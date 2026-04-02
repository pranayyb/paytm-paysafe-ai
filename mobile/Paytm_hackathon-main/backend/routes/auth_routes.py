"""
Paytm AI VoiceGuard - Auth Routes
Handles OTP delivery, signup with ₹1000 bonus, login
Supports role selection: "customer" (default) or "merchant"
"""
from fastapi import APIRouter, HTTPException, Request
from database import cols
from auth_utils import get_password_hash, verify_password, create_access_token
from time_utils import get_ist_now
from services.email_service import send_email_otp
from datetime import datetime
import random, uuid, time

router = APIRouter()

# ─────────────────────── SEND OTP ───────────────────────
@router.post("/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    identifier = (body.get("email") or body.get("phone") or "").lower().strip()
    password = body.get("password")
    is_login = body.get("is_login", False)

    if not identifier:
        raise HTTPException(400, "Email is required")

    if is_login:
        user = await cols.users.find_one({"email": identifier})
        if not user or not verify_password(password, user.get("password", "")):
            raise HTTPException(401, "Invalid credentials")

    otp_code = str(random.randint(1000, 9999))
    await cols.otps.update_one(
        {"email": identifier},
        {"$set": {"otp": otp_code, "email": identifier, "created_at": get_ist_now()}},
        upsert=True
    )

    if "@" in identifier:
        sent = send_email_otp(identifier, otp_code)
        if sent:
            return {"status": "success", "message": "OTP sent to your email"}
    else:
        print(f"🔑 DEBUG OTP for {identifier}: {otp_code}")

    return {"status": "success", "message": "OTP generated (check backend terminal)", "debug_otp": otp_code}

# ─────────────────────── SIGNUP ───────────────────────
@router.post("/signup")
async def signup(request: Request):
    body = await request.json()
    print(f"📥 SIGNUP ATTEMPT: {body}")
    identifier = (body.get("email") or body.get("phone") or "").lower().strip()
    name = body.get("name", "User")
    password = body.get("password", "")
    otp = body.get("otp", "")
    role = body.get("role", "customer")  # "customer" or "merchant"

    if not identifier or not password or not otp:
        print(f"⚠️ SIGNUP FAIL: Missing fields. ID={identifier}, PWD={'YES' if password else 'NO'}, OTP={otp}")
        raise HTTPException(400, "All fields are required")

    if await cols.users.find_one({"email": identifier}):
        raise HTTPException(400, "Already registered")

    otp_rec = await cols.otps.find_one({"email": identifier})
    if not otp_rec or otp_rec.get("otp") != otp:
        raise HTTPException(400, "Invalid or expired OTP")

    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    upi_prefix = identifier.split("@")[0].lower() if "@" in identifier else identifier.lower()
    
    # Ensure unique UPI ID
    upi_id = f"{upi_prefix}@paytm"
    exists = await cols.users.find_one({"upi_id": upi_id})
    if exists:
        upi_id = f"{upi_prefix}{random.randint(10, 99)}@paytm"
        while await cols.users.find_one({"upi_id": upi_id}):
            upi_id = f"{upi_prefix}{random.randint(100, 999)}@paytm"

    qr_data = f"upi://pay?pa={upi_id}&pn={name}&cu=INR"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={qr_data}"

    # Base user document
    user_doc = {
        "user_id": user_id,
        "name": name,
        "email": identifier,
        "password": get_password_hash(password),
        "upi_id": upi_id,
        "qr_url": qr_url,
        "balance": 1000.0,
        "voice_enrolled": False,
        "trusted_recipients": [],
        "credit_score": 750,
        "gold_coins": 0,
        "kyc_status": "pending",
        "member_since": str(datetime.now().year),
        "preferred_language": "en",
        "role": role,  # "customer" or "merchant"
        "created_at": get_ist_now()
    }

    await cols.users.insert_one(user_doc)

    # If merchant, also create a merchant profile
    merchant_id = None
    if role == "merchant":
        merchant_id = f"merch_{uuid.uuid4().hex[:8]}"
        business_name = body.get("business_name", name + "'s Store")
        business_category = body.get("business_category", "General")
        business_address = body.get("business_address", "Not provided")

        await cols.merchants.insert_one({
            "merchant_id": merchant_id,
            "user_id": user_id,
            "name": business_name,
            "owner_name": name,
            "email": identifier,
            "upi_id": upi_id,
            "category": business_category,
            "address": business_address,
            "total_revenue": 0,
            "total_transactions": 0,
            "soundbox_active": True,
            "fraud_alerts": 0,
            "ai_insights_enabled": True,
            "created_at": get_ist_now()
        })
        print(f"🏪 Merchant profile created: {business_name} ({merchant_id})")

    # Welcome notification
    welcome_msg = "₹1,000 signup bonus credited to your wallet."
    if role == "merchant":
        welcome_msg = f"₹1,000 signup bonus credited. Your merchant dashboard is ready!"

    await cols.notifications.insert_one({
        "user_id": user_id,
        "title": "Welcome to Paytm!",
        "body": welcome_msg,
        "time": "Just now", "read": False, "type": "welcome",
        "created_at": get_ist_now()
    })

    # Bonus transaction record
    await cols.transactions.insert_one({
        "id": f"UPI{int(time.time()*1000)}",
        "type": "received", "amount": 1000.0,
        "recipient": "Paytm Cashback", "memo": "Signup Bonus",
        "category": "Cashback", "timestamp": get_ist_now(),
        "status": "completed", "user_id": user_id,
        "verification_method": "system", "biometric_score": 1.0, "risk_level": "low"
    })

    await cols.otps.delete_one({"email": identifier})
    token = create_access_token({"sub": user_id})
    
    result = {
        "status": "success",
        "token": token,
        "user_id": user_id,
        "name": name,
        "role": role,
        "message": "Signup successful with ₹1000 bonus!"
    }
    if merchant_id:
        result["merchant_id"] = merchant_id

    return result

# ─────────────────────── LOGIN ───────────────────────
@router.post("/login")
async def login(request: Request):
    body = await request.json()
    email_in = str(body.get("email") or "").strip().lower()
    phone_in = str(body.get("phone") or "").strip().lower()
    identifier = email_in or phone_in
    print(f"📥 LOGIN ATTEMPT: Email='{email_in}', Phone='{phone_in}', EffectiveID='{identifier}'")
    
    password = body.get("password", "")
    otp = str(body.get("otp", "")).strip()

    if not identifier or not password or not otp:
        print(f"⚠️ LOGIN FAIL: Missing fields. ID='{identifier}', PWD={'YES' if password else 'NO'}, OTP='{otp}'")
        raise HTTPException(400, "All fields are required")

    user = await cols.users.find_one({"email": identifier})
    if not user:
        print(f"⚠️ LOGIN FAIL: User NOT FOUND in DB for identifier '{identifier}'")
        raise HTTPException(401, "User not found. Please signup first.")

    if not verify_password(password, user.get("password", "")):
        print(f"⚠️ LOGIN FAIL: Incorrect password for '{identifier}'")
        raise HTTPException(401, "Invalid credentials")

    otp_rec = await cols.otps.find_one({"email": identifier})
    if not otp_rec:
        all_otps = await cols.otps.find({}).to_list(10)
        print(f"⚠️ LOGIN FAIL: No OTP for '{identifier}'. Available OTPs for: {[o.get('email') for o in all_otps]}")
        raise HTTPException(400, "No OTP record found for this email. Please request a new one.")
    
    db_otp = str(otp_rec.get("otp", "")).strip()
    if db_otp != otp:
        print(f"⚠️ LOGIN FAIL: OTP Mismatch for '{identifier}'. DB='{db_otp}', Entered='{otp}'")
        raise HTTPException(400, f"Invalid OTP")

    await cols.otps.delete_one({"email": identifier})
    token = create_access_token({"sub": user["user_id"]})

    result = {
        "status": "success",
        "token": token,
        "user_id": user["user_id"],
        "name": user["name"],
        "role": user.get("role", "customer")
    }

    # If merchant, include merchant_id
    if user.get("role") == "merchant":
        merchant = await cols.merchants.find_one({"user_id": user["user_id"]})
        if merchant:
            result["merchant_id"] = merchant["merchant_id"]

    return result

# ─────────────────────── VERIFY PASSWORD ───────────────────────
from fastapi import Depends
from auth_utils import get_current_user

@router.post("/verify-password")
async def verify_password_endpoint(request: Request, user=Depends(get_current_user)):
    """Verify the user's password and return balance data if correct."""
    body = await request.json()
    password = body.get("password", "")

    hashed = user.get("password", "")
    if not hashed or not verify_password(password, hashed):
        raise HTTPException(403, "Incorrect password")

    return {
        "verified": True,
        "balance": user.get("balance", 0),
        "name": user.get("name"),
        "upi_id": user.get("upi_id"),
    }
