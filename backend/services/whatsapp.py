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
    
    # Format message
    rev = report_data["revenue"]["today"]
    change = report_data["revenue"]["change_pct"]
    txs = report_data["customers"]["total"]
    insight = report_data["llm_insight"]
    
    msg_body = f"""📊 *Daily Report*

💰 Kal ka revenue: ₹{rev} ({change}% vs last week)
👥 Total customers: {txs}
⏰ Peak time: {report_data['peak_hours'][0]}

💡 Insight: {insight}

⚠️ Alert: Sab normal chal raha hai."""

    message = client.messages.create(
        body=msg_body,
        from_=from_whatsapp_number,
        to=f"whatsapp:{phone}"
    )
    
    return {
        "status": "sent",
        "whatsapp_message_id": message.sid,
        "report_summary": f"Daily report sent to {phone}"
    }
