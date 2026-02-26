from fastapi import FastAPI


def create_demo_app() -> FastAPI:
    app = FastAPI(title="Risk Engine Demo")

    @app.get("/")
    def health() -> dict:
        return {"status": "ok", "service": "risk-engine-demo"}

    @app.get("/risk")
    def quick_risk(age: int, income: float) -> dict:
        score = 0
        if age < 21:
            score += 20
        if income < 2000:
            score += 30
        decision = "FLAGGED" if score >= 50 else "APPROVED"
        return {"risk_score": score, "decision": decision}

    return app


app = create_demo_app()
