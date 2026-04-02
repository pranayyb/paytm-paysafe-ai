"""
Paytm AI VoiceGuard - Merchant & Soundbox Routes
Dashboard analytics, time-series data, AI insights, and soundbox events
"""
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from database import cols
from auth_utils import get_current_user
from time_utils import get_ist_now
from services.ai_insights_service import generate_ai_insights
from datetime import datetime, timedelta
import random

router = APIRouter()


# ═══════════════════════════════════════════════
# HELPER: Aggregate revenue for a date range
# ═══════════════════════════════════════════════

async def _aggregate_range(merchant_id: str, start: datetime, end: datetime) -> dict:
    """Get total revenue and count for a merchant in a date range."""
    pipeline = [
        {"$match": {
            "merchant_id": merchant_id,
            "timestamp": {"$gte": start, "$lt": end}
        }},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    result = {"revenue": 0, "count": 0}
    async for doc in cols.soundbox_events.aggregate(pipeline):
        result["revenue"] = round(doc.get("revenue", 0), 2)
        result["count"] = doc.get("count", 0)
    return result


async def _daily_series(merchant_id: str, days: int = 30) -> list:
    """Get daily revenue/count for the last N days."""
    series = []
    for i in range(days - 1, -1, -1):
        day_start = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        data = await _aggregate_range(merchant_id, day_start, day_end)
        series.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "label": day_start.strftime("%d %b"),
            "revenue": data["revenue"],
            "count": data["count"]
        })
    return series


async def _hourly_series(merchant_id: str) -> list:
    """Get hourly revenue for today."""
    today_start = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0)
    series = []
    for h in range(24):
        h_start = today_start + timedelta(hours=h)
        h_end = h_start + timedelta(hours=1)
        data = await _aggregate_range(merchant_id, h_start, h_end)
        series.append({
            "hour": h,
            "label": f"{h:02d}:00",
            "revenue": data["revenue"],
            "count": data["count"]
        })
    return series


async def _category_breakdown(merchant_id: str) -> list:
    """Get transaction breakdown by payment method."""
    pipeline = [
        {"$match": {"merchant_id": merchant_id}},
        {"$group": {
            "_id": "$method",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total": -1}}
    ]
    categories = []
    async for doc in cols.soundbox_events.aggregate(pipeline):
        categories.append({
            "method": doc["_id"] or "Unknown",
            "revenue": round(doc["total"], 2),
            "count": doc["count"]
        })
    return categories


# ═══════════════════════════════════════════════
# MERCHANT DASHBOARD (Full Data)
# ═══════════════════════════════════════════════

@router.get("/dashboard")
async def merchant_dashboard(user=Depends(get_current_user)):
    """Full merchant dashboard — only accessible by the logged-in merchant."""
    uid = user["user_id"]

    # Find the merchant profile linked to this user
    merchant = await cols.merchants.find_one({"user_id": uid})
    if not merchant:
        raise HTTPException(404, "Merchant profile not found. Please sign up as a merchant.")

    merchant_id = merchant["merchant_id"]

    # ── Time periods ──
    now = get_ist_now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_start = today_start - timedelta(days=today_start.weekday())
    last_week_start = week_start - timedelta(days=7)
    month_start = today_start.replace(day=1)
    last_month_end = month_start
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    # ── Aggregate stats ──
    today_stats = await _aggregate_range(merchant_id, today_start, now)
    yesterday_stats = await _aggregate_range(merchant_id, yesterday_start, today_start)
    this_week_stats = await _aggregate_range(merchant_id, week_start, now)
    last_week_stats = await _aggregate_range(merchant_id, last_week_start, week_start)
    this_month_stats = await _aggregate_range(merchant_id, month_start, now)
    last_month_stats = await _aggregate_range(merchant_id, last_month_start, last_month_end)
    all_time_stats = await _aggregate_range(merchant_id, datetime(2020, 1, 1), now)

    # ── Chart data ──
    daily_chart = await _daily_series(merchant_id, 30)
    hourly_chart = await _hourly_series(merchant_id)
    category_chart = await _category_breakdown(merchant_id)

    # ── Recent events ──
    events_cursor = cols.soundbox_events.find(
        {"merchant_id": merchant_id}
    ).sort("timestamp", -1).limit(20)
    events = []
    async for e in events_cursor:
        events.append({
            "type": e.get("type"),
            "amount": e.get("amount"),
            "sender": e.get("sender"),
            "method": e.get("method"),
            "timestamp": e.get("timestamp").isoformat() if e.get("timestamp") else "",
            "verification": e.get("verification", {}),
            "language": e.get("language", "en")
        })

    # ── AI Insights (HuggingFace) ──
    stats_for_ai = {
        "today": today_stats,
        "yesterday": yesterday_stats,
        "this_week": this_week_stats,
        "last_week": last_week_stats,
        "this_month": this_month_stats,
        "last_month": last_month_stats,
    }
    ai_insights = await generate_ai_insights(merchant["name"], stats_for_ai)

    return {
        "merchant": {
            "id": merchant["merchant_id"],
            "name": merchant["name"],
            "owner_name": merchant.get("owner_name"),
            "upi_id": merchant.get("upi_id"),
            "category": merchant.get("category"),
            "email": merchant.get("email"),
            "soundbox_active": merchant.get("soundbox_active", True),
            "created_at": merchant.get("created_at", "").isoformat() if merchant.get("created_at") else None,
        },
        "stats": {
            "all_time": all_time_stats,
            "today": today_stats,
            "yesterday": yesterday_stats,
            "this_week": this_week_stats,
            "last_week": last_week_stats,
            "this_month": this_month_stats,
            "last_month": last_month_stats,
        },
        "charts": {
            "daily_revenue": daily_chart,
            "hourly_today": hourly_chart,
            "category_breakdown": category_chart,
        },
        "recent_events": events,
        "ai_insights": ai_insights,
    }


# ═══════════════════════════════════════════════
# REFRESH AI INSIGHTS ONLY
# ═══════════════════════════════════════════════

@router.get("/ai-insights")
async def get_ai_insights(user=Depends(get_current_user)):
    """Fetch fresh AI analysis for the merchant."""
    uid = user["user_id"]
    merchant = await cols.merchants.find_one({"user_id": uid})
    if not merchant:
        raise HTTPException(404, "Merchant profile not found")

    merchant_id = merchant["merchant_id"]
    now = get_ist_now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_start = today_start - timedelta(days=today_start.weekday())
    last_week_start = week_start - timedelta(days=7)
    month_start = today_start.replace(day=1)
    last_month_end = month_start
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    stats = {
        "today": await _aggregate_range(merchant_id, today_start, now),
        "yesterday": await _aggregate_range(merchant_id, yesterday_start, today_start),
        "this_week": await _aggregate_range(merchant_id, week_start, now),
        "last_week": await _aggregate_range(merchant_id, last_week_start, week_start),
        "this_month": await _aggregate_range(merchant_id, month_start, now),
        "last_month": await _aggregate_range(merchant_id, last_month_start, last_month_end),
    }

    insights = await generate_ai_insights(merchant["name"], stats)
    return insights


# ═══════════════════════════════════════════════
# SOUNDBOX EVENT (public — called after payments)
# ═══════════════════════════════════════════════

@router.post("/soundbox/event")
async def soundbox_event(request: Request):
    body = await request.json()
    event = {
        "type": body.get("type", "payment_received"),
        "amount": body.get("amount", 0),
        "sender": body.get("sender", "Unknown"),
        "recipient": body.get("recipient", "Merchant"),
        "method": body.get("method", "UPI"),
        "merchant_id": body.get("merchant_id", "merchant_001"),
        "timestamp": get_ist_now(),
        "verification": body.get("verification", {}),
        "language": body.get("language", "Hindi"),
    }
    await cols.soundbox_events.insert_one(event)

    # Update merchant stats
    await cols.merchants.update_one(
        {"merchant_id": event["merchant_id"]},
        {"$inc": {"total_revenue": event["amount"], "total_transactions": 1}}
    )

    # Flag suspicious transactions
    if event["amount"] > 50000:
        await cols.merchants.update_one(
            {"merchant_id": event["merchant_id"]},
            {"$inc": {"fraud_alerts": 1}}
        )

    return {
        "status": "success",
        "announcement": f"Payment received: {event['amount']} rupees from {event['sender']}",
        "language": event["language"]
    }


# ═══════════════════════════════════════════════
# MERCHANT PROFILE UPDATE
# ═══════════════════════════════════════════════

@router.put("/profile")
async def update_merchant_profile(request: Request, user=Depends(get_current_user)):
    """Update merchant business details."""
    uid = user["user_id"]
    merchant = await cols.merchants.find_one({"user_id": uid})
    if not merchant:
        raise HTTPException(404, "Merchant profile not found")

    body = await request.json()
    update_fields = {}
    for field in ["name", "category", "soundbox_active"]:
        if field in body:
            update_fields[field] = body[field]

    if update_fields:
        await cols.merchants.update_one(
            {"merchant_id": merchant["merchant_id"]},
            {"$set": update_fields}
        )

    return {"status": "success", "updated": list(update_fields.keys())}
