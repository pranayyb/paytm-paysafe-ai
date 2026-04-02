import random

class FraudService:
    @staticmethod
    def calculate_risk_score(amount: float, recipient: str, time_of_day: int) -> dict:
        """
        Calculates a risk score based on transaction features.
        In a real app, this would use XGBoost/scikit-learn.
        """
        score = 0.0
        
        # 1. High amount check
        if amount > 5000:
            score += 0.4
        
        # 2. Unusual time check (e.g., 2 AM)
        if time_of_day < 6:
            score += 0.2
            
        # 3. New recipient check (simulated)
        is_new_recipient = len(recipient) % 2 == 0 # Mock logic
        if is_new_recipient:
            score += 0.1
            
        # 4. Random noise
        score += random.uniform(0, 0.1)
        
        risk_level = "low"
        if score > 0.6:
            risk_level = "high"
        elif score > 0.3:
            risk_level = "medium"
            
        return {
            "score": float(round(score, 2)),
            "risk_level": risk_level,
            "action": "flag" if risk_level == "high" else "none"
        }
