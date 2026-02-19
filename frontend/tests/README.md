# Playwright Tests

This directory contains API and UI tests for the Malar Market Ledger application using Playwright.

## Test Structure

```
tests/
├── api/                    # API tests
│   ├── apiClient.js        # API client utilities and test data factories
│   ├── auth.spec.js        # Authentication endpoint tests
│   ├── farmers.spec.js     # Farmers API tests
│   └── dailyEntries.spec.js # Daily entries API tests
│
└── ui/                     # UI tests
    ├── BasePage.js         # Base page object class
    ├── pageObjects.js      # Page objects (Login, Dashboard, DailyEntry, Farmers)
    ├── login.spec.js       # Login page tests
    ├── arctic-theme.spec.js # Arctic theme component tests
    ├── data-table.spec.js  # Data table component tests
    └── daily-entry.spec.js # Daily entry workflow tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
# API tests only
npm run test:api

# UI tests only
npm run test:ui-tests

# Run with headed browser
npm run test:headed

# Interactive UI mode
npm run test:ui
```

### View Test Report
```bash
npm run test:report
```

## Prerequisites

1. **Backend running**: The API tests require the backend server to be running at `http://localhost:8000`
2. **Frontend running**: UI tests require the frontend dev server at `http://localhost:5173`
3. **Test credentials**: Set environment variables for test user:
   ```bash
   export TEST_ADMIN_USERNAME=admin
   export TEST_ADMIN_PASSWORD=admin123
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `TEST_ADMIN_USERNAME` | Admin username for tests | `admin` |
| `TEST_ADMIN_PASSWORD` | Admin password for tests | `admin123` |

## Test Categories

### API Tests

- **Authentication**: Login, register, token refresh, password reset
- **Farmers**: CRUD operations, pagination, search, filtering
- **Daily Entries**: CRUD operations, date filtering, adjustments, batch operations

### UI Tests

- **Login Page**: Form rendering, validation, authentication flow, accessibility
- **Arctic Theme**: Color palette, frosted glass effects, spotlight, flash freeze animations
- **Data Table**: Sorting, pagination, search, responsive design, accessibility
- **Daily Entry**: Quick add panel, entry management, totals calculation, keyboard navigation

## Page Objects

The `pageObjects.js` file exports reusable page object classes:

```javascript
import { LoginPage, DailyEntryPage, DashboardPage, FarmersPage } from './tests/ui/pageObjects';

// Usage in tests
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('admin', 'password');
```

## API Client

The `apiClient.js` provides utilities for API testing:

```javascript
import { ApiClient, testData } from './tests/api/apiClient';

const api = new ApiClient();
await api.setToken('your-jwt-token');

// Using test data factories
const farmer = testData.farmer({ name: 'Custom Name' });
const entry = testData.dailyEntry({ weight_kg: 10 });
```

## Arctic Theme Tests

The Arctic theme tests verify:

- Color palette compliance (Snow, Ice, Glacier, Frostbite, Aurora)
- Frosted glass effects with `backdrop-filter: blur()`
- Spotlight effect on active rows
- Flash freeze animation on save
- Touch target sizes (minimum 48px)
- Color contrast for accessibility

## Running in CI

For CI environments, the tests automatically:
- Use `--forbid-only` to prevent `.only` tests
- Retry failed tests twice
- Run with 1 worker for stability
- Generate HTML and JSON reports

## Screenshots and Videos

On test failure:
- Screenshots are saved to `test-results/screenshots/`
- Videos are retained in `test-results/`
- Traces are captured for debugging

## Best Practices

1. **Use page objects** for UI tests to maintain maintainability
2. **Use test data factories** for consistent test data
3. **Skip tests gracefully** when prerequisites aren't met
4. **Test accessibility** alongside functionality
5. **Verify responsive design** across viewports
