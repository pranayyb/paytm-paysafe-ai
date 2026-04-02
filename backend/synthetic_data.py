import random
import json
from datetime import datetime, timedelta, timezone
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
    "Gautam", "Hemal", "Nirja", "Yashica", "Mahika", "Falak", "Pranay", "Dishant",
    "Saurabh", "Aarav", "Riya", "Kavya", "Ishaan", "Aisha", "Veer", "Tanya"
]

MERCHANT_NAMES = [
    "Kirana Store", "Electronics", "Beauty Salon", "Coffee House", "Tailor Shop",
    "Recharge Shop", "Fashion Boutique", "Mobile Repair", "Pharmacy", "Sweets Shop",
    "Dairy", "Vegetables", "Biryani House", "Books Store", "Pan Shop", "Dry Fruits",
    "Sarees", "Vegetables Market", "Tea Stall", "Barber Shop", "Pizza Corner",
    "Juice Bar", "Hardware Store", "Gym", "Coaching Center"
]

MERCHANT_CATEGORIES = [
    "grocery", "electronics", "beauty", "cafe", "tailoring", "recharge", "fashion",
    "repair", "pharmacy", "sweets", "dairy", "vegetables", "food", "books", "general",
    "fruits", "clothing", "market", "beverages", "personal_care", "fitness", "education"
]

BANK_CODES = ["sbi", "icici", "okhdfcbank", "axis", "barodabank", "hdfc", "paytm", "ybl"]

SCAM_PATTERNS = ['electricity_scam', 'kyc_scam', 'lottery_scam', 'emergency_scam',
                  'refund_scam', 'fake_delivery', 'otp_scam', 'investment_scam']

# Realistic transaction amount ranges by merchant category
AMOUNT_RANGES = {
    "grocery": (20, 2000),
    "electronics": (500, 25000),
    "beauty": (100, 5000),
    "cafe": (50, 800),
    "tailoring": (200, 3000),
    "recharge": (10, 999),
    "fashion": (300, 8000),
    "repair": (100, 5000),
    "pharmacy": (50, 3000),
    "sweets": (50, 2000),
    "dairy": (20, 500),
    "vegetables": (20, 800),
    "food": (80, 1500),
    "books": (100, 2000),
    "general": (10, 5000),
    "fruits": (30, 600),
    "clothing": (200, 5000),
    "market": (50, 3000),
    "beverages": (20, 400),
    "personal_care": (50, 2000),
    "fitness": (500, 5000),
    "education": (1000, 15000),
}

# Peak hours for different merchant categories (realistic Indian patterns)
PEAK_HOURS = {
    "grocery": [8, 9, 10, 17, 18, 19],
    "cafe": [8, 9, 10, 15, 16, 17],
    "food": [12, 13, 14, 19, 20, 21],
    "pharmacy": [9, 10, 11, 18, 19],
    "vegetables": [6, 7, 8, 17, 18],
    "dairy": [6, 7, 8, 18, 19],
    "recharge": [10, 11, 12, 14, 15, 16, 17, 18],
    "default": [9, 10, 11, 14, 15, 16, 17, 18, 19],
}


def generate_data():
    db = SessionLocal()
    random.seed(42)

    # Check if data already exists
    if db.query(User).count() > 0:
        print("Data already exists. Skipping generation.")
        db.close()
        return

    # ─── Generate Users (50 users) ───
    users = []
    user_data = []
    used_upi = set()
    print("Generating 50 users...")
    
    for i in range(50):
        while True:
            first = random.choice(FIRST_NAMES)
            bank = random.choice(BANK_CODES)
            upi_id = f"{first.lower()}@{bank}"
            if upi_id not in used_upi:
                used_upi.add(upi_id)
                break
        
        last = fake.last_name()
        name = f"{first} {last}"
        created_at = datetime(2025, 1, 1, tzinfo=timezone.utc) + timedelta(days=random.randint(0, 300))
        has_disputes = random.choice([True, False]) if random.random() < 0.1 else False
        dispute_count = random.randint(0, 3) if has_disputes else 0
        complaint_count = random.randint(0, 2)
        
        user = User(
            upi_id=upi_id,
            name=name,
            created_at=created_at,
            is_merchant=False,
            has_disputes=has_disputes,
            dispute_count=dispute_count,
            total_transaction_count=0,
            complaint_count=complaint_count
        )
        users.append(user)
        db.add(user)
        
        user_data.append({
            "id": i + 1,
            "upi_id": upi_id,
            "name": name,
            "created_at": created_at.isoformat(),
            "is_merchant": False,
            "has_disputes": has_disputes,
            "dispute_count": dispute_count,
            "complaint_count": complaint_count
        })

    # ─── Generate Merchants (25 merchants) ───
    merchants = []
    merchant_data = []
    merchant_categories = {}  # upi_id -> category mapping
    print("Generating 25 merchants...")
    
    for i in range(25):
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
        created_at = datetime(2025, 1, 1, tzinfo=timezone.utc) + timedelta(days=random.randint(0, 200))
        complaint_count = random.randint(0, 4)
        
        merchant_categories[upi_id] = category
        
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
        
        # Also add as User for cross-referencing
        user_merch = User(
            upi_id=upi_id,
            name=name,
            created_at=created_at,
            is_merchant=True,
            has_disputes=(complaint_count > 0),
            dispute_count=random.randint(0, 2) if complaint_count > 0 else 0,
            total_transaction_count=0,
            complaint_count=complaint_count
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

    # ─── Generate Rich Transaction History (2000 transactions across 90 days) ───
    print("Generating 2000 realistic transactions...")
    transactions = []
    transaction_data = []
    
    # Current time reference
    now = datetime.now(timezone.utc)
    
    for i in range(2000):
        sender = random.choice(users)
        receiver = random.choice(merchants)
        
        # Get category-appropriate amount range
        category = merchant_categories.get(receiver.upi_id, "general")
        min_amt, max_amt = AMOUNT_RANGES.get(category, (10, 5000))
        amount = round(random.uniform(min_amt, max_amt), 2)
        
        # Realistic time distribution: more recent = more transactions
        # 60% in last 7 days, 25% in last 30 days, 15% older
        time_bucket = random.random()
        if time_bucket < 0.60:
            # Last 7 days (dense — makes dashboards look alive)
            days_ago = random.uniform(0, 7)
        elif time_bucket < 0.85:
            # Last 30 days
            days_ago = random.uniform(7, 30)
        else:
            # Last 90 days
            days_ago = random.uniform(30, 90)
        
        # Use realistic peak hours for time of day
        peak_hours = PEAK_HOURS.get(category, PEAK_HOURS["default"])
        if random.random() < 0.7:
            # 70% during peak hours
            hour = random.choice(peak_hours)
        else:
            # 30% random hours (but avoid 1-5 AM)
            hour = random.choice([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
        
        timestamp = now - timedelta(
            days=days_ago,
            hours=random.randint(0, 2),
            minutes=random.randint(0, 59)
        )
        timestamp = timestamp.replace(hour=hour)
        
        # 5% fraud rate with patterns
        is_fraud = random.random() < 0.05
        fraud_pattern = random.choice(SCAM_PATTERNS) if is_fraud else None
        
        # Some frauds have specific characteristics
        if is_fraud:
            # Fraudulent transactions tend to be larger or very small
            if random.random() < 0.6:
                amount = round(random.uniform(5000, 25000), 2)  # Large fraud
            else:
                amount = round(random.uniform(1, 10), 2)  # Micro-fraud (social engineering)
        
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

    # ─── Update Transaction Counts ───
    from sqlalchemy import func as sql_func
    receiver_counts = db.query(
        Transaction.receiver_upi_id,
        sql_func.count(Transaction.id).label('count')
    ).group_by(Transaction.receiver_upi_id).all()
    
    for receiver_upi_id, count in receiver_counts:
        user = db.query(User).filter(User.upi_id == receiver_upi_id).first()
        if user:
            user.total_transaction_count = count
    
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

    fraud_count = sum(1 for t in transaction_data if t['is_fraud'])
    print(f"\n✅ Generated {len(users)} users, {len(merchants)} merchants, {len(transactions)} transactions")
    print(f"📄 Exported to:")
    print(f"   • data/users.json ({len(user_data)} users)")
    print(f"   • data/merchants.json ({len(merchant_data)} merchants)")
    print(f"   • data/sample_transactions.json ({len(transaction_data)} transactions)")
    print(f"   • data/scam_patterns.json ({len(scam_patterns_data)} patterns)")
    print(f"📊 Fraud rate: {fraud_count / len(transaction_data) * 100:.1f}% ({fraud_count} frauds)")
    print(f"📆 Data range: Last 90 days (60% in last 7 days for fresh dashboards)")
    
    db.close()


if __name__ == "__main__":
    generate_data()
