# AGENTS.md

This guide helps AI agents work effectively in the Malar Market Digital Ledger codebase.

## Project Overview

A hybrid Desktop/Tablet Progressive Web Application (PWA) for managing flower commission business operations with 50+ farmers. Built for offline-first operation during critical morning rush hours (4-9 AM).

### Architecture

- **Backend**: Python FastAPI with SQLAlchemy 2.0 (async), PostgreSQL, Redis
- **Frontend**: React + Vite PWA with TailwindCSS, i18next (bilingual: English/Tamil)
- **Key Features**: Offline-first PWA, WhatsApp bot integration, time-based pricing, bilingual support, PDF/Excel reports

---

## Essential Commands

### Quick Start (All Services)

```bash
# Start all services (backend + frontend)
./run.sh start

# Stop all services
./run.sh stop

# Check service status
./run.sh status

# View logs
./run.sh logs backend
./run.sh logs frontend

# Install all dependencies
./run.sh install
```

### Backend Commands

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (development)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run database migrations (if Alembic is set up)
alembic upgrade head
```

### Frontend Commands

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Docker Commands

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Seed Data

```bash
# Run all seed scripts
python scripts/seed/run_seed.py

# Run individual seed scripts
python scripts/seed/seed_users.py
python scripts/seed/seed_farmers.py
python scripts/seed/seed_flower_types.py
python scripts/seed/seed_time_slots.py
python scripts/seed/seed_market_rates.py
python scripts/seed/seed_daily_entries.py
python scripts/seed/seed_cash_advances.py
python scripts/seed/seed_settlements.py
```

---

## Code Organization

### Backend Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Pydantic settings configuration
│   ├── database.py          # Database connection and session management
│   ├── dependencies.py      # Dependency injection (auth, pagination, etc.)
│   ├── api/                 # API route handlers
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── farmers.py
│   │   ├── daily_entries.py
│   │   ├── cash_advances.py
│   │   ├── settlements.py
│   │   ├── reports.py
│   │   └── ...
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── farmer.py
│   │   ├── daily_entry.py
│   │   └── ...
│   ├── schemas/             # Pydantic schemas for validation
│   │   ├── common.py
│   │   └── all_schemas.py
│   ├── services/            # Business logic layer
│   │   ├── audit_service.py
│   │   ├── whatsapp_service.py
│   │   ├── pdf_service.py
│   │   ├── excel_service.py
│   │   └── ...
│   └── core/                # Core utilities
│       └── auth.py         # JWT authentication utilities
├── requirements.txt         # Python dependencies
├── Dockerfile             # Backend Docker image
└── .env.example           # Environment variables template
```

### Frontend Structure

```
frontend/
├── src/
│   ├── App.jsx                   # Main app component with routing
│   ├── main.jsx                  # Application entry point
│   ├── components/               # Reusable components
│   │   ├── data/                # Data display components (DataTable, Card, Badge)
│   │   ├── entry/               # Daily entry components (EntryGrid, EntryRow)
│   │   ├── forms/               # Form components (Input, Select, DatePicker)
│   │   ├── feedback/            # Feedback components (Toast, Modal, LoadingSpinner)
│   │   └── layout/              # Layout components (Header, Sidebar, Footer)
│   ├── pages/                    # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DailyEntryPage.jsx
│   │   ├── FarmersPage.jsx
│   │   └── ...
│   ├── services/                 # API service layer
│   │   ├── api.js               # Axios instance configuration
│   │   ├── authService.js
│   │   ├── farmerService.js
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   │   ├── useApi.js
│   │   ├── useFarmers.js
│   │   ├── useDebounce.js
│   │   └── ...
│   ├── context/                  # React context providers
│   │   ├── AuthContext.jsx
│   │   ├── OfflineContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── utils/                    # Utility functions
│   │   ├── currencyUtils.js
│   │   ├── dateUtils.js
│   │   ├── validation.js
│   │   └── ...
│   ├── store/                    # State management (IndexedDB)
│   │   └── offlineStore.js
│   └── i18n/                     # Internationalization
│       ├── i18n.js
│       ├── en.json              # English translations
│       └── ta.json              # Tamil translations
├── package.json                 # Node.js dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # TailwindCSS configuration
└── Dockerfile.dev             # Frontend development Docker image
```

---

## Code Patterns & Conventions

### Backend Patterns

#### SQLAlchemy 2.0 Async Models

```python
"""Example: farmer.py"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    farmer_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    current_balance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.00)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    daily_entries = relationship("DailyEntry", back_populates="farmer", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Farmer(id={self.id}, code={self.farmer_code}, name={self.name})>"
```

#### API Route Pattern

```python
"""Example: farmers.py"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import CurrentStaffOrAdminUser, DatabaseSession
from app.models.farmer import Farmer

router = APIRouter(tags=["Farmers"])

@router.get("/")
async def list_farmers(
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """List all farmers with soft-delete filter."""
    result = await db.execute(select(Farmer).where(Farmer.deleted_at == None))
    farmers = result.scalars().all()
    return {"farmers": [{"id": f.id, "name": f.name, "phone": f.phone} for f in farmers]}

@router.get("/{farmer_id}")
async def get_farmer(
    farmer_id: str,
    db: DatabaseSession,
    current_user: CurrentStaffOrAdminUser
):
    """Get farmer by ID."""
    result = await db.execute(select(Farmer).where(Farmer.id == farmer_id))
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer
```

#### Dependency Injection Pattern

```python
"""Example: dependencies.py"""
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User, UserRole

# Type aliases for cleaner dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdminUser = Annotated[User, Depends(get_current_admin_user)]
CurrentStaffOrAdminUser = Annotated[User, Depends(get_current_staff_or_admin_user)]
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
```

#### Configuration Pattern

```python
"""Example: config.py"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    app_name: str = "Malar Market Digital Ledger"
    database_url: str
    secret_key: str
    debug: bool = False

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### Frontend Patterns

#### Component Pattern with Context

```jsx
// Example: DataTable.jsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const DataTable = ({ columns = [], data = [], loading = false, sortable = true, searchable = false }) => {
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm && searchable) {
      result = result.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (sortable && sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn.key];
        const bValue = b[sortColumn.key];
        if (aValue === bValue) return 0;
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns, searchable]);

  return (
    <div className="w-full">
      {loading && <div className="spinner" />}
      <table className="data-table">
        {/* Table content */}
      </table>
    </div>
  );
};

export default DataTable;
```

#### Service Layer Pattern

```javascript
// Example: farmerService.js
import api from './api';

export const farmerService = {
  async getAll() {
    const response = await api.get('/farmers');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/farmers/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/farmers', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/farmers/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/farmers/${id}`);
    return response.data;
  }
};
```

#### Custom Hook Pattern

```javascript
// Example: useFarmers.js
import { useState, useEffect } from 'react';
import { farmerService } from '../services';

export const useFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const data = await farmerService.getAll();
      setFarmers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { farmers, loading, error, refetch: fetchFarmers };
};
```

#### Context Provider Pattern

```jsx
// Example: AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      const { access_token, user: userData } = response;

      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Important Gotchas

### Backend Gotchas

1. **Async/Await Required**: All database operations use SQLAlchemy 2.0 async patterns. Always use `await` with database queries.

2. **Soft Delete Pattern**: Most models implement soft deletes with `deleted_at` timestamp. Always filter with `where(Model.deleted_at == None)` in queries.

3. **Type Aliases**: Use type aliases from `app.dependencies` for cleaner code:
   - `CurrentUser` instead of `User = Depends(get_current_user)`
   - `DatabaseSession` instead of `AsyncSession = Depends(get_db)`

4. **UUID Primary Keys**: Most models use string UUIDs as primary keys. Generate UUIDs when creating new records.

5. **Currency Values**: Store as `Numeric(10, 2)` with 2 decimal places. Use float values when creating or updating.

6. **Role-Based Access**: Use appropriate dependency injection for role checks:
   - `CurrentUser`: Any authenticated user
   - `CurrentStaffOrAdminUser`: Staff or Admin roles
   - `CurrentAdminUser`: Admin role only

7. **JWT Token Expiration**: Access tokens expire in 15 minutes, refresh tokens expire in 7 days.

8. **Environment Variables**: Configuration is loaded from `.env` file. Never commit `.env` or `.env.local` files.

### Frontend Gotchas

1. **Translation Keys**: Always use `t()` function from `react-i18next` for all user-facing text.

2. **Tailwind Classes**: Use custom color tokens defined in `tailwind.config.js`:
   - `warm-cream`, `warm-sand`, `warm-taupe`, `warm-charcoal`, `warm-brown`
   - `accent-magenta` for primary actions

3. **API Base URL**: Uses `VITE_API_BASE_URL` environment variable from `.env.example`.

4. **Offline Mode**: Application caches data in IndexedDB. Offline operations are queued and synced when online.

5. **Protected Routes**: Use `ProtectedRoute` component with `allowedRoles` prop for role-based access control.

6. **LocalStorage**: Auth tokens and user data stored in localStorage. Keys: `auth_token`, `refresh_token`, `user_data`.

7. **Currency Formatting**: Use `formatCurrency()` from `currencyUtils.js` for consistent formatting.

8. **Date Formatting**: Use `date-fns` library for date operations. Tamil dates may require special handling.

### Testing Gotchas

1. **Test Database**: Use separate test database to avoid polluting development data.

2. **Async Tests**: Backend tests must use `@pytest.mark.asyncio` decorator for async functions.

3. **Fixtures**: Use pytest fixtures for database setup and cleanup.

4. **Coverage**: Target minimum 80% code coverage for critical paths.

5. **No Test Files Yet**: Project has comprehensive test documentation in `docs/testing-guide.md` but actual test files are not yet implemented.

---

## Naming Conventions

### Backend Naming

- **Files**: `snake_case.py` (e.g., `daily_entry.py`, `auth_service.py`)
- **Classes**: `PascalCase` (e.g., `Farmer`, `DailyEntry`, `SettlementService`)
- **Functions/Variables**: `snake_case` (e.g., `get_farmer`, `calculate_settlement`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_COMMISSION_RATE`)
- **Tables**: `plural_snake_case` (e.g., `farmers`, `daily_entries`)

### Frontend Naming

- **Files**: `PascalCase.jsx` for components, `camelCase.js` for utilities/services
- **Components**: `PascalCase` (e.g., `DataTable`, `FarmerAutocomplete`)
- **Functions/Variables**: `camelCase` (e.g., `formatCurrency`, `useFarmers`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **CSS Classes**: `kebab-case` with Tailwind utility classes
- **Translation Keys**: `snake_case` in i18n files

---

## Testing Approach

### Backend Testing

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-asyncio pytest-mock httpx faker

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_models/test_farmer.py

# Run specific test
pytest tests/test_models/test_farmer.py::test_create_farmer
```

### Frontend Testing

```bash
# Test framework: Vitest with React Testing Library
npm test -- --run

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- DataTable.test.jsx

# E2E testing with Playwright
npm run test:e2e
```

### Test Structure (To Be Implemented)

```
backend/tests/
├── test_models/           # Model tests
├── test_schemas/          # Schema validation tests
├── test_services/         # Business logic tests
├── test_api/             # API endpoint tests
└── integration/          # Integration tests

frontend/src/
├── components/__tests__/   # Component tests
├── hooks/__tests__/       # Hook tests
├── services/__tests__/     # Service tests
└── utils/__tests__/       # Utility tests
```

---

## Database Schema

### Key Tables

- **users**: User accounts with role-based access (admin, staff, farmer)
- **farmers**: Farmer profiles linked to users
- **flower_types**: Flower varieties with bilingual names
- **time_slots**: Market hour slots for time-based pricing
- **market_rates**: Pricing rates per flower type and time slot
- **daily_entries**: Daily transaction records
- **cash_advances**: Cash advance requests and approvals
- **settlements**: Settlement calculations and payments
- **notifications**: In-app notifications
- **security_logs**: Audit logs for security events

### Relationships

- Users → Farmers (1:1)
- Farmers → Daily Entries (1:N)
- Farmers → Cash Advances (1:N)
- Farmers → Settlements (1:N)
- Daily Entries → Flower Types (N:1)
- Daily Entries → Time Slots (N:1)
- Market Rates → Flower Types (N:1)
- Market Rates → Time Slots (N:1)

---

## Internationalization (i18n)

### Supported Languages

- English (default) - `frontend/src/i18n/en.json`
- Tamil - `frontend/src/i18n/ta.json`

### Usage Pattern

```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.description')}</p>
    </div>
  );
};
```

### Adding New Translations

1. Add keys to both `en.json` and `ta.json`
2. Use `t('your.key.here')` in components
3. Tamil text uses UTF-8 encoding
4. RTL layout automatically applied for Tamil

---

## Documentation

### Key Documentation Files

- `README.md` - Project overview and quick start
- `docs/architecture.md` - System architecture details
- `docs/database-schema.md` - Complete database design
- `docs/api-design.md` - RESTful API documentation
- `docs/testing-guide.md` - Comprehensive testing procedures
- `docs/deployment-guide.md` - Production deployment instructions
- `docs/security-checklist.md` - Security measures and audit procedures
- `docs/whatsapp-setup.md` - WhatsApp bot configuration
- `backend/docs/report-generation-guide.md` - PDF report generation with Tamil support

---

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/malar_market_ledger

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# WhatsApp (optional)
WHATSAPP_PROVIDER=twilio
WHATSAPP_API_KEY=your-api-key
WHATSAPP_PHONE_NUMBER=+919876543210
```

### Frontend Environment Variables (.env)

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Malar Market Ledger
```

---

## Service URLs (Local Development)

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Database**: postgresql://localhost:5432/malar_market_ledger
- **Redis**: redis://localhost:6379

---

## Role-Based Access Control

### User Roles

1. **Admin**: Full access to all features
2. **Staff**: Daily entry, cash advances, settlements (read-only for settings)
3. **Farmer**: View own data, settlements, balance

### Permission Matrix

| Feature | Admin | Staff | Farmer |
|---------|-------|-------|---------|
| User Management | ✅ | ❌ | ❌ |
| Farmer Management | ✅ | ✅ | ❌ |
| Daily Entry | ✅ | ✅ | ❌ |
| Market Rates | ✅ | ✅ | ❌ |
| Cash Advances | ✅ | ✅ | ✅ (own) |
| Settlements | ✅ | ✅ | ✅ (own) |
| Reports | ✅ | ✅ | ✅ (own) |
| Settings | ✅ | ❌ | ❌ |

---

## Common Workflows

### Adding a New API Endpoint

1. Create Pydantic schema in `app/schemas/`
2. Add route handler in `app/api/`
3. Add dependency injection for auth/authorization
4. Register router in `app/main.py`
5. Test with Swagger UI at `/docs`

### Adding a New Frontend Component

1. Create component file in `frontend/src/components/`
2. Use Tailwind CSS classes for styling
3. Add translation keys to `en.json` and `ta.json`
4. Write unit tests in `__tests__` directory
5. Export from index file if needed

### Adding Database Migration

1. Modify SQLAlchemy model
2. Create Alembic migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration script
4. Apply migration: `alembic upgrade head`

### Debugging Backend Issues

1. Check backend logs: `./run.sh logs backend` or `tail -f logs/backend.log`
2. Verify database connection in `.env`
3. Check API docs at http://localhost:8000/docs
4. Use `pdb` or `ipdb` for debugging Python code

### Debugging Frontend Issues

1. Check browser console for errors
2. Check network tab in DevTools for API requests
3. Verify API base URL in `.env`
4. Check component state with React DevTools

---

## Performance Considerations

### Backend Performance

- Use database indexes on frequently queried columns
- Implement pagination for large datasets
- Use Redis for caching frequently accessed data
- Optimize SQLAlchemy queries with `select()` and eager loading

### Frontend Performance

- Use `useMemo` and `useCallback` for expensive computations
- Implement virtual scrolling for large lists
- Lazy load components with React.lazy()
- Use service worker for offline caching

---

## Security Best Practices

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Validate input**: Use Pydantic schemas for backend, form validation for frontend
3. **Sanitize output**: Prevent XSS by escaping user-generated content
4. **Use HTTPS**: All API communication should use HTTPS in production
5. **Rate limiting**: Implement rate limiting for public endpoints
6. **Audit logging**: Log all sensitive operations (create, update, delete)

---

## When to Ask for Help

- **Ambiguous requirements**: When business logic is unclear
- **Breaking changes**: When changes might affect multiple components
- **Security concerns**: When implementing authentication/authorization
- **Database schema changes**: When modifying table structure
- **Performance issues**: When optimization strategies are unclear

Otherwise, make autonomous decisions based on:
- Existing code patterns
- Project documentation
- Best practices for the technology stack
