import re
import time
import os
from gtts import gTTS
from sqlalchemy.orm import Session
from models import User
from services.trust_score import calculate_trust_score

# ─── Hindi Intent Parser ───
# Maps Hindi number words to digits
HINDI_NUMBERS = {
    "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5,
    "chhah": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "gyarah": 11, "barah": 12, "bis": 20, "pachas": 50,
    "sau": 100, "hazaar": 1000, "hazar": 1000, "lakh": 100000, "crore": 10000000
}

# Amount extraction patterns
AMOUNT_PATTERNS = [
    re.compile(r'₹\s*([\d,]+)', re.IGNORECASE),
    re.compile(r'([\d,]+)\s*(?:rupees?|rupye|rupaye|rs\.?)', re.IGNORECASE),
    re.compile(r'(?:amount|paisa|paise)\s*(?:of|ka)?\s*([\d,]+)', re.IGNORECASE),
    re.compile(r'([\d,]+)\s*(?:bhejo|bhej|transfer|send|de do|dedo)', re.IGNORECASE),
    re.compile(r'(?:bhejo|bhej|transfer|send|de do|dedo)\s*([\d,]+)', re.IGNORECASE),
]

# Receiver name extraction
NAME_PATTERNS = [
    re.compile(r'(\w+)\s+ko\s+(?:[\d,]+|₹)', re.IGNORECASE),  # "Rahul ko 500"
    re.compile(r'(\w+)\s+(?:ke liye|ke account|ka account|wale ko)', re.IGNORECASE),
    re.compile(r'(?:bhejo|send|transfer)\s+(\w+)', re.IGNORECASE),
]

# Purpose extraction
PURPOSE_PATTERNS = [
    re.compile(r'(?:ke liye|for)\s+(.+?)(?:\.|$)', re.IGNORECASE),
    re.compile(r'(?:khareedne|kharidne)\s+(.+?)(?:\.|$)', re.IGNORECASE),
]


def parse_hindi_intent(text: str):
    """Parse Hindi/Hinglish voice command to extract payment intent."""
    text_lower = text.lower().strip()

    # Extract amount
    amount = None
    for pattern in AMOUNT_PATTERNS:
        match = pattern.search(text_lower)
        if match:
            try:
                amount = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                pass

    # Try Hindi number words if no digit amount found
    if amount is None:
        for word, val in HINDI_NUMBERS.items():
            if word in text_lower:
                amount = val
                break

    # Extract receiver name
    receiver = None
    for pattern in NAME_PATTERNS:
        match = pattern.search(text_lower)
        if match:
            name = match.group(1).strip()
            # Filter out common Hindi words that aren't names
            skip_words = {"mujhe", "mujhko", "hume", "sabko", "unko", "usko", "isko", "paisa", "paise", "rupye"}
            if name.lower() not in skip_words and len(name) > 1:
                receiver = name.capitalize()
                break

    # Extract purpose
    purpose = None
    for pattern in PURPOSE_PATTERNS:
        match = pattern.search(text_lower)
        if match:
            purpose = match.group(1).strip()
            break

    return {
        "receiver": receiver,
        "amount": amount,
        "purpose": purpose
    }


def process_voice_payment(audio_bytes, db: Session):
    """
    Process voice payment: STT → Intent Parse → Trust Check → TTS Response.
    """
    # ─── Step 1: Speech-to-Text ───
    # In production, use OpenAI Whisper:
    #   import whisper
    #   model = whisper.load_model("base")
    #   result = model.transcribe(audio_file_path)
    #   transcribed = result["text"]
    #
    # For demo, we simulate several possible transcriptions
    demo_transcriptions = [
        "Rahul ko 500 bhejo vegetables ke liye",
        "Ramesh medical store ko 1200 bhejo dawai ke liye",
        "Naye dukan wale ko 2000 bhejo",
    ]

    # Use first demo transcription (in production: actual Whisper output)
    transcribed = demo_transcriptions[0]

    # ─── Step 2: Intent Parsing ───
    parsed_intent = parse_hindi_intent(transcribed)

    # ─── Step 3: Trust Score Lookup ───
    trust_check = {"badge": "🟢 Trusted", "warning": False}
    receiver_details = None

    if parsed_intent["receiver"]:
        # Try to find receiver in DB by partial name match
        receiver_name = parsed_intent["receiver"].lower()
        users = db.query(User).filter(
            User.name.ilike(f"%{receiver_name}%")
        ).all()

        if users:
            best_match = users[0]
            trust_data = calculate_trust_score(db, best_match.upi_id)
            trust_check = {
                "badge": trust_data["badge"],
                "warning": trust_data["trust_score"] < 70,
                "trust_score": trust_data["trust_score"],
                "account_age_days": trust_data["account_age_days"]
            }
            receiver_details = {
                "upi_id": best_match.upi_id,
                "name": best_match.name,
                "is_merchant": best_match.is_merchant
            }
        else:
            trust_check = {
                "badge": "🔴 UNKNOWN",
                "warning": True,
                "trust_score": 0
            }

    # ─── Step 4: Generate Voice Response ───
    if trust_check.get("warning"):
        age = trust_check.get("account_age_days", "unknown")
        receiver = parsed_intent.get("receiver", "is account")
        amount = parsed_intent.get("amount", "")
        response_text = (
            f"{receiver} ka account naya ya risky hai. "
            f"Kya aap sure hain ₹{amount} bhejna chahte hain? "
            f"Confirm karne ke liye 'Haan' bolein."
        )
    else:
        receiver = parsed_intent.get("receiver", "receiver")
        amount = parsed_intent.get("amount", "")
        purpose = parsed_intent.get("purpose", "")
        purpose_str = f" {purpose} ke liye" if purpose else ""
        response_text = (
            f"{receiver} ko ₹{amount}{purpose_str} bhejne ki tayyari hai. "
            f"Confirm karne ke liye 'Haan' bolein."
        )

    # Generate TTS audio file
    try:
        tts = gTTS(text=response_text, lang='hi')
        filename = f"response_{int(time.time())}.mp3"
        filepath = f"/tmp/{filename}"
        tts.save(filepath)
        voice_url = f"/audio/{filename}"
    except Exception:
        voice_url = None

    return {
        "transcribed": transcribed,
        "parsed_intent": parsed_intent,
        "receiver_details": receiver_details,
        "trust_check": trust_check,
        "response_text": response_text,
        "voice_response_url": voice_url,
        "requires_confirmation": True
    }
