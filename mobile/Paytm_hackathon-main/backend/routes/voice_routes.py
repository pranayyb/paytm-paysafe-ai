"""
Paytm AI VoiceGuard - Voice Authentication Routes
Handles voice enrollment, verification, challenge phrases, and voice-based payments
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import base64
from database import cols
from auth_utils import get_current_user
from time_utils import get_ist_now
from services.voice_auth_service import VoiceAuthService
from datetime import datetime
import uuid
import time

router = APIRouter()

# ═══════════════════════════════════════════════
# CHALLENGE PHRASE GENERATION
# ═══════════════════════════════════════════════

@router.get("/voice/challenge")
async def get_challenge_phrase(user=Depends(get_current_user)):
    """Generate a random challenge phrase for liveness detection"""
    phrase = VoiceAuthService.generate_challenge_phrase()

    # Store the active challenge in DB so we can verify later
    await cols.voice_enrollments.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"active_challenge": phrase, "challenge_created_at": get_ist_now()}},
        upsert=True
    )

    return {"challenge_phrase": phrase}


# ═══════════════════════════════════════════════
# VOICE ENROLLMENT (Multi-Sample)
# ═══════════════════════════════════════════════

@router.post("/voice/enroll/start")
async def start_enrollment(user=Depends(get_current_user)):
    """Initialize the voice enrollment process - requires 3 voice samples"""
    uid = user["user_id"]

    # Reset any previous enrollment
    await cols.voice_enrollments.update_one(
        {"user_id": uid},
        {"$set": {
            "user_id": uid,
            "status": "enrolling",
            "samples_collected": 0,
            "samples_required": 3,
            "embeddings": [],
            "started_at": get_ist_now()
        }},
        upsert=True
    )

    phrase = VoiceAuthService.generate_challenge_phrase()
    await cols.voice_enrollments.update_one(
        {"user_id": uid},
        {"$set": {"active_challenge": phrase}}
    )

    return {
        "status": "enrollment_started",
        "samples_required": 3,
        "samples_collected": 0,
        "challenge_phrase": phrase,
        "message": "Please read the phrase aloud clearly"
    }


class EnrollSamplePayload(BaseModel):
    audio_base64: str

@router.post("/voice/enroll/sample")
async def enroll_sample(
    payload: EnrollSamplePayload,
    user=Depends(get_current_user)
):
    """Submit a single voice sample during enrollment"""
    uid = user["user_id"]
    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        raise HTTPException(400, "Invalid base64 encoding for audio")
        
    print(f"🎙️ ENROLLMENT SAMPLE: user={uid}, audio_size={len(audio_bytes)} bytes")

    if len(audio_bytes) < 1000:
        raise HTTPException(400, "Audio sample too short. Please record at least 2 seconds.")

    enrollment = await cols.voice_enrollments.find_one({"user_id": uid})
    if not enrollment or enrollment.get("status") != "enrolling":
        enrollment = {
            "user_id": uid,
            "status": "enrolling",
            "samples_collected": 0,
            "embeddings": []
        }
        await cols.voice_enrollments.update_one({"user_id": uid}, {"$set": enrollment}, upsert=True)

    try:
        result = VoiceAuthService.enroll_speaker(audio_bytes)
        embedding = result["embedding"]
    except Exception as e:
        print(f"Extraction failed: {e}")
        raise HTTPException(400, f"Voice analysis failed: {str(e)}")

    collected = enrollment.get("samples_collected", 0) + 1
    embeddings = enrollment.get("embeddings", [])
    embeddings.append(embedding)

    if collected >= 3:
        # Average embeddings for robust voiceprint
        import numpy as np
        avg_embedding = np.mean(embeddings, axis=0).tolist()

        await cols.voice_enrollments.update_one(
            {"user_id": uid},
            {"$set": {
                "status": "active",
                "samples_collected": collected,
                "embeddings": embeddings,
                "final_embedding": avg_embedding,
                "enrolled_at": get_ist_now()
            }}
        )
        await cols.users.update_one(
            {"user_id": uid},
            {"$set": {"voice_enrolled": True}}
        )

        # Send notification
        await cols.notifications.insert_one({
            "user_id": uid,
            "title": "🔒 Voice Enrolled",
            "body": "Your voiceprint is now securing your payments with triple-layer AI protection",
            "time": "Just now", "read": False, "type": "security",
            "created_at": get_ist_now()
        })

        return {
            "status": "enrollment_complete",
            "samples_collected": collected,
            "samples_required": 3,
            "message": "Voice enrollment complete! Your voice is now your secure key."
        }
    else:
        # Need more samples
        new_phrase = VoiceAuthService.generate_challenge_phrase()
        await cols.voice_enrollments.update_one(
            {"user_id": uid},
            {"$set": {
                "samples_collected": collected,
                "embeddings": embeddings,
                "active_challenge": new_phrase
            }}
        )

        return {
            "status": "sample_recorded",
            "samples_collected": collected,
            "samples_required": 3,
            "challenge_phrase": new_phrase,
            "message": f"Sample {collected}/3 recorded. Please read the next phrase."
        }


# ═══════════════════════════════════════════════
# VOICE VERIFICATION (for payments)
# ═══════════════════════════════════════════════

class VerifyVoicePayload(BaseModel):
    audio_base64: str

@router.post("/voice/verify")
async def verify_voice(
    payload: VerifyVoicePayload,
    user=Depends(get_current_user)
):
    """Verify the speaker's identity against their enrolled voiceprint"""
    uid = user["user_id"]
    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        raise HTTPException(400, "Invalid base64 encoding for audio")


    if len(audio_bytes) < 1000:
        raise HTTPException(400, "Audio too short for verification")

    # Get stored enrollment
    enrollment = await cols.voice_enrollments.find_one({"user_id": uid})
    if not enrollment or enrollment.get("status") != "active":
        raise HTTPException(400, "Voice not enrolled. Please enroll first.")

    stored_embedding = enrollment.get("final_embedding")
    if not stored_embedding:
        raise HTTPException(400, "No voiceprint found. Please re-enroll.")

    # Verify speaker
    result = VoiceAuthService.verify_speaker(audio_bytes, stored_embedding)

    return {
        "verified": result["verified"],
        "confidence": result["similarity"],
        "threshold": result["threshold"],
        "message": "Voice verified successfully!" if result["verified"] else "Voice does not match. Please try again."
    }


# ═══════════════════════════════════════════════
# VOICE PAYMENT (Full Pipeline)
# ═══════════════════════════════════════════════

class VoicePayPayload(BaseModel):
    audio_base64: str
    recipient_upi: str
    amount: float

@router.post("/voice/pay")
async def voice_payment(
    payload: VoicePayPayload,
    user=Depends(get_current_user)
):
    """Execute a payment verified by voice biometrics"""
    uid = user["user_id"]
    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        raise HTTPException(400, "Invalid base64 encoding for audio")
    
    recipient_upi = payload.recipient_upi
    amount = payload.amount
    print(f"📥 VOICE PAY REQUEST: user={uid}, recipient={recipient_upi}, amount={amount}, audio_size={len(audio_bytes)} bytes")

    # Step 1: Check enrollment
    enrollment = await cols.voice_enrollments.find_one({"user_id": uid})
    if not enrollment:
        print(f"❌ VOICE PAY FAILED: No enrollment record found for user {uid}")
        await cols.users.update_one({"user_id": uid}, {"$set": {"voice_enrolled": False}})
        raise HTTPException(400, "Voice not enrolled. Please complete voice enrollment first.")
    if enrollment.get("status") != "active":
        print(f"❌ VOICE PAY FAILED: Enrollment status is '{enrollment.get('status')}', not 'active'. Samples: {enrollment.get('samples_collected', 0)}/3")
        await cols.users.update_one({"user_id": uid}, {"$set": {"voice_enrolled": False}})
        raise HTTPException(400, f"Voice enrollment incomplete (status: {enrollment.get('status')}). Please complete all 3 enrollment samples first.")

    stored_embedding = enrollment.get("final_embedding")
    if not stored_embedding:
        print(f"❌ VOICE PAY FAILED: No final_embedding in enrollment record")
        raise HTTPException(400, "No voiceprint found. Please re-enroll.")

    # Get the active challenge phrase for this user
    active_challenge = enrollment.get("active_challenge", "")
    if not active_challenge:
        print(f"❌ VOICE PAY FAILED: No active challenge phrase found")
        raise HTTPException(400, "No challenge phrase found. Please start the payment again.")

    # Step 2: DUAL VERIFICATION (Speaker Identity + Challenge Phrase STT)
    print(f"🔍 Running DUAL VERIFICATION for {user.get('name')}...")
    verify_result = VoiceAuthService.verify_full(audio_bytes, stored_embedding, active_challenge)

    if not verify_result["verified"]:
        reasons = []
        if not verify_result.get("voice_match"):
            reasons.append(f"Voice mismatch ({verify_result['similarity']:.0%} confidence)")
        if not verify_result.get("phrase_match"):
            reasons.append(f"Wrong phrase (heard: \"{verify_result.get('transcript', '?')}\")")
        
        failure_msg = " & ".join(reasons)
        print(f"🔴 PAYMENT BLOCKED: {user.get('name')} | {failure_msg}")
        raise HTTPException(403, f"Verification failed: {failure_msg}. Payment blocked for security.")

    print(f"🟢 DUAL VERIFIED: {user.get('name')} | Voice: {verify_result['similarity']:.2%} | Phrase: {verify_result['phrase_score']:.2%}")

    # Step 3: Validate balance
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if user.get("balance", 0) < amount:
        print(f"❌ VOICE PAY FAILED: Insufficient balance. Has {user.get('balance',0)}, needs {amount}")
        raise HTTPException(400, "Insufficient balance")

    # Step 4: Find recipient
    recipient_user = await cols.users.find_one({"upi_id": recipient_upi})
    if not recipient_user:
        # Try by name
        recipient_user = await cols.users.find_one({"name": {"$regex": recipient_upi, "$options": "i"}})

    if not recipient_user:
        print(f"❌ VOICE PAY FAILED: Recipient '{recipient_upi}' not found")
        raise HTTPException(404, "Recipient not found")
    if recipient_user["user_id"] == uid:
        raise HTTPException(400, "Cannot transfer to yourself")

    # Step 5: Execute payment (atomic)
    sender_result = await cols.users.update_one(
        {"user_id": uid, "balance": {"$gte": amount}},
        {"$inc": {"balance": -round(amount, 2)}}
    )
    if sender_result.modified_count == 0:
        raise HTTPException(400, "Insufficient balance")

    await cols.users.update_one(
        {"user_id": recipient_user["user_id"]},
        {"$inc": {"balance": round(amount, 2)}}
    )

    # Get updated balances
    updated_sender = await cols.users.find_one({"user_id": uid})
    tx_id = f"VPAY{int(time.time()*1000)}"

    # Step 6: Record transactions
    await cols.transactions.insert_one({
        "id": tx_id, "type": "sent", "amount": amount,
        "recipient": recipient_user.get("name", recipient_upi),
        "memo": "VoiceGuard Payment",
        "category": "Transfer", "timestamp": get_ist_now(),
        "status": "completed", "user_id": uid,
        "verification_method": "voiceguard_biometric",
        "biometric_score": verify_result["similarity"],
        "risk_level": "low"
    })

    await cols.transactions.insert_one({
        "id": tx_id + "R", "type": "received", "amount": amount,
        "recipient": user.get("name", "Unknown"),
        "memo": "VoiceGuard Payment Received",
        "category": "Transfer", "timestamp": get_ist_now(),
        "status": "completed", "user_id": recipient_user["user_id"],
        "verification_method": "voiceguard_biometric",
        "biometric_score": verify_result["similarity"],
        "risk_level": "low"
    })

    # Notifications
    await cols.notifications.insert_one({
        "user_id": uid,
        "title": f"Sent ₹{amount}",
        "body": f"Voice-verified payment to {recipient_user.get('name')} via VoiceGuard",
        "time": "Just now", "read": False, "type": "payment",
        "created_at": get_ist_now()
    })

    print(f"💸 VOICE PAYMENT: {user.get('name')} → {recipient_user.get('name')} | ₹{amount} | Score: {verify_result['similarity']}")

    return {
        "status": "success",
        "transaction_id": tx_id,
        "amount": amount,
        "recipient": recipient_user.get("name", recipient_upi),
        "new_balance": round(updated_sender.get("balance", 0), 2),
        "verification": {
            "method": "VoiceGuard Biometric",
            "confidence": verify_result["similarity"]
        }
    }


# ═══════════════════════════════════════════════
# ENROLLMENT STATUS CHECK
# ═══════════════════════════════════════════════

@router.get("/voice/status")
async def voice_status(user=Depends(get_current_user)):
    """Check if the user has voice enrolled and get enrollment details"""
    uid = user["user_id"]
    enrollment = await cols.voice_enrollments.find_one({"user_id": uid})

    if not enrollment or enrollment.get("status") != "active":
        return {
            "enrolled": False,
            "status": enrollment.get("status", "not_started") if enrollment else "not_started",
            "samples_collected": enrollment.get("samples_collected", 0) if enrollment else 0,
        }

    return {
        "enrolled": True,
        "status": "active",
        "enrolled_at": enrollment.get("enrolled_at", "").isoformat() if enrollment.get("enrolled_at") else None,
        "samples_collected": enrollment.get("samples_collected", 0),
    }
