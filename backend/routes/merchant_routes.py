import os
import json
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from config import settings
from schemas import SendReportRequest
from services.merchant_insights import get_insights
from services.whatsapp import send_whatsapp_report
from services.anomaly_detector import detect_merchant_anomalies
from models import Merchant

router = APIRouter(prefix="/merchant", tags=["Merchant Tools"])


@router.get("/insights",
            summary="Get merchant business intelligence",
            description="Revenue, peak hours, customer analysis, weekly patterns, and AI recommendations.")
def fetch_merchant_insights(merchant_id: str, period: str = "week", db: Session = Depends(get_db)):
    if period not in ("day", "week", "month"):
        raise HTTPException(status_code=400, detail="Period must be 'day', 'week', or 'month'")
    return get_insights(db, merchant_id, period)


@router.get("/anomalies",
            summary="Check merchant for anomalies",
            description="Statistical anomaly detection: velocity spikes, large transactions, fraud patterns, unusual hours.")
def check_anomalies(merchant_id: str, db: Session = Depends(get_db)):
    return detect_merchant_anomalies(db, merchant_id)


@router.post("/voice-query",
             summary="Voice business query",
             description="Merchant asks a Hindi voice question about their business. Returns text + AI-powered answer.")
async def handle_voice_query(
    merchant_id: str = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Support WhatsApp formats too
    file_ext = os.path.splitext(audio_file.filename)[1].lower() if audio_file.filename else ".mp3"
    audio_bytes = await audio_file.read()
    
    # 1. Save and Transcribe
    from services.voice import transcribe_audio_assemblyai, generate_voice_response
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_file_path = tmp_file.name
    
    query_text = transcribe_audio_assemblyai(tmp_file_path)
    try: os.unlink(tmp_file_path)
    except: pass
    
    if not query_text or "your_" in os.getenv("ASSEMBLYAI_API_KEY", ""):
        # Demo fallback for testing without keys
        query_text = "Aaj kitna kamaaya?"
    
    # 2. Get Merchant Data Context
    insights = get_insights(db, merchant_id, "week")
    
    # 3. Ask Gemini with Context
    answer_text = "Sorry, main abhi analyze nahi kar paa raha hoon."
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_key_here":
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt = f"""You are 'PaySafe Merchant Guru'.
            A merchant is asking: '{query_text}'
            Based on their business data below, give a helpful, short answer in Hindi/English.
            Data: {json.dumps(insights)}"""
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="Keep it business-focused and encouraging. Use Hinglish if appropriate.",
                )
            )
            answer_text = response.text
        except Exception as e:
            print(f"[MerchantVoice] Gemini failed: {e}")
    else:
        # Rule-based fallback if Gemini not available
        today_rev = insights["revenue"]["today"]
        answer_text = f"Aaj aapne ₹{today_rev:,.0f} kamaaye hain. Business accha chal raha hai!"

    # 4. Generate Voice Response
    voice_url = generate_voice_response(answer_text)

    return {
        "query_text": query_text,
        "answer_text": answer_text,
        "insights_summary": {
            "today_revenue": insights["revenue"]["today"],
            "transactions": insights["revenue"]["total_transactions"],
            "peak_hours": insights["peak_hours"]
        },
        "voice_response_url": voice_url
    }


@router.post("/send-report",
             summary="Send WhatsApp daily report",
             description="Generates insights and sends a formatted WhatsApp message to the merchant's phone.")
def trigger_whatsapp_report(request: SendReportRequest, db: Session = Depends(get_db)):
    report_data = get_insights(db, request.merchant_id, "week")
    return send_whatsapp_report(request.merchant_id, request.phone, report_data)


@router.get("/list",
            summary="List all merchants",
            description="Returns all registered merchants with their categories and UPI IDs.")
def list_merchants(db: Session = Depends(get_db)):
    merchants = db.query(Merchant).all()
    return {
        "count": len(merchants),
        "merchants": [
            {
                "upi_id": m.upi_id,
                "name": m.name,
                "category": m.category,
                "complaint_count": m.complaint_count
            }
            for m in merchants
        ]
    }
