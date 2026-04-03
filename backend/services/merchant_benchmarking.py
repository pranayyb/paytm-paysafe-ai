from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models import Transaction, Merchant, User
import statistics
import json
from config import settings

def get_merchant_performance_metrics(db: Session, merchant_upi_id: str, days: int = 30) -> dict:
    merchant = db.query(Merchant).filter(Merchant.upi_id == merchant_upi_id).first()
    if not merchant:
        return {}
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    transactions = db.query(Transaction).filter(
        Transaction.receiver_upi_id == merchant_upi_id,
        Transaction.timestamp >= cutoff_date,
        Transaction.status == "SUCCESS"
    ).all()
    
    if not transactions:
        return {
            "merchant_upi_id": merchant_upi_id,
            "merchant_name": merchant.name,
            "category": merchant.category,
            "locality": merchant.locality,
            "days_analyzed": days,
            "transaction_count": 0,
            "revenue": 0,
            "avg_transaction_value": 0,
            "customer_count": 0,
            "repeat_customer_rate": 0,
            "peak_hours": [],
            "daily_average_revenue": 0,
            "complaint_rate": 0
        }
    
    total_revenue = sum(tx.amount for tx in transactions)
    daily_avg_revenue = total_revenue / days

    tx_count = len(transactions)
    avg_transaction_value = total_revenue / tx_count if tx_count > 0 else 0

    unique_customers = set(tx.sender_upi_id for tx in transactions)
    customer_count = len(unique_customers)

    customer_freq = Counter(tx.sender_upi_id for tx in transactions)
    repeat_customers = sum(1 for freq in customer_freq.values() if freq > 1)
    repeat_customer_rate = (repeat_customers / customer_count * 100) if customer_count > 0 else 0

    hour_counts = Counter(tx.timestamp.hour for tx in transactions)
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    peak_hours_list = [{"hour": h, "transactions": c} for h, c in peak_hours]

    total_users_evaluated = db.query(User).count()
    complaint_rate = (merchant.complaint_count / total_users_evaluated * 100) if total_users_evaluated > 0 else 0
    
    return {
        "merchant_upi_id": merchant_upi_id,
        "merchant_name": merchant.name,
        "category": merchant.category,
        "locality": merchant.locality,
        "days_analyzed": days,
        "transaction_count": tx_count,
        "revenue": round(total_revenue, 2),
        "avg_transaction_value": round(avg_transaction_value, 2),
        "customer_count": customer_count,
        "repeat_customer_rate": round(repeat_customer_rate, 2),
        "peak_hours": peak_hours_list,
        "daily_average_revenue": round(daily_avg_revenue, 2),
        "complaint_count": merchant.complaint_count,
        "complaint_rate": round(complaint_rate, 2)
    }

def find_peer_merchants(db: Session, merchant_upi_id: str, limit: int = 5) -> list:

    merchant = db.query(Merchant).filter(Merchant.upi_id == merchant_upi_id).first()
    if not merchant:
        return []

    peers = db.query(Merchant).filter(
        Merchant.category == merchant.category,
        Merchant.locality == merchant.locality,
        Merchant.upi_id != merchant_upi_id
    ).limit(limit).all()
    
    peer_metrics = []
    for peer in peers:
        metrics = get_merchant_performance_metrics(db, peer.upi_id, days=30)
        if metrics:
            peer_metrics.append(metrics)
    
    return peer_metrics

def calculate_competitive_position(merchant_metrics: dict, peer_metrics_list: list) -> dict:

    if not peer_metrics_list:
        return {
            "percentile": "no_peers",
            "comparison": "No peers found in your locality/sector",
            "rankings": {}
        }

    all_merchants = [merchant_metrics] + peer_metrics_list

    metrics_to_compare = {
        "daily_average_revenue": "Daily Revenue",
        "avg_transaction_value": "Avg Transaction Value",
        "repeat_customer_rate": "Customer Retention %",
        "transaction_count": "Transaction Volume"
    }
    
    rankings = {}
    for metric_key, metric_name in metrics_to_compare.items():
        values = [m[metric_key] for m in all_merchants if metric_key in m]
        if values:
            merchant_value = merchant_metrics[metric_key]
            higher_count = sum(1 for v in values if v > merchant_value)
            percentile = (higher_count / len(values)) * 100
            
            peer_avg = statistics.mean(values)
            gap = merchant_value - peer_avg
            gap_pct = (gap / peer_avg * 100) if peer_avg > 0 else 0
            
            rankings[metric_key] = {
                "name": metric_name,
                "your_value": round(merchant_value, 2),
                "peer_average": round(peer_avg, 2),
                "gap": round(gap, 2),
                "gap_percentage": round(gap_pct, 2),
                "percentile": round(percentile, 1),
                "status": "💪 Better" if gap > 0 else "📈 Room to grow"
            }

    overall_score = statistics.mean([
        100 - r["percentile"] for r in rankings.values()
    ])
    
    if overall_score > 70:
        position = "🏆 Top performer in your sector"
    elif overall_score > 50:
        position = "📊 Average performer - some improvement needed"
    else:
        position = "📈 Emerging - significant growth opportunity"
    
    return {
        "percentile": overall_score,
        "position": position,
        "peer_count": len(peer_metrics_list),
        "rankings": rankings
    }

def generate_improvement_recommendations(
    db: Session,
    merchant_upi_id: str,
    merchant_metrics: dict,
    competitive_position: dict,
    peer_metrics_list: list
) -> dict:

    merchant = db.query(Merchant).filter(Merchant.upi_id == merchant_upi_id).first()
    if not merchant:
        return {}

    comparison_summary = f

    top_peers = sorted(peer_metrics_list, key=lambda x: x.get('daily_average_revenue', 0), reverse=True)[:3]
    for i, peer in enumerate(top_peers, 1):
        comparison_summary += f"\n{i}. {peer['merchant_name']}: ₹{peer['daily_average_revenue']:,.0f}/day, {peer['repeat_customer_rate']:.1f}% repeat customers"
    
    comparison_summary += f"\n\nYOUR RANKINGS IN SECTOR: {competitive_position.get('position', 'Unknown')}"

    prompt = f
    
    try:
        from google import genai
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={
                "temperature": 0.7,
                "max_output_tokens": 2048,
                "system_instruction": "You are a business advisor for Indian merchants. Provide practical, specific recommendations."
            }
        )
        
        response_text = response.text

        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            recommendations = json.loads(json_match.group())
        else:
            recommendations = {
                "title": f"Improvement Strategy for {merchant_metrics['merchant_name']}",
                "summary": "See detailed analysis above",
                "recommendations": [],
                "priority_focus": response_text,
                "estimated_revenue_impact": "Variable"
            }
        
        return recommendations
    
    except Exception as e:
        return {
            "title": f"Improvement Strategy for {merchant_metrics['merchant_name']}",
            "summary": "Analysis based on peer comparison",
            "error": str(e),
            "recommendations": []
        }

def get_sector_benchmarking_report(db: Session, merchant_upi_id: str) -> dict:

    merchant_metrics = get_merchant_performance_metrics(db, merchant_upi_id)
    if not merchant_metrics:
        return {"error": "Merchant not found"}

    peer_metrics = find_peer_merchants(db, merchant_upi_id, limit=10)

    competitive_position = calculate_competitive_position(merchant_metrics, peer_metrics)

    recommendations = generate_improvement_recommendations(
        db, merchant_upi_id, merchant_metrics, competitive_position, peer_metrics
    )
    
    return {
        "merchant": merchant_metrics,
        "peer_metrics": peer_metrics,
        "competitive_position": competitive_position,
        "recommendations": recommendations,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
