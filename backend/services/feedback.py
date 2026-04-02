"""
User Feedback Service — Collects user corrections on scam/URL analysis results.
Appends labeled data to a CSV file for future model retraining.
"""

import csv
import os
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

FEEDBACK_DIR = Path(__file__).parent.parent / "data"
FEEDBACK_FILE = FEEDBACK_DIR / "feedback.csv"
HEADERS = ["timestamp", "item_type", "item_data", "original_prediction", "correct_label", "user_note"]


def save_feedback(item_type: str, item_data: str, correct_label: int,
                  original_prediction: bool = None, user_note: str = None) -> bool:
    """
    Save user feedback to CSV for model retraining.
    
    Args:
        item_type: 'url', 'scam_message', or 'qr'
        item_data: The analyzed content (URL, message text, QR data)
        correct_label: 0 = legitimate, 1 = fraudulent
        original_prediction: What the system originally predicted
        user_note: Optional user comment
    
    Returns:
        True on success, False on failure
    """
    try:
        FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
        file_exists = FEEDBACK_FILE.exists()

        with open(FEEDBACK_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(HEADERS)
            writer.writerow([
                datetime.now().isoformat(),
                item_type,
                item_data[:500],  # Truncate long data
                original_prediction,
                correct_label,
                user_note or ""
            ])

        logger.info(f"Feedback saved: type={item_type}, label={correct_label}")
        return True

    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        return False


def get_feedback_stats() -> dict:
    """Get summary statistics of collected feedback."""
    if not FEEDBACK_FILE.exists():
        return {"total": 0, "by_type": {}, "corrections": 0}

    try:
        total = 0
        by_type = {}
        corrections = 0

        with open(FEEDBACK_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total += 1
                item_type = row.get("item_type", "unknown")
                by_type[item_type] = by_type.get(item_type, 0) + 1

                # Count where user disagreed with prediction
                orig = row.get("original_prediction", "")
                correct = row.get("correct_label", "")
                if orig and correct:
                    try:
                        if str(orig).lower() in ('true', '1') and int(correct) == 0:
                            corrections += 1
                        elif str(orig).lower() in ('false', '0') and int(correct) == 1:
                            corrections += 1
                    except (ValueError, TypeError):
                        pass

        return {
            "total": total,
            "by_type": by_type,
            "corrections": corrections,
            "file": str(FEEDBACK_FILE)
        }

    except Exception as e:
        logger.error(f"Failed to read feedback stats: {e}")
        return {"total": 0, "by_type": {}, "corrections": 0, "error": str(e)}
