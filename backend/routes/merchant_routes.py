from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
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
             description="Merchant asks a Hindi voice question about their business. Returns text + audio answer.")
async def handle_voice_query(
    merchant_id: str = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Read audio (in production, feed to Whisper)
    audio_bytes = await audio_file.read()

    # Mock STT — in production use Whisper
    demo_queries = {
        "revenue": ("Aaj kitna kamaaya?", "today_revenue"),
        "customers": ("Mere regular customers kaun hain?", "top_customers"),
        "peak": ("Peak time kab hai?", "peak_hours"),
    }

    # For the demo, simulate "Aaj kitna kamaaya?"
    query_text = "Aaj kitna kamaaya?"

    # Get actual insights from DB
    insights = get_insights(db, merchant_id, "week")
    today_rev = insights["revenue"]["today"]
    total_txns = insights["revenue"]["total_transactions"]
    peak = insights["peak_hours"][0] if insights["peak_hours"] else "N/A"

    answer_text = (
        f"Aaj aapne ₹{today_rev:,.0f} kamaaye hain, "
        f"total {total_txns} transactions hue. "
        f"Sabse busy time {peak} hai."
    )

    return {
        "query_text": query_text,
        "answer_text": answer_text,
        "insights_summary": {
            "today_revenue": today_rev,
            "transactions": total_txns,
            "peak_hours": insights["peak_hours"]
        },
        "voice_response_url": "/audio/merchant_response.mp3"
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
