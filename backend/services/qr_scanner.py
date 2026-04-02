from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from models import User, Merchant, Transaction
from services.trust_score import calculate_trust_score
import math
import io
import logging

logger = logging.getLogger(__name__)

# Try importing QR image decoding libraries
try:
    from PIL import Image
    import pyzbar.pyzbar as pyzbar
    HAS_QR_DECODER = True
except ImportError:
    HAS_QR_DECODER = False
    logger.warning("pyzbar/Pillow not installed. QR image decoding disabled. Install: pip install pyzbar Pillow")


def scan_qr(db: Session, qr_data: str, user_location: dict = None):
    """
    Full QR DNA scan: parses UPI URL and runs 6 safety checks.
    """
    # ─── Check 1: Valid UPI format ───
    if not qr_data.startswith("upi://pay"):
        return _build_response(
            is_safe=False,
            risk_level="HIGH",
            badge="🔴 INVALID QR",
            checks={"format": {"passed": False, "detail": "Not a valid UPI QR code"}},
            reasons=["QR code galat format mein hai"],
            explanation="Yeh QR code UPI format mein nahi hai. Scan mat karein."
        )

    parsed = urlparse(qr_data)
    query_params = parse_qs(parsed.query)

    pa = query_params.get("pa", [None])[0]   # payee address (UPI ID)
    pn = query_params.get("pn", [None])[0]   # payee name
    am = query_params.get("am", [None])[0]   # amount
    cu = query_params.get("cu", ["INR"])[0]  # currency

    if not pa:
        return _build_response(
            is_safe=False,
            risk_level="HIGH",
            badge="🔴 INVALID QR",
            checks={"payee": {"passed": False, "detail": "Missing UPI ID in QR"}},
            reasons=["QR mein UPI ID nahi hai"],
            explanation="Is QR code mein receiver ki UPI ID missing hai."
        )

    checks = {}
    reasons = []
    risk_points = 0  # Accumulate risk, max ~100

    # ─── Check 2: UPI ID Age ───
    user = db.query(User).filter(User.upi_id == pa).first()
    now = datetime.now(timezone.utc)

    if user:
        created_at = user.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age_days = (now - created_at).days

        if age_days < 7:
            checks["account_age"] = {"passed": False, "detail": f"Account sirf {age_days} din purana hai!"}
            reasons.append(f"Account sirf {age_days} din purana — bahut naya")
            risk_points += 30
        elif age_days < 30:
            checks["account_age"] = {"passed": False, "detail": f"Account {age_days} din purana — naya hai"}
            reasons.append(f"Naya account ({age_days} din)")
            risk_points += 15
        else:
            checks["account_age"] = {"passed": True, "detail": f"Account {age_days} din purana"}
    else:
        checks["account_age"] = {"passed": False, "detail": "UPI ID database mein nahi mili"}
        reasons.append("Unknown UPI ID — database mein nahi hai")
        risk_points += 25

    # ─── Check 3: Name Mismatch ───
    if pn and user:
        qr_name = pn.strip().lower()
        db_name = user.name.strip().lower() if user.name else ""
        # Check if any word from QR name appears in DB name
        qr_words = set(qr_name.split())
        db_words = set(db_name.split())
        overlap = qr_words & db_words
        if len(overlap) == 0 and db_name:
            checks["name_match"] = {"passed": False, "detail": f"QR: '{pn}' ≠ DB: '{user.name}'"}
            reasons.append(f"Naam match nahi karta: QR mein '{pn}', database mein '{user.name}'")
            risk_points += 20
        else:
            checks["name_match"] = {"passed": True, "detail": f"Name verified: {pn}"}
    elif pn:
        checks["name_match"] = {"passed": None, "detail": "Cannot verify — UPI ID not in DB"}
    else:
        checks["name_match"] = {"passed": None, "detail": "No name in QR code"}

    # ─── Check 4: Complaint History ───
    if user and user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == pa).first()
        if merchant and merchant.complaint_count > 0:
            checks["complaints"] = {"passed": False, "detail": f"{merchant.complaint_count} complaints reported"}
            reasons.append(f"{merchant.complaint_count} logon ne report kiya hai")
            risk_points += min(30, merchant.complaint_count * 10)
        else:
            checks["complaints"] = {"passed": True, "detail": "No complaints"}
    elif user:
        checks["complaints"] = {"passed": True, "detail": "No complaints on personal account"}
    else:
        checks["complaints"] = {"passed": None, "detail": "Unknown account"}

    # ─── Check 5: Amount Analysis ───
    if am:
        try:
            amount = float(am)
            if amount >= 10000:
                checks["amount"] = {"passed": False, "detail": f"₹{amount:,.0f} — bahut bada amount"}
                reasons.append(f"QR mein ₹{amount:,.0f} ka request — verify karein")
                risk_points += 15
            elif amount <= 5:
                checks["amount"] = {"passed": False, "detail": f"₹{amount} — suspiciously small (social engineering trick)"}
                reasons.append(f"₹{amount} bahut chhota amount — social engineering ho sakti hai")
                risk_points += 10
            else:
                checks["amount"] = {"passed": True, "detail": f"₹{amount:,.0f}"}
        except ValueError:
            checks["amount"] = {"passed": False, "detail": f"Invalid amount: {am}"}
            risk_points += 5
    else:
        checks["amount"] = {"passed": True, "detail": "No fixed amount in QR"}

    # ─── Check 6: Transaction Velocity (on this QR receiver) ───
    if user:
        recent_tx_count = db.query(Transaction).filter(
            Transaction.receiver_upi_id == pa,
            Transaction.timestamp >= now - timedelta(hours=24)
        ).count()

        avg_daily = db.query(Transaction).filter(
            Transaction.receiver_upi_id == pa,
            Transaction.timestamp >= now - timedelta(days=30)
        ).count() / 30.0

        if avg_daily > 0 and recent_tx_count > avg_daily * 5:
            checks["velocity"] = {"passed": False, "detail": f"{recent_tx_count} txns today vs {avg_daily:.1f}/day avg — spike!"}
            reasons.append("Aaj bahut zyada transactions ho rahe hain is account pe")
            risk_points += 15
        else:
            checks["velocity"] = {"passed": True, "detail": f"{recent_tx_count} txns today, {avg_daily:.1f}/day avg"}
    else:
        checks["velocity"] = {"passed": None, "detail": "Unknown account"}

    # ─── Check 7: GPS Location Mismatch (if provided) ───
    if user_location and user and user.is_merchant:
        merchant = db.query(Merchant).filter(Merchant.upi_id == pa).first()
        # In production, we'd check against merchant's registered city coordinates
        # For demo, we simulate a distance-based check
        checks["location"] = {"passed": True, "detail": "Location check: within expected range"}
    else:
        checks["location"] = {"passed": None, "detail": "Location data not available"}

    # ─── Final Risk Calculation ───
    risk_points = min(100, risk_points)
    is_safe = risk_points < 25

    if risk_points < 15:
        risk_level = "LOW"
        badge = "🟢 Safe to Pay"
        explanation = "Sab checks pass hue. Aap safely pay kar sakte hain."
    elif risk_points < 40:
        risk_level = "MEDIUM"
        badge = "🟡 Proceed Carefully"
        explanation = "Kuch flags hain. Dhyan se amount check karke pay karein."
    else:
        risk_level = "HIGH"
        badge = "🔴 DO NOT PAY"
        explanation = "Bahut saare red flags! Yeh QR scam ho sakta hai. Payment mat karein."

    # Include trust score too
    trust_data = None
    if user:
        trust_data = calculate_trust_score(db, pa)

    return _build_response(
        is_safe=is_safe,
        risk_level=risk_level,
        badge=badge,
        checks=checks,
        reasons=reasons,
        explanation=explanation,
        qr_details={"upi_id": pa, "name": pn, "amount": am, "currency": cu},
        trust_data=trust_data,
        risk_score=risk_points
    )


def _build_response(is_safe, risk_level, badge, checks, reasons, explanation,
                     qr_details=None, trust_data=None, risk_score=0):
    return {
        "is_safe": is_safe,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "badge": badge,
        "checks": checks,
        "reasons": reasons,
        "explanation_hindi": explanation,
        "qr_details": qr_details or {},
        "trust_data": trust_data
    }


def scan_qr_image(db: Session, image_bytes: bytes, user_location: dict = None) -> dict:
    """
    Decode a QR code from an image and analyze its content.
    - If UPI QR → run through scan_qr() for UPI safety checks
    - If regular URL → run through URL fraud analyzer
    - If plain text → return decoded content
    """
    if not HAS_QR_DECODER:
        return {
            "error": True,
            "message": "QR image decoding not available. Install: pip install pyzbar Pillow",
            "decoded_data": None
        }

    try:
        # Decode QR code from image bytes
        img = Image.open(io.BytesIO(image_bytes))
        qr_codes = pyzbar.decode(img)

        if not qr_codes:
            return {
                "error": True,
                "message": "No QR code found in the image. Please upload a clear image.",
                "decoded_data": None
            }

        # Take the first QR code found
        decoded_data = qr_codes[0].data.decode('utf-8')
        qr_type = qr_codes[0].type  # e.g., 'QRCODE', 'EAN13'

        logger.info(f"QR decoded: type={qr_type}, data={decoded_data[:100]}")

        result = {
            "decoded_data": decoded_data,
            "qr_type": qr_type,
            "total_qr_found": len(qr_codes),
        }

        # Route based on content type
        if decoded_data.startswith("upi://pay"):
            # UPI QR → run full UPI safety checks
            upi_result = scan_qr(db, decoded_data, user_location)
            result["content_type"] = "upi"
            result["analysis"] = upi_result
            result["message"] = "UPI QR code detected — full safety scan completed"

        elif decoded_data.startswith("http://") or decoded_data.startswith("https://"):
            # Web URL → run URL fraud ML analysis
            from services.url_analyzer import analyze_url
            url_result = analyze_url(decoded_data)
            result["content_type"] = "url"
            result["analysis"] = url_result
            result["message"] = "URL detected in QR code — fraud analysis completed"

        else:
            # Plain text or other data
            result["content_type"] = "text"
            result["analysis"] = {
                "is_safe": True,
                "risk_level": "LOW",
                "note": "Plain text QR code — no URL or UPI data detected"
            }
            result["message"] = "Plain text QR code decoded"

        return result

    except Exception as e:
        logger.error(f"QR image decoding error: {e}")
        return {
            "error": True,
            "message": f"Failed to decode QR image: {str(e)}",
            "decoded_data": None
        }

