# Malar Market Digital Ledger - Project Foundation Summary

## Executive Summary

This document provides a complete overview of the Malar Market Digital Ledger project foundation and architecture. The project is a hybrid Desktop/Tablet Progressive Web Application (PWA) for managing flower commission business operations with 50+ farmers, designed for offline-first operation during critical morning rush hours.

---

## Project Structure

```
malar-market-ledger/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── requirements.txt
├── frontend/               # React + Vite PWA
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── utils/          # Utilities
│   │   └── locales/        # i18n translations
│   ├── public/             # Static assets
│   └── tests/              # Frontend tests
├── docs/                   # Documentation
│   ├── architecture.md      # System architecture
│   ├── database-schema.md  # Database design
│   ├── api-design.md       # API documentation
│   └── environment-configuration.md # Environment setup
├── scripts/                # Utility scripts
│   ├── migrations/         # Database migrations
│   └── seed/               # Seed data
├── .env.example            # Environment variables template
├── .gitignore
├── docker-compose.yml      # Local development
└── README.md
```

---

## Technology Stack

### Frontend
- **Framework**: React.js with Vite
- **PWA**: Service Worker with Workbox
- **Offline Storage**: IndexedDB
- **Styling**: Tailwind CSS
- **Internationalization**: i18next
- **State Management**: React Context API / Zustand
- **HTTP Client**: Axios
- **Hosting**: Vercel

### Backend
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL via Supabase
- **Caching**: Redis
- **Authentication**: JWT with refresh tokens
- **WhatsApp Integration**: Twilio/Interakt
- **Hosting**: Render/DigitalOcean

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (optional)
- **Containerization**: Docker

---

## Key Architectural Decisions

### 1. Offline-First Architecture

**Decision**: Implement PWA with IndexedDB for offline data persistence and background sync.

**Rationale**:
- Critical morning rush hours (4-9 AM) may have unreliable internet
- Business continuity is essential
- Farmers need immediate access to their data
- Sync queue ensures no data loss

**Implementation**:
- Service Worker for caching and background sync
- IndexedDB for local data storage
- Conflict resolution with last-write-wins strategy
- Optimistic UI updates with rollback on sync failure

### 2. Time-Based Pricing Engine

**Decision**: Flexible time slot system with configurable rates.

**Rationale**:
- Market rates vary by time of day
- Early morning rates are typically higher
- Need flexibility for seasonal adjustments
- Historical rate tracking for analytics

**Implementation**:
- Time slots defined in database
- Market rates linked to flower types and time slots
- Automatic rate application based on entry time
- Rate history for audit and reporting

### 3. JWT-Based Authentication

**Decision**: JWT with refresh token rotation for stateless authentication.

**Rationale**:
- Stateless design for scalability
- Refresh token rotation enhances security
- Easy integration with multiple clients
- Standard industry practice

**Implementation**:
- Access tokens: 15 minutes validity
- Refresh tokens: 7 days validity
- Token blacklist in Redis for revocation
- Role-based access control (RBAC)

### 4. WhatsApp Bot Integration

**Decision**: Provider-agnostic abstraction layer for WhatsApp API.

**Rationale**:
- Flexibility to switch providers (Twilio/Interakt)
- Template-based messaging for consistency
- Queue-based sending for reliability
- Delivery tracking and error handling

**Implementation**:
- Abstraction layer for provider switching
- Message templates for common notifications
- Queue system with retry logic
- Webhook handling for delivery updates

### 5. Bilingual Support Architecture

**Decision**: i18next integration with dynamic language switching.

**Rationale**:
- Tamil and English support required
- RTL support for Tamil text
- Culturally appropriate formatting
- Easy addition of new languages

**Implementation**:
- i18next for translation management
- Separate translation files for each language
- RTL support for Tamil
- Language preference stored in user profile

### 6. Role-Based Access Control

**Decision**: Three-tier role system (Admin, Staff, Farmer).

**Rationale**:
- Clear separation of concerns
- Appropriate permissions for each role
- Audit trail for sensitive operations
- Scalable for future role additions

**Implementation**:
- JWT tokens include role claim
- Middleware for permission checking
- Permission matrix for each endpoint
- Audit logging for all operations

---

## Database Schema Highlights

### Core Tables

1. **users**: Application users with authentication
2. **farmers**: Farmer information linked to users
3. **flower_types**: Master flower varieties
4. **time_slots**: Time-based pricing slots
5. **market_rates**: Time-based pricing for flowers
6. **daily_entries**: Daily flower entries from farmers
7. **cash_advances**: Cash advance tracking
8. **settlements**: Financial settlement records
9. **settlement_items**: Individual settlement line items
10. **security_logs**: Audit logging
11. **notifications**: Notification records
12. **system_settings**: Configuration settings

### Key Relationships

- One farmer can have multiple daily entries
- One settlement can include multiple daily entries
- One flower type can have multiple market rates
- One time slot can apply to multiple flower types
- One user can create multiple settlements

### Design Principles

- Third Normal Form (3NF) for data integrity
- Soft deletes with `deleted_at` timestamp
- Audit trail with `created_at` and `updated_at`
- UUID primary keys for distributed systems
- Strategic indexing for performance

---

## API Design Highlights

### RESTful Standards

- **Base URL**: `/api/v1`
- **Naming**: kebab-case endpoints, lower_snake_case fields
- **Format**: JSON request/response
- **Dates**: ISO 8601 format
- **Pagination**: Page-based with metadata

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**:
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

### Key Modules

1. **Authentication**: Login, refresh, logout, password reset
2. **Users**: CRUD operations with role-based permissions
3. **Farmers**: Farmer management with balance tracking
4. **Flower Types**: Master data management
5. **Time Slots**: Time slot configuration
6. **Market Rates**: Rate management with effective dates
7. **Daily Entries**: Entry creation with automatic calculations
8. **Cash Advances**: Advance request and approval workflow
9. **Settlements**: Settlement generation and approval
10. **Reports**: Daily and farmer summary reports
11. **Notifications**: Notification management
12. **System Settings**: Configuration management

---

## Security Considerations

### Authentication & Authorization

- JWT tokens with 15-minute access token validity
- Refresh token rotation for enhanced security
- Role-based access control (Admin, Staff, Farmer)
- Password hashing with bcrypt
- Account lockout after failed attempts

### Data Security

- TLS 1.3 for all HTTP communications
- Input validation with Pydantic schemas
- SQL injection prevention via ORM
- XSS prevention via React's built-in escaping
- CSRF protection via same-site cookies

### API Security

- Rate limiting (1000 requests/minute per user)
- CORS configuration with strict origin whitelist
- API key management for WhatsApp integration
- Request/response logging for audit trail

### PWA Security

- HTTPS required for service worker registration
- No sensitive data in IndexedDB
- Encrypted sensitive fields (optional)
- Clear data on logout

---

## Offline-First Strategy

### Service Worker Caching

- **Cache-First**: Static assets (HTML, CSS, JS, images)
- **Network-First**: API calls with fallback to cache
- **Stale-While-Revalidate**: Reference data (market rates, farmers)

### IndexedDB Structure

- **daily_entries**: Local entry storage with sync status
- **sync_queue**: Pending operations for background sync
- **market_rates**: Cached market rates
- **farmers**: Cached farmer information

### Sync Queue Management

- **Operation Types**: CREATE, UPDATE, DELETE, SETTLEMENT
- **Priority**: CREATE > UPDATE > DELETE
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Max Retries**: 5 attempts
- **Conflict Resolution**: Last-write-wins with timestamp

### Offline Capabilities

**Full Offline**:
- Create daily entries
- View cached market rates
- Access farmer information
- Generate local reports
- View sync status

**Limited Offline**:
- Settlement generation (requires rate validation)
- WhatsApp notifications (queued for later)
- Real-time updates (cached data only)

**No Offline**:
- User authentication
- Market rate updates
- Settlement approvals by farmers

---

## Bilingual Support

### Implementation

- **Library**: i18next for React
- **Languages**: English (en), Tamil (ta)
- **Storage**: User preference in database
- **Switching**: Dynamic language switching without reload

### Features

- RTL support for Tamil text
- Culturally appropriate date/time formatting
- Localized currency display (₹)
- Translated error messages and notifications
- Language-specific number formatting

### Translation Structure

```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── farmers.json
│   ├── entries.json
│   └── settlements.json
└── ta/
    ├── common.json
    ├── auth.json
    ├── farmers.json
    ├── entries.json
    └── settlements.json
```

---

## Scalability Approach

### Horizontal Scaling

- **Backend**: Stateless FastAPI with load balancer
- **Database**: Read replicas for reporting queries
- **Frontend**: CDN for static assets (Vercel Edge Network)

### Performance Optimization

- **Database**: Indexed columns, query optimization, materialized views
- **Caching**: Redis for frequently accessed data
- **API**: Pagination, field selection, batch operations

### Monitoring & Observability

- **Metrics**: Response times, error rates, database performance
- **Logging**: Structured JSON logging with log levels
- **Tracing**: Distributed tracing with OpenTelemetry

### Disaster Recovery

- **Backups**: Daily automated database backups
- **High Availability**: Database failover, load balancer health checks
- **Graceful Degradation**: Fallback to cached data on failures

---

## Environment Configuration

### Required Environment Variables

**Backend**:
- Database connection string
- Redis connection string
- JWT secret key
- WhatsApp API credentials
- CORS origins
- SMTP configuration (optional)

**Frontend**:
- API base URL
- Default language
- PWA settings
- Feature flags

### Configuration Files

- `backend/.env.example`: Backend environment template
- `frontend/.env.example`: Frontend environment template
- `.env.example`: Docker Compose environment template

### Security Best Practices

- Never commit `.env` files to version control
- Use strong, unique secrets for each environment
- Rotate secrets regularly (90-180 days)
- Use secret management services in production

---

## Next Steps for Implementation

### Phase 1: Backend Foundation

1. Set up FastAPI project structure
2. Configure database connection with SQLAlchemy
3. Implement authentication middleware
4. Create database models
5. Set up Redis for caching
6. Implement basic CRUD endpoints

### Phase 2: Frontend Foundation

1. Set up React + Vite project
2. Configure PWA with service worker
3. Set up i18next for bilingual support
4. Create basic UI components
5. Implement authentication flow
6. Set up IndexedDB for offline storage

### Phase 3: Core Features

1. Implement daily entry creation with time-based pricing
2. Build settlement generation workflow
3. Integrate WhatsApp notifications
4. Implement offline sync mechanism
5. Create reporting dashboards

### Phase 4: Advanced Features

1. Implement cash advance workflow
2. Build farmer portal for self-service
3. Add advanced analytics and forecasting
4. Implement real-time collaboration
5. Add mobile app (React Native)

### Phase 5: Deployment & Monitoring

1. Set up CI/CD pipeline
2. Configure production environment
3. Implement monitoring and alerting
4. Set up backup and disaster recovery
5. Performance optimization and tuning

---

## Documentation Files

1. **README.md**: Project overview and quick start guide
2. **docs/architecture.md**: Complete system architecture with diagrams
3. **docs/database-schema.md**: Complete ERD with table definitions
4. **docs/api-design.md**: RESTful API documentation with examples
5. **docs/environment-configuration.md**: Environment setup and security best practices
6. **docs/project-summary.md**: This document - comprehensive project overview

---

## Key Deliverables Completed

✅ **Project Structure**: Complete directory structure for backend and frontend
✅ **Architecture Documentation**: System architecture with data flow diagrams
✅ **Database Schema**: Complete ERD with 12 tables, relationships, and indexes
✅ **API Design**: RESTful API with 40+ endpoints across 12 modules
✅ **Environment Configuration**: Comprehensive environment variable templates
✅ **Security Design**: Authentication, authorization, and data security strategy
✅ **Offline-First Strategy**: Complete PWA architecture with sync mechanism
✅ **Bilingual Support**: i18n architecture for English and Tamil
✅ **Scalability Plan**: Horizontal scaling and performance optimization approach

---

## Technical Highlights

### Performance
- IndexedDB for fast offline data access
- Redis caching for frequently accessed data
- Strategic database indexing
- CDN for static asset delivery
- Optimistic UI updates

### Reliability
- Offline-first architecture for business continuity
- Background sync with retry logic
- Conflict resolution strategy
- Automatic database backups
- Graceful degradation

### Security
- JWT authentication with refresh tokens
- Role-based access control
- TLS 1.3 encryption
- Input validation and sanitization
- Comprehensive audit logging

### Maintainability
- Modular architecture with clear separation of concerns
- Comprehensive documentation
- Type safety with TypeScript (frontend) and Pydantic (backend)
- Automated testing framework
- CI/CD pipeline support

---

## Conclusion

The Malar Market Digital Ledger project foundation is now complete with comprehensive architecture, database schema, API design, and environment configuration. The system is designed to handle the unique challenges of a flower commission business with 50+ farmers, including:

- **Offline-first operation** during critical morning rush hours
- **Time-based pricing** with flexible configuration
- **Complex financial settlements** with commissions and advances
- **WhatsApp bot integration** for farmer transparency
- **Bilingual support** for English and Tamil users
- **Role-based access control** for security

The architecture is scalable, secure, and maintainable, providing a solid foundation for the implementation phases ahead.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: Architecture Team
**Status**: Foundation Complete - Ready for Implementation
