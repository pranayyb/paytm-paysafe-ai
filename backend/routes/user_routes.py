from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (ScamCheckRequest, ScamCheckResponse, QRScanRequest,
                     URLCheckRequest, URLCheckResponse, FeedbackRequest)
from services.scam_shield import analyze_message, get_all_patterns
from services.trust_score import calculate_trust_score
from services.qr_scanner import scan_qr, scan_qr_image
from services.voice import process_voice_payment
from services.url_analyzer import analyze_url
from services.feedback import save_feedback, get_feedback_stats

router = APIRouter(tags=["User Protection"])

# ─── Existing Endpoints ───

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
             description="Upload Hindi audio → transcription → intent parsing → trust check → voice response.")
async def voice_payment(audio_file: UploadFile = File(...), db: Session = Depends(get_db)):
    if audio_file.content_type and "audio" not in audio_file.content_type and "octet" not in audio_file.content_type:
        raise HTTPException(status_code=400, detail="Please upload an audio file (WAV/MP3).")
    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received.")
    return process_voice_payment(audio_bytes, db)


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

