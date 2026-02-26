from typing import List

from pydantic import BaseModel, Field


class RiskRequest(BaseModel):
    user_id: str
    offline_wallet_amount: float = Field(..., ge=0)
    offline_tx_count: int = Field(..., ge=0)
    avg_tx_amount: float = Field(..., ge=0)
    max_tx_amount: float = Field(..., ge=0)
    sync_delay_hours: float = Field(..., ge=0)
    merchant_count: int = Field(..., ge=0)
    device_change_flag: bool
    location_change_flag: bool
    time_between_txs_avg: float = Field(..., ge=0)


class RiskFactor(BaseModel):
    feature: str
    weight: float
    delta: int
    description: str


class RiskResponse(BaseModel):
    user_id: str
    risk_score: int
    risk_category: str
    fraud_probability: float
    explanation: str
    recommendation: str
    factors: List[RiskFactor]
