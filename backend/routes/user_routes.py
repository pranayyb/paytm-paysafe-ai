from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.scam_shield import analyze_message, get_all_patterns
from backend.services.trust_score import calculate_trust_score
from backend.services.qr_scanner import scan_qr
from backend.services.voice import process_voice_payment

router = APIRouter(tags=["User Protection"])


# ─── Request / Response Models ───

class PaymentContext(BaseModel):
    amount: Optional[float] = None
    receiver_upi: Optional[str] = None

class ScamCheckRequest(BaseModel):
    message: str
    payment_context: Optional[PaymentContext] = None

class ScamCheckResponse(BaseModel):
    is_scam: bool
    confidence: int
    scam_type: Optional[str] = None
    warning_hindi: Optional[str] = None
    recommendation: str
    analysis_mode: Optional[str] = None
    matched_patterns: list = []

class UserLocation(BaseModel):
    lat: float
    lng: float

class QRScanRequest(BaseModel):
    qr_data: str
    user_location: Optional[UserLocation] = None


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
             description="Upload Hindi audio → transcription → intent parsing → trust check → voice response.")
async def voice_payment(audio_file: UploadFile = File(...), db: Session = Depends(get_db)):
    if audio_file.content_type and "audio" not in audio_file.content_type and "octet" not in audio_file.content_type:
        raise HTTPException(status_code=400, detail="Please upload an audio file (WAV/MP3).")
    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received.")
    return process_voice_payment(audio_bytes, db)
