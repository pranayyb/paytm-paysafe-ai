"""
Paytm AI VoiceGuard - Email OTP Service
Sends beautifully styled HTML OTP emails via SMTP
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_email_otp(target_email: str, otp: str) -> bool:
    """Send a beautiful HTML OTP email. Returns True if sent, False if fallback to terminal."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"🔑 DEBUG OTP for {target_email}: {otp}")
        return False

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }}
.c {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }}
.h {{ background: linear-gradient(135deg, #012b5d 0%, #00baf2 100%); padding: 30px; text-align: center; }}
.h h1 {{ color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }}
.b {{ padding: 40px 30px; text-align: center; }}
.b h2 {{ color: #1b2631; font-size: 22px; margin-top: 0; }}
.b p {{ color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }}
.otp {{ background: #f0f8ff; border: 2px dashed #00baf2; border-radius: 12px; padding: 25px; margin: 0 auto; max-width: 300px; }}
.otp p {{ font-size: 42px; font-weight: 900; color: #012b5d; letter-spacing: 12px; margin: 0; padding-left: 12px; }}
.f {{ background: #f9fbfd; padding: 20px; text-align: center; border-top: 1px solid #eee; }}
.f p {{ color: #888; font-size: 12px; margin: 0; }}
</style></head><body>
<div class="c">
  <div class="h"><h1>Paytm <span style="color:#00baf2;">VoiceGuard</span></h1></div>
  <div class="b">
    <h2>🔐 Secure Authentication</h2>
    <p>Use the code below to complete your verification.<br>This code expires in 10 minutes.</p>
    <div class="otp"><p>{otp}</p></div>
    <p style="margin-top:30px;font-size:14px;color:#888;">Do not share this code with anyone.<br>Paytm employees will never ask for your OTP.</p>
  </div>
  <div class="f"><p>&copy; 2026 Paytm AI VoiceGuard &bull; Piyush</p></div>
</div>
</body></html>"""

    msg = MIMEMultipart()
    msg['From'] = f"Paytm VoiceGuard <{SMTP_EMAIL}>"
    msg['To'] = target_email
    msg['Subject'] = "🔐 Your Paytm VoiceGuard Access Code"
    msg.attach(MIMEText(html, 'html'))

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email OTP sent to {target_email}")
        return True
    except Exception as e:
        print(f"❌ Email failed: {e}")
        print(f"🔑 Fallback OTP for {target_email}: {otp}")
        return False
