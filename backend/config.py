from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = "your_gemini_key_here"
    TWILIO_ACCOUNT_SID: str = "your_twilio_sid_here"
    TWILIO_AUTH_TOKEN: str = "your_twilio_token_here"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    DATABASE_URL: str = "sqlite:///./paysafe.db"

    class Config:
        env_file = ".env"

settings = Settings()
