from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models import Transaction, Merchant


def detect_merchant_anomalies(db: Session, merchant_upi_id: str):
    """
    Statistical anomaly detection for merchant protection.
    Checks: velocity spikes, large transactions, refund patterns, unusual hours.
    """
    now = datetime.now(timezone.utc)
    alerts = []

    # ─── Fetch transaction windows ───
    last_24h_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == merchant_upi_id,
        Transaction.timestamp >= now - timedelta(hours=24)
    ).all()

    last_30d_txs = db.query(Transaction).filter(
        Transaction.receiver_upi_id == merchant_upi_id,
        Transaction.timestamp >= now - timedelta(days=30)
    ).all()

    if not last_30d_txs:
        return {"has_anomalies": False, "alerts": [], "stats": {"total_30d": 0}}

    # ─── Check 1: Transaction Velocity Spike ───
    avg_daily_count = len(last_30d_txs) / 30.0
    today_count = len(last_24h_txs)

    if avg_daily_count > 0 and today_count > avg_daily_count * 3:
        alerts.append({
            "type": "velocity_spike",
            "severity": "high",
            "title": "🚨 Transaction velocity spike",
            "detail_hindi": f"Aaj {today_count} transactions aaye hain, jabki daily average sirf {avg_daily_count:.0f} hai. Kuch unusual lag raha hai.",
            "detail": f"Today: {today_count} txns vs {avg_daily_count:.1f}/day average (>{3}x spike)"
        })

    # ─── Check 2: Unusually Large Single Transactions ───
    amounts_30d = [tx.amount for tx in last_30d_txs]
    avg_amount = sum(amounts_30d) / len(amounts_30d) if amounts_30d else 0
    std_dev = (sum((a - avg_amount) ** 2 for a in amounts_30d) / len(amounts_30d)) ** 0.5 if amounts_30d else 0

    large_txs_today = [tx for tx in last_24h_txs if tx.amount > avg_amount + 3 * std_dev and std_dev > 0]
    if large_txs_today:
        max_tx = max(large_txs_today, key=lambda t: t.amount)
        alerts.append({
            "type": "large_transaction",
            "severity": "medium",
            "title": "⚠️ Unusually large transaction detected",
            "detail_hindi": f"₹{max_tx.amount:,.0f} ka transaction aaya hai, jabki average sirf ₹{avg_amount:,.0f} hai.",
            "detail": f"₹{max_tx.amount:,.0f} received (avg: ₹{avg_amount:,.0f}, σ: ₹{std_dev:,.0f})"
        })

    # ─── Check 3: Fraud-flagged Transactions ───
    fraud_txs_recent = [tx for tx in last_24h_txs if tx.is_fraud]
    if fraud_txs_recent:
        alerts.append({
            "type": "fraud_detected",
            "severity": "critical",
            "title": "🚨 Fraud-flagged transactions found!",
            "detail_hindi": f"Aaj {len(fraud_txs_recent)} suspicious transactions detect hue hain. Apna account turant check karein!",
            "detail": f"{len(fraud_txs_recent)} fraud-flagged transactions in last 24h"
        })

    # ─── Check 4: Unusual Hour Activity ───
    odd_hour_txs = [tx for tx in last_24h_txs
                    if tx.timestamp.replace(tzinfo=timezone.utc).hour < 6 or tx.timestamp.replace(tzinfo=timezone.utc).hour > 23]
    if len(odd_hour_txs) > 3:
        alerts.append({
            "type": "odd_hours",
            "severity": "low",
            "title": "🌙 Late night transaction activity",
            "detail_hindi": f"Raat 11 baje ke baad ya subah 6 baje se pehle {len(odd_hour_txs)} transactions aaye hain.",
            "detail": f"{len(odd_hour_txs)} transactions during unusual hours (11PM-6AM)"
        })

    # ─── Check 5: Repeated Same-Amount Transactions (refund scam pattern) ───
    amount_counts = {}
    for tx in last_24h_txs:
        rounded = round(tx.amount, 0)
        amount_counts[rounded] = amount_counts.get(rounded, 0) + 1

    repeated_amounts = {amt: cnt for amt, cnt in amount_counts.items() if cnt >= 3}
    if repeated_amounts:
        for amt, cnt in repeated_amounts.items():
            alerts.append({
                "type": "repeated_amount",
                "severity": "medium",
                "title": "🔄 Repeated same-amount transactions",
                "detail_hindi": f"₹{amt:,.0f} ka exactly same amount {cnt} baar aaya hai. Refund scam pattern ho sakta hai.",
                "detail": f"₹{amt:,.0f} received {cnt} times in 24h — possible refund scam pattern"
            })

    # ─── Stats Summary ───
    stats = {
        "total_30d": len(last_30d_txs),
        "total_24h": len(last_24h_txs),
        "avg_daily_count": round(avg_daily_count, 1),
        "avg_amount": round(avg_amount, 2),
        "today_revenue": round(sum(tx.amount for tx in last_24h_txs), 2),
    }

    return {
        "has_anomalies": len(alerts) > 0,
        "alert_count": len(alerts),
        "alerts": alerts,
        "stats": stats
    }
