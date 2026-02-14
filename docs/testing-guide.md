# Malar Market Digital Ledger - Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Offline Functionality Testing](#offline-functionality-testing)
9. [Bilingual Support Testing](#bilingual-support-testing)
10. [Test Coverage Requirements](#test-coverage-requirements)

---

## Overview

This guide provides comprehensive testing procedures for the Malar Market Digital Ledger to ensure system reliability, performance, and user satisfaction before production launch.

### Testing Philosophy

- **Test-Driven Development (TDD)**: Write tests before implementing features
- **Automated Testing**: Prioritize automated tests over manual testing
- **Coverage Goals**: Minimum 80% code coverage for critical paths
- **Continuous Testing**: Run tests on every commit via CI/CD
- **Real-World Scenarios**: Test with actual market conditions and data volumes

### Testing Environment Setup

```bash
# Create testing environment
python -m venv venv_test
source venv_test/bin/activate

# Install test dependencies
pip install pytest pytest-cov pytest-asyncio pytest-mock httpx faker factory-boy

# Set test environment variables
export ENVIRONMENT=test
export DATABASE_URL=postgresql://test:test@localhost:5432/malar_test
export REDIS_URL=redis://localhost:6379/1
```

---

## Unit Testing

### Backend Unit Tests

#### Testing Framework
- **Framework**: Pytest
- **Coverage**: pytest-cov
- **Async Support**: pytest-asyncio
- **Mocking**: pytest-mock, unittest.mock

#### Test Structure

```python
# tests/test_models/test_farmer.py
import pytest
from app.models.farmer import Farmer
from app.schemas.all_schemas import FarmerCreate

def test_create_farmer():
    """Test farmer model creation"""
    farmer_data = FarmerCreate(
        farmer_code="FAR001",
        name="Test Farmer",
        village="Test Village",
        phone="+919876543210"
    )
    farmer = Farmer(**farmer_data.dict())
    
    assert farmer.farmer_code == "FAR001"
    assert farmer.name == "Test Farmer"
    assert farmer.current_balance == 0.00
    assert farmer.is_active is True

def test_farmer_balance_calculation():
    """Test farmer balance calculation"""
    farmer = Farmer(
        farmer_code="FAR001",
        name="Test Farmer",
        total_settlements=20000.00,
        total_advances=5000.00
    )
    
    expected_balance = 20000.00 - 5000.00
    assert farmer.current_balance == expected_balance
```

#### Unit Test Categories

**1. Model Tests** (`tests/test_models/`)
- Test model validation
- Test default values
- Test relationships
- Test computed properties

```bash
# Run model tests
pytest tests/test_models/ -v --cov=app/models --cov-report=html
```

**2. Schema Tests** (`tests/test_schemas/`)
- Test Pydantic validation
- Test field constraints
- Test serialization/deserialization

```bash
# Run schema tests
pytest tests/test_schemas/ -v --cov=app/schemas
```

**3. Service Tests** (`tests/test_services/`)
- Test business logic
- Test calculations
- Test edge cases

```python
# tests/test_services/test_settlement_service.py
import pytest
from app.services.settlement_service import SettlementService

@pytest.mark.asyncio
async def test_calculate_settlement():
    """Test settlement calculation"""
    service = SettlementService()
    
    # Mock data
    entries = [
        {"quantity": 10.0, "rate": 150.0, "commission": 5.0},
        {"quantity": 5.0, "rate": 200.0, "commission": 5.0}
    ]
    advances = [{"amount": 5000.00}]
    
    result = await service.calculate_settlement(entries, advances)
    
    assert result.gross_amount == 2500.00
    assert result.total_commission == 125.00
    assert result.net_payable == -2625.00  # 2500 - 125 - 5000
```

**4. API Route Tests** (`tests/test_api/`)
- Test endpoint responses
- Test authentication
- Test authorization
- Test error handling

```python
# tests/test_api/test_farmers.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_farmers_unauthorized():
    """Test unauthorized access to farmers endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/farmers")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_farmers_authorized(test_token):
    """Test authorized access to farmers endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/farmers",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 200
        assert "data" in response.json()
```

### Frontend Unit Tests

#### Testing Framework
- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: Vitest Mock Functions

#### Test Structure

```javascript
// src/components/__tests__/FarmerAutocomplete.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FarmerAutocomplete from '../FarmerAutocomplete';

describe('FarmerAutocomplete', () => {
  it('renders input field', () => {
    render(<FarmerAutocomplete farmers={[]} onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search farmer/i)).toBeInTheDocument();
  });

  it('displays filtered farmers on input', () => {
    const farmers = [
      { id: 1, name: 'Raj Kumar', farmer_code: 'FAR001' },
      { id: 2, name: 'Kumar Raja', farmer_code: 'FAR002' }
    ];
    render(<FarmerAutocomplete farmers={farmers} onSelect={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/search farmer/i);
    fireEvent.change(input, { target: { value: 'Raj' } });
    
    expect(screen.getByText('Raj Kumar')).toBeInTheDocument();
    expect(screen.queryByText('Kumar Raja')).not.toBeInTheDocument();
  });

  it('calls onSelect when farmer is clicked', () => {
    const onSelect = vi.fn();
    const farmers = [{ id: 1, name: 'Raj Kumar', farmer_code: 'FAR001' }];
    render(<FarmerAutocomplete farmers={farmers} onSelect={onSelect} />);
    
    const input = screen.getByPlaceholderText(/search farmer/i);
    fireEvent.change(input, { target: { value: 'Raj' } });
    fireEvent.click(screen.getByText('Raj Kumar'));
    
    expect(onSelect).toHaveBeenCalledWith(farmers[0]);
  });
});
```

#### Frontend Test Categories

**1. Component Tests** (`src/components/__tests__/`)
- Test component rendering
- Test user interactions
- Test props handling
- Test state changes

```bash
# Run component tests
npm test -- --run
```

**2. Hook Tests** (`src/hooks/__tests__/`)
- Test custom hooks
- Test state management
- Test side effects

```javascript
// src/hooks/__tests__/useFarmers.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFarmers } from '../useFarmers';

describe('useFarmers', () => {
  it('fetches farmers on mount', async () => {
    const mockFarmers = [
      { id: 1, name: 'Raj Kumar', farmer_code: 'FAR001' }
    ];
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFarmers })
      })
    );

    const { result } = renderHook(() => useFarmers());
    
    await waitFor(() => {
      expect(result.current.farmers).toEqual(mockFarmers);
    });
  });
});
```

**3. Service Tests** (`src/services/__tests__/`)
- Test API calls
- Test error handling
- Test data transformation

```javascript
// src/services/__tests__/farmerService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { farmerService } from '../farmerService';

describe('farmerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all farmers', async () => {
    const mockFarmers = [
      { id: 1, name: 'Raj Kumar', farmer_code: 'FAR001' }
    ];
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockFarmers })
      })
    );

    const result = await farmerService.getAll();
    expect(result).toEqual(mockFarmers);
  });

  it('handles API errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    await expect(farmerService.getAll()).rejects.toThrow();
  });
});
```

**4. Utility Tests** (`src/utils/__tests__/`)
- Test utility functions
- Test validation logic
- Test data formatting

```javascript
// src/utils/__tests__/currencyUtils.test.js
import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency } from '../currencyUtils';

describe('currencyUtils', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(1500.50)).toBe('₹1,500.50');
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('parses currency string to number', () => {
    expect(parseCurrency('₹1,500.50')).toBe(1500.50);
    expect(parseCurrency('1,500.50')).toBe(1500.50);
  });
});
```

---

## Integration Testing

### Backend Integration Tests

#### Test Database Integration

```python
# tests/integration/test_database.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.models.farmer import Farmer
from app.models.daily_entry import DailyEntry

@pytest.fixture(scope="function")
def test_db():
    """Create test database"""
    engine = create_engine("postgresql://test:test@localhost:5432/malar_test")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_create_and_retrieve_farmer(test_db):
    """Test farmer creation and retrieval"""
    farmer = Farmer(
        farmer_code="FAR001",
        name="Test Farmer",
        village="Test Village",
        phone="+919876543210"
    )
    test_db.add(farmer)
    test_db.commit()
    test_db.refresh(farmer)
    
    retrieved = test_db.query(Farmer).filter(Farmer.id == farmer.id).first()
    assert retrieved is not None
    assert retrieved.name == "Test Farmer"
```

#### Test API Integration

```python
# tests/integration/test_api_integration.py
import pytest
from httpx import AsyncClient
from app.main import app
from app.database import get_db
from app.models.farmer import Farmer

@pytest.fixture
async def test_client(test_db):
    """Create test client with database"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_farmer_crud_workflow(test_client):
    """Test complete farmer CRUD workflow"""
    # Create
    create_response = await test_client.post(
        "/api/v1/farmers",
        json={
            "farmer_code": "FAR001",
            "name": "Test Farmer",
            "village": "Test Village",
            "phone": "+919876543210"
        },
        headers={"Authorization": "Bearer test_token"}
    )
    assert create_response.status_code == 201
    farmer_id = create_response.json()["data"]["id"]
    
    # Read
    read_response = await test_client.get(f"/api/v1/farmers/{farmer_id}")
    assert read_response.status_code == 200
    assert read_response.json()["data"]["name"] == "Test Farmer"
    
    # Update
    update_response = await test_client.put(
        f"/api/v1/farmers/{farmer_id}",
        json={"name": "Updated Farmer"},
        headers={"Authorization": "Bearer test_token"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["name"] == "Updated Farmer"
    
    # Delete
    delete_response = await test_client.delete(
        f"/api/v1/farmers/{farmer_id}",
        headers={"Authorization": "Bearer test_token"}
    )
    assert delete_response.status_code == 204
```

#### Test WhatsApp Integration

```python
# tests/integration/test_whatsapp_integration.py
import pytest
from app.services.whatsapp_service import WhatsAppService

@pytest.mark.asyncio
async def test_send_whatsapp_message():
    """Test WhatsApp message sending"""
    service = WhatsAppService()
    
    result = await service.send_message(
        phone_number="+919876543210",
        template_id="settlement_notification",
        template_data={
            "settlement_number": "SET-2026-02-001",
            "amount": "₹30,125.00"
        }
    )
    
    assert result.success is True
    assert result.message_id is not None

@pytest.mark.asyncio
async def test_whatsapp_webhook_handling():
    """Test WhatsApp webhook handling"""
    service = WhatsAppService()
    
    webhook_data = {
        "From": "+919876543210",
        "Body": "BALANCE",
        "MessageSid": "SM123456"
    }
    
    response = await service.handle_webhook(webhook_data)
    
    assert response.status_code == 200
    assert "balance" in response.body.lower()
```

### Frontend Integration Tests

#### Test API Integration

```javascript
// src/integration/__tests__/apiIntegration.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/v1/farmers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          { id: 1, name: 'Raj Kumar', farmer_code: 'FAR001' }
        ]
      })
    );
  })
);

describe('API Integration', () => {
  beforeEach(() => server.listen());
  afterEach(() => server.close());

  it('fetches farmers from API', async () => {
    const response = await fetch('/api/v1/farmers');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });
});
```

---

## End-to-End Testing

### Testing Framework
- **Framework**: Playwright
- **Language**: JavaScript/TypeScript
- **Runner**: Vitest

### E2E Test Structure

```javascript
// e2e/daily-entry.spec.js
import { test, expect } from '@playwright/test';

test.describe('Daily Entry Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'admin@malar.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('create daily entry successfully', async ({ page }) => {
    await page.goto('http://localhost:5173/daily-entry');
    
    // Select farmer
    await page.click('[data-testid="farmer-autocomplete"]');
    await page.fill('[data-testid="farmer-search"]', 'Raj');
    await page.click('text=Raj Kumar');
    
    // Select flower type
    await page.click('[data-testid="flower-type-select"]');
    await page.click('text=Rose');
    
    // Enter quantity
    await page.fill('[data-testid="quantity-input"]', '10.5');
    
    // Verify auto-calculated total
    await expect(page.locator('[data-testid="total-amount"]')).toHaveText('₹1,575.00');
    
    // Submit entry
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Entry created successfully');
  });

  test('validate required fields', async ({ page }) => {
    await page.goto('http://localhost:5173/daily-entry');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Verify error messages
    await expect(page.locator('[data-testid="error-farmer"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-flower-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-quantity"]')).toBeVisible();
  });

  test('handle offline mode', async ({ page, context }) => {
    await page.goto('http://localhost:5173/daily-entry');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Create entry offline
    await page.click('[data-testid="farmer-autocomplete"]');
    await page.fill('[data-testid="farmer-search"]', 'Raj');
    await page.click('text=Raj Kumar');
    await page.click('[data-testid="flower-type-select"]');
    await page.click('text=Rose');
    await page.fill('[data-testid="quantity-input"]', '10.5');
    await page.click('button[type="submit"]');
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-pending"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Verify sync completed
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  });
});
```

### E2E Test Scenarios

**1. Authentication Flow**
- Login with valid credentials
- Login with invalid credentials
- Password reset flow
- Logout functionality

**2. Daily Entry Flow**
- Create entry with all fields
- Create entry with minimum fields
- Validate required fields
- Auto-calculation verification
- Offline entry creation
- Sync pending entries

**3. Settlement Flow**
- Generate settlement for farmer
- Review settlement details
- Approve settlement
- Mark settlement as paid
- WhatsApp notification verification

**4. Report Generation**
- Generate daily summary report
- Generate farmer summary report
- Export to PDF
- Export to Excel

**5. WhatsApp Bot Flow**
- Send balance inquiry
- Send settlement inquiry
- Receive notifications
- Handle invalid commands

**6. Bilingual Support**
- Switch to Tamil language
- Verify all translations
- Test RTL layout
- Verify currency formatting

### Running E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test daily-entry.spec.js
```

---

## Manual Testing Checklist

### Pre-Launch Testing Checklist

#### Authentication & Authorization
- [ ] User can login with valid credentials
- [ ] User cannot login with invalid credentials
- [ ] Password reset email is sent
- [ ] Password can be reset with valid token
- [ ] User can logout successfully
- [ ] Session expires after inactivity
- [ ] Refresh token rotation works
- [ ] Admin can create new users
- [ ] Staff cannot create users
- [ ] Farmer cannot access admin features

#### Farmer Management
- [ ] Admin can create farmer
- [ ] Admin can update farmer details
- [ ] Admin can deactivate farmer
- [ ] Staff can view farmers
- [ ] Staff cannot delete farmers
- [ ] Farmer search works
- [ ] Farmer autocomplete works
- [ ] Farmer balance displays correctly
- [ ] Farmer history loads correctly

#### Daily Entry Management
- [ ] Staff can create daily entry
- [ ] Time slot is auto-detected
- [ ] Rate is auto-applied based on time slot
- [ ] Total amount is calculated correctly
- [ ] Commission is calculated correctly
- [ ] Entry can be edited before settlement
- [ ] Entry cannot be edited after settlement
- [ ] Entry can be deleted before settlement
- [ ] Entry cannot be deleted after settlement
- [ ] Multiple entries can be created quickly
- [ ] Entry validation works
- [ ] Negative quantities are rejected
- [ ] Zero quantities are rejected

#### Market Rates
- [ ] Admin can set market rates
- [ ] Rates are time-slot specific
- [ ] Rates are date-specific
- [ ] Current rate is applied correctly
- [ ] Rate history is maintained
- [ ] Staff cannot modify rates
- [ ] Rate changes affect new entries only

#### Cash Advances
- [ ] Staff can request cash advance
- [ ] Advance amount is validated
- [ ] Admin can approve advance
- [ ] Admin can reject advance
- [ ] Advance is deducted from balance
- [ ] Advance history is maintained
- [ ] Advance status updates correctly

#### Settlements
- [ ] Admin can generate settlement
- [ ] Settlement includes all entries
- [ ] Settlement calculates totals correctly
- [ ] Settlement deducts advances
- [ ] Settlement deducts fees
- [ ] Settlement can be approved
- [ ] Settlement can be marked as paid
- [ ] Settlement PDF generates correctly
- [ ] Settlement WhatsApp notification is sent
- [ ] Farmer can view own settlement
- [ ] Settlement cannot be modified after approval

#### Reports
- [ ] Daily summary report generates
- [ ] Farmer summary report generates
- [ ] Report filters work
- [ ] Report exports to PDF
- [ ] Report exports to Excel
- [ ] Report data is accurate
- [ ] Report loads quickly
- [ ] Report pagination works

#### WhatsApp Integration
- [ ] WhatsApp bot responds to commands
- [ ] Balance inquiry works
- [ ] Settlement inquiry works
- [ ] Settlement notifications are sent
- [ ] Entry notifications are sent (optional)
- [ ] Failed messages are retried
- [ ] Message delivery status is tracked
- [ ] Bot handles invalid commands

#### Offline Functionality
- [ ] App works without internet
- [ ] Entries can be created offline
- [ ] Cached data is accessible offline
- [ ] Offline indicator is visible
- [ ] Sync queue displays pending operations
- [ ] Sync happens automatically when online
- [ ] Sync conflicts are resolved
- [ ] Sync errors are displayed
- [ ] Data is not lost during sync

#### Bilingual Support
- [ ] Language can be switched to Tamil
- [ ] Language can be switched to English
- [ ] All labels are translated
- [ ] All error messages are translated
- [ ] All notifications are translated
- [ ] Currency formatting is correct
- [ ] Date formatting is correct
- [ ] Tamil font renders correctly
- [ ] RTL layout works for Tamil

#### PDF Generation
- [ ] Settlement PDF generates
- [ ] Tamil text renders correctly in PDF
- [ ] PDF formatting is correct
- [ ] PDF includes all required fields
- [ ] PDF can be downloaded
- [ ] PDF can be printed
- [ ] PDF signature works

#### Performance
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Entry creation time < 1 second
- [ ] Report generation time < 5 seconds
- [ ] PDF generation time < 3 seconds
- [ ] App works smoothly on tablet
- [ ] App works smoothly on desktop
- [ ] No memory leaks detected
- [ ] No console errors

#### Security
- [ ] All API endpoints require authentication
- [ ] Role-based access control works
- [ ] Sensitive data is not exposed
- [ ] SQL injection is prevented
- [ ] XSS is prevented
- [ ] CSRF protection works
- [ ] Rate limiting works
- [ ] Audit logs are created

#### Browser Compatibility
- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Safari
- [ ] Works on Edge
- [ ] Works on mobile browsers
- [ ] PWA installs correctly
- [ ] Service worker registers correctly

---

## Performance Testing

### Load Testing

#### Tool: k6

```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:8000';

export default function () {
  // Login
  let loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'test@malar.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  let token = loginRes.json('data.access_token');
  
  // Get farmers
  let farmersRes = http.get(`${BASE_URL}/api/v1/farmers`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  check(farmersRes, {
    'farmers retrieved': (r) => r.status === 200,
  });
  
  // Create daily entry
  let entryRes = http.post(`${BASE_URL}/api/v1/daily-entries`, JSON.stringify({
    farmer_id: '550e8400-e29b-41d4-a716-446655440000',
    flower_type_id: '660e8400-e29b-41d4-a716-446655440001',
    entry_date: '2026-02-14',
    entry_time: '05:30:00',
    quantity: 10.5,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  check(entryRes, {
    'entry created': (r) => r.status === 201,
  });
  
  sleep(1);
}
```

#### Running Load Tests

```bash
# Install k6
# macOS: brew install k6
# Linux: sudo apt-get install k6

# Run load test
k6 run tests/performance/load-test.js

# Run with output file
k6 run tests/performance/load-test.js --out json=results.json
```

### Performance Benchmarks

#### Backend Performance Targets

| Operation | Target | Acceptable | Critical |
|------------|---------|-------------|----------|
| API Response Time | < 200ms | < 500ms | > 1s |
| Database Query | < 100ms | < 200ms | > 500ms |
| Authentication | < 500ms | < 1s | > 2s |
| Entry Creation | < 300ms | < 500ms | > 1s |
| Settlement Generation | < 2s | < 5s | > 10s |
| Report Generation | < 3s | < 5s | > 10s |
| PDF Generation | < 2s | < 3s | > 5s |

#### Frontend Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|---------|-------------|----------|
| First Contentful Paint | < 1s | < 2s | > 3s |
| Time to Interactive | < 3s | < 5s | > 8s |
| Largest Contentful Paint | < 2s | < 3s | > 4s |
| Cumulative Layout Shift | < 0.1 | < 0.25 | > 0.5 |
| First Input Delay | < 100ms | < 300ms | > 500ms |

### Stress Testing

```javascript
// tests/performance/stress-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users
    { duration: '1m', target: 300 },  // Ramp up to 300 users
    { duration: '3m', target: 300 },  // Stay at 300 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('http://localhost:8000/api/v1/farmers');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
}
```

---

## Security Testing

### Authentication Security Tests

```python
# tests/security/test_auth_security.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_invalid_token_rejected():
    """Test that invalid tokens are rejected"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/farmers",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_expired_token_rejected():
    """Test that expired tokens are rejected"""
    expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired"
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/farmers",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_brute_force_protection():
    """Test brute force protection"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Attempt multiple failed logins
        for _ in range(5):
            response = await client.post("/api/v1/auth/login", json={
                "email": "admin@malar.com",
                "password": "wrong_password"
            })
        
        # Should be rate limited
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@malar.com",
            "password": "wrong_password"
        })
        assert response.status_code == 429
```

### Input Validation Tests

```python
# tests/security/test_input_validation.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_sql_injection_prevention(test_token):
    """Test SQL injection prevention"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/farmers?search=' OR '1'='1",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 200
        # Should return empty results, not all farmers
        assert len(response.json()["data"]) == 0

@pytest.mark.asyncio
async def test_xss_prevention(test_token):
    """Test XSS prevention"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        xss_payload = "<script>alert('xss')</script>"
        response = await client.post(
            "/api/v1/farmers",
            json={
                "farmer_code": "FAR001",
                "name": xss_payload,
                "phone": "+919876543210"
            },
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 201
        # Name should be escaped, not executed
        assert "<script>" not in response.json()["data"]["name"]
```

### Authorization Tests

```python
# tests/security/test_authorization.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_staff_cannot_access_admin_endpoints(staff_token):
    """Test that staff cannot access admin endpoints"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {staff_token}"}
        )
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_farmer_cannot_access_staff_endpoints(farmer_token):
    """Test that farmers cannot access staff endpoints"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/daily-entries",
            json={
                "farmer_id": "test_id",
                "flower_type_id": "test_id",
                "quantity": 10.0
            },
            headers={"Authorization": f"Bearer {farmer_token}"}
        )
        assert response.status_code == 403
```

### Security Tools

```bash
# OWASP ZAP for vulnerability scanning
zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://localhost:8000

# SQLMap for SQL injection testing
sqlmap -u "http://localhost:8000/api/v1/farmers?search=test" --cookie="session=test"

# Nmap for port scanning
nmap -sV -sC localhost

# Nikto for web server scanning
nikto -h http://localhost:8000
```

---

## Offline Functionality Testing

### Test Scenarios

#### 1. Offline Entry Creation

```javascript
// e2e/offline/entry-creation.spec.js
import { test, expect } from '@playwright/test';

test('create entry offline and sync when online', async ({ page, context }) => {
  await page.goto('http://localhost:5173/daily-entry');
  
  // Go offline
  await context.setOffline(true);
  
  // Verify offline indicator
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  
  // Create entry
  await page.click('[data-testid="farmer-autocomplete"]');
  await page.fill('[data-testid="farmer-search"]', 'Raj');
  await page.click('text=Raj Kumar');
  await page.click('[data-testid="flower-type-select"]');
  await page.click('text=Rose');
  await page.fill('[data-testid="quantity-input"]', '10.5');
  await page.click('button[type="submit"]');
  
  // Verify entry saved locally
  await expect(page.locator('[data-testid="sync-pending"]')).toBeVisible();
  await expect(page.locator('[data-testid="toast-success"]')).toContainText('Entry saved locally');
  
  // Go online
  await context.setOffline(false);
  
  // Verify sync
  await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="sync-pending"]')).not.toBeVisible();
});
```

#### 2. Offline Data Access

```javascript
test('access cached data offline', async ({ page, context }) => {
  // Load data online
  await page.goto('http://localhost:5173/farmers');
  await page.waitForSelector('[data-testid="farmer-list"]');
  
  // Go offline
  await context.setOffline(true);
  
  // Verify data is still accessible
  await expect(page.locator('[data-testid="farmer-list"]')).toBeVisible();
  await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  
  // Search should work with cached data
  await page.fill('[data-testid="search-input"]', 'Raj');
  await expect(page.locator('text=Raj Kumar')).toBeVisible();
});
```

#### 3. Sync Conflict Resolution

```javascript
test('handle sync conflicts', async ({ page, context }) => {
  await page.goto('http://localhost:5173/daily-entry');
  
  // Go offline
  await context.setOffline(true);
  
  // Create entry
  await page.click('[data-testid="farmer-autocomplete"]');
  await page.fill('[data-testid="farmer-search"]', 'Raj');
  await page.click('text=Raj Kumar');
  await page.click('[data-testid="flower-type-select"]');
  await page.click('text=Rose');
  await page.fill('[data-testid="quantity-input"]', '10.5');
  await page.click('button[type="submit"]');
  
  // Go online (simulate conflict by modifying server data)
  await context.setOffline(false);
  
  // Verify conflict notification
  await expect(page.locator('[data-testid="conflict-dialog"]')).toBeVisible();
  await expect(page.locator('[data-testid="conflict-dialog"]')).toContainText('Sync conflict detected');
  
  // Resolve conflict
  await page.click('[data-testid="resolve-keep-local"]');
  
  // Verify resolution
  await expect(page.locator('[data-testid="conflict-dialog"]')).not.toBeVisible();
});
```

### Offline Testing Tools

```javascript
// tests/offline/offline-test-utils.js
export class OfflineTestUtils {
  static async simulateOffline(page) {
    await page.context().setOffline(true);
    await page.waitForTimeout(100);
  }

  static async simulateOnline(page) {
    await page.context().setOffline(false);
    await page.waitForTimeout(100);
  }

  static async verifyOfflineIndicator(page) {
    return await page.locator('[data-testid="offline-indicator"]').isVisible();
  }

  static async verifySyncPending(page) {
    return await page.locator('[data-testid="sync-pending"]').isVisible();
  }

  static async clearIndexedDB(page) {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase('malar-market-ledger');
        request.onsuccess = resolve;
        request.onerror = resolve;
      });
    });
  }
}
```

---

## Bilingual Support Testing

### Test Scenarios

#### 1. Language Switching

```javascript
// e2e/bilingual/language-switch.spec.js
import { test, expect } from '@playwright/test';

test('switch between English and Tamil', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Default language should be English
  await expect(page.locator('text=Daily Entry')).toBeVisible();
  
  // Switch to Tamil
  await page.click('[data-testid="language-selector"]');
  await page.click('text=தமிழ்');
  
  // Verify Tamil labels
  await expect(page.locator('text=நாள் உள்ளீடு')).toBeVisible();
  await expect(page.locator('text=விவசாயி')).toBeVisible();
  
  // Switch back to English
  await page.click('[data-testid="language-selector"]');
  await page.click('text=English');
  
  // Verify English labels
  await expect(page.locator('text=Daily Entry')).toBeVisible();
});
```

#### 2. Tamil Font Rendering

```javascript
test('Tamil font renders correctly', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Switch to Tamil
  await page.click('[data-testid="language-selector"]');
  await page.click('text=தமிழ்');
  
  // Verify Tamil text is visible
  const tamilText = await page.locator('text=விவசாயி').isVisible();
  expect(tamilText).toBe(true);
  
  // Check for font loading
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check('1em Noto Sans Tamil');
  });
  expect(fontLoaded).toBe(true);
});
```

#### 3. RTL Layout

```javascript
test('RTL layout works for Tamil', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Switch to Tamil
  await page.click('[data-testid="language-selector"]');
  await page.click('text=தமிழ்');
  
  // Verify RTL direction
  const direction = await page.locator('body').getAttribute('dir');
  expect(direction).toBe('rtl');
  
  // Verify layout adjustments
  const formElement = await page.locator('[data-testid="daily-entry-form"]');
  const styles = await formElement.evaluate(el => {
    return window.getComputedStyle(el);
  });
  expect(styles.direction).toBe('rtl');
});
```

#### 4. Currency Formatting

```javascript
test('currency formatting is correct for both languages', async ({ page }) => {
  await page.goto('http://localhost:5173/daily-entry');
  
  // English currency format
  await page.fill('[data-testid="quantity-input"]', '10');
  await expect(page.locator('[data-testid="total-amount"]')).toHaveText('₹1,500.00');
  
  // Switch to Tamil
  await page.click('[data-testid="language-selector"]');
  await page.click('text=தமிழ்');
  
  // Tamil currency format (should be same)
  await expect(page.locator('[data-testid="total-amount"]')).toHaveText('₹1,500.00');
});
```

### Bilingual Test Coverage

- [ ] All UI elements have English labels
- [ ] All UI elements have Tamil labels
- [ ] Language switcher works on all pages
- [ ] Language preference is saved
- [ ] Tamil font loads correctly
- [ ] Tamil text is readable
- [ ] RTL layout works correctly
- [ ] Currency formatting is correct
- [ ] Date formatting is correct
- [ ] Number formatting is correct
- [ ] Error messages are translated
- [ ] Success messages are translated
- [ ] Notification messages are translated
- [ ] WhatsApp messages are bilingual
- [ ] PDF reports support Tamil
- [ ] Excel reports support Tamil

---

## Test Coverage Requirements

### Coverage Targets

| Component | Target | Minimum |
|------------|---------|----------|
| Backend Models | 95% | 85% |
| Backend Services | 90% | 80% |
| Backend API Routes | 85% | 75% |
| Frontend Components | 85% | 75% |
| Frontend Hooks | 90% | 80% |
| Frontend Services | 85% | 75% |
| Frontend Utils | 95% | 85% |

### Generating Coverage Reports

```bash
# Backend coverage
pytest --cov=app --cov-report=html --cov-report=term

# Frontend coverage
npm test -- --coverage

# Combined coverage report
# Use tools like codecov or coveralls
```

### Coverage Exclusions

```python
# .coveragerc
[run]
omit =
    */tests/*
    */venv/*
    */__pycache__/*
    */migrations/*
    app/main.py  # Entry point
    app/config.py  # Configuration
```

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/dist/**',
        '**/build/**',
        '**/config/**',
      ],
    },
  },
});
```

---

## Test Automation

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: malar_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --run --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: malar_test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## Best Practices

### Test Organization

1. **Separate test types**: Unit, integration, and E2E tests in separate directories
2. **Use fixtures**: Reuse test setup with fixtures
3. **Mock external dependencies**: Don't depend on external services
4. **Test edge cases**: Test boundary conditions and error scenarios
5. **Keep tests independent**: Tests should not depend on each other
6. **Use descriptive names**: Test names should describe what is being tested

### Test Maintenance

1. **Update tests with code changes**: Keep tests in sync with implementation
2. **Remove obsolete tests**: Delete tests for deprecated features
3. **Refactor test code**: Keep test code clean and maintainable
4. **Review test coverage**: Regularly check coverage reports
5. **Fix flaky tests**: Address tests that fail intermittently

### Test Data Management

1. **Use factories**: Create test data with factory patterns
2. **Clean up after tests**: Remove test data after each test
3. **Use realistic data**: Test with data similar to production
4. **Seed test database**: Populate database with initial test data
5. **Isolate test environments**: Use separate databases for testing

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: QA Team
