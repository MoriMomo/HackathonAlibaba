from app.config import settings
from app.schemas.risk import RiskFactor, RiskRequest


class ExplanationService:
    def generate_explanation(
        self,
        score: int,
        category: str,
        factors: list[RiskFactor],
        request: RiskRequest,
    ) -> str:
        if settings.LLM_MOCK_MODE:
            return self._template_explanation(score, category, factors, request)
        return self._llm_api_call(score, category, factors, request)

    def _template_explanation(
        self,
        score: int,
        category: str,
        factors: list[RiskFactor],
        request: RiskRequest,
    ) -> str:
        reasons = "; ".join(f.description for f in factors) or "No significant risk signals."
        return (
            f"Risk score {score} categorized as {category}. "
            f"Key signals: {reasons} "
            f"Offline wallet amount is {request.offline_wallet_amount:.2f}."
        )

    def _llm_api_call(
        self,
        score: int,
        category: str,
        factors: list[RiskFactor],
        request: RiskRequest,
    ) -> str:
        return (
            "LLM integration disabled. Enable LLM_MOCK_MODE or implement provider call."
        )
