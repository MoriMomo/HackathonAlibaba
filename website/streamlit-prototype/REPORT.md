# Streamlit Prototype Full Report

Date: 2026-02-26

## Scope
This report covers the entire workspace root as requested. The only project present is the Streamlit prototype under `streamlit-prototype/`.

## Project Summary
A hackathon-ready Streamlit app simulates an offline-first payment flow with a lightweight AI risk engine, merchant dashboard, and system logs. Transactions are stored in a local JSON file under `data/transactions.json`.

## Directory Inventory
```
streamlit-prototype/
  .gitignore
  app.py
  database.py
  README.md
  requirements.txt
  data/
    transactions.json
  __pycache__/
    app.cpython-313.pyc
    database.cpython-313.pyc
```

Notes:
- `__pycache__/` contains Python bytecode files (binary). Contents are not reproduced.

## How To Run (from README)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

## Dependencies
From `requirements.txt`:
- streamlit
- pandas
- numpy
- plotly

## File Contents

### .gitignore
```ignore
# local data
/data/transactions.json
```

### app.py
```python
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List

import pandas as pd
import plotly.express as px
import streamlit as st

from database import load_transactions, next_id, save_transaction, update_transactions


def edgeguard_ai(txn: Dict[str, Any]) -> Dict[str, Any]:
    score = 0
    reasons: List[str] = []

    amount = float(txn["amount"])
    user_location = str(txn["user_location"]).strip().lower()
    merchant_location = str(txn["merchant_location"]).strip().lower()
    hour = int(txn["local_hour"])

    if amount > 500:
        score += 50
        reasons.append("High value transaction")

    if user_location and merchant_location and user_location != merchant_location:
        score += 30
        reasons.append("Location mismatch")

    if hour < 6 or hour > 22:
        score += 20
        reasons.append("Unusual time of day")

    decision = "APPROVED" if score < 50 else "FLAGGED"
    return {"score": score, "decision": decision, "reasons": reasons}


def _append_log(service: str, endpoint: str, status: str, message: str) -> None:
    if "paylabs_log" not in st.session_state:
        st.session_state.paylabs_log = []
    ts = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"{ts} | {service} | {endpoint} | {status} | {message}"
    st.session_state.paylabs_log.append(entry)


def _status_color(val: str) -> str:
    if val == "FLAGGED":
        return "background-color: #ffcccb"
    if val in {"SETTLED", "LIVE_APPROVED"}:
        return "background-color: #90ee90"
    return "background-color: #ffe4b5"


st.set_page_config(layout="wide", page_title="EdgePay and EdgeGuard")
st.title("EdgePay and EdgeGuard prototype")

st.markdown(
    """
    <style>
    .metric-card {background-color: #f0f2f6; padding: 16px; border-radius: 10px; border-left: 4px solid #0068c9;}
    .status-approved {color: #1a7f37; font-weight: 600;}
    .status-flagged {color: #b42318; font-weight: 600;}
    .status-pending {color: #b54708; font-weight: 600;}
    </style>
    """,
    unsafe_allow_html=True,
)

menu = [
    "User Wallet (Offline)",
    "Merchant Dashboard",
    "EdgeGuard AI Console",
    "System Logs",
]
choice = st.sidebar.selectbox("Select view", menu)
st.sidebar.markdown("---")
st.sidebar.info("Hackathon MVP v1.0\n\nPowered by Alibaba Cloud architecture")

transactions = load_transactions()

if "is_offline" not in st.session_state:
    st.session_state.is_offline = False


if choice == "User Wallet (Offline)":
    st.header("User Wallet")
    st.session_state.is_offline = st.toggle("Simulate offline mode", value=st.session_state.is_offline)

    if st.session_state.is_offline:
        st.warning("Offline mode enabled. Transactions will be stored locally.")

    col1, col2 = st.columns(2)

    with col1:
        with st.form("pay_form", clear_on_submit=True):
            amount = st.number_input("Amount", min_value=1.0, value=50.0, step=1.0)
            merchant_id = st.text_input("Merchant ID", "MERCHANT_001")
            user_location = st.text_input("User location", "Jakarta")
            merchant_location = st.text_input("Merchant location", "Jakarta")
            time_value = st.time_input("Local time", value=dt.datetime.now().time())

            submitted = st.form_submit_button("Pay now")

        if submitted:
            txn: Dict[str, Any] = {
                "id": next_id(transactions),
                "time": dt.datetime.now().isoformat(timespec="seconds"),
                "amount": float(amount),
                "merchant": merchant_id.strip(),
                "user_location": user_location.strip(),
                "merchant_location": merchant_location.strip(),
                "local_hour": int(time_value.hour),
                "status": "OFFLINE_PENDING" if st.session_state.is_offline else "LIVE_APPROVED",
                "ai_score": None,
                "ai_reasons": [],
            }

            if st.session_state.is_offline:
                save_transaction(txn)
                _append_log("EdgePay Device", "Local Sign", "SUCCESS", "Stored offline transaction")
                st.success("Payment stored locally (offline)")
            else:
                result = edgeguard_ai(txn)
                txn["ai_score"] = result["score"]
                txn["ai_reasons"] = result["reasons"]
                txn["status"] = "SETTLED" if result["decision"] == "APPROVED" else "FLAGGED"
                save_transaction(txn)
                _append_log("PayLabs", "/v1/settle", "200 OK", "Live settlement")
                st.success("Payment processed (online)")

            transactions = load_transactions()

    with col2:
        st.subheader("Local pending queue")
        pending = [t for t in transactions if t.get("status") == "OFFLINE_PENDING"]
        st.dataframe(pd.DataFrame(pending))

        if not st.session_state.is_offline and pending:
            if st.button("Sync and verify"):
                for txn in pending:
                    result = edgeguard_ai(txn)
                    txn["ai_score"] = result["score"]
                    txn["ai_reasons"] = result["reasons"]
                    txn["status"] = "SETTLED" if result["decision"] == "APPROVED" else "FLAGGED"
                    _append_log("PayLabs", "/v1/settle", "200 OK", "Batch settlement")

                update_transactions(transactions)
                st.success("Sync complete. Check merchant dashboard.")


elif choice == "Merchant Dashboard":
    st.header("Merchant settlement dashboard")
    df = pd.DataFrame(transactions)

    if not df.empty:
        if "status" in df.columns:
            status_totals = (
                df.groupby("status", as_index=False)["amount"].sum().sort_values("amount", ascending=False)
            )
            if not status_totals.empty:
                fig = px.bar(
                    status_totals,
                    x="status",
                    y="amount",
                    color="status",
                    title="Volume by status",
                )
                fig.update_layout(height=320, margin=dict(l=10, r=10, t=40, b=10))
                st.plotly_chart(fig, use_container_width=True)
            st.dataframe(df.style.applymap(_status_color, subset=["status"]))
        else:
            st.dataframe(df)
    else:
        st.info("No transactions yet.")


elif choice == "EdgeGuard AI Console":
    st.header("EdgeGuard risk engine")

    flagged = [t for t in transactions if t.get("status") == "FLAGGED"]
    flagged_score_total = sum(int(t.get("ai_score") or 0) for t in flagged)

    col1, col2 = st.columns(2)
    col1.metric("Flagged transactions", len(flagged))
    col2.metric("Total risk exposure reduced", flagged_score_total)

    if flagged:
        for txn in flagged:
            st.error(f"Transaction #{txn.get('id')} flagged")
            st.write(f"Risk score: {txn.get('ai_score')}")
            reasons = txn.get("ai_reasons") or []
            if reasons:
                st.write("Reasons: " + ", ".join(reasons))
            st.info("Action: funds held in PayLabs vault")
    else:
        st.success("All transactions clear")

    st.subheader("PayLabs mock log")
    log = st.session_state.get("paylabs_log", [])
    if log:
        st.text("\n".join(log[-25:]))
    else:
        st.write("No log entries yet")


elif choice == "System Logs":
    st.header("System API logs")
    st.write("Simulated logs for PayLabs gateway and Alibaba Cloud services.")

    log = st.session_state.get("paylabs_log", [])
    if log:
        st.text("\n".join(reversed(log[-50:]))
    else:
        st.info("No log entries yet.")

    if st.button("Clear logs"):
        st.session_state.paylabs_log = []
        st.rerun()
```

### database.py
```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_FILE = DATA_DIR / "transactions.json"


def _ensure_data_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def load_transactions() -> List[Dict[str, Any]]:
    _ensure_data_file()
    raw = DATA_FILE.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    return json.loads(raw)


def save_transaction(txn: Dict[str, Any]) -> List[Dict[str, Any]]:
    txns = load_transactions()
    txns.append(txn)
    update_transactions(txns)
    return txns


def update_transactions(txns: List[Dict[str, Any]]) -> None:
    _ensure_data_file()
    DATA_FILE.write_text(json.dumps(txns, indent=2, ensure_ascii=True), encoding="utf-8")


def next_id(txns: List[Dict[str, Any]]) -> int:
    if not txns:
        return 1
    return max(int(t.get("id", 0)) for t in txns) + 1
```

### README.md
````markdown
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
````

### requirements.txt
```pip-requirements
streamlit
pandas
numpy
plotly
```

## Data File Summary

### data/transactions.json
Summary only (contents not reproduced):
- Records: 1
- Fields: id, time, amount, merchant, user_location, merchant_location, local_hour, status, ai_score, ai_reasons
- Status counts: FLAGGED = 1
- Total amount: 50000.0
- Time range: 2026-02-26T15:31:55 to 2026-02-26T15:31:55
