from pydantic_settings import BaseSettings
from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env file explicitly
env_file = Path(__file__).parent.parent / ".env"
load_dotenv(env_file)

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "your_gemini_key_here")
    ASSEMBLYAI_API_KEY: str = os.getenv("ASSEMBLYAI_API_KEY", "your_assemblyai_key_here")
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "your_twilio_sid_here")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "your_twilio_token_here")
    TWILIO_WHATSAPP_FROM: str = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
    TWILIO_CONTENT_SID: str = os.getenv("TWILIO_CONTENT_SID", "HXb5b62575e6e4ff6129ad7c8efe1f983e")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paysafe.db")

    class Config:
        env_file = str(env_file)
        case_sensitive = False

settings = Settings()
