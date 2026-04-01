from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models import User, Merchant, Transaction


def calculate_trust_score(db: Session, upi_id: str):
    """
    Improved weighted trust score matching README specification:
    - Account Age: 20%
    - Transaction Consistency: 15%
    - Dispute Rate: 20% (percentage-based)
    - Payment Spike: 15% (volume & amount spikes)
    - Name Match: 10%
    - User Reports: 20% (applies to all users)
    """
    user = db.query(User).filter(User.upi_id == upi_id).first()

    if not user:
        return {
            "upi_id": upi_id,
            "trust_score": 0,
            "badge": "🔴 UNKNOWN",
            "badge_color": "red",
            "account_age_days": 0,
            "flags": ["not_found"],
            "factors": {},
            "explanation": "Yeh UPI ID database mein nahi mili. Kisi unknown account ko paisa mat bhejo."
        }

    now = datetime.now(timezone.utc)
    created_at = user.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_days = (now - created_at).days

    flags = []
    factors = {}

    # ──── 1. Account Age (20 points) ────
    if age_days >= 365:
        age_score = 20
    elif age_days >= 180:
        age_score = 15
    elif age_days >= 90:
        age_score = 10
    elif age_days >= 30:
        age_score = 5
    else:
        age_score = 0
        flags.append("new_account")
    factors["account_age"] = {"score": age_score, "max": 20, "detail": f"{age_days} days old"}

    # ──── 2. Transaction Consistency (15 points) ────
    # Check for irregular transaction frequency spikes
    last_30_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == upi_id,
        Transaction.timestamp >= now - timedelta(days=30)
    ).all()

    last_7_txs = [tx for tx in last_30_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= now - timedelta(days=7)]

    if len(last_30_txs) > 0:
        avg_daily_30 = len(last_30_txs) / 30
        avg_daily_7 = len(last_7_txs) / 7
        
        # Calculate spike ratio: how much higher is recent week compared to monthly average?
        if avg_daily_30 > 0:
            spike_ratio = avg_daily_7 / avg_daily_30
        else:
            spike_ratio = 1.0

        # Thresholds per spec (irregular spikes = -15)
        if spike_ratio <= 1.5:
            consistency_score = 15
        elif spike_ratio <= 2.5:
            consistency_score = 10
        elif spike_ratio <= 4.0:
            consistency_score = 5
            flags.append("irregular_volume")
        else:
            consistency_score = 0
            flags.append("transaction_spike")
    else:
        consistency_score = 8  # No history = neutral
    factors["consistency"] = {"score": consistency_score, "max": 15, "detail": f"{len(last_30_txs)} txns in 30 days"}

    # ──── 3. Dispute Rate (20 points) ────
    # Calculate actual dispute percentage (spec: >10% disputes = -25 / full deduction)
    if user.total_transaction_count and user.total_transaction_count > 0:
        dispute_percentage = (user.dispute_count / user.total_transaction_count) * 100
        
        if dispute_percentage > 10:
            dispute_score = 0  # >10% disputes = full deduction
            flags.append("high_dispute_rate")
        elif dispute_percentage > 5:
            dispute_score = 10  # 5-10% = partial deduction
            flags.append("moderate_dispute_rate")
        else:
            dispute_score = 20  # <5% = clean
    else:
        # No transaction history, treat as neutral
        dispute_score = 15
    
    factors["disputes"] = {
        "score": dispute_score,
        "max": 20,
        "detail": f"{user.dispute_count} disputes" if user.total_transaction_count > 0 else "No transaction history"
    }

    # ──── 4. Payment Spike Detection (15 points) ────
    # Detect both transaction volume spikes and abnormal amount spikes
    spike_score = 15
    if last_30_txs:
        amounts = [tx.amount for tx in last_30_txs]
        avg_amount = sum(amounts) / len(amounts)
        max_amount = max(amounts)
        
        # Amount spike: individual transaction >= 10x average (spec: 10x normal = -20)
        if avg_amount > 0 and max_amount > avg_amount * 10:
            spike_score = 0
            flags.append("amount_spike")
        elif avg_amount > 0 and max_amount > avg_amount * 5:
            spike_score = 8
            flags.append("moderate_amount_spike")
        else:
            spike_score = 15
    else:
        spike_score = 10  # No transaction data
    
    factors["payment_spike"] = {
        "score": spike_score,
        "max": 15,
        "detail": f"Max: ₹{max(amounts):.0f}, Avg: ₹{avg_amount:.0f}" if last_30_txs else "No data"
    }

    # ──── 5. Name Match (10 points) ────
    # Check if User name matches Merchant name (if merchant)
    name_score = 10
    if user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == upi_id).first()
        if merchant and merchant.name and user.name:
            if merchant.name.lower() != user.name.lower():
                name_score = 5  # Partial mismatch
                flags.append("name_mismatch")
    factors["name_match"] = {"score": name_score, "max": 10, "detail": "Match OK" if name_score == 10 else "Mismatch detected"}

    # ──── 6. User Reports / Complaints (20 points) ────
    # Now applies to ALL users, not just merchants (spec: Each report = -10)
    complaint_count = user.complaint_count if hasattr(user, 'complaint_count') else 0
    if user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == upi_id).first()
        if merchant:
            complaint_count = max(complaint_count, merchant.complaint_count)
    
    deduction = min(20, complaint_count * 10)  # Each complaint = 10 point deduction, max 20
    complaint_score = max(0, 20 - deduction)
    
    if complaint_count > 0:
        flags.append("user_reports")
    
    factors["reports"] = {"score": complaint_score, "max": 20, "detail": f"{complaint_count} complaints" if complaint_count > 0 else "No complaints"}

    # ──── Final Score (100-point scale) ────
    total_score = age_score + consistency_score + dispute_score + spike_score + name_score + complaint_score
    total_score = max(0, min(100, total_score))

    # Assign Badge (per README spec)
    if total_score >= 80:
        badge = "🟢 Trusted Merchant" if user.is_merchant else "🟢 Trusted User"
        color = "green"
        explanation = "Clean history aur purana account. Safe to pay."
    elif total_score >= 60:
        badge = "🟡 New Account" if age_days < 90 else "🟡 Proceed Carefully"
        color = "yellow"
        explanation = f"Yeh account {age_days} din purana hai. Verify karke hi pay karein."
    elif total_score >= 40:
        badge = "⚠️ Proceed Carefully"
        color = "orange"
        explanation = "Kuch red flags hain — dhyan se payment karein."
    else:
        badge = "🔴 High Risk"
        color = "red"
        explanation = "Bahut zyada complaints ya bahut naya account! Payment se pehle verify karein."

    return {
        "upi_id": upi_id,
        "trust_score": total_score,
        "badge": badge,
        "badge_color": color,
        "account_age_days": age_days,
        "flags": flags,
        "factors": factors,
        "explanation": explanation
    }
