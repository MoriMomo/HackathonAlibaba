from __future__ import annotations

import datetime as dt
import os
from typing import Any, Dict, List, Optional

import pandas as pd
import plotly.express as px
import requests
import streamlit as st

from database import load_transactions, next_id, save_transaction, update_transactions

RISK_ENGINE_URL = os.getenv("RISK_ENGINE_URL", "http://localhost:8000")


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


def _parse_time(value: Any) -> Optional[dt.datetime]:
    if not value:
        return None
    if isinstance(value, dt.datetime):
        return value
    try:
        return dt.datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _time_between_txs_avg(transactions: List[Dict[str, Any]]) -> float:
    times = [
        _parse_time(t.get("time"))
        for t in transactions
        if t.get("time") is not None
    ]
    times = [t for t in times if t]
    if len(times) < 2:
        return 0.0
    times.sort()
    deltas = [
        (times[i] - times[i - 1]).total_seconds() / 3600.0
        for i in range(1, len(times))
    ]
    return sum(deltas) / len(deltas)


def _build_risk_request(txn: Dict[str, Any], transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    now = dt.datetime.now()
    txn_time = _parse_time(txn.get("time")) or now
    pending = [t for t in transactions if t.get("status") == "OFFLINE_PENDING"]
    offline_wallet_amount = sum(float(t.get("amount") or 0) for t in pending)
    offline_tx_count = len(pending) if pending else 0
    amounts = [float(t.get("amount") or 0) for t in transactions] + [float(txn.get("amount") or 0)]
    avg_tx_amount = sum(amounts) / len(amounts) if amounts else 0.0
    max_tx_amount = max(amounts) if amounts else 0.0
    sync_delay_hours = max(0.0, (now - txn_time).total_seconds() / 3600.0)
    merchant_count = len({t.get("merchant") for t in transactions if t.get("merchant")}) or 1
    location_change_flag = (
        str(txn.get("user_location") or "").strip().lower()
        != str(txn.get("merchant_location") or "").strip().lower()
    )

    user_id = txn.get("user_id") or txn.get("merchant") or "unknown"
    return {
        "user_id": str(user_id),
        "offline_wallet_amount": float(offline_wallet_amount),
        "offline_tx_count": int(offline_tx_count),
        "avg_tx_amount": float(avg_tx_amount),
        "max_tx_amount": float(max_tx_amount),
        "sync_delay_hours": float(sync_delay_hours),
        "merchant_count": int(merchant_count),
        "device_change_flag": False,
        "location_change_flag": bool(location_change_flag),
        "time_between_txs_avg": float(_time_between_txs_avg(transactions)),
    }


def _call_risk_engine(payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{RISK_ENGINE_URL.rstrip('/')}/risk/score"
    response = requests.post(url, json=payload, timeout=3)
    response.raise_for_status()
    return response.json()


def _evaluate_risk(txn: Dict[str, Any], transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    payload = _build_risk_request(txn, transactions)
    try:
        data = _call_risk_engine(payload)
        factors = data.get("factors") or []
        reasons = [f.get("description") or f.get("feature") or "" for f in factors if f]
        return {
            "score": int(data.get("risk_score") or 0),
            "category": str(data.get("risk_category") or "LOW"),
            "explanation": str(data.get("explanation") or ""),
            "reasons": reasons,
            "source": "risk_engine",
        }
    except requests.RequestException as exc:
        result = edgeguard_ai(txn)
        return {
            "score": int(result.get("score") or 0),
            "category": "HIGH" if result.get("decision") == "FLAGGED" else "LOW",
            "explanation": "Fallback heuristic used due to risk engine error.",
            "reasons": result.get("reasons") or [str(exc)],
            "source": "fallback",
        }


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
                result = _evaluate_risk(txn, transactions)
                txn["ai_score"] = result["score"]
                txn["ai_reasons"] = result["reasons"]
                txn["ai_explanation"] = result["explanation"]
                txn["status"] = (
                    "FLAGGED" if result["category"] in {"HIGH", "CRITICAL"} else "SETTLED"
                )
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
                    result = _evaluate_risk(txn, transactions)
                    txn["ai_score"] = result["score"]
                    txn["ai_reasons"] = result["reasons"]
                    txn["ai_explanation"] = result["explanation"]
                    txn["status"] = (
                        "FLAGGED" if result["category"] in {"HIGH", "CRITICAL"} else "SETTLED"
                    )
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
            explanation = txn.get("ai_explanation")
            if explanation:
                st.write("Explanation: " + str(explanation))
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
        st.text("\n".join(reversed(log[-50:])))
    else:
        st.info("No log entries yet.")

    if st.button("Clear logs"):
        st.session_state.paylabs_log = []
        st.rerun()
