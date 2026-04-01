from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from backend.models import Transaction, Merchant, User


def get_insights(db: Session, merchant_upi_id: str, period: str = "week"):
    """
    Rich business insights for a merchant — revenue, customers, peak hours, day analysis.
    """
    now = datetime.now(timezone.utc)

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
    merchant = db.query(Merchant).filter(Merchant.upi_id == merchant_upi_id).first()
    merchant_info = None
    if merchant:
        merchant_info = {
            "name": merchant.name,
            "category": merchant.category,
            "upi_id": merchant.upi_id
        }

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
        "recommendations": recommendations
    }
