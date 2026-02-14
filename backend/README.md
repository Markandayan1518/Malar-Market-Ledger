# Malar Market Digital Ledger - Backend API

Production-ready FastAPI backend for the Malar Market Digital Ledger system.

## Features

- **Authentication**: JWT-based authentication with access tokens (15 min) and refresh tokens (7 days)
- **Role-Based Access Control**: Admin, Staff, and Farmer roles with appropriate permissions
- **Database**: PostgreSQL with SQLAlchemy ORM, 12 tables with proper relationships
- **Time-Based Pricing**: Automatic rate application based on entry time slots
- **Settlement Engine**: Complex financial calculations with commission, fees, and advances
- **Offline Sync**: Conflict resolution for offline-first operations
- **Audit Logging**: Comprehensive security and operation logging
- **WhatsApp Notifications**: Queue-based notification system
- **40+ API Endpoints**: Complete RESTful API covering all modules

## Tech Stack

- **Backend**: FastAPI 0.109.0 (Python 3.11+)
- **Database**: PostgreSQL via asyncpg driver
- **ORM**: SQLAlchemy 2.0.25 with async support
- **Authentication**: JWT with python-jose, bcrypt password hashing
- **Caching**: Redis for session storage and rate limiting
- **Validation**: Pydantic v2 for request/response validation
- **API Standards**: RESTful over HTTPS, JSON format, lower_snake_case, ISO 8601 dates

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management with Pydantic Settings
│   ├── database.py             # Database connection and session management
│   ├── dependencies.py          # Dependency injection for routes
│   ├── models/                 # SQLAlchemy ORM models (12 tables)
│   │   ├── user.py
│   │   ├── farmer.py
│   │   ├── flower_type.py
│   │   ├── time_slot.py
│   │   ├── market_rate.py
│   │   ├── daily_entry.py
│   │   ├── cash_advance.py
│   │   ├── settlement.py
│   │   ├── notification.py
│   │   ├── security_log.py
│   │   ├── system_setting.py
│   │   └── whatsapp_log.py
│   ├── schemas/                # Pydantic schemas for validation
│   │   ├── __init__.py
│   │   ├── common.py              # Common response wrappers
│   │   └── all_schemas.py         # All model schemas
│   ├── api/                    # API route handlers
│   │   ├── __init__.py
│   │   ├── routes.py               # Main router with all routes
│   │   ├── auth.py                # Authentication endpoints
│   │   ├── users.py               # User management endpoints
│   │   ├── farmers.py             # Farmer management endpoints
│   │   ├── flower_types.py         # Flower type endpoints
│   │   ├── time_slots.py          # Time slot endpoints
│   │   ├── market_rates.py         # Market rate endpoints
│   │   ├── daily_entries.py        # Daily entry endpoints
│   │   ├── cash_advances.py        # Cash advance endpoints
│   │   ├── settlements.py          # Settlement endpoints
│   │   ├── reports.py             # Report endpoints
│   │   ├── notifications.py        # Notification endpoints
│   │   └── system_settings.py     # System settings endpoints
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── audit_service.py        # Audit logging service
│   │   ├── pricing_service.py     # Time-based pricing engine
│   │   ├── settlement_service.py  # Settlement calculation engine
│   │   ├── notification_service.py # WhatsApp notification service
│   │   └── offline_sync_service.py # Offline sync service
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   └── auth.py                # JWT authentication utilities
│   ├── utils/                  # Utility functions
│   │       └── __init__.py
│   ├── tests/                  # Test suite
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example             # Environment variables template
│   └── Dockerfile              # Docker configuration
│   └── docker-compose.yml      # Docker Compose configuration
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_main.py
```

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- PostgreSQL 14 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository** (if applicable)
2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration values
   ```

6. **Run database migrations** (if using Alembic):
   ```bash
   # Initialize Alembic (first time only)
   alembic init alembic/
   
   # Create migration
   alembic revision --autogenerate -m "Initial migration"
   ```

7. **Start the development server**:
   ```bash
   # Using uvicorn directly
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   
   # Or using the run script (if created)
   python -m uvicorn app.main:app
   ```

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Application
APP_NAME=Malar Market Digital Ledger
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/malar_market_ledger
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Authentication
SECRET_KEY=your-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
CORS_ALLOW_CREDENTIALS=True
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000
RATE_LIMIT_PER_MINUTE_ANONYMOUS=100

# WhatsApp API
WHATSAPP_PROVIDER=twilio
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_API_SECRET=your-whatsapp-api-secret
WHATSAPP_PHONE_NUMBER=+919876543210
WHATSAPP_FROM_NUMBER=+919876543210

# System Settings
DEFAULT_COMMISSION_RATE=5.0
MARKET_OPEN_TIME=04:00:00
MARKET_CLOSE_TIME=18:00:00

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# File Upload
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_TYPES=["image/jpeg","image/png","application/pdf"]
```

### Running the Application

The API will be available at:
- Development: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Initiate password reset
- `POST /api/v1/auth/reset-password` - Reset password

#### Users
- `GET /api/v1/users` - List all users (Admin only)
- `GET /api/v1/users/{user_id}` - Get user by ID
- `POST /api/v1/users` - Create user (Admin only)
- `PUT /api/v1/users/{user_id}` - Update user (Admin or own user)
- `DELETE /api/v1/users/{user_id}` - Soft delete user (Admin only)

#### Farmers
- `GET /api/v1/farmers` - List all farmers
- `GET /api/v1/farmers/{farmer_id}` - Get farmer by ID
- `GET /api/v1/farmers/{farmer_id}/balance` - Get farmer balance
- `POST /api/v1/farmers` - Create farmer (Admin only)
- `PUT /api/v1/farmers/{farmer_id}` - Update farmer (Admin only)

#### Flower Types
- `GET /api/v1/flower-types` - List all flower types
- `GET /api/v1/flower-types/{flower_type_id}` - Get flower type by ID

#### Time Slots
- `GET /api/v1/time-slots` - List all time slots

#### Market Rates
- `GET /api/v1/market-rates` - List all market rates
- `GET /api/v1/market-rates/current` - Get current applicable rate
- `POST /api/v1/market-rates` - Create market rate (Admin only)

#### Daily Entries
- `GET /api/v1/daily-entries` - List all daily entries
- `GET /api/v1/daily-entries/{entry_id}` - Get daily entry by ID
- `POST /api/v1/daily-entries` - Create daily entry
- `PUT /api/v1/daily-entries/{entry_id}` - Update daily entry
- `DELETE /api/v1/daily-entries/{entry_id}` - Soft delete daily entry

#### Cash Advances
- `GET /api/v1/cash-advances` - List all cash advances
- `POST /api/v1/cash-advances` - Create cash advance
- `PUT /api/v1/cash-advances/{advance_id}/approve` - Approve cash advance (Admin only)
- `PUT /api/v1/cash-advances/{advance_id}/reject` - Reject cash advance (Admin only)

#### Settlements
- `GET /api/v1/settlements` - List all settlements
- `GET /api/v1/settlements/{settlement_id}` - Get settlement by ID
- `POST /api/v1/settlements/generate` - Generate settlement
- `PUT /api/v1/settlements/{settlement_id}/approve` - Approve settlement
- `PUT /api/v1/settlements/{settlement_id}/mark-paid` - Mark settlement as paid (Admin only)

#### Reports
- `GET /api/v1/reports/daily-summary` - Daily summary report
- `GET /api/v1/reports/farmer-summary` - Farmer summary report

#### Notifications
- `GET /api/v1/notifications` - List notifications for current user
- `PUT /api/v1/notifications/{notification_id}/mark-read` - Mark notification as read

#### System Settings
- `GET /api/v1/system-settings` - List system settings
- `PUT /api/v1/system-settings/{key}` - Update system setting (Admin only)

#### Health
- `GET /health` - Health check endpoint

### API Response Format

All API responses follow a standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ]
  }
}
```

**Paginated List Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 100,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  }
}
```

### Key Features

1. **JWT Authentication**: Access tokens expire in 15 minutes, refresh tokens in 7 days
2. **Time-Based Pricing**: Automatic rate determination based on entry time
3. **Settlement Engine**: Complex formula: `weight × rate - commission - fees - advances`
4. **Role-Based Access Control**: Staff cannot access Settlements or Rates modules
5. **Audit Logging**: All write operations logged to security_logs table
6. **Offline Sync**: Conflict resolution with last-write-wins strategy
7. **WhatsApp Notifications**: Queue-based system for farmer notifications

### Database Schema

12 tables with proper relationships:
- users
- farmers
- flower_types
- time_slots
- market_rates
- daily_entries
- cash_advances
- settlements
- settlement_items
- notifications
- security_logs
- system_settings
- whatsapp_logs

### Security Features

- Password hashing with bcrypt
- JWT token validation
- Role-based access control
- CORS configuration
- Rate limiting (1000 requests/minute for authenticated, 100 for anonymous)
- SQL injection prevention via ORM
- Comprehensive audit logging

### Development

- Hot reload enabled for development
- Comprehensive error handling
- Structured logging with JSON format
- Automatic OpenAPI documentation at `/docs`

### Testing

Run tests with pytest:
```bash
pytest tests/
```

### Docker Support

Docker configuration included for local development:
```bash
docker-compose up
```

## API Standards

- **RESTful**: Resource-based URLs with appropriate HTTP methods
- **JSON Format**: All requests and responses in JSON
- **Naming Convention**: lower_snake_case for fields, kebab-case for URLs
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
- **Pagination**: Consistent pagination across all list endpoints
- **Error Handling**: Standardized error responses with codes
- **Versioning**: URL path versioning (/api/v1/)

## License

This project is part of the Malar Market Digital Ledger system.

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
