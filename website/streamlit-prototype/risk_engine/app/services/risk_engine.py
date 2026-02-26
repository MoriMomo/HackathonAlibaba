from typing import List, Tuple

from app.schemas.risk import RiskFactor, RiskRequest


class RiskEngineService:
    def calculate_score(self, data: RiskRequest) -> Tuple[int, List[RiskFactor]]:
        score = 0
        factors: List[RiskFactor] = []

        if data.sync_delay_hours > 24:
            score += 40
            factors.append(
                RiskFactor(
                    feature="sync_delay_hours",
                    weight=1.5,
                    delta=40,
                    description="Long sync delay increases offline exposure.",
                )
            )
        elif data.sync_delay_hours > 8:
            score += 20
            factors.append(
                RiskFactor(
                    feature="sync_delay_hours",
                    weight=1.0,
                    delta=20,
                    description="Moderate sync delay observed.",
                )
            )

        if data.offline_tx_count > 5:
            score += 25
            factors.append(
                RiskFactor(
                    feature="offline_tx_count",
                    weight=1.2,
                    delta=25,
                    description="High offline transaction count.",
                )
            )
        elif data.offline_tx_count > 0:
            score += 10
            factors.append(
                RiskFactor(
                    feature="offline_tx_count",
                    weight=0.6,
                    delta=10,
                    description="Some offline activity detected.",
                )
            )

        if data.max_tx_amount > 500:
            score += 20
            factors.append(
                RiskFactor(
                    feature="max_tx_amount",
                    weight=0.8,
                    delta=20,
                    description="High maximum transaction value.",
                )
            )

        if data.avg_tx_amount > 200:
            score += 10
            factors.append(
                RiskFactor(
                    feature="avg_tx_amount",
                    weight=0.5,
                    delta=10,
                    description="Elevated average transaction amount.",
                )
            )

        if data.merchant_count <= 1:
            score += 5
            factors.append(
                RiskFactor(
                    feature="merchant_count",
                    weight=0.3,
                    delta=5,
                    description="Low merchant diversity increases risk concentration.",
                )
            )

        if data.device_change_flag:
            score += 15
            factors.append(
                RiskFactor(
                    feature="device_change_flag",
                    weight=1.0,
                    delta=15,
                    description="Device change detected.",
                )
            )

        if data.location_change_flag:
            score += 15
            factors.append(
                RiskFactor(
                    feature="location_change_flag",
                    weight=1.0,
                    delta=15,
                    description="Location change detected.",
                )
            )

        if data.time_between_txs_avg < 1:
            score += 10
            factors.append(
                RiskFactor(
                    feature="time_between_txs_avg",
                    weight=0.7,
                    delta=10,
                    description="High transaction velocity.",
                )
            )

        score = min(score, 100)
        return score, factors

    def get_category(self, score: int) -> str:
        if score >= 80:
            return "CRITICAL"
        if score >= 60:
            return "HIGH"
        if score >= 35:
            return "MEDIUM"
        return "LOW"

    def get_recommendation(self, category: str) -> str:
        mapping = {
            "CRITICAL": "Block and investigate immediately.",
            "HIGH": "Hold funds and request manual review.",
            "MEDIUM": "Allow with additional verification.",
            "LOW": "Auto-approve with standard monitoring.",
        }
        return mapping.get(category, "Review policy required.")
