# 🛡️ PaySafe AI — India's Intelligent Payment Guardian

> *"Ek AI jo aapke saath hota hai — har transaction mein, har fraud se pehle, har merchant ke growth mein."*

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Reference](#-api-reference)
- [Demo Scenarios](#-demo-scenarios)
- [Deployment](#-deployment)

---

## 🎯 Problem Statement

India processes **10+ billion UPI transactions monthly**, yet:

- **₹2,000+ crore** lost to UPI fraud in 2023-24
- **80%+ of fraud** happens via social engineering — users are *manipulated* into paying
- **Kirana merchants** have zero analytics tools — running blind on pen & paper
- **Semi-literate Bharat users** can't navigate complex dashboards or English interfaces

**Existing systems detect fraud AFTER money moves. We stop it BEFORE.**

---

## 💡 Our Solution

**PaySafe AI** is a multi-agent AI middleware layer for Paytm that:

1. Catches scams **before** the user hits "Pay"
2. Gives every receiver a **human-readable trust badge**
3. Enables **voice payments in Hindi** with built-in safety
4. Delivers **WhatsApp business insights** to merchants daily
5. Protects merchants from **payment fraud** too

---

## 🧩 Features

### � Feature Overview

**👤 User Side (Consumer Protection):**
1. [🔴 Feature 1: Scam Shield (Pre-Payment AI)](#-feature-1-scam-shield-pre-payment-ai)
2. [🟡 Feature 2: QR DNA Scanner](#-feature-2-qr-dna-scanner)
3. [🔵 Feature 3: Live Trust Badge System](#-feature-3-live-trust-badge-system)
4. [🎙️ Feature 4: Voice Payment with Safety Net](#️-feature-4-voice-payment-with-safety-net-bharat-feature)

**🏪 Merchant Side (Business Growth):**

5. [📊 Feature 5: WhatsApp Business Intelligence](#-feature-5-whatsapp-business-intelligence)
6. [🎙️ Feature 6: Voice Business Assistant](#️-feature-6-voice-business-assistant)
7. [🚨 Feature 7: Merchant Anomaly Alerts](#-feature-7-merchant-anomaly-alerts)
8. [🏆 Feature 8: Sector Benchmarking & Competitive Analysis](#-feature-8-sector-benchmarking--competitive-analysis)

---

### �👤 USER SIDE — Guardian Angel for Every Payment

---

#### 🔴 Feature 1: Scam Shield (Pre-Payment AI)

**The Problem:** Scammers call/text users with urgency ("bijli katne wali hai!") and manipulate them into paying. No existing system stops this.

**What it does:** Before payment, user can paste a suspicious message/call context. AI analyzes it against known Indian scam patterns and warns in Hindi.

**Scam Patterns Detected:**
| Pattern | Example |
|---|---|
| Electricity Scam | "Bijli katne wali hai, abhi 1 rupee bhejo" |
| KYC Scam | "Account band ho jaega, KYC update karo" |
| Lottery Scam | "Aapne ₹10 lakh jeete, processing fee bhejo" |
| Emergency Scam | "Beta hospital mein hai, paisa bhejo" |
| Refund Scam | "Extra amount aa gaya, wapas karo" |
| Fake Delivery | "COD payment QR scan karo" |

**Output:**
```
⚠️ SCAM ALERT — 94% probability
Yeh message electricity scam jaisa lagta hai.
Paytm kabhi bhi is tarah payment nahi maangta.
Kya aap sure hain aage badhna chahte hain?
```

---

#### 🟡 Feature 2: QR DNA Scanner

**What it does:** When user scans any QR code, AI instantly fingerprints it before payment executes.

**Checks performed:**
- UPI ID age (new account = suspicious)
- Merchant name vs registered name mismatch
- QR generation timestamp (< 7 days = flag)
- User complaint history on this QR
- GPS location vs merchant registered city

**Output badges:**
```
🟢 Safe to Pay     — All checks passed
🟡 Proceed Carefully — New account detected  
🔴 DO NOT PAY      — Reported by other users
```

---

#### 🔵 Feature 3: Live Trust Badge System

**What it does:** Every receiver gets a dynamic, human-readable trust badge — not a confusing 0-100 number.

**Scoring Model:**
| Factor | Weight | Logic |
|---|---|---|
| Account Age | 20 | < 30 days = -30 points |
| Transaction Consistency | 15 | Irregular spikes = -15 |
| Dispute Rate | 20 | > 10% disputes = -25 |
| Payment Spike | 15 | 10x normal volume = -20 |
| Name Match | 10 | Mismatch = -10 |
| User Reports | 20 | Each report = -10 |

**Badges:**
```
🟢 Trusted Merchant   — Score 80–100, 2+ years, clean history
🟡 New Account        — Score 60–79, less than 3 months old
⚠️ Proceed Carefully  — Score 40–59, some red flags
🔴 High Risk          — Score < 40, multiple complaints
```

---

#### 🎙️ Feature 4: Voice Payment with Safety Net (Bharat Feature)

**The Problem:** Semi-literate users in rural India can't type. Voice is their natural interface.

**Flow:**
```
User speaks → Whisper transcribes → LLM parses intent 
→ Trust check runs → AI responds in voice → User confirms → Payment
```

**Example:**
```
User says:    "Ramesh ko 500 bhejo vegetables ke liye"
AI checks:    Ramesh's trust badge = 🟡 New Account (18 days old)
AI responds:  "Ramesh ka account sirf 18 din purana hai. 
               Kya aap sure hain 500 rupye bhejna chahte hain?"
User says:    "Haan bhejo"
AI:           "Payment complete. Ramesh ko ₹500 bheje gaye."
```

**Stack:** OpenAI Whisper (STT) → Gemini LLM intent parsing → gTTS / ElevenLabs (TTS)

---

### 🏪 MERCHANT SIDE — Free CA + Business Coach in Your Pocket

---

#### 📊 Feature 5: WhatsApp Business Intelligence

**The Problem:** 90% of small merchants have no accounting software. They run on memory and paper.

**What it does:** Every morning at 9 AM, merchant receives a WhatsApp message with full business summary — no app, no login, no English required.

**Sample Message:**
```
📊 Ramesh Medical Store — Daily Report

💰 Kal ka revenue: ₹14,200 (+12% vs last week)
📦 Total transactions: 47
👥 Repeat customers: 31 (66%)
⏰ Peak time: 7–9 PM

💡 Insight: Tuesday revenue usually drops 20%.
   Kal discount offer karne se traffic badh sakta hai.

⚠️ Alert: Aaj 3 unusually large transactions detected.
   Apna account check karein.
```

**Implementation:** Twilio WhatsApp API + cron scheduler + LLM summary generation

---

#### 🎙️ Feature 6: Voice Business Assistant

**What it does:** Merchant asks questions in Hindi by voice. AI fetches from DB and responds in voice + sends WhatsApp summary.

**Example queries:**
```
"Is hafte kitna kamaaya?"        → Weekly revenue summary
"Mere regular customers kaun hain?" → Top repeat customers
"Peak time kab hai?"             → Hourly transaction heatmap
"Pichle mahine se compare karo"  → Month-over-month analysis
"Aaj kitne naye customer aaye?"  → New vs repeat breakdown
```

---

#### 🚨 Feature 7: Merchant Anomaly Alerts

**The Problem:** Merchants are also victims of fraud — fake screenshots, overpayment scams, forced refund scams.

**Detects:**
- Fake payment screenshot uploads (AI vision check)
- Overpayment scam pattern ("maine galti se jyada bheja, wapas karo")
- Unusual refund request spikes
- Account takeover attempts
- Transaction velocity anomalies

**Alert sent to merchant:**
```
🚨 ALERT: Suspicious refund request detected
Someone claimed to overpay ₹5,000 and is 
asking for refund. This matches a known scam 
pattern. Do NOT refund without verifying in 
Paytm dashboard.
```

---

#### 🏆 Feature 8: Sector Benchmarking & Competitive Analysis

**The Problem:** Merchants have no idea how well they're doing compared to competitors in their locality. They can't benchmark or improve strategically.

**What it does:** Compare your business against peers in your sector + locality. Get detailed competitive analysis and AI-powered improvement recommendations.

**How it works:**
```
1. System finds all merchants in your category (e.g. "grocery")
   + same locality (e.g. "Delhi")

2. Analyzes each peer's metrics:
   - Daily revenue & transaction volume
   - Average transaction value
   - Customer retention (repeat rate)
   - Peak hours & traffic patterns
   - Complaint/trust rating

3. Compares YOUR metrics vs peer averages:
   - Shows percentile ranking (Are you top 20%? Bottom 40%?)
   - Identifies performance gaps with specific numbers
   - Highlights what successful peers are doing

4. Gemini LLM generates personalized recommendations:
   - "Your repeat customer rate is 30% vs peer avg 55%"
   - → "Recommendation: Offer loyalty rewards on Saturdays 
        when your traffic is 40% lower than peers"
   - With estimated revenue impact
```

**Example Report:**
```json
{
  "merchant_name": "Rahul Kirana Store",
  "category": "grocery",
  "locality": "Delhi",
  
  "your_performance": {
    "daily_revenue": "₹12,400",
    "transaction_count": 187,
    "repeat_customer_rate": "32%",
    "peak_hours": "8-10 AM, 6-8 PM"
  },
  
  "sector_position": {
    "overall_score": "42/100",
    "position": "📈 Emerging - significant growth opportunity",
    "peer_count": 8,
    
    "rankings": {
      "daily_revenue": {
        "your_value": 12400,
        "peer_average": 18500,
        "gap": -₹6,100 (-33%),
        "percentile": 25.0,
        "status": "📈 Room to grow"
      },
      "repeat_customer_rate": {
        "your_value": "32%",
        "peer_average": "58%",
        "gap": "-26%",
        "percentile": 12.5,
        "status": "📈 Room to grow"
      }
    }
  },
  
  "ai_recommendations": {
    "title": "Improvement Strategy for Rahul Kirana Store",
    "summary": "You're in bottom 25% for revenue - big opportunity!",
    "recommendations": [
      {
        "title": "Weekend loyalty rewards (Hinglish: Hafte ke aakhri dinon mein discount!)",
        "description": "Your Saturday transactions are 40% lower than peers. 
                       Offer 5-10% discount or cashback on Saturdays to drive traffic.",
        "expected_impact": "Saturdays revenue 15-20% increase = ₹2,500/week more",
        "difficulty": "Easy",
        "time_to_implement": "Immediate"
      },
      {
        "title": "Build repeat customers (Regular customer loyalty program)",
        "description": "Top peers have 58% repeat rate vs your 32%. 
                       Track regular customers, remember their preferences.",
        "expected_impact": "+₹4,000-6,000/month from better retention",
        "difficulty": "Medium",
        "time_to_implement": "This week"
      }
    ],
    "priority_focus": "Fix Saturday traffic gap first - quickest revenue win",
    "estimated_revenue_impact": "+₹15-20K/month if all implemented"
  }
}
```

**Tech Stack:**
- Learns from actual transaction data (no guessing)
- Compares 5-10 peer merchants automatically
- Gemini LLM generates context-aware recommendations
- Works for any merchant category + locality
- Updates recommendations as business data changes

**Why this is a game-changer:**
- First-ever competitive intelligence for small merchants in India
- Not just data, but **actionable recommendations** with revenue impact estimates
- Merchants finally see: "I can earn ₹20K more if I do these 3 things"
- Bridges knowledge gap between informal merchants and MBAs

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER / MERCHANT INPUT                 │
│         (App UI / Voice / WhatsApp / QR Scan)           │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   PAYSAFE AI LAYER                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Scam Shield │  │  QR Scanner  │  │ Voice Engine  │  │
  │  │  (LLM NLP)  │  │  (Rule Engine) │  │(Whisper+gTTS) │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
│         └────────────────┼─────────────────┘            │
│                          │                               │
│              ┌───────────▼──────────┐                   │
│              │    TRUST ENGINE      │                   │
│              │  (Scoring + Badges)  │                   │
│              └───────────┬──────────┘                   │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    DECISION LAYER                        │
│              Allow / Warn / Block Payment                │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼───────┐ ┌───────▼───────┐ ┌──────▼──────────┐
│  PAYMENT GOES  │ │   MERCHANT    │ │    WHATSAPP     │
│    THROUGH     │ │   INSIGHTS    │ │     ALERTS      │
│  (or blocked)  │ │  (SQL + LLM)  │ │   (Twilio)      │
└────────────────┘ └───────────────┘ └─────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology | Why |
|---|---|---|
| API Framework | FastAPI (Python) | Fastest to build, async support |
| Database | SQLite (dev) / PostgreSQL (prod) | Zero setup for hackathon |

### AI / ML
| Component | Technology | Why |
|---|---|---|
| LLM (Scam Shield, Insights) | Google Gemini | Fast reasoning in Hindi |
| Speech-to-Text | OpenAI Whisper | Free, local, Hindi support |
| Text-to-Speech | gTTS / ElevenLabs | Free tier sufficient |
| Agent Orchestration | LangGraph | Multi-agent coordination |

### Integrations
| Service | Technology | Purpose |
|---|---|---|
| WhatsApp | Twilio Sandbox (free) | Merchant reports + alerts |
| Voice | FastAPI endpoint | Voice payment flow |
| Payment Mock | Internal mock | Simulated UPI (hackathon scope) |

### Frontend
| Layer | Technology |
|---|---|
| Demo UI | React.js (Vite) |
| Styling | Tailwind CSS |
| API calls | Axios |

---

## 📁 Project Structure

```
paysafe-ai/
│
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── database.py                # DB setup + models
│   ├── synthetic_data.py          # Generate fake transaction data
│   ├── config.py                  # API keys, env variables
│   │
│   ├── services/
│   │   ├── scam_shield.py         # LLM-based scam detection
│   │   ├── trust_score.py         # Rule-based trust scoring
│   │   ├── qr_scanner.py          # QR code analysis
│   │   ├── voice.py               # Whisper STT + gTTS TTS
│   │   ├── merchant_insights.py   # SQL analytics + LLM summary
│   │   ├── whatsapp.py            # Twilio WhatsApp integration
│   │   └── anomaly_detector.py    # Merchant fraud protection
│   │
│   ├── routes/
│   │   ├── user_routes.py         # /scam, /trust, /voice, /qr
│   │   └── merchant_routes.py     # /insights, /alerts, /voice-query
│   │
│   └── data/
│       ├── scam_patterns.json     # Known Indian scam scripts
│       └── sample_transactions.json # Pre-generated demo data
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ScamShield.jsx     # Paste message → get warning
│   │   │   ├── TrustBadge.jsx     # Enter UPI ID → see badge
│   │   │   ├── VoicePayment.jsx   # Voice recording + response
│   │   │   └── MerchantDashboard.jsx
│   │   └── api/
│   │       └── client.js
│   └── package.json
│
├── demo/
│   ├── scenarios.md               # Step-by-step demo scripts
│   ├── sample_scam_messages.txt   # Pre-loaded scam examples
│   └── postman_collection.json    # API demo without frontend
│
├── .env.example                   # Environment variables template
├── requirements.txt               # Python dependencies
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- API Keys: Google Gemini, Twilio

### Step 1: Clone & Configure
```bash
git clone https://github.com/your-team/paysafe-ai
cd paysafe-ai

# Copy env template
cp .env.example .env

# Fill in your API keys in .env
GEMINI_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data
python synthetic_data.py

# Start the server
uvicorn main:app --reload --port 8000
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Step 4: Verify Everything Works
```bash
# Test Scam Shield
curl -X POST http://localhost:8000/scam/check \
  -H "Content-Type: application/json" \
  -d '{"message": "bijli katne wali hai abhi 1 rupee bhejo"}'

# Test Trust Badge
curl http://localhost:8000/trust/rahul@paytm

# Trigger WhatsApp Report (test merchant)
curl -X POST http://localhost:8000/merchant/send-report \
  -d '{"merchant_id": "demo_merchant_001"}'
```

---

## 📡 API Reference

### 🔐 User APIs

#### Check Scam Shield
```
POST /scam/check
Content-Type: application/json

{
  "message": "suspicious message text here",
  "payment_context": {
    "amount": 1,
    "receiver_upi": "xyz@paytm"
  }
}

Response:
{
  "is_scam": true,
  "confidence": 94,
  "scam_type": "electricity_scam",
  "warning_hindi": "Yeh electricity scam jaisa lagta hai...",
  "recommendation": "DO_NOT_PAY"
}
```

#### Get Trust Badge
```
GET /trust/{upi_id}

Response:
{
  "upi_id": "rahul@paytm",
  "trust_score": 72,
  "badge": "🟡 New Account",
  "badge_color": "yellow",
  "account_age_days": 18,
  "flags": ["new_account", "no_dispute_history"],
  "explanation": "Yeh account sirf 18 din purana hai"
}
```

#### Scan QR Code
```
POST /qr/scan
Content-Type: application/json

{
  "qr_data": "upi://pay?pa=shop@paytm&pn=ShopName&am=500",
  "user_location": {"lat": 28.6139, "lng": 77.2090}
}

Response:
{
  "is_safe": false,
  "risk_level": "HIGH",
  "badge": "🔴 DO NOT PAY",
  "reasons": ["QR generated 2 days ago", "Name mismatch detected"],
  "explanation_hindi": "Is QR mein kuch gadbad hai..."
}
```

#### Voice Payment
```
POST /voice/pay
Content-Type: multipart/form-data

audio_file: [WAV/MP3 file]

Response:
{
  "transcribed": "Rahul ko 500 bhejo",
  "parsed_intent": {
    "receiver": "Rahul",
    "amount": 500,
    "purpose": null
  },
  "trust_check": {
    "badge": "🟡 New Account",
    "warning": true
  },
  "voice_response_url": "/audio/response_123.mp3",
  "requires_confirmation": true
}
```

---

### 🏪 Merchant APIs

#### Get Merchant Insights
```
GET /merchant/insights?merchant_id=demo_001&period=week

Response:
{
  "revenue": {
    "today": 14200,
    "yesterday": 12680,
    "this_week": 89400,
    "change_pct": 12.0
  },
  "peak_hours": ["19:00-21:00"],
  "top_customers": [...],
  "llm_insight": "Aapki sales 12% badhi hai is hafte...",
  "recommendations": ["Tuesday discount offer karo"]
}
```

#### Voice Business Query
```
POST /merchant/voice-query
Content-Type: multipart/form-data

merchant_id: demo_001
audio_file: [WAV file]

Response:
{
  "query_text": "Aaj kitna kamaaya?",
  "answer_text": "Aaj aapne 14,200 rupye kamaaye",
  "voice_response_url": "/audio/merchant_response.mp3"
}
```

#### Send WhatsApp Report
```
POST /merchant/send-report
{
  "merchant_id": "demo_001",
  "phone": "+919876543210"
}

Response:
{
  "status": "sent",
  "whatsapp_message_id": "SM...",
  "report_summary": "Daily report sent to +91987..."
}
```

#### 🏆 Sector Benchmarking & Competitive Analysis
```
GET /merchant/benchmarking/{merchant_upi_id}

Example:
GET /merchant/benchmarking/rahul_kirana_store@paytm

Response:
{
  "merchant_name": "Rahul Kirana Store",
  "category": "grocery",
  "locality": "Delhi",
  
  "your_performance": {
    "daily_revenue": 12400,
    "transaction_count": 187,
    "avg_transaction_value": 66.31,
    "repeat_customer_rate": "32%",
    "customer_complaints": 2,
    "peak_hours": [
      {"hour": 8, "transactions": 45},
      {"hour": 7, "transactions": 42},
      {"hour": 18, "transactions": 38}
    ]
  },
  
  "sector_position": {
    "overall_score": "42.0/100",
    "position": "📈 Emerging - significant growth opportunity",
    "peer_count": 8,
    "detailed_rankings": {
      "daily_average_revenue": {
        "name": "Daily Revenue",
        "your_value": 12400,
        "peer_average": 18500,
        "gap": -6100,
        "gap_percentage": -32.97,
        "percentile": 25.0,
        "status": "📈 Room to grow"
      },
      "repeat_customer_rate": {
        "name": "Customer Retention %",
        "your_value": 32,
        "peer_average": 58,
        "gap": -26,
        "gap_percentage": -44.83,
        "percentile": 12.5,
        "status": "📈 Room to grow"
      }
    }
  },
  
  "top_performing_peers": [
    {
      "name": "Vikram Grocery",
      "daily_revenue": 28500,
      "repeat_customer_rate": "68%",
      "transactions": 387
    },
    {
      "name": "Priya's Kirana",
      "daily_revenue": 21200,
      "repeat_customer_rate": "62%",
      "transactions": 298
    }
  ],
  
  "ai_recommendations": {
    "title": "Improvement Strategy for Rahul Kirana Store",
    "summary": "You're in bottom 25% for revenue - big opportunity!",
    "recommendations": [
      {
        "title": "Weekend loyalty rewards",
        "description": "Your Saturday transactions are 40% lower than peers. 
                       Offer 5-10% discount on Saturdays to drive traffic.",
        "expected_impact": "Saturdays revenue +15-20% = ₹2,500/week more",
        "difficulty": "Easy",
        "time_to_implement": "Immediate"
      },
      {
        "title": "Build repeat customers",
        "description": "Top peers have 58% repeat rate vs your 32%. 
                       Track regular customers, remember preferences.",
        "expected_impact": "+₹4,000-6,000/month from retention",
        "difficulty": "Medium",
        "time_to_implement": "This week"
      }
    ],
    "priority_focus": "Fix Saturday traffic gap first - quickest revenue win",
    "estimated_revenue_impact": "+₹15-20K/month if all implemented"
  },
  
  "report_generated": "2026-04-03T14:32:00Z"
}
```

**Key Features:**
- Automatically finds 5-10 peer merchants (same category + locality)
- Calculates performance metrics: revenue, transactions, customer retention, peak hours
- Shows percentile rankings (top 20%? bottom 40%?)
- Compares against peer averages with gap analysis
- Gemini LLM generates personalized, actionable recommendations
- Each recommendation includes expected revenue impact and difficulty level
- Works for any merchant category and locality as data grows

---

## 🎬 Demo Scenarios

### Scenario 1: Sunita gets scammed (User Protection)
```
1. Open app → "Check a suspicious message"
2. Paste: "Bijli department se baat kar raha hoon.
          Aapka connection aaj raat band hoga.
          Abhi 1 rupee bhejo verify karne ke liye."
3. DEMO MOMENT: AI shows ⚠️ 94% SCAM ALERT in Hindi
4. User clicks "I'm safe, thanks"
```

### Scenario 2: Voice payment with trust check
```
1. Click microphone button
2. Say: "Ek naye dukan wale ko 2000 bhejo"
3. DEMO MOMENT: AI says in voice — "Yeh account 3 din 
   purana hai. Kya aap sure hain?"
4. Say "Haan" → payment confirmed
```

### Scenario 3: Merchant Ramesh's morning report
```
1. Open WhatsApp on demo phone
2. Click "Send Report" button in dashboard
3. DEMO MOMENT: WhatsApp message arrives LIVE on stage
   with full Hindi business summary
```

### Scenario 4: Merchant voice query
```
1. Click merchant mic button
2. Say: "Is hafte kitna kamaaya?"
3. DEMO MOMENT: AI responds in Hindi voice with 
   weekly revenue and comparison
```

### Scenario 5: Merchant Sector Benchmarking
```
1. Merchant navigates to "Analyze Competition" section
2. System automatically finds 8 peer grocery stores in Delhi
3. DEMO MOMENT: Shows comparison dashboard:
   
   YOUR STORE (Rahul's Kirana):
   - Daily revenue: ₹12,400 (📈 25th percentile)
   - Repeat customers: 32% (📈 12th percentile)
   - Peak hours: 8-10 AM
   
   BEST PERFORMER (Vikram's Grocery):
   - Daily revenue: ₹28,500 (+₹16,100 vs you!)
   - Repeat customers: 68% (+36% vs you!)
   - Peak: 7-9 AM + 6-9 PM
   
4. AI RECOMMENDATIONS:
   ✅ "Your Saturday sales 40% lower than peers"
      → "Offer Saturday special discounts, expect +₹2,500/week"
   ✅ "Repeat customers 36% below average"
      → "Build loyalty program, expected +₹6K/month"
   ✅ "Peak time 8 AM but Vikram peaks at 7-8 AM"
      → "Open 30 min earlier to catch morning rush"
   
5. Merchant gets: "Do these 3 things → earn ₹20K more/month"
   (specific, achievable, measurable impact)
```

---

## 🚀 Deployment

### Backend (Railway.app — Free)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
# Add: GEMINI_API_KEY, TWILIO_ACCOUNT_SID, etc.
```

### Frontend (Vercel — Free)
```bash
cd frontend
npx vercel

# Set VITE_API_URL to your Railway backend URL
```

### Database (Supabase — Free Tier)
```bash
# Replace SQLite with Supabase PostgreSQL for production
# Connection string goes in .env as DATABASE_URL
```

---

## 🔮 Future Scope (Post-Hackathon)

- Graph Neural Networks for fraud detection across UPI network
- Cross-platform trust scoring (works across all payment apps)
- Personalized merchant offers engine
- Regional language support (Tamil, Telugu, Bengali, Marathi)
- Real-time transaction stream processing (Kafka)
- Federated learning for privacy-preserving fraud models

---

