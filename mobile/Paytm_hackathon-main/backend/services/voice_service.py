import os
import spacy
from typing import Dict, Any

# Load spaCy model (English, but could be multilingual)
try:
    nlp = spacy.load("en_core_web_sm")
except:
    # If not found, download or skip
    nlp = None

class VoiceService:
    @staticmethod
    def transcribe(audio_path: str) -> str:
        """
        Transcribes audio to text using faster-whisper.
        For prototype, uses a mock response or simpler model.
        """
        # In a real app:
        # from faster_whisper import WhisperModel
        # model = WhisperModel("base", device="cpu", compute_type="int8")
        # segments, info = model.transcribe(audio_path, beam_size=5)
        # result = " ".join([segment.text for segment in segments])
        
        # MOCK MOCK MOCK (For hackathon demo)
        if "pay" in audio_path.lower(): # Just a simple check for flow
            return "Pay 500 to Ramesh for lunch"
        return "Unknown command"

    @staticmethod
    def extract_entities(text: str) -> Dict[str, Any]:
        """
        Extracts recipient, amount, and memo from text.
        """
        entities: Dict[str, Any] = {"recipient": None, "amount": None, "memo": None}
        
        # 1. Very simple rule-based (more reliable for hackathon)
        # Looking for words like "to [NAME]", "Rs [PRICE]" etc.
        import re
        
        # Amount: "pay x" or "Rs x"
        amount_match = re.search(r'(?:pay|rs\.?|₹)\s*(\d+)', text.lower())
        if amount_match:
            entities["amount"] = float(amount_match.group(1))
            
        # Recipient: "to [NAME]"
        recipient_match = re.search(r'to\s+([A-Z][a-z]+)', text) # Tries to catch proper noun
        if recipient_match:
            entities["recipient"] = recipient_match.group(1)
            
        # Memo: "for [MEMO]"
        memo_match = re.search(r'for\s+(.*)', text.lower())
        if memo_match:
            entities["memo"] = memo_match.group(1).strip()
            
        # 2. Use spaCy for fallback
        if nlp and (not entities["recipient"] or not entities["amount"]):
            doc = nlp(text)
            for ent in doc.ents:
                if ent.label_ == "PERSON" and not entities["recipient"]:
                    entities["recipient"] = ent.text
                if ent.label_ == "MONEY" and not entities["amount"]:
                    # Clean the amount text
                    clean_amt = re.sub(r'[^\d.]', '', ent.text)
                    if clean_amt:
                        entities["amount"] = float(clean_amt)
                        
        return entities
