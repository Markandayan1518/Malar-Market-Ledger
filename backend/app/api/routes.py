"""Complete API routes for all modules."""

from fastapi import APIRouter

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
    system_settings,
    whatsapp
)

# Create a single router that includes all routes
router = APIRouter()

# Include all module routers
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(farmers.router)
router.include_router(flower_types.router)
router.include_router(time_slots.router)
router.include_router(market_rates.router)
router.include_router(daily_entries.router)
router.include_router(cash_advances.router)
router.include_router(settlements.router)
router.include_router(reports.router)
router.include_router(notifications.router)
router.include_router(system_settings.router)
router.include_router(whatsapp.router)
