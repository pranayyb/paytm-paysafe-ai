import random
import json
from datetime import datetime, timedelta
from faker import Faker
from pathlib import Path
from backend.database import SessionLocal, engine, Base
from backend.models import User, Merchant, Transaction

fake = Faker('en_IN')

# Create tables
Base.metadata.create_all(bind=engine)

DATA_DIR = Path(__file__).parent / "data"


def generate_data():
    db = SessionLocal()
    categories = ['kirana', 'medical', 'restaurant', 'auto', 'vegetables']
    scam_patterns = ['electricity_scam', 'kyc_scam', 'lottery_scam', 'emergency_scam',
                     'refund_scam', 'fake_delivery', 'otp_scam', 'investment_scam']

    # Check if data already exists
    if db.query(User).count() > 0:
        print("Data already exists. Skipping generation.")
        db.close()
        return

    # ─── Demo-Specific Accounts ───
    demo_users = [
        {"upi_id": "rahul@paytm", "name": "Rahul Kumar", "days_old": 18, "disputes": False},
        {"upi_id": "suspicious_guy@paytm", "name": "Fake Account", "days_old": 3, "disputes": True},
        {"upi_id": "sunita@paytm", "name": "Sunita Devi", "days_old": 400, "disputes": False},
        {"upi_id": "priya@paytm", "name": "Priya Sharma", "days_old": 200, "disputes": False},
        {"upi_id": "scammer123@paytm", "name": "Scam Artist", "days_old": 2, "disputes": True},
    ]

    users = []
    print("Generating demo accounts...")
    for du in demo_users:
        user = User(
            upi_id=du["upi_id"],
            name=du["name"],
            created_at=datetime.now() - timedelta(days=du["days_old"]),
            is_merchant=False,
            has_disputes=du["disputes"]
        )
        users.append(user)
        db.add(user)

    print("Generating 200 random users...")
    for idx in range(195):  # 195 + 5 demo = 200
        name = fake.name()
        has_disputes = random.random() < 0.05
        created_at = datetime.now() - timedelta(days=random.randint(1, 730))

        user = User(
            upi_id=f"user_{idx}@paytm",
            name=name,
            created_at=created_at,
            is_merchant=False,
            has_disputes=has_disputes
        )
        users.append(user)
        db.add(user)

    # ─── Demo-Specific Merchants ───
    demo_merchants = [
        {"upi_id": "ramesh_med1@paytm", "name": "Ramesh Medical Store", "category": "medical",
         "phone": "+919876543210", "days_old": 500, "complaints": 0},
        {"upi_id": "demo_merchant_001@paytm", "name": "Sharma Kirana Store", "category": "kirana",
         "phone": "+919876543211", "days_old": 365, "complaints": 0},
        {"upi_id": "shady_shop@paytm", "name": "Quick Cash Shop", "category": "kirana",
         "phone": "+919876543212", "days_old": 10, "complaints": 8},
        {"upi_id": "new_restaurant@paytm", "name": "Tasty Bites", "category": "restaurant",
         "phone": "+919876543213", "days_old": 5, "complaints": 0},
    ]

    merchants = []
    print("Generating demo merchants...")
    for dm in demo_merchants:
        merchant = Merchant(
            upi_id=dm["upi_id"],
            name=dm["name"],
            category=dm["category"],
            phone=dm["phone"],
            created_at=datetime.now() - timedelta(days=dm["days_old"]),
            complaint_count=dm["complaints"]
        )
        user_merch = User(
            upi_id=dm["upi_id"],
            name=dm["name"],
            created_at=datetime.now() - timedelta(days=dm["days_old"]),
            is_merchant=True,
            has_disputes=(dm["complaints"] > 0)
        )
        merchants.append(merchant)
        db.add(merchant)
        db.add(user_merch)

    print("Generating 50 random merchants...")
    indian_shop_names = [
        "Gupta General Store", "Singh Electronics", "Verma Cloth House",
        "Patel Vegetables", "Nair Pharmacy", "Reddy Auto Parts",
        "Khan Biryani House", "Joshi Books", "Mishra Sweets",
        "Agarwal Dry Fruits", "Bhatia Hardware", "Chowdhary Dairy",
        "Iyer Coffee", "Mukherjee Sarees", "Pandey Pan Shop"
    ]

    for i in range(46):  # 46 + 4 demo = 50
        if i < len(indian_shop_names):
            name = indian_shop_names[i]
        else:
            name = fake.company()

        upi_id = f"merchant_{i+10}@paytm"
        category = random.choice(categories)
        created_at = datetime.now() - timedelta(days=random.randint(30, 730))
        complaints = random.randint(1, 12) if random.random() < 0.1 else 0

        merchant = Merchant(
            upi_id=upi_id,
            name=name,
            category=category,
            phone=fake.phone_number(),
            created_at=created_at,
            complaint_count=complaints
        )
        user_merch = User(
            upi_id=upi_id,
            name=name,
            created_at=created_at,
            is_merchant=True,
            has_disputes=(complaints > 0)
        )
        merchants.append(merchant)
        db.add(merchant)
        db.add(user_merch)

    db.commit()

    # ─── Generate Transactions ───
    print("Generating 1000 transactions...")
    transactions = []
    sample_txs = []
    base_time = datetime.now() - timedelta(days=30)

    for i in range(1000):
        sender = random.choice(users)
        receiver = random.choice(merchants)

        # Realistic amount distribution
        amt_type = random.random()
        if amt_type < 0.4:
            amount = round(random.uniform(10, 200), 2)      # Small purchases
        elif amt_type < 0.75:
            amount = round(random.uniform(200, 1000), 2)     # Medium
        elif amt_type < 0.95:
            amount = round(random.uniform(1000, 5000), 2)    # Large
        else:
            amount = round(random.uniform(5000, 25000), 2)   # Very large

        # 5% fraud rate
        is_fraud = random.random() < 0.05
        fraud_pattern = random.choice(scam_patterns) if is_fraud else None

        # Realistic time distribution
        days_ago = random.randint(0, 30)
        if random.random() < 0.4:
            hour = random.randint(19, 21)  # Peak: 7-9 PM
        elif random.random() < 0.3:
            hour = random.randint(10, 13)  # Morning peak
        else:
            hour = random.randint(8, 22)

        # Tuesday dip (~20% fewer transactions)
        tx_time = base_time + timedelta(days=days_ago, hours=hour, minutes=random.randint(0, 59))
        if tx_time.weekday() == 1 and random.random() < 0.2:
            continue

        tx = Transaction(
            sender_upi_id=sender.upi_id,
            receiver_upi_id=receiver.upi_id,
            amount=amount,
            timestamp=tx_time,
            is_fraud=is_fraud,
            fraud_pattern=fraud_pattern
        )
        transactions.append(tx)

        # Collect first 100 for sample JSON export
        if len(sample_txs) < 100:
            sample_txs.append({
                "id": i + 1,
                "sender": sender.upi_id,
                "sender_name": sender.name,
                "receiver": receiver.upi_id,
                "receiver_name": receiver.name,
                "amount": amount,
                "timestamp": tx_time.isoformat(),
                "is_fraud": is_fraud,
                "fraud_pattern": fraud_pattern
            })

    db.add_all(transactions)
    db.commit()

    # ─── Export sample_transactions.json ───
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_DIR / "sample_transactions.json", "w") as f:
        json.dump(sample_txs, f, indent=2, ensure_ascii=False)

    print(f"✅ Generated {len(users)} users, {len(merchants)} merchants, {len(transactions)} transactions")
    print(f"📄 Exported {len(sample_txs)} sample transactions to data/sample_transactions.json")
    db.close()


if __name__ == "__main__":
    generate_data()
