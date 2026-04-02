"""
URL Fraud Analyzer — ML-based phishing/fraud URL detection.
Ported from Fraud_detection_using_ML-main/Notebook/fraud_detection_model_.py
Uses a RandomForestClassifier trained on 18 URL features.
"""

import os
import re
import math
import logging
import urllib.parse
from pathlib import Path
from datetime import datetime

import numpy as np
import joblib

logger = logging.getLogger(__name__)

# ─── Model Paths ───
MODEL_DIR = Path(__file__).parent.parent / "ml_models"
MODEL_FILE = MODEL_DIR / "fraud_detection_model.pkl"
SCALER_FILE = MODEL_DIR / "fraud_detection_scaler.pkl"

# Feature names (must match training order)
FEATURE_NAMES = [
    "length", "num_dots", "num_slashes", "num_digits", "has_https",
    "has_http", "has_ip", "has_at_symbol", "has_double_slash_after_protocol",
    "keyword_count", "domain_length", "has_suspicious_tld", "entropy",
    "path_length", "has_query", "has_fragment",
    "domain_age_days", "is_young_domain"
]
EXPECTED_FEATURE_COUNT = len(FEATURE_NAMES)

# Suspicious keywords & TLDs
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "update", "bank", "secure", "account", "free",
    "win", "promo", "temp", "gift", "download", "file", "admin", "backup"
]
SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.club', '.online', '.site', '.bid', '.cn',
    '.ru', '.gq', '.cf', '.tk', '.ml', '.ga'
]


class URLFraudDetector:
    """ML-based URL fraud detector using RandomForest + heuristic risk factors."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):
        """Load pre-trained model and scaler from disk."""
        if MODEL_FILE.exists() and SCALER_FILE.exists():
            try:
                self.model = joblib.load(str(MODEL_FILE))
                self.scaler = joblib.load(str(SCALER_FILE))
                logger.info(f"URL fraud model loaded from {MODEL_DIR}")
            except Exception as e:
                logger.error(f"Failed to load ML model: {e}")
                self.model = None
                self.scaler = None
        else:
            logger.warning(f"ML model files not found at {MODEL_DIR}. Training required.")
            self._train_fallback()

    def _train_fallback(self):
        """Train on synthetic data if no pre-trained model exists."""
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import StandardScaler
            from sklearn.model_selection import train_test_split

            logger.info("Training URL fraud model on synthetic data...")
            urls, labels = self._generate_synthetic_data(10000)
            features = [self._extract_features(url) for url in urls]
            X = np.array(features)
            y = np.array(labels)

            X_train, _, y_train, _ = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)

            self.model = RandomForestClassifier(
                n_estimators=200, random_state=42, class_weight='balanced',
                max_depth=25, min_samples_leaf=5, min_samples_split=10, n_jobs=-1
            )
            self.model.fit(X_train_scaled, y_train)

            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            joblib.dump(self.model, str(MODEL_FILE))
            joblib.dump(self.scaler, str(SCALER_FILE))
            logger.info("URL fraud model trained and saved successfully")
        except Exception as e:
            logger.error(f"Failed to train fallback model: {e}")

    def _extract_features(self, url: str) -> list:
        """Extract 18 numerical features from a URL."""
        try:
            length = len(url)
            num_dots = url.count('.')
            num_slashes = url.count('/')
            num_digits = len(re.findall(r'\d', url))
            has_https = int('https://' in url.lower())
            has_http = int('http://' in url.lower())
            has_ip = int(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) is not None)
            has_at_symbol = int('@' in url)
            has_double_slash = int(re.search(r'https?://[^/]+/+', url) is not None)

            keyword_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url.lower())

            # Parse domain
            domain = ''
            parsed = None
            try:
                parsed = urllib.parse.urlparse(url)
                domain = parsed.netloc
                if '@' in domain:
                    domain = domain.split('@')[-1]
                if ':' in domain:
                    domain = domain.split(':')[0]
                if domain.startswith('www.'):
                    domain = domain[4:]
            except Exception:
                domain = ''

            domain_length = len(domain)

            # TLD check
            tld = ''
            if domain:
                parts = domain.split('.')
                if len(parts) > 1:
                    tld = '.' + parts[-1].lower()
            has_suspicious_tld = int(tld in SUSPICIOUS_TLDS)

            # Domain entropy
            domain_no_tld = '.'.join(domain.split('.')[:-1]) if domain and len(domain.split('.')) > 1 else domain
            domain_no_tld = domain_no_tld.replace('.', '')
            probs = [domain_no_tld.count(c) / len(domain_no_tld) for c in set(domain_no_tld)] if domain_no_tld else []
            entropy = -sum(p * math.log2(p) for p in probs) if probs else 0

            # Path/query features
            path = parsed.path if parsed else ''
            path_length = len(path)
            has_query = int(bool(parsed.query if parsed else ''))
            has_fragment = int(bool(parsed.fragment if parsed else ''))

            # Domain age (default: unknown)
            domain_age_days = 0
            is_young_domain = 0

            features = [
                length, num_dots, num_slashes, num_digits, has_https,
                has_http, has_ip, has_at_symbol, has_double_slash,
                keyword_count, domain_length, has_suspicious_tld, round(entropy, 3),
                path_length, has_query, has_fragment,
                domain_age_days, is_young_domain
            ]

            if len(features) != EXPECTED_FEATURE_COUNT:
                return [0.0] * EXPECTED_FEATURE_COUNT

            return [float(f) for f in features]

        except Exception as e:
            logger.error(f"Feature extraction error for {url[:100]}: {e}")
            return [0.0] * EXPECTED_FEATURE_COUNT

    def analyze_url(self, url: str) -> dict:
        """Analyze a URL for fraud using ML model + heuristic risk factors."""
        # Heuristic-only fallback if no model
        if not self.model or not self.scaler:
            return self._heuristic_analysis(url)

        try:
            features = np.array([self._extract_features(url)])

            if features.shape[1] != self.scaler.n_features_in_:
                return self._heuristic_analysis(url)

            features_scaled = self.scaler.transform(features)
            prediction = int(self.model.predict(features_scaled)[0])
            probabilities = self.model.predict_proba(features_scaled)[0]
            confidence = round(probabilities[prediction] * 100, 2)

            is_fraud = bool(prediction)

            # Risk level
            if is_fraud:
                risk_level = "Critical" if confidence >= 90 else ("High" if confidence >= 75 else "Medium")
            else:
                risk_level = "Safe" if confidence >= 95 else ("Low" if confidence >= 80 else "Medium")

            # Risk factors (heuristic)
            risk_factors = self._get_risk_factors(features[0])
            if is_fraud:
                risk_factors.append("ML model ne is URL ko fraudulent classify kiya hai")

            return {
                "url": url,
                "is_fraud": is_fraud,
                "confidence": confidence,
                "risk_level": risk_level,
                "risk_factors": risk_factors if risk_factors else ["Koi specific risk factor nahi mila"],
                "analysis_mode": "ml",
                "warning_hindi": self._get_hindi_warning(is_fraud, risk_level, url) if is_fraud else None
            }

        except Exception as e:
            logger.error(f"URL analysis error: {e}")
            return self._heuristic_analysis(url)

    def _get_risk_factors(self, features: np.ndarray) -> list:
        """Generate human-readable risk factors from extracted features."""
        factors = []
        feat = dict(zip(FEATURE_NAMES, features))

        if feat.get("length", 0) > 100:
            factors.append("URL bahut lamba hai (100+ characters)")
        if feat.get("has_ip"):
            factors.append("URL mein IP address hai domain ke jagah")
        if feat.get("keyword_count", 0) > 0:
            factors.append(f"Suspicious keywords mile ({int(feat['keyword_count'])} found: login/verify/bank etc.)")
        if feat.get("has_suspicious_tld"):
            factors.append("Suspicious domain extension (.xyz, .top, .club etc.)")
        if feat.get("has_http", 0) and not feat.get("has_https", 0):
            factors.append("HTTPS nahi use ho raha — insecure connection")
        if feat.get("has_at_symbol"):
            factors.append("URL mein '@' symbol hai — deception trick ho sakti hai")
        if feat.get("num_digits", 0) > 10:
            factors.append(f"URL mein bahut digits hain ({int(feat['num_digits'])})")
        if feat.get("path_length", 0) > 60:
            factors.append("URL path bahut lamba hai")
        if feat.get("domain_length", 0) > 30:
            factors.append("Domain name bahut lamba hai — suspicious")

        return factors

    def _get_hindi_warning(self, is_fraud: bool, risk_level: str, url: str) -> str:
        if risk_level == "Critical":
            return "🚨 KHATARNAK URL! Yeh phishing/fraud website hai. Bilkul mat kholein!"
        elif risk_level == "High":
            return "⚠️ Yeh URL bahut suspicious hai. Is link pe click mat karein."
        else:
            return "⚠️ Yeh URL mein kuch suspicious patterns hain. Dhyan se check karein."

    def _heuristic_analysis(self, url: str) -> dict:
        """Fallback heuristic analysis if ML model is unavailable."""
        features = self._extract_features(url)
        risk_factors = self._get_risk_factors(np.array(features))
        score = len(risk_factors) * 15
        is_fraud = score > 30

        return {
            "url": url,
            "is_fraud": is_fraud,
            "confidence": min(95, score + 20) if is_fraud else max(5, 100 - score),
            "risk_level": "High" if score > 60 else ("Medium" if score > 30 else "Low"),
            "risk_factors": risk_factors if risk_factors else ["Koi specific risk factor nahi mila"],
            "analysis_mode": "heuristic",
            "warning_hindi": self._get_hindi_warning(is_fraud, "High" if score > 60 else "Medium", url) if is_fraud else None
        }

    def _generate_synthetic_data(self, n_samples: int = 10000):
        """Generate synthetic URL training data."""
        urls, labels = [], []
        safe_domains = ['https://www.google.com', 'https://www.microsoft.com', 'https://github.com',
                        'https://stackoverflow.com', 'https://www.amazon.in', 'https://paytm.com']
        fraud_domains = ['http://temp-offer.xyz', 'http://free-money.top', 'https://login-verify.club',
                         'http://phishing.gq', 'https://update-your-info.online', 'http://fake-bank.tk']
        safe_paths = ['/', '/index.html', '/home', '/about', '/products', '/contact']
        fraud_paths = ['/admin/', '/.env', '/backup/', '/password.txt', '/cgi-bin/', '/temp/']
        chars = 'abcdefghijklmnopqrstuvwxyz0123456789'

        for _ in range(n_samples):
            is_fraud = np.random.random() < 0.4
            if is_fraud:
                domain = np.random.choice(fraud_domains)
                path = np.random.choice(fraud_paths) if np.random.random() < 0.6 else ''
                query = f"?{''.join(np.random.choice(list(chars)) for _ in range(5))}={''.join(np.random.choice(list(chars)) for _ in range(8))}" if np.random.random() < 0.5 else ''
                if np.random.random() < 0.15:
                    domain = f"http://{np.random.randint(1,255)}.{np.random.randint(0,255)}.{np.random.randint(0,255)}.{np.random.randint(1,254)}"
                urls.append(f"{domain}{path}{query}")
                labels.append(1)
            else:
                domain = np.random.choice(safe_domains)
                path = np.random.choice(safe_paths) if np.random.random() < 0.8 else '/'
                query = f"?id={np.random.randint(100,9999)}" if np.random.random() < 0.2 else ''
                urls.append(f"{domain}{path}{query}")
                labels.append(0)

        return urls, labels


# ─── Singleton instance ───
_detector = None

def get_detector() -> URLFraudDetector:
    global _detector
    if _detector is None:
        _detector = URLFraudDetector()
    return _detector

def analyze_url(url: str) -> dict:
    """Public API: analyze a URL for fraud."""
    return get_detector().analyze_url(url)
