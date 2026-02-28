# API Test Suite Refactoring - Sequential Coding Tasks

This document provides a detailed, sequential checklist of coding tasks to execute the Python API test suite refactor. Tasks are organized into four logical phases.

---

## Phase 1: Environment Setup and Cleanup

### 1.1 Remove Playwright API Test Dependencies

- [ ] **Task 1.1.1**: Delete `frontend/tests/api/` directory
  - Remove `frontend/tests/api/apiClient.js`
  - Remove `frontend/tests/api/auth.spec.js`
  - Remove `frontend/tests/api/dailyEntries.spec.js`
  - Remove `frontend/tests/api/farmers.spec.js`
  - Remove the `frontend/tests/api/` folder entirely

- [ ] **Task 1.1.2**: Update `frontend/package.json`
  - Remove `test:api` script if it exists
  - Keep UI test scripts (`test`, `test:headed`)

- [ ] **Task 1.1.3**: Update `frontend/playwright.config.js`
  - Remove any API test file patterns from testMatch
  - Ensure only UI tests are configured

### 1.2 Create Backend Test Directory Structure

- [ ] **Task 1.2.1**: Create `backend/tests/schemas/` directory
  - Create `backend/tests/schemas/__init__.py`

- [ ] **Task 1.2.2**: Create `backend/tests/fixtures/` directory
  - Create `backend/tests/fixtures/__init__.py`

- [ ] **Task 1.2.3**: Create `backend/tests/utils/` directory
  - Create `backend/tests/utils/__init__.py`

### 1.3 Verify Python Dependencies

- [ ] **Task 1.3.1**: Verify `backend/requirements.txt` contains:
  - `pytest>=7.0.0`
  - `pytest-cov>=4.0.0`
  - `requests>=2.28.0`
  - `pydantic>=2.0.0`
  - `faker>=18.0.0`

---

## Phase 2: Pydantic Schema Modeling

### 2.1 Core Response Envelope Schemas

- [ ] **Task 2.1.1**: Create `backend/tests/schemas/common.py`
  - Define `PaginationMeta` model with fields: page, page_size, total_items, total_pages, has_next, has_previous
  - Define `SuccessResponse` generic model with success, data, message fields
  - Define `ErrorDetail` model with field, message fields
  - Define `ErrorBody` model with code, message, details fields
  - Define `ErrorResponse` model with success, error, message fields
  - Define `PaginatedResponse` generic model with success, data, pagination, message fields

### 2.2 Authentication Schemas

- [ ] **Task 2.2.1**: Create `backend/tests/schemas/auth.py`
  - Define `UserRole` enum: admin, staff, farmer
  - Define `LoginRequest` with email, password fields
  - Define `RefreshTokenRequest` with refresh_token field
  - Define `ForgotPasswordRequest` with email field
  - Define `ResetPasswordRequest` with token, new_password fields
  - Define `UserInToken` with id, email, full_name, role, language_preference fields
  - Define `LoginResponse` with access_token, refresh_token, token_type, expires_in, user fields
  - Define `RefreshTokenResponse` with access_token, refresh_token, token_type, expires_in fields
  - Define `LogoutResponse` with success, message fields

### 2.3 User Schemas

- [ ] **Task 2.3.1**: Create `backend/tests/schemas/users.py`
  - Define `UserResponse` with id, email, full_name, phone, role, is_active, email_verified, language_preference, created_at, updated_at fields
  - Define `UserCreate` with email, password, full_name, phone, role, language_preference fields
  - Define `UserUpdate` with optional full_name, phone, language_preference fields

### 2.4 Farmer Schemas

- [ ] **Task 2.4.1**: Create `backend/tests/schemas/farmers.py`
  - Define `FarmerResponse` with all fields from api-design.md
  - Define `FarmerCreate` with farmer_code, name, village, phone, whatsapp_number, address, commission_pct, flat_fee_monthly fields
  - Define `FarmerUpdate` with optional update fields
  - Define `FarmerBalance` with farmer_id, current_balance, total_advances, total_settlements, last_updated fields
  - Define `NestedFarmer` for embedded farmer in responses
  - Define `FarmerListResponse` extending PaginatedResponse

### 2.5 Flower Type Schemas

- [ ] **Task 2.5.1**: Create `backend/tests/schemas/flower_types.py`
  - Define `FlowerTypeResponse` with id, name, name_ta, code, description, unit, is_active, created_at, updated_at fields
  - Define `FlowerTypeCreate` with name, name_ta, code, description, unit fields
  - Define `FlowerTypeUpdate` with optional update fields
  - Define `NestedFlowerType` for embedded flower type in responses

### 2.6 Time Slot Schemas

- [ ] **Task 2.6.1**: Create `backend/tests/schemas/time_slots.py`
  - Define `TimeSlotResponse` with id, name, name_ta, start_time, end_time, is_active, created_at, updated_at fields
  - Define `NestedTimeSlot` for embedded time slot in responses

### 2.7 Market Rate Schemas

- [ ] **Task 2.7.1**: Create `backend/tests/schemas/market_rates.py`
  - Define `MarketRateResponse` with all fields including nested flower_type and time_slot
  - Define `MarketRateCreate` with flower_type_id, time_slot_id, rate_per_unit, effective_date, expiry_date fields
  - Define `CurrentRateResponse` with flower_type_id, time_slot_id, rate_per_unit, effective_date, time_slot fields
  - Define `MarketRateListResponse` extending PaginatedResponse

### 2.8 Daily Entry Schemas

- [ ] **Task 2.8.1**: Create `backend/tests/schemas/daily_entries.py`
  - Define `AdjustmentReasonCode` enum: LATE, WET, QUALITY, BONUS, OTHER
  - Define `DailyEntryCreate` with farmer_id, flower_type_id, entry_date, entry_time, quantity, manual_adj_amount, adj_reason_code, notes fields
  - Define `DailyEntryUpdate` with optional update fields
  - Define `DailyEntryResponse` with all fields including nested relationships
  - Define `DailyEntryListResponse` extending PaginatedResponse

### 2.9 Cash Advance Schemas

- [ ] **Task 2.9.1**: Create `backend/tests/schemas/cash_advances.py`
  - Define `AdvanceStatus` enum: pending, approved, rejected
  - Define `CashAdvanceCreate` with farmer_id, amount, reason, advance_date, notes fields
  - Define `CashAdvanceUpdate` with optional notes field
  - Define `CashAdvanceResponse` with all fields including nested farmer
  - Define `CashAdvanceApproveRequest` with optional notes field
  - Define `CashAdvanceListResponse` extending PaginatedResponse

### 2.10 Settlement Schemas

- [ ] **Task 2.10.1**: Create `backend/tests/schemas/settlements.py`
  - Define `SettlementStatus` enum: draft, pending_approval, approved, paid
  - Define `SettlementItemResponse` with id, daily_entry_id, entry_date, flower_type, quantity, rate_per_unit, total_amount, commission_amount, net_amount fields
  - Define `SettlementCreateRequest` with farmer_id, period_start, period_end, notes fields
  - Define `SettlementResponse` with all fields including items array
  - Define `SettlementApproveRequest` with optional notes field
  - Define `SettlementListResponse` extending PaginatedResponse

### 2.11 Report Schemas

- [ ] **Task 2.11.1**: Create `backend/tests/schemas/reports.py`
  - Define `FlowerTypeBreakdown` with flower_type, total_quantity, total_amount fields
  - Define `DailySummaryResponse` with date, total_entries, total_quantity, gross_amount, total_commission, net_amount, unique_farmers, flower_type_breakdown fields
  - Define `FarmerSummaryResponse` with farmer_id, farmer, period_start, period_end, totals, balances fields

### 2.12 Notification Schemas

- [ ] **Task 2.12.1**: Create `backend/tests/schemas/notifications.py`
  - Define `NotificationStatus` enum: pending, sent, failed
  - Define `NotificationChannel` enum: whatsapp, in_app
  - Define `NotificationResponse` with all fields
  - Define `NotificationListResponse` extending PaginatedResponse

### 2.13 Schema Exports

- [ ] **Task 2.13.1**: Update `backend/tests/schemas/__init__.py`
  - Export all schema models for easy importing

---

## Phase 3: Core API Client and Pytest Fixtures

### 3.1 API Client Wrapper

- [ ] **Task 3.1.1**: Create `backend/tests/utils/api_client.py`
  - Implement `APIClient` class with:
    - `__init__(base_url, session)` constructor
    - `_build_url(endpoint)` helper method
    - `request(method, endpoint, token, json, params, timeout)` method
    - `get(endpoint, token, **kwargs)` method
    - `post(endpoint, token, **kwargs)` method
    - `put(endpoint, token, **kwargs)` method
    - `delete(endpoint, token, **kwargs)` method
    - `validate_response(response, model, expected_status)` method
    - `validate_success_response(response, data_model, expected_status)` method
    - `validate_paginated_response(response, item_model, expected_status)` method
    - `validate_error_response(response, expected_status, expected_error_code)` method

### 3.2 Response Validators

- [ ] **Task 3.2.1**: Create `backend/tests/utils/response_validators.py`
  - Implement `validate_status_code(response, expected)` function
  - Implement `validate_json_response(response)` function
  - Implement `validate_success_response(response, data_model, expected_status)` function
  - Implement `validate_error_response(response, expected_status, expected_code)` function
  - Implement `validate_paginated_response(response, item_model, expected_status)` function
  - Implement `validate_pagination_meta(pagination)` function
  - Implement `validate_response_has_fields(response, fields)` function
  - Implement `validate_response_data_has_fields(response, fields, expected_status)` function

### 3.3 Custom Assertions

- [ ] **Task 3.3.1**: Create `backend/tests/utils/assertions.py`
  - Implement `assert_valid_uuid(value)` function
  - Implement `assert_valid_iso_datetime(value)` function
  - Implement `assert_valid_iso_date(value)` function
  - Implement `assert_positive_decimal(value)` function
  - Implement `assert_valid_phone_format(value)` function

### 3.4 Utility Exports

- [ ] **Task 3.4.1**: Update `backend/tests/utils/__init__.py`
  - Export APIClient, all validators, and assertions

### 3.5 Pytest Configuration and Fixtures

- [ ] **Task 3.5.1**: Enhance `backend/tests/conftest.py`
  - Add imports for new schemas and utils
  - Add session-scoped `api_client` fixture using requests.Session
  - Add session-scoped `admin_login_response` fixture
  - Add session-scoped `admin_token` fixture
  - Add session-scoped `admin_refresh_token` fixture
  - Add session-scoped `staff_login_response` fixture
  - Add session-scoped `staff_token` fixture
  - Add session-scoped `farmer_login_response` fixture
  - Add session-scoped `farmer_token` fixture
  - Add function-scoped `admin_auth_header` fixture
  - Add function-scoped `staff_auth_header` fixture
  - Add function-scoped `farmer_auth_header` fixture
  - Add helper function `get_auth_header(token)`
  - Add helper function `make_authenticated_request()`
  - Add pytest markers: positive, negative, integration, auth
  - Add pytest_configure hook for custom markers
  - Add pytest_collection_modifyitems hook for auto-marking

### 3.6 Test Data Fixtures

- [ ] **Task 3.6.1**: Create `backend/tests/fixtures/auth_fixtures.py`
  - Define `valid_login_payload` fixture
  - Define `invalid_login_payload` fixture
  - Define `refresh_token_payload` fixture

- [ ] **Task 3.6.2**: Create `backend/tests/fixtures/farmer_fixtures.py`
  - Define `sample_farmer_create` fixture using Pydantic FarmerCreate
  - Define `sample_farmer_update` fixture using Pydantic FarmerUpdate
  - Define `invalid_farmer_create` fixture for negative tests

- [ ] **Task 3.6.3**: Create `backend/tests/fixtures/entry_fixtures.py`
  - Define `sample_daily_entry_create` fixture using Pydantic DailyEntryCreate
  - Define `sample_daily_entry_update` fixture using Pydantic DailyEntryUpdate

- [ ] **Task 3.6.4**: Update `backend/tests/fixtures/__init__.py`
  - Export all fixtures

---

## Phase 4: Test Suite Implementation

### 4.1 Authentication Tests

- [ ] **Task 4.1.1**: Refactor `backend/tests/test_api/test_auth.py`
  - Import Pydantic schemas from tests.schemas.auth
  - Import validators from tests.utils.response_validators
  - Create `TestAuthLogin` class with:
    - `test_login_with_valid_admin_credentials_returns_200` using LoginRequest and LoginResponse validation
    - `test_login_with_valid_staff_credentials_returns_200`
    - `test_login_with_valid_farmer_credentials_returns_200`
    - `test_login_with_invalid_credentials_returns_401` validating AUTHENTICATION_FAILED error
    - `test_login_with_missing_email_returns_422`
    - `test_login_with_missing_password_returns_422`
    - `test_login_with_invalid_email_format_returns_422`
  - Create `TestAuthRefresh` class with:
    - `test_refresh_token_returns_200` using RefreshTokenRequest and RefreshTokenResponse
    - `test_refresh_with_invalid_token_returns_401` validating REFRESH_TOKEN_INVALID error
    - `test_refresh_with_missing_token_returns_422`
  - Create `TestAuthLogout` class with:
    - `test_logout_with_valid_token_returns_200`
    - `test_logout_without_token_returns_401`
    - `test_logout_with_invalid_token_returns_401`
  - Create `TestAuthForgotPassword` class with:
    - `test_forgot_password_with_valid_email_returns_200`
    - `test_forgot_password_with_missing_email_returns_422`
  - Create `TestAuthResetPassword` class with:
    - `test_reset_password_with_valid_token_returns_200`
    - `test_reset_password_with_missing_token_returns_422`
    - `test_reset_password_with_missing_password_returns_422`
  - Create `TestAuthMe` class with:
    - `test_get_current_user_with_valid_token_returns_200` validating UserResponse
    - `test_get_current_user_without_token_returns_401`

### 4.2 Users Tests

- [ ] **Task 4.2.1**: Create/Refactor `backend/tests/test_api/test_users.py`
  - Import Pydantic schemas from tests.schemas.users
  - Create `TestUsersList` class with:
    - `test_list_users_returns_200` with PaginatedResponse validation
    - `test_list_users_with_pagination` validating pagination metadata
    - `test_list_users_without_auth_returns_401`
    - `test_list_users_with_non_admin_returns_403`
  - Create `TestUsersGet` class with:
    - `test_get_user_by_id_returns_200` validating UserResponse
    - `test_get_nonexistent_user_returns_404`
    - `test_get_user_without_auth_returns_401`
  - Create `TestUsersCreate` class with:
    - `test_create_user_returns_201` using UserCreate and UserResponse
    - `test_create_user_with_duplicate_email_returns_409`
    - `test_create_user_with_invalid_data_returns_400`
    - `test_create_user_without_admin_returns_403`
  - Create `TestUsersUpdate` class with:
    - `test_update_user_returns_200` using UserUpdate
    - `test_update_nonexistent_user_returns_404`
    - `test_update_user_without_auth_returns_401`
  - Create `TestUsersDelete` class with:
    - `test_delete_user_returns_200`
    - `test_delete_nonexistent_user_returns_404`
    - `test_delete_user_without_admin_returns_403`

### 4.3 Farmers Tests

- [ ] **Task 4.3.1**: Refactor `backend/tests/test_api/test_farmers.py`
  - Import Pydantic schemas from tests.schemas.farmers
  - Import fixtures from tests.fixtures.farmer_fixtures
  - Create `TestFarmersList` class with:
    - `test_list_farmers_returns_200` with PaginatedResponse validation
    - `test_list_farmers_with_pagination` validating page, page_size, total_items
    - `test_list_farmers_with_search_filter`
    - `test_list_farmers_with_is_active_filter`
    - `test_list_farmers_without_auth_returns_401`
  - Create `TestFarmersGet` class with:
    - `test_get_farmer_by_id_returns_200` validating FarmerResponse
    - `test_get_nonexistent_farmer_returns_404`
    - `test_get_farmer_without_auth_returns_401`
  - Create `TestFarmersCreate` class with:
    - `test_create_farmer_returns_201` using FarmerCreate schema
    - `test_create_farmer_with_duplicate_code_returns_409` validating RESOURCE_ALREADY_EXISTS
    - `test_create_farmer_with_invalid_phone_returns_400`
    - `test_create_farmer_without_admin_returns_403`
  - Create `TestFarmersUpdate` class with:
    - `test_update_farmer_returns_200` using FarmerUpdate schema
    - `test_update_nonexistent_farmer_returns_404`
    - `test_update_farmer_without_admin_returns_403`
  - Create `TestFarmersDelete` class with:
    - `test_delete_farmer_returns_200`
    - `test_delete_nonexistent_farmer_returns_404`
  - Create `TestFarmersBalance` class with:
    - `test_get_farmer_balance_returns_200` validating FarmerBalance
    - `test_get_balance_nonexistent_farmer_returns_404`

### 4.4 Flower Types Tests

- [ ] **Task 4.4.1**: Create `backend/tests/test_api/test_flower_types.py`
  - Import Pydantic schemas from tests.schemas.flower_types
  - Create `TestFlowerTypesList` class with:
    - `test_list_flower_types_returns_200`
    - `test_list_flower_types_with_pagination`
    - `test_list_flower_types_without_auth_returns_401`
  - Create `TestFlowerTypesGet` class with:
    - `test_get_flower_type_by_id_returns_200`
    - `test_get_nonexistent_flower_type_returns_404`

### 4.5 Time Slots Tests

- [ ] **Task 4.5.1**: Create `backend/tests/test_api/test_time_slots.py`
  - Import Pydantic schemas from tests.schemas.time_slots
  - Create `TestTimeSlotsList` class with:
    - `test_list_time_slots_returns_200`
    - `test_list_time_slots_without_auth_returns_401`
  - Create `TestTimeSlotsGet` class with:
    - `test_get_time_slot_by_id_returns_200`
    - `test_get_nonexistent_time_slot_returns_404`

### 4.6 Market Rates Tests

- [ ] **Task 4.6.1**: Refactor `backend/tests/test_api/test_market_rates.py`
  - Import Pydantic schemas from tests.schemas.market_rates
  - Create `TestMarketRatesList` class with:
    - `test_list_market_rates_returns_200` with PaginatedResponse validation
    - `test_list_market_rates_with_flower_type_filter`
    - `test_list_market_rates_with_time_slot_filter`
    - `test_list_market_rates_without_auth_returns_401`
  - Create `TestMarketRatesCurrent` class with:
    - `test_get_current_rate_returns_200` validating CurrentRateResponse
    - `test_get_current_rate_without_flower_type_returns_400`
  - Create `TestMarketRatesCreate` class with:
    - `test_create_market_rate_returns_201` using MarketRateCreate
    - `test_create_market_rate_without_admin_returns_403`

### 4.7 Daily Entries Tests

- [ ] **Task 4.7.1**: Refactor `backend/tests/test_api/test_daily_entries.py`
  - Import Pydantic schemas from tests.schemas.daily_entries
  - Import fixtures from tests.fixtures.entry_fixtures
  - Create `TestDailyEntriesList` class with:
    - `test_list_daily_entries_returns_200` with PaginatedResponse validation
    - `test_list_daily_entries_with_farmer_filter`
    - `test_list_daily_entries_with_date_filter`
    - `test_list_daily_entries_with_pagination`
    - `test_list_daily_entries_without_auth_returns_401`
  - Create `TestDailyEntriesGet` class with:
    - `test_get_daily_entry_by_id_returns_200` validating DailyEntryResponse
    - `test_get_nonexistent_entry_returns_404`
  - Create `TestDailyEntriesCreate` class with:
    - `test_create_daily_entry_returns_201` using DailyEntryCreate schema
    - `test_create_daily_entry_with_invalid_farmer_returns_404`
    - `test_create_daily_entry_with_invalid_flower_type_returns_404`
    - `test_create_daily_entry_without_rate_returns_422` validating NO_APPLICABLE_RATE
    - `test_create_daily_entry_without_auth_returns_401`
  - Create `TestDailyEntriesUpdate` class with:
    - `test_update_daily_entry_returns_200` using DailyEntryUpdate
    - `test_update_entry_in_settlement_returns_403` validating INVALID_STATE_TRANSITION
    - `test_update_nonexistent_entry_returns_404`
  - Create `TestDailyEntriesDelete` class with:
    - `test_delete_daily_entry_returns_200`
    - `test_delete_entry_in_settlement_returns_403`
    - `test_delete_nonexistent_entry_returns_404`

### 4.8 Cash Advances Tests

- [ ] **Task 4.8.1**: Refactor `backend/tests/test_api/test_cash_advances.py`
  - Import Pydantic schemas from tests.schemas.cash_advances
  - Create `TestCashAdvancesList` class with:
    - `test_list_cash_advances_returns_200`
    - `test_list_cash_advances_with_farmer_filter`
    - `test_list_cash_advances_with_status_filter`
    - `test_list_cash_advances_without_auth_returns_401`
  - Create `TestCashAdvancesCreate` class with:
    - `test_create_cash_advance_returns_201` using CashAdvanceCreate
    - `test_create_cash_advance_with_invalid_farmer_returns_404`
  - Create `TestCashAdvancesApprove` class with:
    - `test_approve_cash_advance_returns_200` using CashAdvanceApproveRequest
    - `test_approve_without_admin_returns_403`
    - `test_approve_already_processed_returns_422`
  - Create `TestCashAdvancesReject` class with:
    - `test_reject_cash_advance_returns_200`
    - `test_reject_without_admin_returns_403`

### 4.9 Settlements Tests

- [ ] **Task 4.9.1**: Refactor `backend/tests/test_api/test_settlements.py`
  - Import Pydantic schemas from tests.schemas.settlements
  - Create `TestSettlementsList` class with:
    - `test_list_settlements_returns_200`
    - `test_list_settlements_with_farmer_filter`
    - `test_list_settlements_with_status_filter`
    - `test_list_settlements_without_auth_returns_401`
  - Create `TestSettlementsGet` class with:
    - `test_get_settlement_by_id_returns_200` validating SettlementResponse with items
    - `test_get_nonexistent_settlement_returns_404`
  - Create `TestSettlementsGenerate` class with:
    - `test_generate_settlement_returns_201` using SettlementCreateRequest
    - `test_generate_with_no_entries_returns_422` validating NO_ENTRIES_FOUND
    - `test_generate_without_auth_returns_401`
  - Create `TestSettlementsApprove` class with:
    - `test_approve_settlement_returns_200` using SettlementApproveRequest
    - `test_approve_without_auth_returns_401`
  - Create `TestSettlementsMarkPaid` class with:
    - `test_mark_settlement_paid_returns_200`
    - `test_mark_paid_without_admin_returns_403`

### 4.10 Notifications Tests

- [ ] **Task 4.10.1**: Create `backend/tests/test_api/test_notifications.py`
  - Import Pydantic schemas from tests.schemas.notifications
  - Create `TestNotificationsList` class with:
    - `test_list_notifications_returns_200`
    - `test_list_notifications_with_status_filter`
    - `test_list_notifications_with_channel_filter`
  - Create `TestNotificationsMarkRead` class with:
    - `test_mark_notification_read_returns_200`
    - `test_mark_read_without_auth_returns_401`

### 4.11 Reports Tests

- [ ] **Task 4.11.1**: Refactor `backend/tests/test_api/test_reports.py`
  - Import Pydantic schemas from tests.schemas.reports
  - Create `TestDailySummary` class with:
    - `test_daily_summary_returns_200` validating DailySummaryResponse
    - `test_daily_summary_without_auth_returns_401`
  - Create `TestFarmerSummary` class with:
    - `test_farmer_summary_returns_200` validating FarmerSummaryResponse
    - `test_farmer_summary_without_auth_returns_401`

### 4.12 Data Import Tests

- [ ] **Task 4.12.1**: Create `backend/tests/test_api/test_data_import.py`
  - Create `TestFarmerImport` class with:
    - `test_import_farmers_returns_200`
    - `test_import_with_invalid_file_returns_400`
    - `test_import_without_admin_returns_403`
  - Create `TestFarmerImportTemplate` class with:
    - `test_download_template_returns_200`
  - Create `TestFarmerImportPreview` class with:
    - `test_preview_import_returns_200`

---

## Phase 5: Documentation Updates

### 5.1 Update AGENTS.md

- [ ] **Task 5.1.1**: Update `AGENTS.md` Testing section
  - Update backend testing commands to reference new structure
  - Remove any references to Playwright API tests
  - Add note about Pydantic validation in tests

### 5.2 Update Backend README

- [ ] **Task 5.2.1**: Update `backend/README.md`
  - Add section on test directory structure
  - Add examples of running tests with new schemas
  - Document the Pydantic validation approach

### 5.3 Update Testing Guide

- [ ] **Task 5.3.1**: Update `docs/testing-guide.md`
  - Add section on API contract testing with Pydantic
  - Document the response validation utilities
  - Add examples of writing new tests with schemas

---

## Verification Checklist

### After Phase 1 Completion
- [ ] Verify `frontend/tests/api/` directory no longer exists
- [ ] Verify `backend/tests/schemas/`, `backend/tests/fixtures/`, `backend/tests/utils/` directories exist

### After Phase 2 Completion
- [ ] Run `python -c "from tests.schemas import *"` to verify all schemas import correctly
- [ ] Verify all Pydantic models validate against sample data

### After Phase 3 Completion
- [ ] Run `pytest --collect-only` to verify fixtures are discovered
- [ ] Verify API client can make requests to test server

### After Phase 4 Completion
- [ ] Run `pytest tests/test_api/ -v` to execute all tests
- [ ] Verify all tests pass with Pydantic validation
- [ ] Run `pytest --cov=app --cov-report=html` for coverage report

### Final Verification
- [ ] Run full test suite: `pytest tests/`
- [ ] Verify no Playwright dependencies remain for API testing
- [ ] Verify all response schemas are validated with Pydantic
- [ ] Verify all error responses are validated with correct error codes
