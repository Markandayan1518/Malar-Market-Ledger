# Malar Market Digital Ledger - API Design

## Table of Contents

1. [Overview](#overview)
2. [API Standards](#api-standards)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Response Format](#response-format)

---

## Overview

This document defines the RESTful API design for the Malar Market Digital Ledger backend. The API follows REST principles over HTTPS with JSON request/response format and lower_snake_case naming convention.

### Base URL

```
Production: https://api.malar-market-ledger.com/api/v1
Staging: https://api-staging.malar-market-ledger.com/api/v1
Development: http://localhost:8000/api/v1
```

---

## API Standards

### Naming Conventions

- **Endpoints**: kebab-case (e.g., `/daily-entries`)
- **Request/Response Fields**: lower_snake_case (e.g., `farmer_id`)
- **Query Parameters**: lower_snake_case (e.g., `page_size=20`)
- **HTTP Methods**: UPPERCASE (e.g., GET, POST, PUT, DELETE)

### Date/Time Format

All dates and timestamps follow ISO 8601 format:
```
2026-02-14T05:30:00Z
```

### Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|----------|-------------|
| page | integer | 1 | Page number (1-indexed) |
| page_size | integer | 20 | Items per page (max: 100) |
| sort_by | string | created_at | Field to sort by |
| sort_order | string | desc | Sort order: asc, desc |

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

### Filtering

List endpoints support filtering with query parameters:

```
/api/v1/daily-entries?farmer_id=xxx&date_from=2026-02-01&date_to=2026-02-14
```

### Field Selection

Clients can request specific fields using the `fields` parameter:

```
/api/v1/farmers?fields=id,name,phone,current_balance
```

---

## Authentication Flow

### JWT Token-Based Authentication

The API uses JWT (JSON Web Tokens) for authentication with refresh token rotation.

#### 1. Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "admin@malar.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@malar.com",
      "full_name": "Admin User",
      "role": "admin",
      "language_preference": "en"
    }
  },
  "message": "Login successful"
}
```

#### 2. Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 900
  },
  "message": "Token refreshed successfully"
}
```

#### 3. Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Protected Endpoints

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### Authentication Module

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** See Authentication Flow section above

**Error Codes:**
- `401`: Invalid credentials
- `423`: Account locked

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:** See Authentication Flow section above

**Error Codes:**
- `401`: Invalid or expired refresh token

#### POST /auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /auth/forgot-password
Initiate password reset.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "string",
  "new_password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### Users Module

#### GET /users
List all users (Admin only).

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `role`: Filter by role (admin, staff, farmer)
- `is_active`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@malar.com",
      "full_name": "Admin User",
      "phone": "+919876543210",
      "role": "admin",
      "is_active": true,
      "email_verified": true,
      "language_preference": "en",
      "created_at": "2026-02-14T04:00:00Z",
      "updated_at": "2026-02-14T04:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 5,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Permissions:** Admin only

#### GET /users/{user_id}
Get user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@malar.com",
    "full_name": "Admin User",
    "phone": "+919876543210",
    "role": "admin",
    "is_active": true,
    "email_verified": true,
    "language_preference": "en",
    "created_at": "2026-02-14T04:00:00Z",
    "updated_at": "2026-02-14T04:00:00Z"
  }
}
```

**Permissions:** Admin, or own user

#### POST /users
Create new user (Admin only).

**Request Body:**
```json
{
  "email": "staff@malar.com",
  "password": "securepassword123",
  "full_name": "Staff User",
  "phone": "+919876543211",
  "role": "staff",
  "language_preference": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "staff@malar.com",
    "full_name": "Staff User",
    "phone": "+919876543211",
    "role": "staff",
    "is_active": true,
    "email_verified": false,
    "language_preference": "en",
    "created_at": "2026-02-14T04:00:00Z",
    "updated_at": "2026-02-14T04:00:00Z"
  },
  "message": "User created successfully"
}
```

**Permissions:** Admin only

**Error Codes:**
- `400`: Validation error
- `409`: Email already exists

#### PUT /users/{user_id}
Update user (Admin or own user).

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "phone": "+919876543212",
  "language_preference": "ta"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "staff@malar.com",
    "full_name": "Updated Name",
    "phone": "+919876543212",
    "role": "staff",
    "is_active": true,
    "email_verified": false,
    "language_preference": "ta",
    "created_at": "2026-02-14T04:00:00Z",
    "updated_at": "2026-02-14T04:05:00Z"
  },
  "message": "User updated successfully"
}
```

**Permissions:** Admin, or own user (limited fields)

#### DELETE /users/{user_id}
Soft delete user (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Permissions:** Admin only

---

### Farmers Module

#### GET /farmers
List all farmers.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `is_active`: Filter by active status
- `search`: Search by name or code

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "farmer_code": "FAR001",
      "name": "Raj Kumar",
      "village": "Madurai",
      "phone": "+919876543211",
      "whatsapp_number": "+919876543211",
      "current_balance": 15000.00,
      "total_advances": 5000.00,
      "total_settlements": 20000.00,
      "commission_pct": 10.00,
      "flat_fee_monthly": 0.00,
      "is_active": true,
      "created_at": "2026-02-14T04:00:00Z",
      "updated_at": "2026-02-14T04:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 50,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

**Permissions:** Admin, Staff

#### GET /farmers/{farmer_id}
Get farmer by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "farmer_code": "FAR001",
    "name": "Raj Kumar",
    "village": "Madurai",
    "phone": "+919876543211",
    "whatsapp_number": "+919876543211",
    "address": "123, Flower Street, Madurai",
    "current_balance": 15000.00,
    "total_advances": 5000.00,
    "total_settlements": 20000.00,
    "commission_pct": 10.00,
    "flat_fee_monthly": 0.00,
    "is_active": true,
    "created_at": "2026-02-14T04:00:00Z",
    "updated_at": "2026-02-14T04:00:00Z"
  }
}
```

**Permissions:** Admin, Staff, own farmer

#### POST /farmers
Create new farmer (Admin only).

**Request Body:**
```json
{
  "farmer_code": "FAR002",
  "name": "Kumar Raja",
  "village": "Dindigul",
  "phone": "+919876543213",
  "whatsapp_number": "+919876543213",
  "address": "456, Market Road, Dindigul",
  "commission_pct": 10.00,
  "flat_fee_monthly": 0.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "farmer_code": "FAR002",
    "name": "Kumar Raja",
    "village": "Dindigul",
    "phone": "+919876543213",
    "whatsapp_number": "+919876543213",
    "address": "456, Market Road, Dindigul",
    "current_balance": 0.00,
    "total_advances": 0.00,
    "total_settlements": 0.00,
    "commission_pct": 10.00,
    "flat_fee_monthly": 0.00,
    "is_active": true,
    "created_at": "2026-02-14T04:10:00Z",
    "updated_at": "2026-02-14T04:10:00Z"
  },
  "message": "Farmer created successfully"
}
```

**Permissions:** Admin only

**Error Codes:**
- `400`: Validation error
- `409`: Farmer code or phone already exists

#### PUT /farmers/{farmer_id}
Update farmer (Admin only).

**Request Body:**
```json
{
  "name": "Updated Name",
  "village": "New Village",
  "phone": "+919876543214",
  "commission_pct": 12.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "farmer_code": "FAR002",
    "name": "Updated Name",
    "village": "New Village",
    "phone": "+919876543214",
    "whatsapp_number": "+919876543213",
    "address": "456, Market Road, Dindigul",
    "current_balance": 0.00,
    "total_advances": 0.00,
    "total_settlements": 0.00,
    "commission_pct": 12.00,
    "flat_fee_monthly": 0.00,
    "is_active": true,
    "created_at": "2026-02-14T04:10:00Z",
    "updated_at": "2026-02-14T04:15:00Z"
  },
  "message": "Farmer updated successfully"
}
```

**Permissions:** Admin only

#### GET /farmers/{farmer_id}/balance
Get farmer current balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "farmer_id": "660e8400-e29b-41d4-a716-446655440001",
    "current_balance": 15000.00,
    "total_advances": 5000.00,
    "total_settlements": 20000.00,
    "last_updated": "2026-02-14T04:00:00Z"
  }
}
```

**Permissions:** Admin, Staff, own farmer

---

### Flower Types Module

#### GET /flower-types
List all flower types.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `is_active`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "name": "Rose",
      "name_ta": "ரோஜா",
      "code": "FLW001",
      "description": "Fresh red roses",
      "unit": "kg",
      "is_active": true,
      "created_at": "2026-02-14T04:00:00Z",
      "updated_at": "2026-02-14T04:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 10,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Permissions:** All authenticated users

#### GET /flower-types/{flower_type_id}
Get flower type by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "name": "Rose",
    "name_ta": "ரோஜா",
    "code": "FLW001",
    "description": "Fresh red roses",
    "unit": "kg",
    "is_active": true,
    "created_at": "2026-02-14T04:00:00Z",
    "updated_at": "2026-02-14T04:00:00Z"
  }
}
```

**Permissions:** All authenticated users

---

### Time Slots Module

#### GET /time-slots
List all time slots.

**Query Parameters:**
- `is_active`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "name": "Early Morning",
      "name_ta": "காலை",
      "start_time": "04:00:00",
      "end_time": "06:00:00",
      "is_active": true,
      "created_at": "2026-02-14T04:00:00Z",
      "updated_at": "2026-02-14T04:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users

---

### Market Rates Module

#### GET /market-rates
List all market rates.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `flower_type_id`: Filter by flower type
- `time_slot_id`: Filter by time slot
- `effective_date`: Filter by effective date
- `is_active`: Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440005",
      "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
      "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
      "flower_type": {
        "name": "Rose",
        "name_ta": "ரோஜா",
        "code": "FLW001",
        "unit": "kg"
      },
      "time_slot": {
        "name": "Early Morning",
        "name_ta": "காலை",
        "start_time": "04:00:00",
        "end_time": "06:00:00"
      },
      "rate_per_unit": 150.00,
      "effective_date": "2026-02-14",
      "expiry_date": null,
      "is_active": true,
      "created_at": "2026-02-14T04:00:00Z",
      "updated_at": "2026-02-14T04:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 50,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

**Permissions:** All authenticated users

#### GET /market-rates/current
Get current applicable rates for a flower type and time.

**Query Parameters:**
- `flower_type_id`: Required
- `entry_time`: Required (ISO 8601 time)

**Response:**
```json
{
  "success": true,
  "data": {
    "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
    "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
    "rate_per_unit": 150.00,
    "effective_date": "2026-02-14",
    "time_slot": {
      "name": "Early Morning",
      "name_ta": "காலை",
      "start_time": "04:00:00",
      "end_time": "06:00:00"
    }
  }
}
```

**Permissions:** All authenticated users

#### POST /market-rates
Create new market rate (Admin only).

**Request Body:**
```json
{
  "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
  "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
  "rate_per_unit": 155.00,
  "effective_date": "2026-02-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-4466554406",
    "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
    "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
    "rate_per_unit": 155.00,
    "effective_date": "2026-02-15",
    "expiry_date": null,
    "is_active": true,
    "created_at": "2026-02-14T04:20:00Z",
    "updated_at": "2026-02-14T04:20:00Z"
  },
  "message": "Market rate created successfully"
}
```

**Permissions:** Admin only

---

### Daily Entries Module

#### GET /daily-entries
List all daily entries.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `farmer_id`: Filter by farmer
- `flower_type_id`: Filter by flower type
- `entry_date`: Filter by date
- `date_from`: Filter from date
- `date_to`: Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-4466554406",
      "farmer_id": "660e8400-e29b-41d4-a716-446655440001",
      "farmer": {
        "farmer_code": "FAR001",
        "name": "Raj Kumar"
      },
      "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
      "flower_type": {
        "name": "Rose",
        "name_ta": "ரோஜா",
        "code": "FLW001",
        "unit": "kg"
      },
      "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
      "time_slot": {
        "name": "Early Morning",
        "name_ta": "காலை",
        "start_time": "04:00:00",
        "end_time": "06:00:00"
      },
      "entry_date": "2026-02-14",
      "entry_time": "05:30:00",
      "quantity": 10.50,
      "rate_per_unit": 150.00,
      "total_amount": 1575.00,
      "commission_rate": 5.00,
      "commission_amount": 78.75,
      "manual_adj_amount": 0.00,
      "adj_reason_code": null,
      "net_amount": 1496.25,
      "notes": null,
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-14T05:30:00Z",
      "updated_at": "2026-02-14T05:30:00Z"
    }
  ],
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

**Permissions:** Admin, Staff

#### GET /daily-entries/{entry_id}
Get daily entry by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-4466554406",
    "farmer_id": "660e8400-e29b-41d4-a716-446655440001",
    "farmer": {
      "farmer_code": "FAR001",
      "name": "Raj Kumar",
      "phone": "+919876543211"
    },
    "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
    "flower_type": {
      "name": "Rose",
      "name_ta": "ரோஜா",
      "code": "FLW001",
      "unit": "kg"
    },
    "time_slot_id": "880e8400-e29b-41d4-a716-446655440004",
    "time_slot": {
      "name": "Early Morning",
      "name_ta": "காலை",
      "start_time": "04:00:00",
      "end_time": "06:00:00"
    },
    "entry_date": "2026-02-14",
    "entry_time": "05:30:00",
    "quantity": 10.50,
    "rate_per_unit": 150.00,
    "total_amount": 1575.00,
    "commission_rate": 5.00,
    "commission_amount": 78.75,
    "manual_adj_amount": 0.00,
    "adj_reason_code": null,
    "net_amount": 1496.25,
    "notes": null,
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-02-14T05:30:00Z",
    "updated_at": "2026-02-14T05:30:00Z"
  }
}
```

**Permissions:** Admin, Staff

#### POST /daily-entries
Create new daily entry.

**Request Body:**
```json
{
  "farmer_id": "660e8400-e29b-41d4-a716-446655440001",
  "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
  "entry_date": "2026-02-14",
  "entry_time": "05:30:00",
  "quantity": 10.50,
  "notes": "Fresh roses",
  "manual_adj_amount": -50.00,
  "adj_reason_code": "WET"
}
```

**Adjustment Reason Codes:**

| Code | Description |
|------|-------------|
| LATE | Late delivery adjustment |
| WET | Wet flowers discount |
| QUALITY | Quality-based adjustment |
| BONUS | Bonus payment |
| OTHER | Other reasons |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-4466554406",
    "farmer_id": "660e8400-e29b-41d4-a716-446655440001",
    "flower_type_id": "770e8400-e29b-41d4-a716-446655440003",
    "time_slot_id": "880e8400-e29b-41d4-a716-4466554404",
    "entry_date": "2026-02-14",
    "entry_time": "05:30:00",
    "quantity": 10.50,
    "rate_per_unit": 150.00,
    "total_amount": 1575.00,
    "commission_rate": 5.00,
    "commission_amount": 78.75,
    "manual_adj_amount": -50.00,
    "adj_reason_code": "WET",
    "net_amount": 1446.25,
    "notes": "Fresh roses",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T05:30:00Z",
    "updated_at": "2026-02-14T05:30:00Z"
  },
  "message": "Daily entry created successfully"
}
```

**Permissions:** Admin, Staff

**Note:** The API automatically determines the time slot based on `entry_time`, applies the appropriate market rate, and calculates totals. The net_amount is calculated as: `net_amount = total_amount - commission_amount + manual_adj_amount`.

**Error Codes:**
- `400`: Validation error
- `404`: Farmer or flower type not found
- `422`: No applicable market rate found

#### PUT /daily-entries/{entry_id}
Update daily entry.

**Request Body:**
```json
{
  "quantity": 12.00,
  "entry_time": "05:45:00",
  "notes": "Updated quantity",
  "manual_adj_amount": 0.00,
  "adj_reason_code": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-4466554406",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "flower_type_id": "770e8400-e29b-41d4-a716-4466554403",
    "time_slot_id": "880e8400-e29b-41d4-a716-4466554404",
    "entry_date": "2026-02-14",
    "entry_time": "05:45:00",
    "quantity": 12.00,
    "rate_per_unit": 150.00,
    "total_amount": 1800.00,
    "commission_rate": 5.00,
    "commission_amount": 90.00,
    "manual_adj_amount": 0.00,
    "adj_reason_code": null,
    "net_amount": 1710.00,
    "notes": "Updated quantity",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T05:30:00Z",
    "updated_at": "2026-02-14T05:35:00Z"
  },
  "message": "Daily entry updated successfully"
}
```

**Permissions:** Admin, Staff (own entries only)

**Error Codes:**
- `403`: Cannot edit entry already in settlement
- `422`: No applicable market rate found

#### DELETE /daily-entries/{entry_id}
Soft delete daily entry.

**Response:**
```json
{
  "success": true,
  "message": "Daily entry deleted successfully"
}
```

**Permissions:** Admin, Staff (own entries only)

**Error Codes:**
- `403`: Cannot delete entry already in settlement

---

### Cash Advances Module

#### GET /cash-advances
List all cash advances.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `farmer_id`: Filter by farmer
- `status`: Filter by status (pending, approved, rejected)
- `advance_date`: Filter by date
- `date_from`: Filter from date
- `date_to`: Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bb0e8400-e29b-41d4-a716-4466554407",
      "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
      "farmer": {
        "farmer_code": "FAR001",
        "name": "Raj Kumar"
      },
      "amount": 5000.00,
      "reason": "Emergency medical expense",
      "advance_date": "2026-02-14",
      "status": "pending",
      "approved_by": null,
      "approved_at": null,
      "notes": null,
      "created_by": "550e8400-e29b-41d4-a716-4466554400",
      "created_at": "2026-02-14T06:00:00Z",
      "updated_at": "2026-02-14T06:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 25,
    "total_pages": 2,
    "has_next": true,
    "has_previous": false
  }
}
```

**Permissions:** Admin, Staff

#### POST /cash-advances
Create new cash advance request.

**Request Body:**
```json
{
  "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
  "amount": 5000.00,
  "reason": "Emergency medical expense",
  "advance_date": "2026-02-14",
  "notes": "Urgent request"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-4466554407",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "amount": 5000.00,
    "reason": "Emergency medical expense",
    "advance_date": "2026-02-14",
    "status": "pending",
    "approved_by": null,
    "approved_at": null,
    "notes": "Urgent request",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T06:00:00Z",
    "updated_at": "2026-02-14T06:00:00Z"
  },
  "message": "Cash advance request created successfully"
}
```

**Permissions:** Admin, Staff

#### PUT /cash-advances/{advance_id}/approve
Approve cash advance (Admin only).

**Request Body:**
```json
{
  "notes": "Approved as emergency"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-4466554407",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "amount": 5000.00,
    "reason": "Emergency medical expense",
    "advance_date": "2026-02-14",
    "status": "approved",
    "approved_by": "550e8400-e29b-41d4-a716-4466554400",
    "approved_at": "2026-02-14T06:15:00Z",
    "notes": "Approved as emergency",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T06:00:00Z",
    "updated_at": "2026-02-14T06:15:00Z"
  },
  "message": "Cash advance approved successfully"
}
```

**Permissions:** Admin only

#### PUT /cash-advances/{advance_id}/reject
Reject cash advance (Admin only).

**Request Body:**
```json
{
  "notes": "Insufficient balance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-4466554407",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "amount": 5000.00,
    "reason": "Emergency medical expense",
    "advance_date": "2026-02-14",
    "status": "rejected",
    "approved_by": "550e8400-e29b-41d4-a716-4466554400",
    "approved_at": "2026-02-14T06:20:00Z",
    "notes": "Insufficient balance",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T06:00:00Z",
    "updated_at": "2026-02-14T06:20:00Z"
  },
  "message": "Cash advance rejected successfully"
}
```

**Permissions:** Admin only

---

### Settlements Module

#### GET /settlements
List all settlements.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `farmer_id`: Filter by farmer
- `status`: Filter by status (draft, pending_approval, approved, paid)
- `settlement_date`: Filter by date
- `date_from`: Filter from date
- `date_to`: Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-4466554408",
      "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
      "farmer": {
        "farmer_code": "FAR001",
        "name": "Raj Kumar"
      },
      "settlement_date": "2026-02-14",
      "settlement_number": "SET-2026-02-001",
      "period_start": "2026-02-01",
      "period_end": "2026-02-14",
      "total_entries": 25,
      "total_quantity": 250.00,
      "gross_amount": 37500.00,
      "total_commission": 1875.00,
      "total_fees": 500.00,
      "total_advances": 5000.00,
      "net_payable": 30125.00,
      "status": "pending_approval",
      "approved_by": null,
      "approved_at": null,
      "paid_at": null,
      "notes": "Regular settlement",
      "created_by": "550e8400-e29b-41d4-a716-4466554400",
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 50,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

**Permissions:** Admin, Staff

#### GET /settlements/{settlement_id}
Get settlement by ID with items.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-4466554408",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "farmer": {
      "farmer_code": "FAR001",
      "name": "Raj Kumar",
      "phone": "+919876543211"
    },
    "settlement_date": "2026-02-14",
    "settlement_number": "SET-2026-02-001",
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_entries": 25,
    "total_quantity": 250.00,
    "gross_amount": 37500.00,
    "total_commission": 1875.00,
    "total_fees": 500.00,
    "total_advances": 5000.00,
    "net_payable": 30125.00,
    "status": "pending_approval",
    "approved_by": null,
    "approved_at": null,
    "paid_at": null,
    "notes": "Regular settlement",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:00:00Z",
    "items": [
      {
        "id": "dd0e8400-e29b-41d4-a716-4466554409",
        "daily_entry_id": "aa0e8400-e29b-41d4-a716-4466554406",
        "entry_date": "2026-02-14",
        "flower_type": "Rose",
        "quantity": 10.50,
        "rate_per_unit": 150.00,
        "total_amount": 1575.00,
        "commission_amount": 78.75,
        "net_amount": 1496.25
      }
    ]
  }
}
```

**Permissions:** Admin, Staff, own farmer

#### POST /settlements/generate
Generate settlement for a farmer.

**Request Body:**
```json
{
  "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
  "period_start": "2026-02-01",
  "period_end": "2026-02-14",
  "notes": "Regular settlement"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-4466554408",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "settlement_date": "2026-02-14",
    "settlement_number": "SET-2026-02-001",
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_entries": 25,
    "total_quantity": 250.00,
    "gross_amount": 37500.00,
    "total_commission": 1875.00,
    "total_fees": 500.00,
    "total_advances": 5000.00,
    "net_payable": 30125.00,
    "status": "draft",
    "approved_by": null,
    "approved_at": null,
    "paid_at": null,
    "notes": "Regular settlement",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:00:00Z"
  },
  "message": "Settlement generated successfully"
}
```

**Permissions:** Admin, Staff

**Error Codes:**
- `404`: Farmer not found
- `422`: No entries found for period

#### PUT /settlements/{settlement_id}/approve
Approve settlement (Admin, Staff, Farmer).

**Request Body:**
```json
{
  "notes": "Settlement approved"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-4466554408",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "settlement_date": "2026-02-14",
    "settlement_number": "SET-2026-02-001",
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_entries": 25,
    "total_quantity": 250.00,
    "gross_amount": 37500.00,
    "total_commission": 1875.00,
    "total_fees": 500.00,
    "total_advances": 5000.00,
    "net_payable": 30125.00,
    "status": "approved",
    "approved_by": "550e8400-e29b-41d4-a716-4466554400",
    "approved_at": "2026-02-14T10:30:00Z",
    "paid_at": null,
    "notes": "Settlement approved",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T10:30:00Z"
  },
  "message": "Settlement approved successfully"
}
```

**Permissions:** Admin, Staff, own farmer

#### PUT /settlements/{settlement_id}/mark-paid
Mark settlement as paid (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-4466554408",
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "settlement_date": "2026-02-14",
    "settlement_number": "SET-2026-02-001",
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_entries": 25,
    "total_quantity": 250.00,
    "gross_amount": 37500.00,
    "total_commission": 1875.00,
    "total_fees": 500.00,
    "total_advances": 5000.00,
    "net_payable": 30125.00,
    "status": "paid",
    "approved_by": "550e8400-e29b-41d4-a716-4466554400",
    "approved_at": "2026-02-14T10:30:00Z",
    "paid_at": "2026-02-14T11:00:00Z",
    "notes": "Settlement approved",
    "created_by": "550e8400-e29b-41d4-a716-4466554400",
    "created_at": "2026-02-14T10:00:00Z",
    "updated_at": "2026-02-14T11:00:00Z"
  },
  "message": "Settlement marked as paid successfully"
}
```

**Permissions:** Admin only

---

### Reports Module

#### GET /reports/daily-summary
Get daily summary report.

**Query Parameters:**
- `date`: Required (ISO 8601 date)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-14",
    "total_entries": 100,
    "total_quantity": 1000.00,
    "gross_amount": 150000.00,
    "total_commission": 7500.00,
    "net_amount": 142500.00,
    "unique_farmers": 25,
    "flower_type_breakdown": [
      {
        "flower_type": "Rose",
        "total_quantity": 500.00,
        "total_amount": 75000.00
      }
    ]
  }
}
```

**Permissions:** Admin, Staff

#### GET /reports/farmer-summary
Get farmer summary report.

**Query Parameters:**
- `farmer_id`: Required
- `period_start`: Required
- `period_end`: Required

**Response:**
```json
{
  "success": true,
  "data": {
    "farmer_id": "660e8400-e29b-41d4-a716-4466554401",
    "farmer": {
      "farmer_code": "FAR001",
      "name": "Raj Kumar"
    },
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_entries": 25,
    "total_quantity": 250.00,
    "gross_amount": 37500.00,
    "total_commission": 1875.00,
    "net_amount": 35625.00,
    "advances_taken": 5000.00,
    "settlements_received": 20000.00,
    "current_balance": 15000.00
  }
}
```

**Permissions:** Admin, Staff, own farmer

---

### Notifications Module

#### GET /notifications
List notifications for authenticated user.

**Query Parameters:**
- `page`, `page_size`, `sort_by`, `sort_order` (pagination)
- `status`: Filter by status (pending, sent, failed)
- `channel`: Filter by channel (whatsapp, in_app)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ee0e8400-e29b-41d4-a716-4466554410",
      "type": "settlement_created",
      "channel": "whatsapp",
      "status": "sent",
      "title": "Settlement Created",
      "title_ta": "தீர்வை உருவாக்கப்படுத்தப்படு",
      "message": "Your settlement SET-2026-02-001 has been created with net payable amount of ₹30,125.00",
      "message_ta": "உங்கள் தீர்வை SET-2026-02-001 உருவாக்கப்படுத்தப்படு, நிகர செலுக்கப்படு தொகை ₹30,125.00",
      "sent_at": "2026-02-14T10:05:00Z",
      "created_at": "2026-02-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 10,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Permissions:** All authenticated users

#### PUT /notifications/{notification_id}/mark-read
Mark notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Permissions:** All authenticated users (own notifications only)

---

### System Settings Module

#### GET /system-settings
List all system settings.

**Query Parameters:**
- `is_public`: Filter by public visibility

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "commission_rate",
      "value": "5.0",
      "value_type": "number",
      "description": "Default commission rate percentage",
      "is_public": false
    },
    {
      "key": "market_open_time",
      "value": "04:00:00",
      "value_type": "string",
      "description": "Market opening time",
      "is_public": true
    }
  ]
}
```

**Permissions:** Admin (all), others (public only)

#### PUT /system-settings/{key}
Update system setting (Admin only).

**Request Body:**
```json
{
  "value": "6.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "commission_rate",
    "value": "6.0",
    "value_type": "number",
    "description": "Default commission rate percentage",
    "is_public": false,
    "updated_at": "2026-02-14T12:00:00Z"
  },
  "message": "System setting updated successfully"
}
```

**Permissions:** Admin only

---

### Data Import Module

#### POST /data/import/farmers
Bulk import farmers from Excel/CSV file.

**Request:** `multipart/form-data`
- `file`: Excel (.xlsx) or CSV file with farmer data

**Required Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| farmer_code | string | Yes | Unique farmer code |
| name | string | Yes | Farmer name |
| village | string | No | Village name |
| phone | string | Yes | Phone number with country code |
| whatsapp_number | string | No | WhatsApp number (defaults to phone) |
| address | string | No | Full address |
| commission_pct | number | No | Commission percentage (default: 10.00) |
| flat_fee_monthly | number | No | Monthly flat fee (default: 0.00) |

**Response:**
```json
{
  "success": true,
  "data": {
    "total_rows": 50,
    "imported": 48,
    "skipped": 2,
    "errors": [
      {
        "row": 15,
        "field": "farmer_code",
        "message": "Farmer code already exists"
      },
      {
        "row": 32,
        "field": "phone",
        "message": "Invalid phone number format"
      }
    ],
    "imported_ids": [
      "660e8400-e29b-41d4-a716-446655440001",
      "660e8400-e29b-41d4-a716-446655440002"
    ]
  },
  "message": "Import completed with 2 errors"
}
```

**Permissions:** Admin only

**Error Codes:**
- `400`: Invalid file format
- `422`: Validation errors in file data

#### POST /data/import/farmers/template
Download farmer import template file.

**Response:** Excel file download (`farmer_import_template.xlsx`)

**Permissions:** Admin only

#### GET /data/import/farmers/preview
Preview import file before committing.

**Query Parameters:**
- `file_id`: Temporary file ID from upload

**Response:**
```json
{
  "success": true,
  "data": {
    "total_rows": 50,
    "valid_rows": 48,
    "invalid_rows": 2,
    "preview": [
      {
        "row": 1,
        "data": {
          "farmer_code": "FAR001",
          "name": "Raj Kumar",
          "village": "Madurai",
          "phone": "+919876543211"
        },
        "valid": true,
        "errors": []
      },
      {
        "row": 15,
        "data": {
          "farmer_code": "FAR001",
          "name": "Duplicate",
          "phone": "+919876543299"
        },
        "valid": false,
        "errors": ["Farmer code already exists"]
      }
    ]
  }
}
```

**Permissions:** Admin only

### Invoices Module

#### GET /invoices
List invoices with filtering and pagination (Staff/Admin only).

**Query Parameters:**
- `page`, `page_size` (pagination)
- `status`: Filter by status (draft, pending, paid, cancelled)
- `farmer_id`: Filter by farmer
- `start_date`, `end_date`: Filter by date range
- `search`: Search by invoice number, customer name, or phone

**Permissions:** Staff, Admin

#### GET /invoices/{invoice_id}
Get invoice by ID with items.

**Permissions:** Staff, Admin

#### POST /invoices
Create new invoice.

**Request Body:**
```json
{
  "farmer_id": "string",
  "customer_name": "string",
  "customer_phone": "string",
  "customer_address": "string",
  "invoice_date": "2026-02-20",
  "due_date": "2026-03-20",
  "tax_rate": 18.00,
  "discount": 0.00,
  "notes": "string",
  "terms": "string",
  "settlement_id": "string (optional)",
  "items": [
    {
      "description": "string",
      "quantity": 50.00,
      "unit": "kg",
      "rate": 155.00,
      "flower_type_id": "string",
      "daily_entry_id": "string (optional)"
    }
  ]
}
```

**Permissions:** Staff, Admin

#### PUT /invoices/{invoice_id}
Update invoice (only draft/pending status).

**Permissions:** Staff, Admin

#### POST /invoices/{invoice_id}/send
Send invoice (change status from draft to pending).

**Permissions:** Staff, Admin

#### POST /invoices/{invoice_id}/payment
Record payment for invoice.

**Request Body:**
```json
{
  "amount": 5000.00,
  "notes": "Payment via UPI"
}
```

**Permissions:** Staff, Admin

#### POST /invoices/{invoice_id}/cancel
Cancel invoice with reason.

**Request Body:**
```json
{
  "reason": "Order cancelled by customer"
}
```

**Permissions:** Staff, Admin

#### DELETE /invoices/{invoice_id}
Soft delete invoice (Admin only).

**Permissions:** Admin

#### GET /invoices/{invoice_id}/pdf
Generate PDF for invoice.

**Query Parameters:**
- `language`: Output language (`en` or `ta`, default: `en`)

**Response:** PDF file download

**Permissions:** Staff, Admin

---

### Business Profile Module

#### GET /business-profile
Get active business profile (public endpoint, no auth required).

**Permissions:** Public

#### GET /business-profile/all
List all business profiles (Admin only).

**Permissions:** Admin

#### POST /business-profile
Create new business profile (Admin only, deactivates existing active profile).

**Request Body:**
```json
{
  "shop_name": "Malar Flower Market",
  "owner_name": "string",
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "pincode": "string",
  "phone": "string",
  "alternate_phone": "string",
  "email": "string",
  "gst_number": "string",
  "pan_number": "string",
  "bank_name": "string",
  "bank_account_number": "string",
  "bank_ifsc_code": "string",
  "bank_branch": "string",
  "upi_id": "string",
  "logo_url": "string",
  "invoice_prefix": "MLR",
  "invoice_notes": "string",
  "invoice_terms": "string"
}
```

**Permissions:** Admin

#### PUT /business-profile/{profile_id}
Update business profile (Admin only).

**Permissions:** Admin

#### POST /business-profile/{profile_id}/activate
Activate profile and deactivate all others (Admin only).

**Permissions:** Admin

#### DELETE /business-profile/{profile_id}
Delete business profile (Admin only, cannot delete active profile).

**Permissions:** Admin

---

## Additional Endpoints

### Health Check

#### GET /health
Check API service health (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "service": "malar-market-ledger"
}
```

### User Profile Endpoints

#### GET /users/me
Get current authenticated user info.

**Permissions:** Any authenticated user

#### PUT /users/me
Update current user profile.

**Query Parameters:**
- `full_name`: Full name
- `language_preference`: `en` or `ta`
- `theme_preference`: `arctic` or `warm`

**Permissions:** Any authenticated user

#### PUT /users/me/password
Change current user password.

**Query Parameters:**
- `current_password`: Current password (min 6 chars)
- `new_password`: New password (min 6 chars)

**Permissions:** Any authenticated user

#### GET /users/me/preferences
Get current user preferences (language, theme, notifications).

**Permissions:** Any authenticated user

#### PUT /users/me/preferences
Update current user preferences.

**Query Parameters:**
- `language`: `en` or `ta`
- `theme`: `arctic` or `warm`
- `notifications_enabled`: boolean

**Permissions:** Any authenticated user

#### POST /users/{user_id}/reset-password
Admin resets a user's password.

**Query Parameters:**
- `new_password`: New password (min 6 chars)

**Permissions:** Admin

### Farmer Extended Endpoints

#### GET /farmers/search
Quick search for autocomplete (returns simplified list).

**Query Parameters:**
- `q`: Search query (required, min 1 char)
- `limit`: Max results (1-50, default 10)

**Permissions:** Staff, Admin

#### DELETE /farmers/{farmer_id}
Soft delete farmer (fails if farmer has existing entries).

**Permissions:** Staff, Admin

#### PATCH /farmers/{farmer_id}/deactivate
Deactivate farmer.

**Permissions:** Staff, Admin

#### PATCH /farmers/{farmer_id}/activate
Activate farmer.

**Permissions:** Staff, Admin

#### GET /farmers/{farmer_id}/products
Get flower types linked to a farmer with entry counts.

**Permissions:** Staff, Admin

#### POST /farmers/{farmer_id}/products
Add flower types to farmer profile.

**Request Body:**
```json
{
  "flower_type_ids": ["uuid1", "uuid2"]
}
```

**Permissions:** Staff, Admin

#### DELETE /farmers/{farmer_id}/products/{product_id}
Remove flower type from farmer profile (soft delete).

**Permissions:** Staff, Admin

#### GET /farmers/{farmer_id}/suggested-flower
Get suggested flower type based on farmer history.

**Permissions:** Staff, Admin

### Flower Type Extended Endpoints

#### GET /flower-types/active
List all active flower types for dropdowns.

**Permissions:** Any authenticated user

#### POST /flower-types
Create new flower type.

**Query Parameters:**
- `name`: Name (required)
- `name_ta`: Tamil name (required)
- `unit`: Unit (default: kg)

**Permissions:** Staff, Admin

#### PUT /flower-types/{flower_type_id}
Update flower type.

**Permissions:** Staff, Admin

#### DELETE /flower-types/{flower_type_id}
Soft delete flower type.

**Permissions:** Admin

#### PATCH /flower-types/{flower_type_id}/deactivate
Deactivate flower type.

**Permissions:** Staff, Admin

#### PATCH /flower-types/{flower_type_id}/activate
Activate flower type.

**Permissions:** Staff, Admin

### Time Slot Extended Endpoints

#### GET /time-slots/active
List all active time slots for dropdowns.

**Permissions:** Any authenticated user

#### POST /time-slots
Create new time slot.

**Query Parameters:**
- `name`: Name (required)
- `name_ta`: Tamil name (required)
- `start_time`: Start time in HH:MM (required)
- `end_time`: End time in HH:MM (required)

**Permissions:** Staff, Admin

#### PUT /time-slots/{time_slot_id}
Update time slot.

**Permissions:** Staff, Admin

#### DELETE /time-slots/{time_slot_id}
Soft delete time slot.

**Permissions:** Admin

#### PATCH /time-slots/{time_slot_id}/deactivate | /activate
Deactivate or activate time slot.

**Permissions:** Staff, Admin

### Market Rate Extended Endpoints

#### GET /market-rates/{rate_id}
Get market rate by ID.

**Permissions:** Any authenticated user

#### POST /market-rates/bulk
Create multiple market rates at once.

**Request Body:** Array of rate objects with `flower_type_id`, `time_slot_id`, `rate_per_unit`, `effective_date`.

**Permissions:** Staff, Admin

#### PUT /market-rates/{rate_id}
Update market rate.

**Permissions:** Staff, Admin

#### DELETE /market-rates/{rate_id}
Soft delete market rate.

**Permissions:** Admin

#### GET /market-rates/history/{flower_type_id}
Get rate history for a flower type.

**Query Parameters:**
- `days`: Number of days (1-365, default 30)
- `time_slot_id`: Optional filter by time slot

**Permissions:** Any authenticated user

### Daily Entry Extended Endpoints

#### GET /daily-entries/summary
Get daily summary statistics for a date.

**Query Parameters:**
- `entry_date`: Required date (YYYY-MM-DD)

**Response includes:** total_entries, total_quantity, gross_amount, total_commission, net_amount, unique_farmers, flower_type_breakdown

**Permissions:** Staff, Admin

#### POST /daily-entries/bulk
Create multiple entries in bulk (for offline sync).

**Request Body:**
```json
{
  "entries": [
    {
      "farmer_id": "string",
      "flower_type_id": "string",
      "entry_date": "2026-02-15",
      "entry_time": "06:00:00",
      "quantity": 15.00,
      "notes": "string"
    }
  ]
}
```

**Permissions:** Staff, Admin

### Cash Advance Extended Endpoints

#### GET /cash-advances/{advance_id}
Get single cash advance by ID.

**Permissions:** Staff, Admin

#### PUT /cash-advances/{advance_id}
Update cash advance notes (only pending advances).

**Permissions:** Staff, Admin

#### DELETE /cash-advances/{advance_id}
Soft delete cash advance (only pending advances).

**Permissions:** Staff, Admin

#### GET /cash-advances/farmer/{farmer_id}/summary
Get advance summary for a specific farmer by status.

**Permissions:** Staff, Admin

### Settlement Extended Endpoints

#### DELETE /settlements/{settlement_id}
Soft delete settlement (only draft settlements).

**Permissions:** Staff, Admin

### Reports Extended Endpoints

#### GET /reports/market-analytics
Market analytics data (avg/min/max weight, adjustment stats).

**Query Parameters:** `start_date`, `end_date`

**Permissions:** Any authenticated user

#### GET /reports/settlements
Settlements report data as JSON.

**Query Parameters:** `start_date`, `end_date`

**Permissions:** Any authenticated user

#### GET /reports/cash-advances
Cash advances report data as JSON.

**Query Parameters:** `start_date`, `end_date`

**Permissions:** Any authenticated user

#### GET /reports/farmer-statement/{farmer_id}/{month}/{year}
Generate farmer monthly statement (PDF/Excel).

**Query Parameters:**
- `language`: `en` or `ta` (default: `en`)
- `format`: `pdf` or `excel` (default: `pdf`)

**Response:** File download

**Permissions:** Any authenticated user

#### GET /reports/monthly-report/{month}/{year}
Master monthly report for all farmers.

**Query Parameters:**
- `format`: `pdf` or `excel` (default: `excel`)
- `flower_type_id`: Optional filter
- `village`: Optional filter

**Response:** File download

**Permissions:** Any authenticated user

#### GET /reports/daily-summary/{report_date}
Daily summary report file (PDF/Excel).

**Query Parameters:**
- `format`: `pdf` or `excel` (default: `excel`)

**Response:** File download

**Permissions:** Any authenticated user

#### GET /reports/settlement-report/{settlement_id}
Settlement report PDF.

**Query Parameters:**
- `format`: `pdf` (default)

**Response:** PDF file download

**Permissions:** Any authenticated user

#### POST /reports/custom
Custom report with filters.

**Request Body:**
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-02-28"
}
```

**Query Parameters:**
- `format`: `pdf` or `excel`
- `farmer_id`, `flower_type_id`, `village`: Optional filters

**Response:** File download

**Permissions:** Any authenticated user

#### GET /reports/font-info
Available font information for reports.

**Permissions:** Any authenticated user

### Notification Extended Endpoints

#### GET /notifications/unread-count
Get count of unread notifications.

**Permissions:** Any authenticated user

#### GET /notifications/{notification_id}
Get notification by ID.

**Permissions:** Any authenticated user

#### POST /notifications
Create notification for a user.

**Query Parameters:**
- `user_id`: Target user ID (required)
- `title`: Title (required)
- `message`: Message (required)
- `notification_type`: Type (default: `info`)
- `action_url`: Optional action URL

**Permissions:** Staff, Admin

#### PUT /notifications/read-all
Mark all notifications as read.

**Permissions:** Any authenticated user

#### DELETE /notifications/{notification_id}
Delete a notification.

**Permissions:** Any authenticated user

#### DELETE /notifications/clear-all
Delete all notifications for current user.

**Permissions:** Any authenticated user

#### DELETE /notifications/clear-read
Delete all read notifications for current user.

**Permissions:** Any authenticated user

### System Settings Extended Endpoints

#### GET /system-settings/public
Get public system settings (business_name, address, phone, currency, language, theme).

**Permissions:** Any authenticated user

#### GET /system-settings/{key}
Get setting by key.

**Permissions:** Admin

#### DELETE /system-settings/{key}
Delete a system setting.

**Permissions:** Admin

#### POST /system-settings/bulk
Update multiple settings at once.

**Request Body:** JSON object with key-value pairs.

**Permissions:** Admin

#### GET /system-settings/business/profile
Get business profile from system settings.

**Permissions:** Any authenticated user

#### PUT /system-settings/business/profile
Update business profile settings.

**Query Parameters:**
- `business_name`, `business_address`, `business_phone`, `business_email`, `business_gst`, `currency_symbol`

**Permissions:** Staff, Admin

---

## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "quantity",
        "message": "Quantity must be greater than 0"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Category | Description |
|------|----------|-------------|
| 200 | Success | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| AUTHENTICATION_FAILED | 401 | Invalid credentials |
| TOKEN_EXPIRED | 401 | Access token expired |
| REFRESH_TOKEN_INVALID | 401 | Invalid refresh token |
| PERMISSION_DENIED | 403 | Insufficient permissions |
| RESOURCE_NOT_FOUND | 404 | Resource does not exist |
| RESOURCE_ALREADY_EXISTS | 409 | Resource already exists |
| INVALID_STATE_TRANSITION | 422 | Invalid status transition |
| NO_APPLICABLE_RATE | 422 | No market rate found |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### List Response

List endpoints include pagination metadata:

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
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

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      // Optional detailed error information
    ]
  }
}
```

---

## Rate Limiting

### Rate Limits

| User Type | Limit | Window |
|-----------|-------|--------|
| Anonymous | 100 requests | 15 minutes |
| Authenticated | 1000 requests | 15 minutes |
| Admin | 2000 requests | 15 minutes |

### Rate Limit Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 16763568000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## Versioning

### API Versioning

The API uses URL path versioning: `/api/v1/`

### Deprecation Policy

- Deprecated endpoints will be supported for at least 6 months
- Deprecated endpoints will include `X-Deprecated` header
- New versions will be announced in advance
- Breaking changes will result in a new major version

---

**Document Version**: 2.0
**Last Updated**: 2026-05-10
**Author**: API Team
