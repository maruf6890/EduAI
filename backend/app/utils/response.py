"""Utility helpers for building consistent JSON responses."""

from typing import Any


def success(data: Any = None, message: str = "Success") -> dict:
    return {"status": "success", "message": message, "data": data}


def error(message: str, code: int = 400) -> dict:
    return {"status": "error", "message": message, "code": code}
