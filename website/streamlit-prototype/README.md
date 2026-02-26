# Streamlit Prototype

This folder contains a hackathon-ready Streamlit prototype that simulates an offline-first payment flow with a lightweight AI risk engine.

## Quick start

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

## What it demonstrates

- Offline mode that queues transactions locally
- A sync flow that runs a simple risk engine
- Merchant dashboard with color-coded statuses
- AI console with risk explanations and mock API logs
- System logs view for mocked PayLabs and cloud events

## Files

- app.py: Streamlit UI and flow
- database.py: JSON persistence helpers
- data/transactions.json: Local storage (created at runtime)
