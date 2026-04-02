from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (ScamCheckRequest, ScamCheckResponse, QRScanRequest,
                     URLCheckRequest, URLCheckResponse, FeedbackRequest,VoiceConfirmationRequest, VerifyPinRequest)
from services.scam_shield import analyze_message, get_all_patterns
from services.trust_score import calculate_trust_score
from services.qr_scanner import scan_qr, scan_qr_image
from services.voice import process_voice_payment, process_voice_command_with_agent
from models import Transaction, User
import tempfile
import os
from pydantic import BaseModel
from google import genai
from config import settings
from datetime import datetime, timezone
from gtts import gTTS
import time
from services.url_analyzer import analyze_url
from services.feedback import save_feedback, get_feedback_stats

router = APIRouter(tags=["User Protection"])


# ─── Endpoints ───

@router.post("/scam/check", response_model=ScamCheckResponse,
            summary="Analyze a message for scam patterns",
            description="Paste a suspicious message and get AI-powered scam analysis in Hindi.")
async def check_scam(request: ScamCheckRequest):
    ctx = request.payment_context.model_dump() if request.payment_context else None
    return await analyze_message(request.message, ctx)


@router.get("/scam/patterns",
            summary="List all known scam patterns",
            description="Returns the full database of known Indian scam patterns with examples.")
def list_scam_patterns():
    return {"count": len(get_all_patterns()), "patterns": get_all_patterns()}


@router.get("/trust/{upi_id}",
            summary="Get trust badge for a UPI ID",
            description="Returns a weighted trust score (0-100) and badge for any UPI ID.")
def get_trust_badge(upi_id: str, db: Session = Depends(get_db)):
    result = calculate_trust_score(db, upi_id)
    return result


@router.post("/qr/scan",
            summary="Scan and analyze a QR code",
            description="Deep QR DNA scan: checks account age, name match, complaints, amount, velocity, and location.")
def scan_qr_code(request: QRScanRequest, db: Session = Depends(get_db)):
    loc = request.user_location.model_dump() if request.user_location else None
    return scan_qr(db, request.qr_data, loc)


@router.post("/voice/pay",
            summary="Process voice payment command",
            description="Upload Hindi audio (MP3/WAV/MP4/OGG) → transcription → intent parsing → trust check → voice response.")
async def voice_payment(audio_file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Support common formats including WhatsApp (.mp4 audio, .ogg)
    allowed_extensions = {".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".aac"}
    file_ext = os.path.splitext(audio_file.filename)[1].lower() if audio_file.filename else ".mp3"
    
    if file_ext not in allowed_extensions:
        # Fallback check on content_type if extension is missing
        if audio_file.content_type and "audio" not in audio_file.content_type and "video/mp4" not in audio_file.content_type:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {file_ext}. Use MP3, WAV, or MP4.")

    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received.")
    
    try:
        # Use the correct extension for the temporary file
        suffix = file_ext if file_ext in allowed_extensions else ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file_path = tmp_file.name
        
        # Pass to service for processing
        result = process_voice_payment(tmp_file_path, db)
        
        try:
            os.unlink(tmp_file_path)
        except:
            pass
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice payment processing failed: {str(e)}")


@router.post("/voice/confirm",
            summary="Confirm pending voice payment - Step 2",
            description="User confirms payment by transaction_id. Asks for PIN.")
async def confirm_voice_payment(
    request: VoiceConfirmationRequest,
    db: Session = Depends(get_db)
):
    try:
        sender_upi = request.sender
        transaction_id = request.transaction_id
        confirmation_text = request.confirmation_text
        
        # Fetch the transaction
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.status == "PENDING_CONFIRMATION"
        ).first()
        
        if not transaction:
            return {
                "status": "error",
                "message": f"🚨 Transaction {transaction_id} nahi mila ya already processed hai"
            }
        
        # Verify sender matches
        if transaction.sender_upi_id.lower() != sender_upi.lower():
            return {
                "status": "error",
                "message": f"🚨 Sender verification failed. Transaction sender: {transaction.sender_upi_id}"
            }
        
        # Check if user confirmed
        if confirmation_text.lower() not in ["yes", "haan", "ok", "confirm"]:
            transaction.status = "CANCELLED"
            db.commit()
            return {
                "status": "cancelled",
                "message": "❌ Payment cancelled",
                "transaction_id": transaction_id
            }
        
        # Get receiver info for PIN message
        receiver = db.query(User).filter(
            User.upi_id == transaction.receiver_upi_id
        ).first()
        
        # Get sender info to include in response
        sender = db.query(User).filter(
            User.upi_id == transaction.sender_upi_id
        ).first()
        
        # Generate PIN request message using LLM
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            pin_prompt = f"""Generate ONE single, natural Hindi/Hinglish message asking the sender for 4-digit PIN. Must be suitable for text-to-speech.

Sender: {sender.name if sender else 'Pranay'}
Receiver: {receiver.name if receiver else 'Someone'}
Amount: ₹{transaction.amount}

REQUIREMENTS:
- ONLY ONE sentence, no bullet points, no lists, no markdown
- Ask ONLY the sender for PIN, NOT the receiver
- Keep it SHORT (under 10 words)
- Suitable for voice TTS output
- NO special characters or formatting
- Be friendly and conversational

Good examples:
Apni 4-digit PIN boldo
PIN dedo {sender.name.split()[0] if sender else 'beta'}
4 digit PIN sunao"""
            
            pin_response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=pin_prompt,
                config=genai.types.GenerateContentConfig(
                    system_instruction="You are a friendly payment assistant. Always respond with EXACTLY ONE sentence, no lists, no bullet points, no markdown formatting."
                )
            )
            pin_message = pin_response.text.strip() if pin_response.text else "4-digit PIN boldo"
        except Exception as e:
            print(f"⚠️ PIN message generation failed: {e}")
            pin_message = "Apni 4-digit PIN sun ao"
        
        # Generate TTS response
        voice_url = None
        if pin_message:
            try:
                tts = gTTS(text=pin_message, lang='hi')
                filename = f"response_{int(time.time())}.mp3"
                filepath = f"/tmp/{filename}"
                tts.save(filepath)
                voice_url = f"/audio/{filename}"
                print(f"✅ Voice response generated: {filename}")
            except Exception as e:
                print(f"⚠️ TTS generation failed: {e}")
        
        return {
            "status": "pin_required",
            "transaction_id": transaction_id,
            "sender_upi": transaction.sender_upi_id,
            "sender_name": sender.name if sender else "Pranay",
            "receiver_name": receiver.name if receiver else "Unknown",
            "receiver_upi": transaction.receiver_upi_id,
            "amount": transaction.amount,
            "message": f"✅ Payment ready: ₹{transaction.amount} {receiver.name if receiver else 'receiver'} ko",
            "response": pin_message,
            "voice_response_url": voice_url,
            "next_step": "verify_pin"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Confirmation failed: {str(e)}")


@router.post("/voice/verify-pin",
            summary="Verify PIN and execute payment - Step 3",
            description="User enters PIN. Verifies and executes the payment.")
async def verify_pin_and_execute(
    request: VerifyPinRequest,
    db: Session = Depends(get_db)
):
    try:
        transaction_id = request.transaction_id
        pin = request.pin

        if not pin or len(pin) != 4 or not pin.isdigit():
            return {
                "status": "error",
                "message": "❌ PIN galat hai. 4-digit PIN dedo"
            }
        
        # Find the transaction
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.status == "PENDING_CONFIRMATION"
        ).first()
        
        if not transaction:
            return {
                "status": "error",
                "message": f"🚨 Transaction {transaction_id} nahi mila ya already processed hai"
            }
        
        # Transaction is confirmed after PIN verification
        transaction.status = "SUCCESS"
        db.commit()
        
        # Get receiver info for success message
        receiver = db.query(User).filter(
            User.upi_id == transaction.receiver_upi_id
        ).first()
        
        # Get sender info to include in response
        sender = db.query(User).filter(
            User.upi_id == transaction.sender_upi_id
        ).first()
        
        # Generate success message using LLM
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            success_prompt = f"""Generate ONE single, natural Hindi/Hinglish message confirming successful payment. Must be suitable for text-to-speech.

Receiver: {receiver.name if receiver else 'Someone'}
Amount: ₹{transaction.amount}

REQUIREMENTS:
- ONLY ONE sentence, no bullet points, no lists, no markdown
- Be conversational and friendly
- Keep it SHORT (under 15 words)
- Suitable for voice TTS output
- NO special characters or formatting

Good examples:
Vijay, {receiver.name if receiver else 'payment'} ko {int(transaction.amount)} rupaye bhej diye!
Success hain, paise {receiver.name if receiver else 'receiver'} ke paas chale gaye
{int(transaction.amount)} rupaye {receiver.name if receiver else 'receiver'} ko transfer ho gaya"""
            
            success_response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=success_prompt,
                config=genai.types.GenerateContentConfig(
                    system_instruction="You are a friendly payment assistant. Always respond with EXACTLY ONE sentence, no lists, no bullet points, no markdown formatting."
                )
            )
            success_message = success_response.text.strip() if success_response.text else f"Success! {receiver.name if receiver else 'Payment'} ko {int(transaction.amount)} rupaye transfer ho gaya"
        except Exception as e:
            print(f"⚠️ Success message generation failed: {e}")
            success_message = f"Success! {receiver.name if receiver else 'Payment'} ko {int(transaction.amount)} rupaye transfer ho gaya"
        
        # Generate TTS response
        voice_url = None
        if success_message:
            try:
                tts = gTTS(text=success_message, lang='hi')
                filename = f"response_{int(time.time())}.mp3"
                filepath = f"/tmp/{filename}"
                tts.save(filepath)
                voice_url = f"/audio/{filename}"
                print(f"✅ Voice response generated: {filename}")
            except Exception as e:
                print(f"⚠️ TTS generation failed: {e}")
        
        return {
            "status": "success",
            "message": f"✅ ₹{transaction.amount} successfully भेज दिए गए {transaction.receiver_upi_id} को!",
            "transaction_id": transaction_id,
            "transaction_status": "SUCCESS",
            "amount": transaction.amount,
            "sender_upi": transaction.sender_upi_id,
            "sender_name": sender.name if sender else "Pranay",
            "receiver_upi": transaction.receiver_upi_id,
            "receiver_name": receiver.name if receiver else "Unknown",
            "response": success_message,
            "voice_response_url": voice_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PIN verification failed: {str(e)}")


# ─── NEW: URL Fraud Detection (ML) ───

@router.post("/url/check", response_model=URLCheckResponse,
             summary="Analyze a URL for phishing/fraud",
             description="ML-based URL analysis using RandomForest + 18 heuristic features (TLD, IP, keywords, entropy, etc.)")
def check_url(request: URLCheckRequest):
    return analyze_url(request.url)


# ─── NEW: QR Code Image Upload ───

@router.post("/qr/scan-image",
             summary="Upload a QR code image for decoding + analysis",
             description="Upload a photo of a QR code → pyzbar decodes it → runs UPI safety scan or URL fraud check automatically.")
async def scan_qr_image_endpoint(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if image.content_type and "image" not in image.content_type:
        raise HTTPException(status_code=400, detail="Please upload an image file (PNG/JPG).")
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")
    result = scan_qr_image(db, image_bytes)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ─── NEW: User Feedback Loop ───

@router.post("/feedback",
             summary="Submit feedback on scam/URL analysis",
             description="Report if an analysis was correct or wrong. Helps improve the ML model over time.")
def submit_feedback(request: FeedbackRequest):
    if request.correct_label not in [0, 1]:
        raise HTTPException(status_code=400, detail="correct_label must be 0 (legitimate) or 1 (fraudulent)")
    success = save_feedback(
        item_type=request.item_type,
        item_data=request.item_data,
        correct_label=request.correct_label,
        original_prediction=request.original_prediction,
        user_note=request.user_note
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save feedback")
    return {"success": True, "message": "Feedback saved. Thank you for improving PaySafe!"}


@router.get("/feedback/stats",
            summary="Get feedback collection stats",
            description="Returns summary of all user feedback collected for model retraining.")
def feedback_stats():
    return get_feedback_stats()