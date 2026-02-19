# API Contracts - UI Redesign (Arctic Frost Completion)

**Version**: 1.0.0 | **Date**: 2026-02-17 | **Base URL**: `/api/v1`

---

## Standard Response Envelope

All API responses MUST follow this standard envelope format:

### Success Response

```json
{
  "success": true,
  "data": <T>,
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  },
  "meta": {
    "timestamp": "2026-02-17T05:30:00Z",
    "request_id": "uuid"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      {
        "field": "field_name",
        "message": "Field-specific error message"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-17T05:30:00Z",
    "request_id": "uuid"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_ERROR` | 401 | Not authenticated |
| `AUTHORIZATION_ERROR` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Farmers API

### GET /farmers

List all farmers with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Items per page (max 100) |
| `search` | string | - | Search by name or phone |
| `is_active` | boolean | - | Filter by active status |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "Raj Kumar",
      "phone": "9876543210",
      "village": "Madurai",
      "is_active": true,
      "balance": 1500.00,
      "created_at": "2026-01-15T05:30:00Z",
      "updated_at": "2026-02-17T05:30:00Z"
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

### GET /farmers/{id}

Get a single farmer by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "Raj Kumar",
    "phone": "9876543210",
    "village": "Madurai",
    "is_active": true,
    "balance": 1500.00,
    "total_entries": 125,
    "total_weight": 1250.5,
    "created_at": "2026-01-15T05:30:00Z",
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

### POST /farmers

Create a new farmer.

**Request Body:**

```json
{
  "name": "Raj Kumar",
  "phone": "9876543210",
  "village": "Madurai",
  "is_active": true
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "Raj Kumar",
    "phone": "9876543210",
    "village": "Madurai",
    "is_active": true,
    "balance": 0.00,
    "created_at": "2026-02-17T05:30:00Z",
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

### PUT /farmers/{id}

Update an existing farmer.

**Request Body:**

```json
{
  "name": "Raj Kumar Updated",
  "phone": "9876543211",
  "village": "Madurai City",
  "is_active": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "Raj Kumar Updated",
    "phone": "9876543211",
    "village": "Madurai City",
    "is_active": true,
    "balance": 1500.00,
    "created_at": "2026-01-15T05:30:00Z",
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

### DELETE /farmers/{id}

Soft delete a farmer.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "deleted_at": "2026-02-17T05:30:00Z"
  }
}
```

### GET /farmers/{id}/balance

Get farmer balance information.

**Response:**

```json
{
  "success": true,
  "data": {
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "current_balance": 1500.00,
    "pending_settlements": 500.00,
    "total_advances": 200.00,
    "last_settlement_date": "2026-02-15T05:30:00Z"
  }
}
```

### GET /farmers/search

Search farmers by name or phone.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `limit` | integer | No | Max results (default 10) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "Raj Kumar",
      "phone": "9876543210",
      "village": "Madurai"
    }
  ]
}
```

---

## Daily Entries API

### GET /daily-entries

List daily entries with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Items per page |
| `date` | string | - | Filter by date (YYYY-MM-DD) |
| `farmer_id` | string | - | Filter by farmer |
| `flower_type_id` | string | - | Filter by flower type |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "farmer_id": "uuid-string",
      "farmer_name": "Raj Kumar",
      "flower_type_id": "uuid-string",
      "flower_name": "Rose",
      "date": "2026-02-17",
      "time_slot": "Morning",
      "weight_kg": 10.5,
      "rate_per_kg": 150.00,
      "total_amount": 1575.00,
      "created_at": "2026-02-17T05:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### GET /daily-entries/{id}

Get a single daily entry.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "flower_type_id": "uuid-string",
    "flower_name": "Rose",
    "date": "2026-02-17",
    "time_slot": "Morning",
    "weight_kg": 10.5,
    "rate_per_kg": 150.00,
    "total_amount": 1575.00,
    "notes": "Premium quality",
    "created_by": "uuid-string",
    "created_at": "2026-02-17T05:30:00Z",
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

### POST /daily-entries

Create a new daily entry.

**Request Body:**

```json
{
  "farmer_id": "uuid-string",
  "flower_type_id": "uuid-string",
  "date": "2026-02-17",
  "time_slot": "Morning",
  "weight_kg": 10.5,
  "notes": "Premium quality"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "flower_type_id": "uuid-string",
    "flower_name": "Rose",
    "date": "2026-02-17",
    "time_slot": "Morning",
    "weight_kg": 10.5,
    "rate_per_kg": 150.00,
    "total_amount": 1575.00,
    "notes": "Premium quality",
    "created_at": "2026-02-17T05:30:00Z"
  }
}
```

### POST /daily-entries/bulk

Create multiple entries at once.

**Request Body:**

```json
{
  "entries": [
    {
      "farmer_id": "uuid-string",
      "flower_type_id": "uuid-string",
      "date": "2026-02-17",
      "time_slot": "Morning",
      "weight_kg": 10.5
    },
    {
      "farmer_id": "uuid-string",
      "flower_type_id": "uuid-string",
      "date": "2026-02-17",
      "time_slot": "Morning",
      "weight_kg": 8.25
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "entries": [...]
  }
}
```

### GET /daily-entries/summary

Get daily summary statistics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | Date (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2026-02-17",
    "total_entries": 125,
    "total_weight_kg": 1250.5,
    "total_amount": 187575.00,
    "farmers_count": 45,
    "by_flower_type": [
      {
        "flower_name": "Rose",
        "weight_kg": 500.0,
        "amount": 75000.00
      }
    ],
    "by_time_slot": [
      {
        "time_slot": "Morning",
        "weight_kg": 800.0,
        "amount": 120000.00
      }
    ]
  }
}
```

---

## Settlements API

### GET /settlements

List settlements with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Items per page |
| `status` | string | - | Filter by status |
| `farmer_id` | string | - | Filter by farmer |
| `from_date` | string | - | Start date |
| `to_date` | string | - | End date |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "farmer_id": "uuid-string",
      "farmer_name": "Raj Kumar",
      "period_start": "2026-02-01",
      "period_end": "2026-02-15",
      "total_amount": 25000.00,
      "advances_deducted": 500.00,
      "net_amount": 24500.00,
      "status": "pending",
      "created_at": "2026-02-15T05:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### GET /settlements/{id}

Get a single settlement with items.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "period_start": "2026-02-01",
    "period_end": "2026-02-15",
    "total_amount": 25000.00,
    "advances_deducted": 500.00,
    "net_amount": 24500.00,
    "status": "pending",
    "items": [
      {
        "date": "2026-02-01",
        "flower_name": "Rose",
        "weight_kg": 10.5,
        "amount": 1575.00
      }
    ],
    "created_at": "2026-02-15T05:30:00Z",
    "updated_at": "2026-02-15T05:30:00Z"
  }
}
```

### POST /settlements/generate

Generate settlements for a period.

**Request Body:**

```json
{
  "farmer_id": "uuid-string",
  "period_start": "2026-02-01",
  "period_end": "2026-02-15"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "period_start": "2026-02-01",
    "period_end": "2026-02-15",
    "total_amount": 25000.00,
    "advances_deducted": 500.00,
    "net_amount": 24500.00,
    "status": "pending",
    "items_count": 25
  }
}
```

### PUT /settlements/{id}/approve

Approve a settlement.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "approved",
    "approved_by": "uuid-string",
    "approved_at": "2026-02-17T05:30:00Z"
  }
}
```

### PUT /settlements/{id}/pay

Mark settlement as paid.

**Request Body:**

```json
{
  "payment_method": "cash",
  "payment_reference": "optional-reference"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "paid",
    "paid_by": "uuid-string",
    "paid_at": "2026-02-17T05:30:00Z",
    "payment_method": "cash"
  }
}
```

---

## Cash Advances API

### GET /cash-advances

List cash advances with pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 20 | Items per page |
| `status` | string | - | Filter by status |
| `farmer_id` | string | - | Filter by farmer |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "farmer_id": "uuid-string",
      "farmer_name": "Raj Kumar",
      "amount": 1000.00,
      "reason": "Seeds purchase",
      "status": "pending",
      "created_at": "2026-02-17T05:30:00Z"
    }
  ],
  "pagination": {...}
}
```

### POST /cash-advances

Request a new cash advance.

**Request Body:**

```json
{
  "farmer_id": "uuid-string",
  "amount": 1000.00,
  "reason": "Seeds purchase"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "farmer_id": "uuid-string",
    "farmer_name": "Raj Kumar",
    "amount": 1000.00,
    "reason": "Seeds purchase",
    "status": "pending",
    "created_at": "2026-02-17T05:30:00Z"
  }
}
```

### PUT /cash-advances/{id}/approve

Approve a cash advance.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "approved",
    "approved_by": "uuid-string",
    "approved_at": "2026-02-17T05:30:00Z"
  }
}
```

### PUT /cash-advances/{id}/reject

Reject a cash advance.

**Request Body:**

```json
{
  "reason": "Insufficient balance"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "rejected",
    "rejected_by": "uuid-string",
    "rejected_at": "2026-02-17T05:30:00Z",
    "rejection_reason": "Insufficient balance"
  }
}
```

---

## Dashboard API

### GET /dashboard/activity

Get recent activity feed.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `page_size` | integer | 10 | Items per page (max 50) |

**Response:**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid-string",
        "type": "entry_created",
        "description": "Entry created for Raj Kumar - 10.5kg Rose",
        "timestamp": "2026-02-17T05:30:00Z",
        "user_id": "uuid-string",
        "user_name": "Staff User",
        "entity_type": "daily_entry",
        "entity_id": "uuid-string"
      },
      {
        "id": "uuid-string",
        "type": "settlement_approved",
        "description": "Settlement approved for Raj Kumar - ₹24,500",
        "timestamp": "2026-02-17T05:25:00Z",
        "user_id": "uuid-string",
        "user_name": "Admin User",
        "entity_type": "settlement",
        "entity_id": "uuid-string"
      }
    ],
    "pagination": {...}
  }
}
```

**Activity Types:**

| Type | Description |
|------|-------------|
| `entry_created` | Daily entry created |
| `entry_updated` | Daily entry updated |
| `settlement_generated` | Settlement generated |
| `settlement_approved` | Settlement approved |
| `settlement_paid` | Settlement paid |
| `advance_requested` | Cash advance requested |
| `advance_approved` | Cash advance approved |
| `advance_rejected` | Cash advance rejected |

### GET /dashboard/quick-stats

Get quick statistics for dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "today": {
      "entries_count": 125,
      "total_weight_kg": 1250.5,
      "total_amount": 187575.00,
      "farmers_count": 45
    },
    "pending": {
      "settlements_count": 12,
      "settlements_amount": 150000.00,
      "advances_count": 5,
      "advances_amount": 5000.00
    },
    "comparisons": {
      "entries_vs_yesterday": 15.5,
      "amount_vs_yesterday": 12.3
    }
  }
}
```

---

## User Preferences API

### GET /users/me/preferences

Get current user preferences.

**Response:**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid-string",
    "theme": "arctic",
    "language": "en",
    "dashboard_layout": "default",
    "font_size": "normal",
    "reduced_motion": false,
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

### PUT /users/me/preferences

Update user preferences.

**Request Body:**

```json
{
  "theme": "arctic-dark",
  "language": "ta",
  "dashboard_layout": "compact",
  "font_size": "large",
  "reduced_motion": true
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user_id": "uuid-string",
    "theme": "arctic-dark",
    "language": "ta",
    "dashboard_layout": "compact",
    "font_size": "large",
    "reduced_motion": true,
    "updated_at": "2026-02-17T05:30:00Z"
  }
}
```

**Preference Options:**

| Field | Valid Values |
|-------|--------------|
| `theme` | `arctic`, `arctic-dark` |
| `language` | `en`, `ta` |
| `dashboard_layout` | `default`, `compact` |
| `font_size` | `normal`, `large` |
| `reduced_motion` | `true`, `false` |

---

## Authentication Headers

All authenticated requests must include:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

| Endpoint Type | Rate Limit |
|---------------|------------|
| List endpoints | 100 req/min |
| Create/Update | 50 req/min |
| Bulk operations | 10 req/min |

Rate limit headers included in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645084800
```

## Soft Delete Behavior

All DELETE operations are soft deletes:
- Sets `deleted_at` timestamp
- Resource is excluded from list queries
- Resource can still be retrieved by ID (returns 404 or includes deleted_at)
- No physical deletion from database

## Pagination

All list endpoints support cursor-based pagination:

```json
{
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

---

## Implementation Notes

### Backend Implementation Pattern

```python
from fastapi import APIRouter, Depends
from app.dependencies import DatabaseSession, CurrentUser
from app.schemas.all_schemas import FarmerCreate, FarmerResponse

router = APIRouter(prefix="/farmers", tags=["farmers"])

@router.post("/", response_model=FarmerResponse, status_code=201)
async def create_farmer(
    data: FarmerCreate,
    db: DatabaseSession,
    current_user: CurrentUser
) -> dict:
    """Create a new farmer with validation."""
    # Check for duplicates
    # Create farmer with UUID string ID
    # Return standard envelope format
    return {"success": True, "data": farmer}
```

### Frontend Service Pattern

```javascript
// frontend/src/services/farmerService.js
import { apiClient } from './apiClient';

export const farmerService = {
  async getAll(params = {}) {
    const response = await apiClient.get('/farmers', { params });
    return response.data; // { success, data, pagination }
  },
  
  async create(data) {
    const response = await apiClient.post('/farmers', data);
    return response.data;
  }
};
```
