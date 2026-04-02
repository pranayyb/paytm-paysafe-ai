import json
import os
import re
from pathlib import Path
from typing import Optional, List
from config import settings
from schemas import MatchedPattern, ScamAnalysisResponse

# Load patterns
DATA_DIR = Path(__file__).parent.parent / "data"
with open(DATA_DIR / "scam_patterns.json", "r") as f:
    PATTERNS = json.load(f)

# ─── Urgency keyword boosters ───
URGENCY_WORDS = [
    "jaldi", "turant", "abhi", "immediately", "urgent", "last chance",
    "aaj hi", "time limit", "expire", "band", "block", "freeze",
    "arrest", "jail", "cancel", "warning", "aakhri mauka"
]

MONEY_PATTERN = re.compile(r'₹?\s*[\d,]+\.?\d*')


def _keyword_analysis(message: str, payment_context: dict = None):
    """Enhanced keyword matching with urgency weighting and multi-pattern detection."""
    message_lower = message.lower()

    results = []
    for pattern in PATTERNS:
        matched_keywords = [kw for kw in pattern["keywords"] if kw in message_lower]
        if len(matched_keywords) >= 2:
            # Base confidence from keyword density
            keyword_ratio = len(matched_keywords) / len(pattern["keywords"])
            base_conf = min(95, int(keyword_ratio * 80) + 20)

            # Urgency boost
            urgency_hits = sum(1 for w in URGENCY_WORDS if w in message_lower)
            urgency_boost = min(15, urgency_hits * 5)

            # Amount analysis: mentioning very small amounts (₹1, ₹2) is a social engineering trick
            amounts = MONEY_PATTERN.findall(message_lower)
            amount_boost = 0
            for amt_str in amounts:
                try:
                    amt = float(amt_str.replace("₹", "").replace(",", "").strip())
                    if amt <= 10:
                        amount_boost = 10  # Very small amount = manipulation
                except ValueError:
                    pass

            # Pattern urgency multiplier
            urgency_mult = {"critical": 1.15, "high": 1.05, "medium": 1.0, "low": 0.95}
            mult = urgency_mult.get(pattern.get("urgency", "medium"), 1.0)

            final_conf = min(99, int((base_conf + urgency_boost + amount_boost) * mult))
            results.append({
                "pattern": pattern,
                "confidence": final_conf,
                "matched_keywords": matched_keywords
            })

    if not results:
        return {
            "is_scam": False,
            "confidence": max(5, min(25, len(message_lower.split()) // 3)),
            "scam_type": None,
            "warning_hindi": None,
            "recommendation": "SAFE",
            "matched_patterns": []
        }

    # Sort by confidence, pick the top match
    results.sort(key=lambda x: x["confidence"], reverse=True)
    top = results[0]
    pattern = top["pattern"]

    return {
        "is_scam": True,
        "confidence": top["confidence"],
        "scam_type": pattern["type"],
        "warning_hindi": pattern.get("warning_hindi",
            f"Yeh message {pattern['description']} jaisa lagta hai. Kya aap sure hain aage badhna chahte hain?"),
        "recommendation": "DO_NOT_PAY",
        "matched_patterns": [
            {"type": r["pattern"]["type"], "confidence": r["confidence"]}
            for r in results[:3]  # return top 3 matches
        ]
    }


async def _llm_analysis(message: str, payment_context: dict = None):
    """Use Google Gemini with structured output to analyze the message for scam patterns."""
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        system_prompt = """You are PaySafe AI, an expert Indian UPI scam detector. 
                        You analyze messages in Hindi/Hinglish/English for fraud patterns common in India.
                        Identify the scam pattern and provide a warning in Hindi."""

        user_msg = f"Analyze this message for scam: \"{message}\""
        if payment_context:
            user_msg += f"\nPayment context: amount=₹{payment_context.get('amount')}, receiver={payment_context.get('receiver_upi')}"

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_msg,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ScamAnalysisResponse,
                system_instruction=system_prompt,
            )
        )
        
        return response.parsed.model_dump()

    except Exception as e:
        print(f"[ScamShield] LLM failed ({e}), falling back to keyword analysis")
        return None


async def analyze_message(message: str, payment_context: dict = None):
    """
    Hybrid scam analysis: tries LLM first, falls back to keyword matching.
    """
    # Try LLM if API key is configured
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_key_here":
        llm_result = await _llm_analysis(message, payment_context)
        if llm_result:
            llm_result["analysis_mode"] = "llm"
            return llm_result

    # Fallback: enhanced keyword matching
    result = _keyword_analysis(message, payment_context)
    result["analysis_mode"] = "keyword"
    return result


def get_all_patterns():
    """Returns all known scam patterns for the /scam/patterns endpoint."""
    return [
        {
            "type": p["type"],
            "description": p["description"],
            "urgency": p.get("urgency", "medium"),
            "example_hindi": p.get("example_hindi", ""),
        }
        for p in PATTERNS
    ]
