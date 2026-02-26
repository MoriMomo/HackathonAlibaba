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
