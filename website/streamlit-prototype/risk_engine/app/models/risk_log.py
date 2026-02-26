import datetime as dt

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class RiskAssessmentLog(Base):
    __tablename__ = "risk_assessment_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), index=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_category = Column(String(32), nullable=False)
    fraud_probability = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    raw_features = Column(Text, nullable=False)
