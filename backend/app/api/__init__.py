"""API routes module."""

from app.api import (
    auth,
    users,
    farmers,
    flower_types,
    time_slots,
    market_rates,
    daily_entries,
    cash_advances,
    settlements,
    reports,
    notifications,
    system_settings
)

__all__ = [
    "auth",
    "users",
    "farmers",
    "flower_types",
    "time_slots",
    "market_rates",
    "daily_entries",
    "cash_advances",
    "settlements",
    "reports",
    "notifications",
    "system_settings"
]
