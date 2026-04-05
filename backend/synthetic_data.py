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
    "Saurabh", "Aarav", "Riya", "Kavya", "Ishaan", "Aisha", "Veer", "Tanya",
    "Nikhil", "Pooja", "Rahul", "Sneha", "Arun", "Medha", "Suresh", "Varsha",
    "Arjun", "Nayantara", "Karan", "Shruti", "Rohan", "Anjali", "Varun", "Megha"
]

# User trust profiles for diverse testing
USER_PROFILES = {
    "trusted_veteran": {"ratio": 0.15, "complaints": 0, "disputes": 0, "years": (2, 5)},
    "trusted_regular": {"ratio": 0.25, "complaints": 0, "disputes": 0, "years": (0.5, 2)},
    "low_activity": {"ratio": 0.20, "complaints": 0, "disputes": 0, "years": (0.1, 0.5)},
    "suspicious_new": {"ratio": 0.15, "complaints": (1, 3), "disputes": (0, 2), "years": (0, 0.2)},
    "risky_user": {"ratio": 0.15, "complaints": (2, 5), "disputes": (1, 3), "years": (0, 1)},
    "flagged_account": {"ratio": 0.10, "complaints": (3, 7), "disputes": (2, 4), "years": (0.1, 2)}
}

MERCHANT_NAMES = [
    "Kirana Store", "Electronics", "Beauty Salon", "Coffee House", "Tailor Shop",
    "Recharge Shop", "Fashion Boutique", "Mobile Repair", "Pharmacy", "Sweets Shop",
    "Dairy", "Vegetables", "Biryani House", "Books Store", "Pan Shop", "Dry Fruits",
    "Sarees", "Vegetables Market", "Tea Stall", "Barber Shop", "Pizza Corner",
    "Juice Bar", "Hardware Store", "Gym", "Coaching Center", "Flower Shop",
    "Jewelry Store", "Spa & Wellness", "Fast Food", "Bakery", "Bookshop",
    "Travel Agent", "Insurance Broker", "Tax Consultant", "Gym+Yoga", "Organic Store"
]

# Merchant trust/performance profiles
MERCHANT_PROFILES = {
    "elite_merchant": {"ratio": 0.10, "complaints": 0, "growth": (15, 25), "monthly_revenue": (300000, 800000)},
    "established": {"ratio": 0.25, "complaints": (0, 1), "growth": (8, 15), "monthly_revenue": (150000, 350000)},
    "steady": {"ratio": 0.30, "complaints": (0, 2), "growth": (2, 8), "monthly_revenue": (50000, 180000)},
    "new_promising": {"ratio": 0.15, "complaints": (0, 1), "growth": (20, 40), "monthly_revenue": (10000, 80000)},
    "struggling": {"ratio": 0.10, "complaints": (1, 3), "growth": (-5, 2), "monthly_revenue": (20000, 80000)},
    "problematic": {"ratio": 0.10, "complaints": (2, 6), "growth": (-10, 0), "monthly_revenue": (5000, 50000)}
}

MERCHANT_CATEGORIES = [
    "grocery", "electronics", "beauty", "cafe", "tailoring", "recharge", "fashion",
    "repair", "pharmacy", "sweets", "dairy", "vegetables", "food", "books", "general",
    "fruits", "clothing", "market", "beverages", "personal_care", "fitness", "education"
]

BANK_CODES = ["sbi", "icici", "okhdfcbank", "axis", "barodabank", "hdfc", "paytm", "ybl"]

SCAM_PATTERNS = [
    'electricity_scam', 'kyc_scam', 'lottery_scam', 'emergency_scam',
    'refund_scam', 'fake_delivery', 'otp_scam', 'investment_scam',
    'romance_scam', 'job_scam', 'impersonation_scam', 'phishing_scam',
    'qr_code_fraud', 'duplicate_transaction', 'unusual_location', 'testing_fraud'
]

# Anomaly types for merchant/user monitoring
ANOMALY_TYPES = [
    'unusual_amount', 'rapid_repeat_upi', 'unusual_time', 'batch_transactions',
    'amount_spike', 'frequency_spike', 'new_merchants_burst', 'geolocation_mismatch'
]

# Fraud characteristics for realistic patterns
FRAUD_CHARACTERISTICS = {
    'electricity_scam': {'amount_range': (500, 5000), 'common_merchants': ['recharge', 'utility'], 'keywords': ['bill', 'payment', 'urgent']},
    'kyc_scam': {'amount_range': (0, 100), 'common_merchants': ['general'], 'keywords': ['verify', 'update', 'confirm']},
    'lottery_scam': {'amount_range': (1000, 15000), 'common_merchants': ['general', 'education'], 'keywords': ['won', 'prize', 'congratulations']},
    'emergency_scam': {'amount_range': (5000, 50000), 'common_merchants': ['general', 'pharmacy'], 'keywords': ['emergency', 'urgent', 'hospital']},
    'refund_scam': {'amount_range': (100, 10000), 'common_merchants': ['electronics', 'fashion'], 'keywords': ['refund', 'reverse', 'cashback']},
    'fake_delivery': {'amount_range': (200, 3000), 'common_merchants': ['general', 'electronics'], 'keywords': ['delivery', 'otp', 'order']},
    'otp_scam': {'amount_range': (1, 500), 'common_merchants': ['general', 'recharge'], 'keywords': ['otp', 'verify', 'confirm']},
    'investment_scam': {'amount_range': (10000, 100000), 'common_merchants': ['general', 'education'], 'keywords': ['investment', 'returns', 'profit']},
    'romance_scam': {'amount_range': (500, 20000), 'common_merchants': ['general', 'gift'], 'keywords': ['friend', 'help', 'travel']},
    'job_scam': {'amount_range': (1000, 30000), 'common_merchants': ['education', 'general'], 'keywords': ['job', 'training', 'placement']},
    'qr_code_fraud': {'amount_range': (100, 5000), 'common_merchants': ['food', 'retail'], 'keywords': ['payment', 'scan', 'qr']},
    'duplicate_transaction': {'amount_range': (50, 10000), 'common_merchants': ['any'], 'keywords': ['duplicate', 'repeat']},
}

# Major Indian cities with subdivisisions for better locality granularity
LOCALITIES = {
    "Delhi": ["Connaught Place", "Lajpat Nagar", "Khan Market", "Karol Bagh", "South Delhi"],
    "Mumbai": ["Fort", "Bandra", "Andheri", "Malad", "Powai"],
    "Bangalore": ["Indiranagar", "Koramangala", "Whitefield", "MG Road", "Marathahalli"],
    "Hyderabad": ["Hitech City", "Madhapur", "Jubilee Hills", "Banjara Hills", "HITEC"],
    "Chennai": ["T. Nagar", "Adyar", "Anna Nagar", "Nungambakkam", "Mylapore"],
    "Kolkata": ["Park Street", "Ballyganj", "Salt Lake", "Alipore", "Bhawanipur"],
    "Pune": ["Camp", "Koregaon Park", "Hadapsar", "Baner", "Viman Nagar"],
    "Ahmedabad": ["Ahmedabad City", "Satellite", "Vastrapur", "Chandkheda", "Ramdev Nagar"]
}

ALL_LOCALITIES = [loc for sublist in LOCALITIES.values() for loc in sublist]

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

    # ─── Generate Users (200+ users with diverse profiles) ───
    users = []
    user_data = []
    user_profiles_assigned = []
    used_upi = set()
    print("Generating 200+ users with diverse trust profiles...")
    
    # Calculate users per profile
    total_users = 200
    user_profile_counts = {}
    for profile_type, profile_config in USER_PROFILES.items():
        count = max(1, int(total_users * profile_config['ratio']))
        user_profile_counts[profile_type] = count
    
    user_id = 0
    for profile_type, count in user_profile_counts.items():
        profile_config = USER_PROFILES[profile_type]
        
        for _ in range(count):
            user_id += 1
            while True:
                first = random.choice(FIRST_NAMES)
                bank = random.choice(BANK_CODES)
                upi_id = f"{first.lower()}{random.randint(100, 9999)}@{bank}"
                if upi_id not in used_upi:
                    used_upi.add(upi_id)
                    break
            
            name = f"{first} {fake.last_name()}"
            
            # Account age based on profile
            years_old = random.uniform(profile_config['years'][0], profile_config['years'][1])
            created_at = datetime.now(timezone.utc) - timedelta(days=years_old * 365)
            
            # Complaints and disputes from profile
            if isinstance(profile_config['complaints'], tuple):
                complaint_count = random.randint(profile_config['complaints'][0], profile_config['complaints'][1])
            else:
                complaint_count = profile_config['complaints']
            
            if isinstance(profile_config['disputes'], tuple):
                dispute_count = random.randint(profile_config['disputes'][0], profile_config['disputes'][1])
            else:
                dispute_count = profile_config['disputes']
            
            has_disputes = dispute_count > 0
            
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
            user_profiles_assigned.append((upi_id, profile_type))
            db.add(user)
            
            user_data.append({
                "id": user_id,
                "upi_id": upi_id,
                "name": name,
                "profile": profile_type,
                "created_at": created_at.isoformat(),
                "is_merchant": False,
                "has_disputes": has_disputes,
                "dispute_count": dispute_count,
                "complaint_count": complaint_count,
                "account_age_years": years_old
            })

    # ─── Generate Merchants (80+ merchants with diverse profiles) ───
    merchants = []
    merchant_data = []
    merchant_categories = {}  # upi_id -> category mapping
    merchant_localities = {}  # upi_id -> locality mapping
    merchant_profiles = {}  # upi_id -> profile type mapping
    
    print("Generating 80+ merchants with performance profiles...")
    
    # Calculate merchants per profile
    total_merchants = 80
    merchant_profile_counts = {}
    for profile_type, profile_config in MERCHANT_PROFILES.items():
        count = max(1, int(total_merchants * profile_config['ratio']))
        merchant_profile_counts[profile_type] = count
    
    merchant_id = 0
    for profile_type, count in merchant_profile_counts.items():
        profile_config = MERCHANT_PROFILES[profile_type]
        
        for _ in range(count):
            merchant_id += 1
            while True:
                first = random.choice(FIRST_NAMES)
                bank = random.choice(BANK_CODES)
                merchant_type = random.choice(MERCHANT_NAMES)
                upi_id = f"{first.lower()}_{merchant_type.lower().replace(' ', '_')}{random.randint(100, 999)}@{bank}"
                if upi_id not in used_upi:
                    used_upi.add(upi_id)
                    break
            
            name = f"{first} {merchant_type}"
            category = random.choice(MERCHANT_CATEGORIES)
            locality = random.choice(ALL_LOCALITIES)
            phone = f"+91{random.randint(8000000000, 9999999999)}"
            
            # Account age for merchants
            if profile_type == "new_promising":
                years_old = random.uniform(0.1, 0.5)
            elif profile_type == "elite_merchant":
                years_old = random.uniform(2, 7)
            else:
                years_old = random.uniform(0.3, 4)
            
            created_at = datetime.now(timezone.utc) - timedelta(days=years_old * 365)
            
            # Complaints from profile
            if isinstance(profile_config['complaints'], tuple):
                complaint_count = random.randint(profile_config['complaints'][0], profile_config['complaints'][1])
            else:
                complaint_count = profile_config['complaints']
            
            merchant_categories[upi_id] = category
            merchant_localities[upi_id] = locality
            merchant_profiles[upi_id] = profile_type
            
            merchant = Merchant(
                upi_id=upi_id,
                name=name,
                category=category,
                locality=locality,
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
                "id": merchant_id,
                "upi_id": upi_id,
                "name": name,
                "category": category,
                "locality": locality,
                "phone": phone,
                "created_at": created_at.isoformat(),
                "complaint_count": complaint_count,
                "profile_type": profile_type,
                "account_age_years": years_old
            })

    db.commit()

    # ─── Generate Rich Transaction History (4000+ transactions with diverse patterns) ───
    print("Generating 4000+ realistic transactions with diverse patterns...")
    
    transactions = []
    transaction_data = []
    anomalies_record = []
    
    # Current time reference
    now = datetime.now(timezone.utc)
    
    # Create mapping of user profiles for fraud probability
    user_profile_map = {upi: profile for upi, profile in user_profiles_assigned}
    
    transaction_id = 0
    for i in range(4000):
        sender = random.choice(users)
        receiver = random.choice(merchants)
        
        # Get category-appropriate amount range
        category = merchant_categories.get(receiver.upi_id, "general")
        min_amt, max_amt = AMOUNT_RANGES.get(category, (10, 5000))
        
        # Realistic time distribution
        time_bucket = random.random()
        if time_bucket < 0.55:
            days_ago = random.uniform(0, 7)
        elif time_bucket < 0.80:
            days_ago = random.uniform(7, 30)
        else:
            days_ago = random.uniform(30, 90)
        
        # Peak hours by category
        peak_hours = PEAK_HOURS.get(category, PEAK_HOURS["default"])
        if random.random() < 0.7:
            hour = random.choice(peak_hours)
        else:
            hour = random.choice([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
        
        timestamp = now - timedelta(
            days=days_ago,
            hours=random.randint(0, 2),
            minutes=random.randint(0, 59)
        )
        timestamp = timestamp.replace(hour=hour)
        
        # Fraud detection based on user profile
        user_profile = user_profile_map.get(sender.upi_id, "trusted_regular")
        fraud_probability = {
            "trusted_veteran": 0.001,
            "trusted_regular": 0.005,
            "low_activity": 0.01,
            "suspicious_new": 0.12,
            "risky_user": 0.25,
            "flagged_account": 0.40
        }.get(user_profile, 0.05)
        
        is_fraud = random.random() < fraud_probability
        fraud_pattern = None
        amount = round(random.uniform(min_amt, max_amt), 2)
        anomaly_type = None
        
        if is_fraud:
            fraud_pattern = random.choice(SCAM_PATTERNS)
            fraud_char = FRAUD_CHARACTERISTICS.get(fraud_pattern, {})
            amt_range = fraud_char.get('amount_range', (100, 5000))
            amount = round(random.uniform(amt_range[0], amt_range[1]), 2)
            
            # Log anomaly for fraud cases
            anomaly_type = random.choice([
                'unusual_amount', 'rapid_repeat_upi', 'suspicious_pattern'
            ]) if random.random() < 0.6 else None
        else:
            # 10% chance of legitimate anomalies for non-fraud transactions
            if random.random() < 0.10:
                anomaly_rand = random.random()
                if anomaly_rand < 0.4:
                    anomaly_type = 'unusual_time'  # Late night transaction
                    hour = random.choice([23, 0, 1, 2, 3])
                elif anomaly_rand < 0.7:
                    anomaly_type = 'amount_spike'  # Higher than usual
                    amount = round(random.uniform(max_amt * 1.5, max_amt * 3), 2)
                else:
                    anomaly_type = 'unusual_location'
        
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
        
        transaction_id += 1
        transaction_data.append({
            "id": transaction_id,
            "sender": sender.upi_id,
            "sender_name": sender.name,
            "sender_profile": user_profile,
            "receiver": receiver.upi_id,
            "receiver_name": receiver.name,
            "receiver_category": category,
            "amount": amount,
            "timestamp": timestamp.isoformat(),
            "is_fraud": is_fraud,
            "fraud_pattern": fraud_pattern,
            "anomaly_type": anomaly_type
        })
        
        if anomaly_type and is_fraud:
            anomalies_record.append({
                "transaction_id": transaction_id,
                "type": anomaly_type,
                "severity": "CRITICAL" if fraud_pattern in ['otp_scam', 'kyc_scam'] else "HIGH",
                "timestamp": timestamp.isoformat(),
                "amount": amount,
                "description": f"{fraud_pattern.replace('_', ' ').title()} - Unusual {anomaly_type.replace('_', ' ')}"
            })

    db.commit()

    # ─── Generate Rapid-Fire Anomalies (Testing Patterns) ───
    print("Generating rapid-fire transaction anomalies for testing...")

    risky_user = random.choice([u for u in users if user_profile_map.get(u.upi_id) in ['risky_user', 'flagged_account']])
    legitimate_merchant = random.choice(merchants)
    
    # Create various anomaly patterns
    anomaly_scenarios = []
    
    # Scenario 1: Rapid repeat UPI (7 transactions in 45 mins)
    base_time = now - timedelta(hours=2)
    for j in range(7):
        tx_time = base_time + timedelta(minutes=j*6)
        rapid_tx = Transaction(
            sender_upi_id=risky_user.upi_id,
            receiver_upi_id=legitimate_merchant.upi_id,
            amount=round(random.uniform(100, 500), 2),
            timestamp=tx_time,
            is_fraud=True,
            fraud_pattern='testing_fraud'
        )
        db.add(rapid_tx)
        transaction_id += 1
        anomaly_scenarios.append({
            "scenario": "rapid_repeat_upi",
            "transaction_id": transaction_id,
            "timestamp": tx_time.isoformat()
        })
    
    # Scenario 2: Unusual late-night transaction (3x average)
    late_night = now - timedelta(hours=3)
    late_night = late_night.replace(hour=23, minute=42)
    unusual_tx = Transaction(
        sender_upi_id=risky_user.upi_id,
        receiver_upi_id=legitimate_merchant.upi_id,
        amount=round(random.uniform(50000, 100000), 2),
        timestamp=late_night,
        is_fraud=True,
        fraud_pattern='unusual_amount'
    )
    db.add(unusual_tx)
    transaction_id += 1
    anomaly_scenarios.append({
        "scenario": "unusual_amount",
        "transaction_id": transaction_id,
        "timestamp": late_night.isoformat()
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
    
    # ─── Generate Comprehensive Scam Patterns ───
    scam_patterns_data = [
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
            "id": 3,
            "pattern": "lottery_scam",
            "name": "Lottery/Prize Scam",
            "description": "Fake lottery winnings or prize claims requiring confirmation payment",
            "keywords": ["lottery", "prize", "won", "congratulations", "claim"],
            "risk_level": "high",
            "typical_amount": "1000-15000",
            "target_segments": ["gullible", "reward_seekers"]
        },
        {
            "id": 4,
            "pattern": "emergency_scam",
            "name": "Emergency Money Scam",
            "description": "Urgent money requests claiming accident/hospital emergency",
            "keywords": ["emergency", "urgent", "accident", "hospital", "police", "bail"],
            "risk_level": "critical",
            "typical_amount": "5000-50000",
            "target_segments": ["parents", "family_oriented"]
        },
        {
            "id": 5,
            "pattern": "refund_scam",
            "name": "Refund Scam",
            "description": "Fake refunds from banks or e-commerce claiming payment reversal",
            "keywords": ["refund", "revert", "cashback", "payment failed", "reverse", "credit"],
            "risk_level": "high",
            "typical_amount": "100-10000",
            "target_segments": ["online_shoppers", "regular_users"]
        },
        {
            "id": 6,
            "pattern": "fake_delivery",
            "name": "Fake Delivery Scam",
            "description": "Fake delivery/order confirmation asking to click malicious link/OTP",
            "keywords": ["delivery", "order", "package", "otp", "track", "confirm"],
            "risk_level": "medium",
            "typical_amount": "200-3000",
            "target_segments": ["e_commerce_users"]
        },
        {
            "id": 7,
            "pattern": "otp_scam",
            "name": "OTP/PIN Phishing",
            "description": "Attempts to obtain OTP or PIN codes through social engineering",
            "keywords": ["otp", "pin", "security", "confirm", "verify", "authenticate"],
            "risk_level": "critical",
            "typical_amount": "1-500",
            "target_segments": ["everyone"],
            "prevention": "Never share OTP, PIN, or passwords with anyone"
        },
        {
            "id": 8,
            "pattern": "investment_scam",
            "name": "Investment Scam",
            "description": "Fake investment opportunities promising high guaranteed returns",
            "keywords": ["investment", "returns", "profit", "fast money", "guaranteed", "assured"],
            "risk_level": "high",
            "typical_amount": "10000-100000",
            "target_segments": ["wealth_seekers", "retirees"]
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
        },
        {
            "id": 10,
            "pattern": "job_scam",
            "name": "Fake Job Scam",
            "description": "Offering lucrative job requiring upfront payment for training/processing",
            "keywords": ["job", "training", "placement", "fee", "work_from_home"],
            "risk_level": "high",
            "typical_amount": "1000-30000",
            "target_segments": ["job_seekers", "students"]
        },
        {
            "id": 11,
            "pattern": "phishing_scam",
            "name": "Phishing & Malicious Links",
            "description": "Links/QR codes that steal banking credentials or install malware",
            "keywords": ["click", "link", "download", "app", "qr", "update"],
            "risk_level": "critical",
            "typical_amount": "variable",
            "target_segments": ["everyone"],
            "prevention": "Never click links from unknown sources; verify URLs"
        },
        {
            "id": 12,
            "pattern": "qr_code_fraud",
            "name": "Malicious QR Code Fraud",
            "description": "Fake QR codes at shops redirecting payments to fraudulent accounts",
            "keywords": ["qr", "scan", "payment", "shop", "replace"],
            "risk_level": "medium",
            "typical_amount": "100-5000",
            "target_segments": ["merchant_customers"],
            "prevention": "Verify QR codes with merchants before scanning"
        },
        {
            "id": 13,
            "pattern": "impersonation_scam",
            "name": "Government/Authority Impersonation",
            "description": "Posing as tax officials, police, or government demanding payment",
            "keywords": ["tax", "income", "fine", "penalty", "warrant", "arrest"],
            "risk_level": "critical",
            "typical_amount": "5000-100000",
            "target_segments": ["business_owners", "high_earners"]
        },
        {
            "id": 14,
            "pattern": "duplicate_transaction",
            "name": "Duplicate Transaction Fraud",
            "description": "Charging same transaction multiple times within short period",
            "keywords": ["duplicate", "repeat", "charged", "multiple"],
            "risk_level": "medium",
            "typical_amount": "50-10000",
            "target_segments": ["online_users"],
            "prevention": "Check transaction history immediately after payment"
        },
        {
            "id": 15,
            "pattern": "unusual_location",
            "name": "Geolocation Mismatch",
            "description": "Transactions from impossible locations in quick succession",
            "keywords": ["location", "different_city", "suspicious_location"],
            "risk_level": "high",
            "typical_amount": "variable",
            "target_segments": ["frequent_travelers"],
            "prevention": "Enable location alerts and verify unexpected transfers"
        }
    ]
    
    with open(DATA_DIR / "scam_patterns.json", "w") as f:
        json.dump(scam_patterns_data, f, indent=2)
    
    # ─── Generate Merchant Anomalies Data ───
    merchant_anomalies = [
        {
            "merchant_id": merchants[0].upi_id if merchants else "unknown",
            "merchant_name": merchants[0].name if merchants else "Unknown",
            "has_anomalies": True,
            "anomalies": [
                {
                    "type": "Unusual Transaction Amount",
                    "description": "Transaction of ₹2,40,000 at 11:42 PM is 15x your average evening transaction (avg: ₹16,000).",
                    "severity": "HIGH",
                    "timestamp": (now - timedelta(hours=3)).isoformat(),
                    "amount": 240000,
                    "pattern": "amount_spike"
                },
                {
                    "type": "Rapid Repeat UPI",
                    "description": "7 transactions from arif.r@okhdfcbank within 45 mins (6-min intervals) — possible test fraud or account compromise.",
                    "severity": "MEDIUM",
                    "timestamp": (now - timedelta(hours=2)).isoformat(),
                    "pattern": "rapid_repeat_upi"
                },
                {
                    "type": "Off-Peak Activity Spike",
                    "description": "Unusual 23 transactions between 2-4 AM (typically only 1-2 transactions in these hours).",
                    "severity": "MEDIUM",
                    "timestamp": (now - timedelta(hours=4)).isoformat(),
                    "pattern": "unusual_time"
                }
            ]
        }
    ]
    
    with open(DATA_DIR / "merchant_anomalies.json", "w") as f:
        json.dump(merchant_anomalies, f, indent=2)
    
    # ─── Generate Test Anomalies Scenarios ───
    with open(DATA_DIR / "anomaly_scenarios.json", "w") as f:
        json.dump(anomaly_scenarios, f, indent=2)

    fraud_count = sum(1 for t in transaction_data if t['is_fraud'])
    print(f"\n✅ Generated {len(users)} users, {len(merchants)} merchants, {transaction_id} transactions")
    print(f"📊 User Profiles:")
    for profile_type, count in user_profile_counts.items():
        print(f"   • {profile_type}: {count}")
    print(f"📊 Merchant Profiles:")
    for profile_type, count in merchant_profile_counts.items():
        print(f"   • {profile_type}: {count}")
    print(f"📄 Exported to:")
    print(f"   • data/users.json ({len(user_data)} users with profiles)")
    print(f"   • data/merchants.json ({len(merchant_data)} merchants with analytics)")
    print(f"   • data/sample_transactions.json ({len(transaction_data)} transactions)")
    print(f"   • data/scam_patterns.json ({len(scam_patterns_data)} scam patterns)")
    print(f"   • data/merchant_anomalies.json (anomaly examples)")
    print(f"   • data/anomaly_scenarios.json (test scenarios)")
    print(f"📊 Fraud Distribution:")
    print(f"   • Total frauds: {fraud_count} ({fraud_count / len(transaction_data) * 100:.1f}%)")
    print(f"   • Flagged accounts likely fraud: 40%")
    print(f"   • Risky users likely fraud: 25%")
    print(f"   • Suspicious-new likely fraud: 12%")
    print(f"   • Regular users likely fraud: <1%")
    print(f"📆 Data range: Last 90 days with realistic distribution")
    print(f"🎯 Covers all user & merchant types for comprehensive testing")
    
    db.close()


if __name__ == "__main__":
    generate_data()
