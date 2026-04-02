"""
Centralized Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Scam Shield Models ───

class MatchedPattern(BaseModel):
    type: Optional[str] = Field(description="The type of scam pattern detected")
    confidence: int = Field(description="Confidence score 0-99")


class ScamAnalysisResponse(BaseModel):
    is_scam: bool = Field(description="Whether the message appears to be a scam")
    confidence: int = Field(description="Confidence score 0-99")
    scam_type: Optional[str] = Field(description="Type of scam detected, if any")
    warning_hindi: Optional[str] = Field(description="Warning message in Hindi")
    recommendation: str = Field(description="Recommendation: DO_NOT_PAY, PROCEED_CAREFULLY, or SAFE")
    matched_patterns: Optional[List[MatchedPattern]] = Field(default_factory=list, description="List of matched scam patterns with confidence scores")


# ─── User Payment Context Models ───

class PaymentContext(BaseModel):
    amount: Optional[float] = Field(None, description="Transaction amount in INR")
    receiver_upi: Optional[str] = Field(None, description="Receiver's UPI ID")


class ScamCheckRequest(BaseModel):
    message: str = Field(description="The suspicious message to analyze for scam patterns")
    payment_context: Optional[PaymentContext] = Field(None, description="Optional payment context for enriched analysis")


class ScamCheckResponse(BaseModel):
    is_scam: bool = Field(description="Whether the message is detected as a scam")
    confidence: int = Field(description="Confidence score from 0-99")
    scam_type: Optional[str] = Field(None, description="Type of scam detected (e.g., electricity_scam, kyc_scam)")
    warning_hindi: Optional[str] = Field(None, description="Warning message in Hindi")
    recommendation: str = Field(description="Recommendation: DO_NOT_PAY, PROCEED_CAREFULLY, or SAFE")
    analysis_mode: Optional[str] = Field(None, description="Analysis method used: llm or keyword")
    matched_patterns: list = Field(default_factory=list, description="List of matched scam patterns with confidence scores")


# ─── QR Scanner Models ───

class UserLocation(BaseModel):
    lat: float = Field(description="Latitude of user's location")
    lng: float = Field(description="Longitude of user's location")


class QRScanRequest(BaseModel):
    qr_data: str = Field(description="UPI QR code data (upi://pay?...)")
    user_location: Optional[UserLocation] = Field(None, description="Optional user GPS location for location-based checks")


# ─── Merchant Models ───

class SendReportRequest(BaseModel):
    merchant_id: str = Field(description="Merchant's UPI ID")
    phone: str = Field("+919999999999", description="Merchant's WhatsApp phone number in E.164 format")


# ─── URL Fraud Check Models ───

class URLCheckRequest(BaseModel):
    url: str = Field(description="The URL to analyze for phishing/fraud")


class URLCheckResponse(BaseModel):
    url: str = Field(description="The analyzed URL")
    is_fraud: bool = Field(description="Whether the URL is classified as fraudulent")
    confidence: float = Field(description="Confidence score (0-100)")
    risk_level: str = Field(description="Risk level: Safe, Low, Medium, High, Critical")
    risk_factors: List[str] = Field(default_factory=list, description="List of detected risk factors")
    analysis_mode: Optional[str] = Field(None, description="Analysis method: ml or heuristic")
    warning_hindi: Optional[str] = Field(None, description="Warning message in Hindi")


# ─── User Feedback Models ───

class FeedbackRequest(BaseModel):
    item_type: str = Field(description="Type of item: 'url', 'scam_message', or 'qr'")
    item_data: str = Field(description="The content that was analyzed (URL, message, QR data)")
    correct_label: int = Field(description="Correct label: 0 = legitimate, 1 = fraudulent")
    original_prediction: Optional[bool] = Field(None, description="What the system originally predicted")
    user_note: Optional[str] = Field(None, description="Optional note from user about why this is correct/incorrect")


# ─── Request Models ───
class VoiceConfirmationRequest(BaseModel):
    """Step 2: Confirm pending payment by transaction_id"""
    sender: str  # Sender UPI ID (e.g., "pranay@sbi")
    transaction_id: int
    confirmation_text: str = "yes"  # yes/no/haan/cancel

class VerifyPinRequest(BaseModel):
    """Step 3: Verify PIN and execute payment by transaction_id"""
    transaction_id: int
    pin: str