"""
Paytm AI VoiceGuard - Database Layer
MongoDB connection management and collection references
Supports both Customer and Merchant roles
"""
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
from time_utils import get_ist_now

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "paytm_voiceguard")

# ─── Collection Manager ───
class Collections:
    users = None
    transactions = None
    notifications = None
    offers = None
    voice_enrollments = None
    merchants = None
    soundbox_events = None
    otps = None

cols = Collections()
client = None

async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    cols.users = db["users"]
    cols.transactions = db["transactions"]
    cols.notifications = db["notifications"]
    cols.offers = db["offers"]
    cols.voice_enrollments = db["voice_enrollments"]
    cols.merchants = db["merchants"]
    cols.soundbox_events = db["soundbox_events"]
    cols.otps = db["otps"]

    # Indexes
    await cols.users.create_index("user_id", unique=True)
    await cols.users.create_index("email", unique=True)
    await cols.users.create_index("upi_id", unique=True)
    await cols.transactions.create_index([("user_id", 1), ("timestamp", -1)])
    await cols.transactions.create_index([("merchant_id", 1), ("timestamp", -1)])
    await cols.notifications.create_index("user_id")
    await cols.merchants.create_index("merchant_id", unique=True)
    await cols.merchants.create_index("user_id", sparse=True)
    await cols.soundbox_events.create_index([("merchant_id", 1), ("timestamp", -1)])

    # Seed default offers if empty
    offers_count = await cols.offers.count_documents({})
    if offers_count == 0:
        await cols.offers.insert_many([
            {"title": "₹50 Cashback", "subtitle": "On first voice payment", "icon": "mic", "color": "#00BAF2", "active": True},
            {"title": "Gold Coins", "subtitle": "Earn 5x on UPI", "icon": "coins", "color": "#FFB800", "active": True},
            {"title": "Recharge Deal", "subtitle": "₹20 off on ₹199+", "icon": "smartphone", "color": "#21C17C", "active": True},
        ])
        await cols.notifications.insert_many([
            {"user_id": "system", "title": "VoiceGuard Active", "body": "Triple-layer voice auth protects your payments", "time": "Now", "read": False, "type": "security", "created_at": get_ist_now()},
            {"user_id": "system", "title": "Voice Payments", "body": "Say 'Pay 500 to Rahul' to make instant payments", "time": "Today", "read": False, "type": "promo", "created_at": get_ist_now()},
        ])
    print("✅ MongoDB connected & seeded")

async def close_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")
