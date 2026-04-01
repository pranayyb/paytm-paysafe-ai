import random
import json
from datetime import datetime, timedelta
from faker import Faker
from pathlib import Path
from database import SessionLocal, engine, Base
from models import User, Merchant, Transaction

fake = Faker('en_IN')

# Create tables
Base.metadata.create_all(bind=engine)

DATA_DIR = Path(__file__).parent / "data"

# ─── Configuration ───
FIRST_NAMES = [
    "Rajesh", "Priya", "Amit", "Sunita", "Vikram", "Deepa", "Harish", "Neha",
    "Mohan", "Anita", "Rajiv", "Krishna", "Divya", "Patrick", "Jonathan", "Ekta",
    "Warda", "Maanav", "Chanchal", "Janya", "Widisha", "Elijah", "Aryan", "Ekani",
    "Gautam", "Hemal", "Nirja", "Yashica", "Mahika", "Falak"
]

MERCHANT_NAMES = [
    "Kirana Store", "Electronics", "Beauty Salon", "Coffee House", "Tailor Shop",
    "Recharge Shop", "Fashion Boutique", "Mobile Repair", "Pharmacy", "Sweets Shop",
    "Dairy", "Vegetables", "Biryani House", "Books Store", "Pan Shop", "Dry Fruits",
    "Sarees", "Vegetables Market", "Tea Stall", "Barber Shop"
]

MERCHANT_CATEGORIES = [
    "grocery", "electronics", "beauty", "cafe", "tailoring", "recharge", "fashion",
    "repair", "pharmacy", "sweets", "dairy", "vegetables", "food", "books", "general",
    "fruits", "clothing", "market", "beverages", "personal_care"
]

BANK_CODES = ["sbi", "icici", "okhdfcbank", "axis", "barodabank", "hdfc"]

SCAM_PATTERNS = ['electricity_scam', 'kyc_scam', 'lottery_scam', 'emergency_scam',
                  'refund_scam', 'fake_delivery', 'otp_scam', 'investment_scam']


def generate_data():
    db = SessionLocal()
    random.seed(42)

    # Check if data already exists
    if db.query(User).count() > 0:
        print("Data already exists. Skipping generation.")
        db.close()
        return

    # ─── Generate Users ───
    users = []
    user_data = []
    used_upi = set()
    print("Generating 25 users...")
    
    for i in range(25):
        # Ensure unique UPI IDs
        while True:
            first = random.choice(FIRST_NAMES)
            bank = random.choice(BANK_CODES)
            upi_id = f"{first.lower()}@{bank}"
            if upi_id not in used_upi:
                used_upi.add(upi_id)
                break
        
        last = fake.last_name()
        name = f"{first} {last}"
        created_at = datetime(2025, 1, 1) + timedelta(days=random.randint(0, 300))
        has_disputes = random.choice([True, False]) if random.random() < 0.1 else False
        
        user = User(
            upi_id=upi_id,
            name=name,
            created_at=created_at,
            is_merchant=False,
            has_disputes=has_disputes
        )
        users.append(user)
        db.add(user)
        
        user_data.append({
            "id": i + 1,
            "upi_id": upi_id,
            "name": name,
            "created_at": created_at.isoformat(),
            "is_merchant": False,
            "has_disputes": has_disputes
        })

    # ─── Generate Merchants ───
    merchants = []
    merchant_data = []
    print("Generating 20 merchants...")
    
    for i in range(20):
        # Ensure unique UPI IDs (avoiding user conflicts)
        while True:
            first = random.choice(FIRST_NAMES)
            bank = random.choice(BANK_CODES)
            merchant_type = random.choice(MERCHANT_NAMES)
            upi_id = f"{first.lower()}_{merchant_type.lower().replace(' ', '_')}@{bank}"
            if upi_id not in used_upi:
                used_upi.add(upi_id)
                break
        
        name = f"{first} {merchant_type}"
        category = random.choice(MERCHANT_CATEGORIES)
        phone = f"+91{random.randint(8000000000, 9999999999)}"
        created_at = datetime(2025, 1, 1) + timedelta(days=random.randint(0, 300))
        complaint_count = random.randint(0, 4)
        
        merchant = Merchant(
            upi_id=upi_id,
            name=name,
            category=category,
            phone=phone,
            created_at=created_at,
            complaint_count=complaint_count
        )
        merchants.append(merchant)
        db.add(merchant)
        
        # Also add as User for merchant purposes
        user_merch = User(
            upi_id=upi_id,
            name=name,
            created_at=created_at,
            is_merchant=True,
            has_disputes=(complaint_count > 0)
        )
        db.add(user_merch)
        
        merchant_data.append({
            "id": i + 1,
            "upi_id": upi_id,
            "name": name,
            "category": category,
            "phone": phone,
            "created_at": created_at.isoformat(),
            "complaint_count": complaint_count
        })

    db.commit()

    # ─── Generate Transactions ───
    print("Generating 200 transactions...")
    transactions = []
    transaction_data = []
    
    for i in range(200):
        sender = random.choice(users)
        receiver = random.choice(merchants)
        
        amount = round(random.uniform(10, 5000), 2)
        
        # 5% fraud rate
        is_fraud = random.random() < 0.05
        fraud_pattern = random.choice(SCAM_PATTERNS) if is_fraud else None
        
        # Transactions spread across last 2 months
        timestamp = datetime(2026, 2, 1) + timedelta(
            days=random.randint(0, 60),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        tx = Transaction(
            sender_upi_id=sender.upi_id,
            receiver_upi_id=receiver.upi_id,
            amount=amount,
            timestamp=timestamp,
            is_fraud=is_fraud,
            fraud_pattern=fraud_pattern
        )
        transactions.append(tx)
        db.add(tx)
        
        transaction_data.append({
            "id": i + 1,
            "sender": sender.upi_id,
            "sender_name": sender.name,
            "receiver": receiver.upi_id,
            "receiver_name": receiver.name,
            "amount": amount,
            "timestamp": timestamp.isoformat(),
            "is_fraud": is_fraud,
            "fraud_pattern": fraud_pattern
        })

    db.commit()

    # ─── Export JSON Files ───
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(DATA_DIR / "users.json", "w") as f:
        json.dump(user_data, f, indent=2)
    
    with open(DATA_DIR / "merchants.json", "w") as f:
        json.dump(merchant_data, f, indent=2)
    
    with open(DATA_DIR / "sample_transactions.json", "w") as f:
        json.dump(transaction_data, f, indent=2)
    
    # ─── Generate Scam Patterns ───
    scam_patterns_data = [
        {
            "id": 1,
            "pattern": "electricity_scam",
            "name": "Electricity Bill Scam",
            "description": "Fake billing demands claiming unpaid electricity bills",
            "keywords": ["electricity", "bill", "urgent", "disconnect", "payment"],
            "risk_level": "high"
        },
        {
            "id": 2,
            "pattern": "kyc_scam",
            "name": "KYC Verification Scam",
            "description": "Requests for KYC/personal details under false pretense",
            "keywords": ["kyc", "verification", "update", "aadhar", "pan"],
            "risk_level": "critical"
        },
        {
            "id": 3,
            "pattern": "lottery_scam",
            "name": "Lottery/Prize Scam",
            "description": "Fake lottery winnings or prize claims",
            "keywords": ["lottery", "prize", "won", "lottery", "congratulations"],
            "risk_level": "high"
        },
        {
            "id": 4,
            "pattern": "emergency_scam",
            "name": "Emergency Money Scam",
            "description": "Urgent money requests claiming emergency situations",
            "keywords": ["emergency", "urgent", "accident", "hospital", "police"],
            "risk_level": "critical"
        },
        {
            "id": 5,
            "pattern": "refund_scam",
            "name": "Refund Scam",
            "description": "Fake refunds from banks or online platforms",
            "keywords": ["refund", "revert", "cashback", "payment failed", "reverse"],
            "risk_level": "high"
        },
        {
            "id": 6,
            "pattern": "fake_delivery",
            "name": "Fake Delivery Scam",
            "description": "Fraudulent delivery or order confirmation messages",
            "keywords": ["delivery", "order", "package", "otp", "track"],
            "risk_level": "medium"
        },
        {
            "id": 7,
            "pattern": "otp_scam",
            "name": "OTP/PIN Phishing",
            "description": "Attempts to obtain OTP or PIN codes",
            "keywords": ["otp", "pin", "security", "confirm", "verify"],
            "risk_level": "critical"
        },
        {
            "id": 8,
            "pattern": "investment_scam",
            "name": "Investment Scam",
            "description": "Fake investment opportunities with guaranteed returns",
            "keywords": ["investment", "returns", "profit", "fast money", "guaranteed"],
            "risk_level": "high"
        }
    ]
    
    with open(DATA_DIR / "scam_patterns.json", "w") as f:
        json.dump(scam_patterns_data, f, indent=2)

    print(f"✅ Generated {len(users)} users, {len(merchants)} merchants, {len(transactions)} transactions")
    print(f"📄 Exported to:")
    print(f"   • data/users.json ({len(user_data)} users)")
    print(f"   • data/merchants.json ({len(merchant_data)} merchants)")
    print(f"   • data/sample_transactions.json ({len(transaction_data)} transactions)")
    print(f"   • data/scam_patterns.json ({len(scam_patterns_data)} patterns)")
    print(f"📊 Fraud rate: {sum(1 for t in transaction_data if t['is_fraud']) / len(transaction_data) * 100:.1f}%")
    
    db.close()


if __name__ == "__main__":
    generate_data()
