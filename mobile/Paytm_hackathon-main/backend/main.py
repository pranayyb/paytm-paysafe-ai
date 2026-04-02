"""
╔══════════════════════════════════════════════════════════════╗
║         Paytm AI VoiceGuard - Backend Server v2.0           ║
║    Secure Voice UPI Payments with Deep Soundbox Integration  ║
║                       Piyush                                ║
╚══════════════════════════════════════════════════════════════╝
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging
import cv2
import numpy as np

# Silence annoying passlib warning about bcrypt version
logging.getLogger("passlib").setLevel(logging.ERROR)

# Silence harmless uvicorn warnings caused by localtunnel/app tearing down keep-alive connections
class IgnoreInvalidHTTP(logging.Filter):
    def filter(self, record):
        return "Invalid HTTP request received" not in record.getMessage()

logging.getLogger("uvicorn.error").addFilter(IgnoreInvalidHTTP())

from database import connect_db, close_db
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.payment_routes import router as payment_router
from routes.merchant_routes import router as merchant_router
from routes.voice_routes import router as voice_router

from services.voice_auth_service import VoiceAuthService

# ─── Lifespan (replaces deprecated on_event) ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print("🧠 Warming up Voice AI Models (this may take a few seconds)...")
    try:
        VoiceAuthService.get_encoder()
        VoiceAuthService.get_whisper()
    except Exception as e:
        print(f"⚠️ Warning: Could not pre-load AI models: {e}")
        
    print("🚀 Paytm AI VoiceGuard v2.0 is LIVE")
    yield
    await close_db()

# ─── App Factory ───
app = FastAPI(
    title="Paytm AI VoiceGuard",
    description="Secure, AI-Powered Voice UPI Payments with Deep Soundbox Integration",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount Routers ───
app.include_router(auth_router,     prefix="/auth",     tags=["🔐 Authentication"])
app.include_router(user_router,     prefix="/user",     tags=["👤 User"])
app.include_router(payment_router,                      tags=["💳 Payments & Voice"])
app.include_router(merchant_router, prefix="/merchant", tags=["🏪 Merchant & Soundbox"])
app.include_router(voice_router,    prefix="/api",      tags=["🔊 Voice Authentication"])

# ─── Health Check ───
@app.get("/", tags=["System"])
async def health():
    return {
        "status": "active",
        "service": "Paytm AI VoiceGuard",
        "version": "2.0.0",
        "team": "DREAMTECH",
        "features": [
            "Triple-Layer Voice Verification",
            "AI Risk Scoring",
            "Soundbox Integration",
            "Email OTP Authentication",
        ]
    }

# ─── Utility: QR Decoding ───
@app.post("/qr/decode", tags=["🔧 Utilities"])
async def decode_qr(file: UploadFile = File(...)):
    """Decode a QR code from an uploaded image using OpenCV"""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image format"})
            
        detector = cv2.QRCodeDetector()
        data, bbox, straight_qrcode = detector.detectAndDecode(img)
        
        if data:
            print(f"✅ Decoded QR: {data}")
            return {"data": data}
        else:
            return JSONResponse(status_code=404, content={"error": "No QR code found in image"})
    except Exception as e:
        print(f"❌ QR Decode Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ─── Run ───
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
