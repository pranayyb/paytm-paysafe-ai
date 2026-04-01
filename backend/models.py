from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime(timezone=True), default=func.now())
    is_merchant = Column(Boolean, default=False)
    has_disputes = Column(Boolean, default=False)

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String, unique=True, index=True)
    name = Column(String)
    category = Column(String)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), default=func.now())
    complaint_count = Column(Integer, default=0)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    sender_upi_id = Column(String, index=True)
    receiver_upi_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now())
    is_fraud = Column(Boolean, default=False)
    fraud_pattern = Column(String, nullable=True) # e.g. 'electricity_scam'
    status = Column(String, default="SUCCESS")
