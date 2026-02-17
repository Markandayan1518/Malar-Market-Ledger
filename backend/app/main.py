"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db, init_db, close_db
from app.core.auth import verify_token
from app.dependencies import get_current_user
from app.schemas.common import create_error_response, ErrorResponse
from app.api import auth, users, farmers, flower_types, time_slots, market_rates, daily_entries, cash_advances, settlements, reports, notifications, system_settings, invoices, business_profile

settings = get_settings()


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Malar Market Digital Ledger API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


# Trusted host middleware for development
if settings.environment == "development":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await init_db()
    print(f"{settings.app_name} v{settings.app_version} started")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown."""
    await close_db()
    print(f"{settings.app_name} v{settings.app_version} stopped")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    error_response = create_error_response(
        message=str(exc),
        code="INTERNAL_SERVER_ERROR"
    )
    return JSONResponse(
        status_code=500,
        content=error_response.model_dump()
    )


# Include all API routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(farmers.router, prefix="/api/v1/farmers", tags=["Farmers"])
app.include_router(flower_types.router, prefix="/api/v1/flower-types", tags=["Flower Types"])
app.include_router(time_slots.router, prefix="/api/v1/time-slots", tags=["Time Slots"])
app.include_router(market_rates.router, prefix="/api/v1/market-rates", tags=["Market Rates"])
app.include_router(daily_entries.router, prefix="/api/v1/daily-entries", tags=["Daily Entries"])
app.include_router(cash_advances.router, prefix="/api/v1/cash-advances", tags=["Cash Advances"])
app.include_router(settlements.router, prefix="/api/v1/settlements", tags=["Settlements"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(system_settings.router, prefix="/api/v1/system-settings", tags=["System Settings"])
app.include_router(invoices.router, prefix="/api/v1", tags=["Invoices"])
app.include_router(business_profile.router, prefix="/api/v1", tags=["Business Profile"])


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level=settings.log_level.lower()
    )
