# PaySafe AI - API Request/Response Documentation

## Overview
Complete API documentation for PaySafe AI with request/response JSON formats for all user protection and merchant tools endpoints.

---

## 🛡️ USER PROTECTION ROUTES

### 1. **Scam Message Analysis**
**Endpoint:** `POST /scam/check`

**Summary:** Analyze a message for scam patterns using AI-powered detection

**Description:** Users paste suspicious messages (SMS, chat, email) and receive instant scam analysis with risk level, detected patterns, and Hindi explanation.

**Request:**
```json
{
  "message": "Dear Customer, Your account will be locked in 24 hours. Update your Aadhar & PAN immediately on www.bank-updated.com to avoid suspension. Click link: bit.ly/bankupd",
  "payment_context": {
    "receiver_upi": "rajesh@paytm",
    "amount": 250
  }
}
```

**Response:**
```json
{
  "is_scam": true,
  "confidence": 95,
  "scam_type": "kyc_scam",
  "warning_hindi": "🚨 CRITICAL SCAM! यह KYC scam है। असली bank कभी SMS/email से Aadhar/PAN नहीं माँगता। Link पर click मत करो, अपनी जानकारी मत दो।",
  "recommendation": "DO_NOT_PAY",
  "analysis_mode": "llm",
  "matched_patterns": [
    {
      "type": "kyc_scam",
      "confidence": 95
    },
    {
      "type": "phishing_scam",
      "confidence": 88
    }
  ]
}
```

---

### 2. **Get All Scam Patterns**
**Endpoint:** `GET /scam/patterns`

**Summary:** List all known scam patterns in the database

**Description:** Returns complete database of 15+ Indian scam types with examples, keywords, and prevention tips.

**Request:** No request body (Query parameters optional)

**Response:**
```json
{
  "count": 15,
  "patterns": [
    {
      "id": 1,
      "pattern": "electricity_scam",
      "name": "Electricity Bill Scam",
      "description": "Fake billing demands claiming unpaid electricity bills",
      "keywords": ["electricity", "bill", "urgent", "disconnect", "payment"],
      "risk_level": "high",
      "typical_amount": "500-5000",
      "target_segments": ["middle_class", "business_owners"]
    },
    {
      "id": 2,
      "pattern": "kyc_scam",
      "name": "KYC Verification Scam",
      "description": "Requests for KYC/personal details claiming account freeze/upgrade",
      "keywords": ["kyc", "verification", "update", "aadhar", "pan", "freeze"],
      "risk_level": "critical",
      "typical_amount": "0-100",
      "target_segments": ["elderly", "less_tech_savvy"],
      "prevention": "Banks never ask for KYC details via UPI/messaging"
    },
    {
      "id": 9,
      "pattern": "romance_scam",
      "name": "Romance/Relationship Scam",
      "description": "Building fake relationships to extract money for emergencies or travel",
      "keywords": ["friend", "help", "travel", "visa", "meeting", "emergency"],
      "risk_level": "high",
      "typical_amount": "500-20000",
      "target_segments": ["lonely", "seeking_relationships"],
      "prevention": "Be cautious if someone you just met asks for money"
    }
  ]
}
```

---

### 3. **Get Trust Badge for UPI ID**
**Endpoint:** `GET /trust/{upi_id}`

**Summary:** Get trust score and badge for any UPI ID

**Description:** Returns weighted trust score (0-100), badge, account age, transaction history, and risk factors for any UPI ID (user or merchant).

**Request:** 
```
GET /trust/amit.k@paytm
```

**Response (Trusted User):**
```json
{
  "upi_id": "amit.k@paytm",
  "trust_score": 92,
  "badge": "✅ Verified Trusted",
  "badge_color": "green",
  "account_age_days": 1824,
  "flags": [],
  "explanation": "✅ Safe to transact. Highly trusted user with excellent track record.",
  "factors": {
    "account_age": {"score": 95, "label": "Excellent (5+ years)"},
    "transaction_history": {"score": 90, "label": "Strong (400+ transactions)"},
    "complaints": {"score": 100, "label": "None"},
    "disputes": {"score": 100, "label": "None"}
  }
}
```

**Response (Flagged User):**
```json
{
  "upi_id": "suspicious123@ybl",
  "trust_score": 18,
  "badge": "🔴 High Risk",
  "badge_color": "red",
  "account_age_days": 45,
  "flags": [
    "Very new account",
    "Multiple complaints filed",
    "Disputed transactions"
  ],
  "explanation": "⚠️ HIGH RISK. Bahut zyada complaints ya bahut naya account! Payment se pehle verify karein.",
  "factors": {
    "account_age": {"score": 5, "label": "Very New (<2 months)"},
    "transaction_history": {"score": 20, "label": "Limited"},
    "complaints": {"score": 0, "label": "5 complaints"},
    "disputes": {"score": 10, "label": "2 disputed transactions"}
  }
}
```

---

### 4. **QR Code Analysis**
**Endpoint:** `POST /qr/scan`

**Summary:** Scan and analyze a QR code for safety

**Description:** Analyzes QR data (usually UPI links) for account safety. Checks: account age, name match, complaints, transaction velocity, location anomalies.

**Request:**
```json
{
  "qr_data": "upi://pay?pa=rajesh.chai@paytm&pn=Rajesh%20Chai&am=250&tn=Tea%20Payment",
  "user_location": {
    "lat": 28.7041,
    "lng": 77.1025
  }
}
```

**Response (Safe QR):**
```json
{
  "is_safe": true,
  "risk_level": "LOW",
  "risk_score": 5,
  "badge": "✅ SAFE",
  "checks": {
    "account_age": {"passed": true, "detail": "Account 2.5 years purana"},
    "name_match": {"passed": true, "detail": "Name verified: Rajesh Chai"},
    "complaints": {"passed": true, "detail": "No complaints recorded"}
  },
  "reasons": [],
  "explanation_hindi": "✅ सुरक्षित QR! यह एक विश्वसनीय व्यापारी है। आप सुरक्षित रूप से भुगतान कर सकते हैं।",
  "qr_details": {
    "upi_id": "rajesh.chai@paytm",
    "name": "Rajesh Chai",
    "amount": "250",
    "currency": "INR"
  },
  "trust_data": {
    "account_age_days": 912,
    "transaction_count": 487,
    "complaint_count": 0,
    "dispute_count": 0,
    "trust_badge": "verified_trusted"
  }
}
```

**Response (Suspicious QR):**
```json
{
  "is_safe": false,
  "risk_level": "CRITICAL",
  "risk_score": 85,
  "badge": "🔴 FRAUD ALERT",
  "checks": {
    "account_age": {"passed": false, "detail": "Account sirf 2 din purana hai!"},
    "name_match": {"passed": false, "detail": "Naam match nahi karta"},
    "complaints": {"passed": false, "detail": "3 complaints registered"}
  },
  "reasons": [
    "Account sirf 2 din purana — bahut naya",
    "Naam match nahi karta",
    "3 fraud complaints recorded"
  ],
  "explanation_hindi": "🚨 FRAUD ALERT! Ye QR code fraud jaisa lagta hai. Paise mat bhejo! Ye account naya hai aur complaints hain.",
  "qr_details": {
    "upi_id": "unknown.upi@bank",
    "name": "Unknown",
    "amount": null,
    "currency": "INR"
  },
  "trust_data": {
    "account_age_days": 2,
    "transaction_count": 5,
    "complaint_count": 3,
    "dispute_count": 1,
    "trust_badge": "flagged_account"
  }
}
```

---

### 5. **Upload QR Code Image**
**Endpoint:** `POST /qr/scan-image`

**Summary:** Upload QR code image for analysis

**Description:** Upload a photo of QR code → automatically decoded and analyzed for fraud/safety.

**Request:** Multipart form-data with image file
```
POST /qr/scan-image
Content-Type: multipart/form-data

[Binary image data - PNG or JPG]
```

**Response:**
```json
{
  "decoded_data": "upi://pay?pa=rajesh.chai@paytm&pn=Rajesh%20Chai&am=250",
  "is_safe": true,
  "risk_level": "LOW",
  "risk_score": 5,
  "badge": "✅ SAFE",
  "qr_details": {
    "upi_id": "rajesh.chai@paytm",
    "name": "Rajesh Chai",
    "amount": "250",
    "currency": "INR"
  },
  "trust_data": {
    "account_age_days": 912,
    "transaction_count": 487,
    "trust_badge": "verified_trusted"
  }
}
```

---

### 6. **Voice Payment - Step 1**
**Endpoint:** `POST /voice/pay`

**Summary:** Initiate voice payment (Hindi audio upload)

**Description:** Upload Hindi audio message → transcription → intent parsing (payment amount, recipient) → trust check → generates voice response.

**Request:** Multipart form-data with audio file
```
POST /voice/pay
Content-Type: multipart/form-data

[Binary audio data - MP3, WAV, M4A, OGG, or MP4]
```

**Example Audio Transcript:** "Rajesh ko 250 rupaye bhej do"

**Response:**
```json
{
  "status": "pending_confirmation",
  "transcribed_text": "Rajesh ko 250 rupaye bhej do",
  "sender_upi": "amit.k@paytm",
  "sender_name": "Amit Kumar",
  "transaction_id": 1042,
  "pending_payment": {
    "transaction_id": 1042,
    "sender_upi": "amit.k@paytm",
    "receiver_upi": "rajesh.chai@paytm",
    "receiver_name": "Rajesh Chai",
    "amount": 250
  },
  "response": "250 rupaye Rajesh Chai ko bhejne ke liye ready hain. Confirm karte ho?",
  "message": "✅ Payment ready. Please confirm.",
  "voice_response_url": "/audio/response_1712345678.mp3"
}
```

---

### 7. **Voice Payment - Step 2: Confirm**
**Endpoint:** `POST /voice/confirm`

**Summary:** Confirm pending voice payment

**Description:** User confirms payment. System asks for 4-digit PIN verification.

**Request:**
```json
{
  "sender": "amit.k@paytm",
  "transaction_id": 1042,
  "confirmation_text": "yes"
}
```

**Response:**
```json
{
  "status": "pin_required",
  "transaction_id": 1042,
  "sender_upi": "amit.k@paytm",
  "sender_name": "Amit Kumar",
  "receiver_name": "Rajesh Chai",
  "receiver_upi": "rajesh.chai@paytm",
  "amount": 250,
  "message": "✅ Payment ready: ₹250 Rajesh Chai ko",
  "response": "Aapna 4-digit PIN boldo",
  "next_step": "verify_pin",
  "voice_response_url": "/audio/response_1712345679.mp3"
}
```

---

### 8. **Voice Payment - Step 3: Verify PIN**
**Endpoint:** `POST /voice/verify-pin`

**Summary:** Verify PIN and execute payment

**Description:** User enters 4-digit PIN. If correct, payment is executed instantly.

**Request:**
```json
{
  "transaction_id": 1042,
  "pin": "1234"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "✅ ₹250 successfully भेज दिए गए rajesh.chai@paytm को!",
  "transaction_id": 1042,
  "transaction_status": "SUCCESS",
  "amount": 250,
  "sender_upi": "amit.k@paytm",
  "sender_name": "Amit Kumar",
  "receiver_upi": "rajesh.chai@paytm",
  "receiver_name": "Rajesh Chai",
  "response": "Success hain! 250 rupaye Rajesh ke paas chale gaye",
  "voice_response_url": "/audio/response_1712345680.mp3"
}
```

**Response (Wrong PIN):**
```json
{
  "status": "error",
  "message": "❌ PIN galat hai. 4-digit PIN dedo"
}
```

---

### 9. **URL Fraud Detection (ML)**
**Endpoint:** `POST /url/check`

**Summary:** Analyze a URL for phishing/fraud using ML

**Description:** Uses RandomForest ML model with 18 heuristic features (TLD, IP patterns, keywords, entropy, etc.) to detect fraudulent URLs.

**Request:**
```json
{
  "url": "https://www.bank-verify-aadhar.com/secure/login.php?id=567&redirect=paytm"
}
```

**Response (Fraudulent):**
```json
{
  "url": "https://www.bank-verify-aadhar.com/secure/login.php?id=567&redirect=paytm",
  "is_fraud": true,
  "confidence": 94,
  "risk_level": "High",
  "risk_factors": [
    "Suspicious TLD (.com domain with bank keywords)",
    "Phishing keywords detected: verify, aadhar, secure, login",
    "URL entropy abnormally high",
    "Redirect parameters detected",
    "Domain age suspicious (3 days old)"
  ],
  "analysis_mode": "ml",
  "warning_hindi": "🚨 PHISHING ALERT! Ye URL phishing jaisa lagta hai. Aadhar/bank details enter mat karna. Report karo cybercrime.gov.in par."
}
```

**Response (Legitimate):**
```json
{
  "url": "https://www.paytm.com/payment/checkout",
  "is_fraud": false,
  "confidence": 98,
  "risk_level": "Safe",
  "risk_factors": [],
  "analysis_mode": "ml",
  "warning_hindi": null
}
```

---

### 10. **Submit Feedback (Model Improvement)**
**Endpoint:** `POST /feedback`

**Summary:** Report if analysis was correct or incorrect

**Description:** Users provide feedback on scam/URL analysis to help improve ML model accuracy over time.

**Request:**
```json
{
  "item_type": "url",
  "item_data": "https://phishing-site.com/bank-login",
  "original_prediction": 1,
  "correct_label": 1,
  "user_note": "Yes, this was indeed a phishing site. Tried to steal my passwords."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback saved. Thank you for improving PaySafe!"
}
```

---

### 11. **Get Feedback Stats**
**Endpoint:** `GET /feedback/stats`

**Summary:** Get feedback collection stats

**Description:** Returns overall statistics on user feedback for model retraining.

**Request:** No request body

**Response:**
```json
{
  "total_feedback_collected": 245,
  "feedback_by_type": {
    "url": 156,
    "scam_message": 89
  },
  "accuracy_stats": {
    "correct_predictions": 238,
    "incorrect_predictions": 7,
    "model_accuracy": 97.1
  },
  "recent_corrections": 3,
  "data_quality": "excellent"
}
```

---

---

## 💼 MERCHANT TOOLS ROUTES

### 1. **Get Merchant Business Intelligence**
**Endpoint:** `GET /merchant/insights?merchant_id={id}&period={day|week|month}`

**Summary:** Get comprehensive business analytics for merchant

**Description:** Revenue trends, peak hours, customer analysis, weekly patterns, purchase heatmaps, and AI-powered business recommendations.

**Request:**
```
GET /merchant/insights?merchant_id=rajesh_chai@paytm&period=week
```

**Response:**
```json
{
  "merchant": {
    "name": "Rajesh Chai & Snacks",
    "category": "Food & Beverages",
    "upi_id": "rajesh_chai@paytm",
    "locality": "Lajpat Nagar, Delhi"
  },
  "revenue": {
    "today": 8420,
    "yesterday": 7650,
    "this_period": 218500,
    "previous_period": 195000,
    "change_pct": 10.1,
    "total_transactions": 63
  },
  "customers": {
    "total": 634,
    "new": 142,
    "repeat": 492,
    "repeat_pct": 77.6
  },
  "hourly_heatmap": [
    {"hour": "6 AM", "transactions": 3},
    {"hour": "8 AM", "transactions": 18},
    {"hour": "12 PM", "transactions": 22},
    {"hour": "6 PM", "transactions": 24},
    {"hour": "9 PM", "transactions": 8}
  ],
  "weekly_pattern": [
    {"day": "Mon", "revenue": 28500, "transactions": 54},
    {"day": "Tue", "revenue": 25600, "transactions": 48},
    {"day": "Wed", "revenue": 31200, "transactions": 58},
    {"day": "Thu", "revenue": 29800, "transactions": 56},
    {"day": "Fri", "revenue": 34900, "transactions": 65},
    {"day": "Sat", "revenue": 39500, "transactions": 74},
    {"day": "Sun", "revenue": 53000, "transactions": 88}
  ],
  "top_customers": [
    {"name": "Amit Kumar", "upi_id": "amit.k@paytm", "visits": 28, "total_spent": 3360},
    {"name": "Priya Sharma", "upi_id": "priya.s@okaxis", "visits": 22, "total_spent": 2640},
    {"name": "Rohit Singh", "upi_id": "rohit.singh@ybl", "visits": 19, "total_spent": 2280}
  ],
  "llm_insight": "Your Saturday evening peak (6–9 PM) drives 28% of weekly revenue. Consider extending hours by 30 mins.",
  "recommendations": [
    "Your Saturday evening peak (6–9 PM) drives 28% of weekly revenue. Consider extending hours by 30 mins.",
    "Tuesday revenue is 25% lower than rest of week. Introduce 'Tuesday Special' combo to boost sales.",
    "Repeat customer rate (77.6%) is excellent! Create a loyalty program to maintain engagement."
  ]
}
```

---

### 2. **Check Merchant Anomalies**
**Endpoint:** `GET /merchant/anomalies?merchant_id={id}`

**Summary:** Detect statistical anomalies in transaction patterns

**Description:** Identifies unusual transaction velocities, large amounts, fraud patterns, off-peak spikes, and suspicious behavior.

**Request:**
```
GET /merchant/anomalies?merchant_id=rajesh_chai@paytm
```

**Response:**
```json
{
  "merchant_id": "rajesh_chai@paytm",
  "merchant_name": "Rajesh Chai & Snacks",
  "has_anomalies": true,
  "anomalies": [
    {
      "type": "Unusual Transaction Amount",
      "description": "Transaction of ₹2,40,000 at 11:42 PM is 15x your average evening transaction (avg: ₹16,000).",
      "severity": "HIGH",
      "timestamp": "2026-04-05T23:42:00Z",
      "amount": 240000,
      "pattern": "amount_spike"
    },
    {
      "type": "Rapid Repeat UPI",
      "description": "7 transactions from arif.r@okhdfcbank within 45 mins (6-min intervals) — possible test fraud or account compromise.",
      "severity": "MEDIUM",
      "timestamp": "2026-04-05T09:15:00Z",
      "pattern": "rapid_repeat_upi"
    },
    {
      "type": "Off-Peak Activity Spike",
      "description": "Unusual 23 transactions between 2-4 AM (typically only 1-2 transactions in these hours).",
      "severity": "MEDIUM",
      "timestamp": "2026-04-04T03:30:00Z",
      "pattern": "unusual_time"
    }
  ]
}
```

---

### 3. **Voice Business Query**
**Endpoint:** `POST /merchant/voice-query`

**Summary:** Merchant asks voice questions about their business

**Description:** Merchant uploads Hindi audio question → transcription → AI analyzes with merchant data context → generates Hindi voice answer.

**Request:** Multipart form-data
```
POST /merchant/voice-query
Content-Type: multipart/form-data

merchant_id: rajesh_chai@paytm
audio_file: [Binary audio data]
```

**Example Audio Transcript:** "Aaj kitna kamaaya ho?"

**Response:**
```json
{
  "query_text": "Aaj kitna kamaaya ho?",
  "answer_text": "Aaj aapne ₹8,420 kamaaye hain. Business accha chal raha hai! Aapka repeat customer rate bhi bahut accha hai (77.6%).",
  "insights_summary": {
    "today_revenue": 8420,
    "transactions": 63,
    "peak_hours": ["8 AM", "12 PM", "6 PM"]
  },
  "voice_response_url": "/audio/response_1712345681.mp3"
}
```

---

### 4. **Send WhatsApp Daily Report**
**Endpoint:** `POST /merchant/send-report`

**Summary:** Send formatted WhatsApp report to merchant

**Description:** Generates daily/weekly insights and sends formatted WhatsApp message to merchant's registered phone.

**Request:**
```json
{
  "merchant_id": "rajesh_chai@paytm",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp report sent successfully!",
  "report_generated": {
    "revenue": {
      "today": 8420,
      "week": 218500,
      "growth": "+10.1%"
    },
    "metrics": {
      "customers": 634,
      "transactions": 63,
      "repeat_rate": "77.6%"
    }
  },
  "whatsapp_status": "sent",
  "phone": "+919876543210"
}
```

---

### 5. **List All Merchants**
**Endpoint:** `GET /merchant/list`

**Summary:** List all registered merchants

**Description:** Returns all merchants with basic info: name, category, UPI ID, complaints.

**Request:**
```
GET /merchant/list
```

**Response:**
```json
{
  "count": 80,
  "merchants": [
    {
      "upi_id": "rajesh_chai@paytm",
      "name": "Rajesh Chai & Snacks",
      "category": "Food & Beverages",
      "complaint_count": 0
    },
    {
      "upi_id": "sharma_electronics@okhdfcbank",
      "name": "Sharma Electronics",
      "category": "Electronics",
      "complaint_count": 2
    },
    {
      "upi_id": "beauty_salon_delhi@axis",
      "name": "Beauty Salon Delhi",
      "category": "Beauty",
      "complaint_count": 0
    }
  ]
}
```

---

### 6. **Sector Benchmarking & Competitive Analysis** ⭐
**Endpoint:** `GET /merchant/benchmarking/{merchant_upi_id}`

**Summary:** Compare against peers in same locality/sector

**Description:** Comprehensive competitive analysis comparing merchant's performance against similar businesses in the same area. Provides rankings, gaps, and actionable recommendations.

**Request:**
```
GET /merchant/benchmarking/rajesh_chai@paytm
```

**Response:**
```json
{
  "merchant_name": "Rajesh Chai & Snacks",
  "category": "Food & Beverages",
  "locality": "Lajpat Nagar, Delhi",
  "your_performance": {
    "daily_revenue": 8420,
    "transaction_count": 63,
    "avg_transaction_value": 133.65,
    "repeat_customer_rate": "77.6%",
    "customer_complaints": 0,
    "peak_hours": ["8 AM", "12 PM", "6 PM"]
  },
  "sector_position": {
    "overall_score": "78.5/100",
    "position": "Rank 3 out of 5 merchants",
    "peer_count": 5,
    "detailed_rankings": [
      {
        "rank": 1,
        "merchant_name": "Sharma Ji Ka Dhaba",
        "daily_revenue": 11400,
        "gap_revenue": "+₹2,980"
      },
      {
        "rank": 2,
        "merchant_name": "Cafe Monsoon",
        "daily_revenue": 9600,
        "gap_revenue": "+₹1,180"
      },
      {
        "rank": 3,
        "merchant_name": "Rajesh Chai & Snacks",
        "daily_revenue": 8420,
        "gap_revenue": "Your position"
      }
    ]
  },
  "top_performing_peers": [
    {
      "name": "Sharma Ji Ka Dhaba",
      "daily_revenue": 11400,
      "repeat_customer_rate": "82.3%",
      "transactions": 85
    },
    {
      "name": "Cafe Monsoon",
      "daily_revenue": 9600,
      "repeat_customer_rate": "79.1%",
      "transactions": 72
    }
  ],
  "ai_recommendations": [
    {
      "area": "Digital Presence",
      "gap_revenue": "₹38,500/month",
      "description": "Top merchants earn 17% of revenue from food apps. You earn only 8%.",
      "action": "Register on Swiggy & Zomato to capture delivery orders. Expected gain: ₹38,500/month"
    },
    {
      "area": "Weekend Hours",
      "gap_revenue": "₹12,000/month",
      "description": "You close at 10 PM. Top merchants stay open till 11:30 PM on weekends.",
      "action": "Extend Friday–Sunday by 90 mins to capture late evening crowd. Expected gain: ₹12,000/month"
    },
    {
      "area": "Loyalty Program",
      "gap_revenue": "₹8,750/month",
      "description": "Your repeat rate (77.6%) is strong. Top merchants use loyalty programs to reach 85%+.",
      "action": "Launch 'Buy 5, Get 1 Free' chai combo. Expected gain: ₹8,750/month"
    }
  ],
  "potential_monthly_gain": 59250,
  "report_generated": "2026-04-05T18:35:00Z"
}
```

---

---

## 🌐 SYSTEM ENDPOINTS

### Root Endpoint
**Endpoint:** `GET /`

**Response:**
```json
{
  "service": "PaySafe AI",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs",
  "endpoints": {
    "user": [
      "/scam/check",
      "/scam/patterns",
      "/trust/{upi_id}",
      "/qr/scan",
      "/qr/scan-image",
      "/url/check",
      "/voice/pay",
      "/voice/confirm",
      "/voice/verify-pin",
      "/feedback",
      "/feedback/stats"
    ],
    "merchant": [
      "/merchant/insights",
      "/merchant/anomalies",
      "/merchant/voice-query",
      "/merchant/send-report",
      "/merchant/list",
      "/merchant/benchmarking/{merchant_upi_id}"
    ]
  }
}
```

### Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "users": 200
}
```

---

## 📋 Summary

| Route | Method | Purpose | Auth | Response Time |
|-------|--------|---------|------|----------------|
| `/scam/check` | POST | Analyze message for scams | None | 2-3s (AI) |
| `/scam/patterns` | GET | List all scam patterns | None | <100ms |
| `/trust/{upi_id}` | GET | Get trust score | None | <200ms |
| `/qr/scan` | POST | Analyze QR code | None | <300ms |
| `/qr/scan-image` | POST | Upload & decode QR image | None | 1-2s |
| `/url/check` | POST | ML fraud detection | None | <500ms |
| `/voice/pay` | POST | Initiate voice payment | None | 3-5s |
| `/voice/confirm` | POST | Confirm payment | None | <200ms |
| `/voice/verify-pin` | POST | Execute payment | None | <200ms |
| `/feedback` | POST | Report analysis feedback | None | <100ms |
| `/feedback/stats` | GET | Get feedback stats | None | <100ms |
| `/merchant/insights` | GET | Business intelligence | None | 1-2s |
| `/merchant/anomalies` | GET | Anomaly detection | None | 1-2s |
| `/merchant/voice-query` | POST | Voice business Q&A | None | 3-5s |
| `/merchant/send-report` | POST | Send WhatsApp report | None | 2-3s |
| `/merchant/list` | GET | List merchants | None | <100ms |
| `/merchant/benchmarking` | GET | Competitive analysis | None | 2-3s |

---

## 🎯 Common Use Cases

### For Users (Regular Customers)
1. **Check suspicious SMS** → `/scam/check`
2. **Verify before paying** → `/trust/{upi_id}` or `/qr/scan`
3. **Make voice payment** → `/voice/pay` → `/voice/confirm` → `/voice/verify-pin`
4. **Check malicious link** → `/url/check`
5. **Report issue** → `/feedback`

### For Merchants
1. **Check daily revenue** → `/merchant/insights`
2. **Detect fraud** → `/merchant/anomalies`
3. **Get business insights** → `/merchant/voice-query`
4. **See competitor performance** → `/merchant/benchmarking`
5. **Send daily report** → `/merchant/send-report`

