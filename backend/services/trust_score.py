from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models import User, Merchant, Transaction


def calculate_trust_score(db: Session, upi_id: str):
    """
    Weighted trust score matching README specification:
    - Account Age: 20%
    - Transaction Consistency: 15%
    - Dispute Rate: 20%
    - Payment Spike: 15%
    - Name Match: 10%
    - User Reports: 20%
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
    # Check if transaction pattern is regular (not erratic spikes)
    last_30_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == upi_id,
        Transaction.timestamp >= now - timedelta(days=30)
    ).all()

    last_7_txs = [tx for tx in last_30_txs if tx.timestamp.replace(tzinfo=timezone.utc) >= now - timedelta(days=7)]

    if len(last_30_txs) > 0:
        avg_daily_30 = len(last_30_txs) / 30
        avg_daily_7 = len(last_7_txs) / 7
        # Spike ratio: if recent week is 3x+ the monthly average, it's suspicious
        if avg_daily_30 > 0:
            spike_ratio = avg_daily_7 / avg_daily_30
        else:
            spike_ratio = 1.0

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
    if user.has_disputes:
        dispute_score = 0
        flags.append("has_disputes")
    else:
        dispute_score = 20
    factors["disputes"] = {"score": dispute_score, "max": 20, "detail": "Has disputes" if user.has_disputes else "Clean"}

    # ──── 4. Payment Spike Detection (15 points) ────
    # Large single transactions compared to average
    if last_30_txs:
        amounts = [tx.amount for tx in last_30_txs]
        avg_amount = sum(amounts) / len(amounts)
        max_amount = max(amounts)
        if avg_amount > 0 and max_amount > avg_amount * 10:
            spike_score = 0
            flags.append("amount_spike")
        elif avg_amount > 0 and max_amount > avg_amount * 5:
            spike_score = 8
            flags.append("moderate_spike")
        else:
            spike_score = 15
    else:
        spike_score = 10
    factors["payment_spike"] = {"score": spike_score, "max": 15, "detail": f"Max: ₹{max_amount:.0f}" if last_30_txs else "No data"}

    # ──── 5. Name Match (10 points) ────
    # Check if the User name matches the Merchant name (if merchant)
    name_score = 10  # Default: no mismatch detected
    if user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == upi_id).first()
        if merchant and merchant.name and user.name:
            if merchant.name.lower() != user.name.lower():
                name_score = 5  # Partial mismatch
                flags.append("name_mismatch")
    factors["name_match"] = {"score": name_score, "max": 10}

    # ──── 6. User Reports / Complaints (20 points) ────
    complaint_score = 20
    if user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == upi_id).first()
        if merchant:
            complaints = merchant.complaint_count
            deduction = min(20, complaints * 10)
            complaint_score = max(0, 20 - deduction)
            if complaints > 0:
                flags.append("user_reports")
    factors["reports"] = {"score": complaint_score, "max": 20}

    # ──── Final Score ────
    total_score = age_score + consistency_score + dispute_score + spike_score + name_score + complaint_score
    total_score = max(0, min(100, total_score))

    # Assign Badge
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
