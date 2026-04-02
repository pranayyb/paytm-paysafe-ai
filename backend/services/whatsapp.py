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
            
            # Rich AI context with full merchant intelligence
            anomalies_raw = report_data.get("anomalies", [])
            anomaly_alerts = anomalies_raw.get("alerts", []) if isinstance(anomalies_raw, dict) else anomalies_raw
            
            ai_context = {
                "merchant_id": merchant_id,
                "revenue_today": f"₹{rev}",
                "revenue_change": f"{change}%",
                "total_customers": txs,
                "peak_hour": report_data.get('peak_hours', ['N/A'])[0],
                "ai_insight": insight,
                "recommendations": report_data.get("recommendations", []),
                "security_alerts": report_data.get("security_alerts", []),
                "anomalies": anomaly_alerts
            }
            
            prompt = f"""Generate a premium WhatsApp daily business report.
Merchant Data: {json.dumps(ai_context, ensure_ascii=False)}"""
            
            response = client_ai.models.generate_content(
                model="gemini-2.5-pro",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="""You are 'PaySafe Merchant Guru' — an elite AI business advisor for Indian merchants.

FORMAT RULES (STRICT):
1. MUST be UNDER 900 characters total. This is non-negotiable.
2. Use WhatsApp-native formatting only: *bold*, _italic_, ~strikethrough~.
3. Structure:
   - 💎 *PaySafe Daily Report* (Header)
   - ━━━━━━━━━━━━━━ (Divider)
   - 📊 *Key Metrics* section (Revenue, Customers, Peak Hour)
   - 🌟 *Guru Ka Gyan* section (1 actionable tip based on data)
   - 🚨 *Alerts* section (only if anomalies exist, skip if none)
   - 🙏 Closing line
4. Use 🔹 for bullet points. Bold all numbers.
5. Language: Professional Hinglish (60% Hindi, 40% English).
6. Tone: Confident, encouraging, data-driven. Like a trusted business partner.
7. DO NOT repeat data. Be concise and impactful.""",
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
