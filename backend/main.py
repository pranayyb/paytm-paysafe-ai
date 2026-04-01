from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from backend.database import engine, Base
from backend.routes.user_routes import router as user_router
from backend.routes.merchant_routes import router as merchant_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed data if empty."""
    Base.metadata.create_all(bind=engine)
    # Auto-seed data on first run
    from backend.database import SessionLocal
    from backend.models import User
    db = SessionLocal()
    if db.query(User).count() == 0:
        print("⚡ No data found. Running synthetic data generation...")
        from backend.synthetic_data import generate_data
        generate_data()
        print("✅ Synthetic data generated!")
    db.close()
    yield


app = FastAPI(
    title="PaySafe AI",
    description="🛡️ India's Intelligent Payment Guardian — Protecting users from scams, giving merchants business intelligence.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for TTS audio responses
os.makedirs("/tmp/audio", exist_ok=True)
app.mount("/audio", StaticFiles(directory="/tmp"), name="audio")

# Include routers
app.include_router(user_router)
app.include_router(merchant_router)


@app.get("/", tags=["System"])
def read_root():
    return {
        "service": "PaySafe AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "user": ["/scam/check", "/scam/patterns", "/trust/{upi_id}", "/qr/scan", "/voice/pay"],
            "merchant": ["/merchant/insights", "/merchant/anomalies", "/merchant/voice-query",
                         "/merchant/send-report", "/merchant/list"]
        }
    }


@app.get("/health", tags=["System"])
def health_check():
    from backend.database import SessionLocal
    from backend.models import User
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        return {"status": "healthy", "database": "connected", "users": user_count}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
    finally:
        db.close()
