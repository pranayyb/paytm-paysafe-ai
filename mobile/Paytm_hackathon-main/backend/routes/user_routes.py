"""
Paytm AI VoiceGuard - User Routes
Profile, balance, transactions, notifications, and offers
"""
from fastapi import APIRouter, Depends, Query
from database import cols
from auth_utils import get_current_user

router = APIRouter()

# ─────────────────────── PROFILE ───────────────────────
@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "name": user.get("name"),
        "email": user.get("email"),
        "upi_id": user.get("upi_id"),
        "balance": user.get("balance", 0),
        "voice_enrolled": user.get("voice_enrolled", False),
        "credit_score": user.get("credit_score", 750),
        "gold_coins": user.get("gold_coins", 0),
        "kyc_status": user.get("kyc_status", "pending"),
        "member_since": user.get("member_since"),
        "preferred_language": user.get("preferred_language", "en"),
        "qr_url": user.get("qr_url", f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa={user.get('upi_id', '')}"),
        "role": user.get("role", "customer"),
    }

# ─────────────────────── VERIFY UPI ───────────────────────
@router.get("/verify-upi")
async def verify_upi(upi_id: str, user=Depends(get_current_user)):
    target = await cols.users.find_one({"upi_id": upi_id})
    if not target:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return {"exists": True, "name": target.get("name", "Unknown User")}

# ─────────────────────── BALANCE ───────────────────────
@router.get("/balance")
async def get_balance(user=Depends(get_current_user)):
    uid = user["user_id"]
    tx_count = await cols.transactions.count_documents({"user_id": uid})
    return {
        "balance": user.get("balance", 0),
        "currency": "INR",
        "upi_id": user.get("upi_id"),
        "total_transactions": tx_count,
        "voice_enrolled": user.get("voice_enrolled", False),
        "credit_score": user.get("credit_score", 750),
    }

# ─────────────────────── TRANSACTIONS ───────────────────────
@router.get("/transactions")
async def get_transactions(user=Depends(get_current_user), limit: int = Query(20, ge=1, le=100)):
    uid = user["user_id"]
    cursor = cols.transactions.find({"user_id": uid}).sort("timestamp", -1).limit(limit)
    txns = []
    async for t in cursor:
        txns.append({
            "id": t.get("id"),
            "type": t.get("type"),
            "amount": t.get("amount"),
            "recipient": t.get("recipient"),
            "memo": t.get("memo"),
            "category": t.get("category"),
            "timestamp": t.get("timestamp").strftime("%d %b %Y, %I:%M %p") if t.get("timestamp") else "",
            "status": t.get("status"),
            "verification_method": t.get("verification_method"),
            "biometric_score": t.get("biometric_score"),
            "risk_level": t.get("risk_level"),
        })
    total = await cols.transactions.count_documents({"user_id": uid})
    return {"transactions": txns, "total": total}

# ─────────────────────── NOTIFICATIONS ───────────────────────
@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    uid = user["user_id"]
    cursor = cols.notifications.find({"$or": [{"user_id": uid}, {"user_id": "system"}]}).sort("created_at", -1).limit(20)
    notifs = []
    async for n in cursor:
        notifs.append({
            "title": n.get("title"),
            "body": n.get("body"),
            "time": n.get("created_at").strftime("%d %b %Y, %I:%M %p") if n.get("created_at") else n.get("time", "Just now"),
            "read": n.get("read", False),
            "type": n.get("type"),
        })
    return {"notifications": notifs}

# ─────────────────────── OFFERS ───────────────────────
@router.get("/offers")
async def get_offers(user=Depends(get_current_user)):
    cursor = cols.offers.find({"active": True})
    offers = []
    async for o in cursor:
        offers.append({
            "title": o.get("title"),
            "subtitle": o.get("subtitle"),
            "icon": o.get("icon"),
            "color": o.get("color"),
        })
    return {"offers": offers}
