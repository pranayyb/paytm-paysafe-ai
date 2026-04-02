# 🛡️ Paytm AI VoiceGuard

### Secure, AI-Powered Voice Biometric UPI Payments

Paytm Project AI – Build for India 2026

---

## 🚀 What is VoiceGuard?

**Paytm AI VoiceGuard** is an AI-first, voice-biometric payment system deeply integrated into a Paytm-style mobile app. It enables **secure UPI transactions verified by your unique voiceprint** — replacing traditional PINs with AI-powered speaker recognition and liveness detection.

> 💡 Built to address the needs of 300M+ low-literacy, rural, disabled, and on-the-go users in India

---

## 🔒 Dual-Layer Voice Verification (Implemented)

| Layer | Technology | Purpose |
|---|---|---|
| 🎙️ **Speaker Recognition** | Resemblyzer (voice embeddings + cosine similarity) | Matches live voice against enrolled voiceprint |
| 🧠 **Challenge Phrase Liveness** | faster-whisper (STT) + exact phrase matching | Blocks replay attacks — user must speak a random phrase |

### How It Works
1. User enters recipient UPI ID and amount
2. Backend generates a **random challenge phrase** (e.g., "blue elephant twenty seven")
3. User speaks the phrase into the microphone
4. **Dual verification runs simultaneously:**
   - Voice embedding is compared against enrolled voiceprint (cosine similarity ≥ 0.88)
   - Speech is transcribed and matched against the expected challenge phrase
5. **Both must pass** for the payment to be authorized

### Transaction Security
- **Voice-verified payments** → Speaker identity + challenge phrase must both pass
- **Standard UPI payments** → Password-verified fallback available
- **Anti-replay** → Challenge phrases are single-use and time-bound

---

## ✅ Features Implemented

### 📱 Mobile App (Expo/React Native)
- **Authentication** — Email OTP-based signup/login with JWT session management
- **Home Dashboard** — Paytm-style UI with UPI transfer, recharge, and bill payment sections
- **Voice Enrollment** — 3-sample voiceprint registration with real-time progress tracking
- **Voice Pay Modal** — Full end-to-end voice-verified payment flow with recording, verification, and animated success screen
- **QR Code** — Auto-generated UPI QR codes for each user; QR scanner for peer payments
- **UPI Transfers** — Password-verified UPI payments between registered users
- **Mobile Recharge** — Functional recharge flow (Jio operator)
- **Transaction History** — Real-time transaction log with categories, timestamps, and verification badges
- **Notifications** — System and payment notifications with real-time updates
- **Profile & Settings** — User profile with dark mode toggle, voice enrollment status
- **Payment Success Screen** — Full-screen Paytm-style success UI with share/screenshot capability
- **Dark Mode** — Complete dark theme support across all screens

### 🧠 Backend AI Pipeline (FastAPI + Python)
- **Voice Enrollment API** — Multi-sample enrollment (3 samples), embedding extraction via Resemblyzer, averaged voiceprint storage in MongoDB
- **Voice Verification API** — Real-time speaker identity matching using cosine similarity with configurable threshold
- **Challenge Phrase System** — 10 unique challenge phrases with variant matching (words + digits)
- **Speech-to-Text** — faster-whisper (base model, CPU, int8) for transcribing spoken challenge phrases
- **Audio Conversion** — ffmpeg-based m4a → 16kHz mono WAV conversion pipeline
- **Email OTP Service** — Styled HTML email OTP delivery via Gmail SMTP (with terminal fallback)
- **Risk Scoring** — Rule-based fraud detection (amount, time-of-day, recipient analysis)
- **NLP Entity Extraction** — spaCy + regex-based extraction of payment intent (recipient, amount, memo)

### 💾 Database (MongoDB)
- **8 Collections** — users, transactions, notifications, offers, voice_enrollments, merchants, soundbox_events, otps
- **Indexed** — Unique indexes on user_id, email, upi_id; compound index on transactions
- **Auto-seeded** — Default merchant, promotional offers, and system notifications on first run
- **Atomic Operations** — `$inc`-based balance updates for safe concurrent transactions

### 🏪 Merchant Dashboard API
- **Dashboard endpoint** — Revenue analytics, transaction counts, recent soundbox events
- **Soundbox event logging** — Payment events stored with verification metadata
- **AI Insights** — Average transaction value, peak hours, voice pay adoption stats
- **Fraud flagging** — Auto-flags transactions over ₹50,000

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  FastAPI Backend  │────▶│    MongoDB      │
│   (Expo/RN)     │     │  (AI Pipeline)   │     │  (8 Collections)│
│                 │     │                  │     │                 │
│ • Paytm UI      │     │ • Resemblyzer    │     │ • users         │
│ • Voice Capture  │     │ • faster-whisper │     │ • transactions  │
│ • Voice Enroll   │     │ • spaCy NLP      │     │ • notifications │
│ • QR Scanner     │     │ • Fraud Engine   │     │ • offers        │
│ • Dark Mode      │     │ • Email OTP      │     │ • merchants     │
└─────────────────┘     └──────────────────┘     │ • voice_enroll  │
                                                  │ • soundbox_evts │
                                                  │ • otps          │
                                                  └─────────────────┘
```

---

## 📱 Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | Expo SDK 54, React Native, TypeScript |
| **Backend** | Python, FastAPI, Motor (async MongoDB) |
| **Database** | MongoDB (8 collections, indexed) |
| **Voice AI** | Resemblyzer (speaker embeddings), faster-whisper (STT) |
| **NLP** | spaCy (entity extraction), regex-based intent parsing |
| **Auth** | JWT (PyJWT), bcrypt password hashing, email OTP |
| **Audio** | expo-audio (recording), ffmpeg (format conversion) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, Python 3.10+, MongoDB running locally
- ffmpeg installed and in PATH
- Expo Go app on your phone

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Server runs on http://localhost:8000
```

### 2. Mobile App
```bash
cd mobile
npm install
npx expo start --lan --clear
# Scan QR with Expo Go (same Wi-Fi)
```

### Environment Variables

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=paytm_voiceguard
PORT=8000
SMTP_EMAIL=your_email@gmail.com        # Optional: for email OTP
SMTP_PASSWORD=your_app_password         # Optional: falls back to terminal OTP
```

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/send-otp` | Send OTP to email |
| POST | `/auth/signup` | Register with OTP verification + ₹1000 bonus |
| POST | `/auth/login` | Login with password + OTP |
| POST | `/auth/verify-password` | Verify user password |

### Voice AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/voice/challenge` | Generate random challenge phrase |
| POST | `/api/voice/enroll/start` | Initialize 3-sample enrollment |
| POST | `/api/voice/enroll/sample` | Submit voice sample (base64 audio) |
| GET | `/api/voice/status` | Check enrollment status |
| POST | `/api/voice/verify` | Verify speaker identity |
| POST | `/api/voice/pay` | Voice-biometric verified payment |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/voice/process` | Full voice processing pipeline |
| POST | `/voice/enroll` | Legacy voice enrollment |
| POST | `/payment/upi` | Password-verified UPI transfer |
| POST | `/payment/recharge` | Mobile recharge |
| POST | `/payment/bill` | Bill payment |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | `/user/profile` | User profile data |
| GET | `/user/balance` | Wallet balance + stats |
| GET | `/user/transactions` | Transaction history |
| GET | `/user/notifications` | Notification feed |
| GET | `/user/offers` | Active promotional offers |
| GET | `/user/verify-upi` | Verify UPI ID exists |

### Merchant
| Method | Endpoint | Description |
|---|---|---|
| GET | `/merchant/dashboard` | Merchant analytics + recent events |
| POST | `/merchant/soundbox/event` | Log a soundbox payment event |

---

## 🎯 Demo Flow

1. **Sign Up** → Create account with email OTP → Get ₹1,000 bonus balance
2. **Enroll Voice** → Record 3 challenge phrases → Voiceprint created
3. **Voice Pay** → Enter recipient UPI + amount → Speak challenge phrase
4. **AI Verifies** → Speaker identity (Resemblyzer) + phrase match (Whisper) → Both must pass
5. **Payment Executes** → Balance updated, transaction recorded, notification sent
6. **Success Screen** → Full-screen Paytm-style confirmation with share option

---

## ⚖️ License

This project is **proprietary and all rights are reserved** by Team DREAMTECH.

- ❌ **No copying or reproduction** — You may not copy, clone, or reproduce this software in any form.
- ❌ **No commercial use** — This software may not be used for any commercial purpose.
- ❌ **No redistribution** — You may not distribute or share this software.
- ❌ **No false attribution** — You may not claim this work as your own under any circumstances.
- ✅ **Viewing only** — This code is available for private, non-commercial viewing only.

See the full [LICENSE](./LICENSE) file for details.

---

