from datetime import datetime, timedelta

def get_ist_now() -> datetime:
    """Return current Indian Standard Time (UTC+5:30) for display and statistics."""
    return datetime.utcnow() + timedelta(hours=5, minutes=30)
