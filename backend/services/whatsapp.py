import os
from twilio.rest import Client
from config import settings

def send_whatsapp_report(merchant_id: str, phone: str, report_data: dict):
    """
    Sends a WhatsApp message via Twilio Sandbox.
    """
    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_whatsapp_number = settings.TWILIO_WHATSAPP_FROM
    
    if account_sid == "your_twilio_sid_here":
        # Mock behavior for local dev
        print(f"[MOCK WHATSAPP] Sending report to {phone} for {merchant_id}")
        return {
            "status": "sent",
            "whatsapp_message_id": "SM_mock_12345",
            "report_summary": f"Mock report sent to {phone}"
        }
        
    client = Client(account_sid, auth_token)
    
    # Ensure whatsapp prefix
    from_num = from_whatsapp_number if from_whatsapp_number.startswith("whatsapp:") else f"whatsapp:{from_whatsapp_number}"
    to_num = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
    
    # Extraction
    rev = report_data.get("revenue", {}).get("today", 0)
    change = report_data.get("revenue", {}).get("change_pct", 0)
    txs = report_data.get("customers", {}).get("total", 0)
    insight = report_data.get("llm_insight", "Business looks stable.")
    
    # ─── Dynamic AI Report Generation ───
    msg_body = "📊 Daily Report: Business is stable."
    
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_key_here":
        try:
            from google import genai
            from google.genai import types
            import json
            
            client_ai = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            # Simplified report data for AI context
            ai_context = {
                "merchant_id": merchant_id,
                "revenue": rev,
                "change_pct": change,
                "customers": txs,
                "insight": insight,
                "peak": report_data.get('peak_hours', ['N/A'])[0],
                "security_alerts": report_data.get("security_alerts", [])
            }
            
            prompt = f"""You are 'PaySafe Merchant Guru'. Write a professional daily WhatsApp report for an Indian merchant.
            Include revenue, customer metrics, and any security warnings.
            Data: {json.dumps(ai_context)}"""
            
            response = client_ai.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="""You are 'PaySafe Merchant Guru'. Create a premium, professional WhatsApp report.
                    - Style: Clear, organized, and encouraging.
                    - Format: Use title, section separators (---), and bullet points.
                    - Bold key numbers (e.g., *767.12*). 
                    - Emojis: Use professional ones (📊, 💰, 🚀, 🚨).
                    - Language: Professional Hinglish (Hindi + English).""",
                )
            )
            msg_body = response.text
        except Exception as e:
            print(f"[AI Report] Gemini failed: {e}")
            msg_body = f"📊 *Daily Report*\n\n💰 Revenue: ₹{rev}\n👥 Customers: {txs}"
    else:
        msg_body = f"📊 *Daily Report*\n\n💰 Revenue: ₹{rev}\n👥 Customers: {txs}"

    message = client.messages.create(
        body=msg_body,
        from_=from_num,
        to=to_num
    )
    
    return {
        "status": "sent",
        "whatsapp_message_id": message.sid,
        "report_summary": f"Daily report sent to {phone}"
    }
