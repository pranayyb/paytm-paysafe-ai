from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models import Transaction, Merchant, User
import statistics
import json
from config import settings
from pytz import timezone as tz


# ─── Fraud & Risk Analysis ───
def _calculate_fraud_score(db: Session, merchant_upi_id: str, transactions: list) -> dict:
    """Analyze fraudulent transactions and calculate fraud risk score."""
    fraud_txs = [tx for tx in transactions if tx.is_fraud]
    fraud_rate = (len(fraud_txs) / len(transactions) * 100) if transactions else 0
    
    # Import LLM analysis if needed
    fraud_patterns = defaultdict(int)
    for tx in fraud_txs:
        if tx.fraud_pattern:
            fraud_patterns[tx.fraud_pattern] += 1
    
    # Risk levels
    if fraud_rate > 10:
        risk_level = "critical"
        risk_score = 85
    elif fraud_rate > 5:
        risk_level = "high"
        risk_score = 65
    elif fraud_rate > 2:
        risk_level = "medium"
        risk_score = 40
    else:
        risk_level = "low"
        risk_score = 15
    
    return {
        "fraud_rate": round(fraud_rate, 2),
        "fraud_count": len(fraud_txs),
        "risk_level": risk_level,
        "risk_score": risk_score,
        "common_patterns": dict(sorted(fraud_patterns.items(), key=lambda x: x[1], reverse=True)[:3])
    }


def _detect_anomalies(transactions: list) -> dict:
    """Detect unusual transaction patterns (velocity, amounts, timing)."""
    if not transactions:
        return {"anomalies": [], "velocity_alert": False, "amount_alert": False}
    
    anomalies = []
    
    # 1. Velocity Check: transactions per hour
    hour_counts = Counter()
    for tx in transactions:
        h = tx.timestamp.hour
        hour_counts[h] += 1
    
    max_hourly_txs = max(hour_counts.values()) if hour_counts else 0
    avg_hourly_txs = sum(hour_counts.values()) / 24 if hour_counts else 0
    velocity_spike = max_hourly_txs > (avg_hourly_txs * 3)  # 3x normal
    
    if velocity_spike:
        anomalies.append(f"⚠️ Velocity spike: {max_hourly_txs} txns/hour (normal: {avg_hourly_txs:.1f})")
    
    # 2. Amount Analysis: unusual transaction sizes
    amounts = [tx.amount for tx in transactions]
    if len(amounts) > 1:
        mean_amt = statistics.mean(amounts)
        stdev_amt = statistics.stdev(amounts)
        
        # Flag transactions > 2 std dev from mean
        outlier_amounts = [amt for amt in amounts if amt > mean_amt + (2 * stdev_amt)]
        if outlier_amounts:
            anomalies.append(f"⚠️ Large transactions: ₹{max(outlier_amounts):.0f} (avg: ₹{mean_amt:.0f})")
    
    # 3. Time Pattern: transactions at odd hours (11 PM - 5 AM)
    odd_hour_txs = sum(1 for tx in transactions if tx.timestamp.hour in [23, 0, 1, 2, 3, 4, 5])
    odd_hour_pct = (odd_hour_txs / len(transactions) * 100) if transactions else 0
    
    if odd_hour_pct > 30:
        anomalies.append(f"⚠️ Late night transactions: {odd_hour_pct:.1f}% between 11pm-5am")
    
    # 4. Repeat sender analysis: single customer doing huge volume
    sender_counts = Counter(tx.sender_upi_id for tx in transactions)
    max_sender_txs = max(sender_counts.values()) if sender_counts else 0
    max_sender_pct = (max_sender_txs / len(transactions) * 100) if transactions else 0
    
    if max_sender_pct > 40:
        anomalies.append(f"⚠️ Concentration risk: one customer = {max_sender_pct:.1f}% of volume")
    
    return {
        "anomalies": anomalies,
        "velocity_alert": velocity_spike,
        "amount_alert": len(outlier_amounts) > 0 if len(amounts) > 1 else False,
        "max_hourly_transactions": max_hourly_txs,
        "avg_hourly_transactions": round(avg_hourly_txs, 1)
    }


def _calculate_merchant_risk_score(merchant: Merchant, transactions: list, fraud_data: dict) -> dict:
    """Calculate overall merchant risk score based on complaints, fraud, behavior."""
    base_score = 10
    
    # 1. Complaint history (0-30 points)
    complaint_score = min(30, merchant.complaint_count * 5)
    
    # 2. Fraud rate (0-40 points)
    fraud_contribution = fraud_data.get("risk_score", 0) * 0.6
    
    # 3. Transaction recency: newer merchants are riskier
    now = datetime.now(timezone.utc)
    created_at = merchant.created_at
    
    # Handle timezone-naive created_at (assume UTC if no timezone)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    days_active = (now - created_at).days
    recency_score = max(0, 20 - (days_active // 30))  # Newer = higher risk
    
    total_score = min(99, base_score + complaint_score + fraud_contribution + recency_score)
    
    if total_score >= 70:
        risk_tier = "🔴 CRITICAL"
    elif total_score >= 50:
        risk_tier = "🟠 HIGH"
    elif total_score >= 30:
        risk_tier = "🟡 MEDIUM"
    else:
        risk_tier = "🟢 LOW"
    
    return {
        "risk_score": round(total_score, 1),
        "risk_tier": risk_tier,
        "complaint_score": complaint_score,
        "fraud_score": fraud_contribution,
        "recency_score": recency_score,
        "days_active": days_active
    }


def _analyze_velocity(transactions: list) -> dict:
    """Analyze transaction velocity patterns."""
    if not transactions:
        return {"avg_transaction_amount": 0, "max_transaction": 0, "txns_per_hour": 0}
    
    amounts = [tx.amount for tx in transactions]
    txn_times = [tx.timestamp for tx in transactions]
    
    if len(txn_times) > 1:
        time_span = (max(txn_times) - min(txn_times)).total_seconds() / 3600  # hours
        txns_per_hour = len(transactions) / max(time_span, 1)
    else:
        txns_per_hour = 0
    
    return {
        "avg_transaction_amount": round(statistics.mean(amounts), 2),
        "max_transaction": round(max(amounts), 2),
        "min_transaction": round(min(amounts), 2),
        "txns_per_hour": round(txns_per_hour, 2),
        "total_transactions": len(transactions)
    }


def _get_ist_time(utc_dt):
    """Convert UTC datetime to IST (India Standard Time)."""
    ist = tz('Asia/Kolkata')
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(ist)


def get_insights(db: Session, merchant_upi_id: str, period: str = "week"):
    """
    Rich business insights for a merchant — revenue, customers, peak hours, day analysis.
    NOW INCLUDES: Fraud detection, anomaly alerts, risk scoring, velocity analysis.
    """
    now = datetime.now(timezone.utc)
    ist_now = _get_ist_time(now)

    if period == "day":
        start_date = now - timedelta(days=1)
        prev_start_date = now - timedelta(days=2)
        period_label = "kal"
    elif period == "week":
        start_date = now - timedelta(days=7)
        prev_start_date = now - timedelta(days=14)
        period_label = "is hafte"
    else:  # month
        start_date = now - timedelta(days=30)
        prev_start_date = now - timedelta(days=60)
        period_label = "is mahine"

    # ─── Fetch Transactions ───
    current_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == merchant_upi_id,
        Transaction.timestamp >= start_date,
        Transaction.timestamp <= now
    ).all()

    prev_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == merchant_upi_id,
        Transaction.timestamp >= prev_start_date,
        Transaction.timestamp < start_date
    ).all()

    current_revenue = sum(tx.amount for tx in current_txs)
    prev_revenue = sum(tx.amount for tx in prev_txs)

    if prev_revenue > 0:
        change_pct = round(((current_revenue - prev_revenue) / prev_revenue) * 100, 1)
    else:
        change_pct = 0.0

    # ─── Fraud & Risk Analysis ───
    fraud_data = _calculate_fraud_score(db, merchant_upi_id, current_txs)
    anomalies = _detect_anomalies(current_txs)
    
    # ─── Merchant Info & Risk Score ───
    merchant = db.query(Merchant).filter(Merchant.upi_id == merchant_upi_id).first()
    risk_score_data = _calculate_merchant_risk_score(merchant, current_txs, fraud_data) if merchant else {}
    
    # ─── Velocity Analysis ───
    velocity_data = _analyze_velocity(current_txs)

    # ─── Today vs Yesterday ───
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    today_revenue = sum(tx.amount for tx in current_txs
                        if tx.timestamp.replace(tzinfo=timezone.utc) >= today_start)
    yesterday_revenue = sum(tx.amount for tx in current_txs
                           if yesterday_start <= tx.timestamp.replace(tzinfo=timezone.utc) < today_start)

    # ─── Real Peak Hours Calculation ───
    hour_counts = Counter()
    hour_revenue = defaultdict(float)
    for tx in current_txs:
        h = tx.timestamp.replace(tzinfo=timezone.utc).hour
        hour_counts[h] += 1
        hour_revenue[h] += tx.amount

    if hour_counts:
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        top_hours = sorted_hours[:3]
        peak_hours = [f"{h:02d}:00-{(h+1) % 24:02d}:00" for h, _ in top_hours]

        # Build hourly heatmap
        hourly_heatmap = [
            {"hour": f"{h:02d}:00", "transactions": hour_counts.get(h, 0),
             "revenue": round(hour_revenue.get(h, 0), 2)}
            for h in range(24)
        ]
    else:
        peak_hours = ["N/A"]
        hourly_heatmap = []

    # ─── Customer Analysis ───
    senders = Counter()
    for tx in current_txs:
        senders[tx.sender_upi_id] += 1

    total_customers = len(senders)
    repeat_customers = sum(1 for count in senders.values() if count > 1)
    new_customers = total_customers - repeat_customers
    repeat_pct = round((repeat_customers / total_customers * 100), 1) if total_customers > 0 else 0

    # Top 5 customers with names
    top_customer_data = []
    for upi_id, visits in senders.most_common(5):
        user = db.query(User).filter(User.upi_id == upi_id).first()
        customer_revenue = sum(tx.amount for tx in current_txs if tx.sender_upi_id == upi_id)
        top_customer_data.append({
            "upi_id": upi_id,
            "name": user.name if user else "Unknown",
            "visits": visits,
            "total_spent": round(customer_revenue, 2)
        })

    # ─── Day-of-Week Analysis ───
    day_revenue = defaultdict(float)
    day_counts = defaultdict(int)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_names_hindi = ["Somvaar", "Mangalvaar", "Budhvaar", "Guruvaar", "Shukravaar", "Shanivaar", "Ravivaar"]

    for tx in current_txs:
        day_idx = tx.timestamp.weekday()
        day_revenue[day_idx] += tx.amount
        day_counts[day_idx] += 1

    weekly_pattern = [
        {
            "day": day_names[i],
            "day_hindi": day_names_hindi[i],
            "revenue": round(day_revenue.get(i, 0), 2),
            "transactions": day_counts.get(i, 0)
        }
        for i in range(7)
    ]

    # Find weakest day for recommendation
    if day_revenue:
        weakest_day_idx = min(day_revenue, key=day_revenue.get)
        weakest_day = day_names_hindi[weakest_day_idx]
        strongest_day_idx = max(day_revenue, key=day_revenue.get)
        strongest_day = day_names_hindi[strongest_day_idx]
    else:
        weakest_day = "N/A"
        strongest_day = "N/A"

    # ─── Smart Recommendations ───
    recommendations = []
    change_word = "badhi" if change_pct >= 0 else "ghati"

    if change_pct < -10:
        recommendations.append(f"Sales {abs(change_pct)}% kam hui hai. {weakest_day} ko special offer lagaein.")
    elif change_pct > 20:
        recommendations.append(f"Bahut acchi growth! {strongest_day} ko aur push karein.")

    if repeat_pct > 60:
        recommendations.append(f"Repeat customers {repeat_pct}% hain — loyalty program shuru karein!")
    elif repeat_pct < 30:
        recommendations.append("Naye customers aa rahe hain par laut nahi rahe. Service quality check karein.")

    if peak_hours and peak_hours[0] != "N/A":
        recommendations.append(f"Peak time {peak_hours[0]} hai — us time extra staff rakhein.")

    if not recommendations:
        recommendations.append("Business steady chal raha hai. Keep it up! 💪")

    # ─── LLM-style Insight ───
    llm_insight = (
        f"📊 {period_label.capitalize()} ki summary: Sales {abs(change_pct)}% {change_word} hai. "
        f"Total {total_customers} customers mein se {repeat_customers} ({repeat_pct}%) repeat customers hain. "
        f"Sabse busy time {peak_hours[0] if peak_hours[0] != 'N/A' else 'N/A'} hai."
    )

    # ─── Merchant Info ───
    merchant_info = None
    if merchant:
        merchant_info = {
            "name": merchant.name,
            "category": merchant.category,
            "upi_id": merchant.upi_id
        }

    # ─── Final AI Consultant Logic ───
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_key_here":
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            summary_for_ai = {
                "period": period,
                "revenue": today_revenue,
                "change": change_pct,
                "total_customers": total_customers,
                "repeat_pct": repeat_pct,
                "peak_hours": peak_hours,
                "anomalies": anomalies["anomalies"]
            }
            
            prompt = f"""You are 'PaySafe Merchant Guru', a professional business consultant in India.
            Analyze this merchant's data and provide:
            1. A concise 'llm_insight' (Hindi/English mix)
            2. 3 actionable 'recommendations' to grow revenue or reduce fraud.
            Data: {json.dumps(summary_for_ai)}"""
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    system_instruction="You help Indian merchants succeed by providing smart, culturally relevant business advice.",
                )
            )
            
            ai_data = json.loads(response.text)
            if "llm_insight" in ai_data: llm_insight = ai_data["llm_insight"]
            if "recommendations" in ai_data: recommendations = ai_data["recommendations"]
            
        except Exception as e:
            print(f"[MerchantGuru] Gemini failed: {e}")

    return {
        "merchant": merchant_info,
        "revenue": {
            "today": round(today_revenue, 2),
            "yesterday": round(yesterday_revenue, 2),
            "this_period": round(current_revenue, 2),
            "previous_period": round(prev_revenue, 2),
            "change_pct": change_pct,
            "total_transactions": len(current_txs)
        },
        "customers": {
            "total": total_customers,
            "repeat": repeat_customers,
            "new": new_customers,
            "repeat_pct": repeat_pct
        },
        "peak_hours": peak_hours,
        "hourly_heatmap": hourly_heatmap,
        "weekly_pattern": weekly_pattern,
        "top_customers": top_customer_data,
        "llm_insight": llm_insight,
        "recommendations": recommendations,
        
        # ─── NEW: Fraud & Risk Analysis ───
        "fraud_analysis": fraud_data,
        "anomalies": anomalies["anomalies"],
        "velocity_alert": anomalies["velocity_alert"],
        "amount_alert": anomalies["amount_alert"],
        "risk_assessment": risk_score_data,
        "velocity_metrics": velocity_data,
        
        # ─── Enhanced Recommendations ───
        "security_alerts": [
            f"🚨 {anom}" for anom in anomalies["anomalies"]
        ] if anomalies["anomalies"] else []
    }
