import json

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.models.risk_log import RiskAssessmentLog
from app.schemas.risk import RiskRequest, RiskResponse
from app.services.explanation import ExplanationService
from app.services.risk_engine import RiskEngineService

router = APIRouter(prefix="/risk", tags=["risk"])
engine_service = RiskEngineService()
explanation_service = ExplanationService()


def _persist_log(payload: dict) -> None:
    db = SessionLocal()
    try:
        record = RiskAssessmentLog(**payload)
        db.add(record)
        db.commit()
    finally:
        db.close()


@router.post("/score", response_model=RiskResponse)
def score_risk(
    request: RiskRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> RiskResponse:
    score, factors = engine_service.calculate_score(request)
    category = engine_service.get_category(score)
    recommendation = engine_service.get_recommendation(category)
    explanation = explanation_service.generate_explanation(score, category, factors, request)
    fraud_probability = min(max(score / 100.0, 0.0), 1.0)

    response = RiskResponse(
        user_id=request.user_id,
        risk_score=score,
        risk_category=category,
        fraud_probability=fraud_probability,
        explanation=explanation,
        recommendation=recommendation,
        factors=factors,
    )

    payload = {
        "user_id": request.user_id,
        "risk_score": score,
        "risk_category": category,
        "fraud_probability": fraud_probability,
        "explanation": explanation,
        "raw_features": json.dumps(request.model_dump(), ensure_ascii=True),
    }
    background_tasks.add_task(_persist_log, payload)

    return response
