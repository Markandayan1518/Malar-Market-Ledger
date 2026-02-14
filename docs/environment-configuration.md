# Environment Configuration Guide

## Overview

This document outlines all required environment variables for the Malar Market Digital Ledger application. Copy the appropriate `.env.example` files to `.env` and fill in your actual values.

**IMPORTANT**: Never commit `.env` files to version control. They contain sensitive credentials.

---

## Backend Environment Variables

### File: `backend/.env.example`

```bash
# Application
APP_NAME=Malar Market Ledger
APP_ENV=development
APP_DEBUG=true
APP_VERSION=1.0.0

# Server
HOST=0.0.0.0
PORT=8000

# Database (PostgreSQL via Supabase)
DATABASE_URL=postgresql://user:password@localhost:5432/malar_market_ledger
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis (Caching)
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
REDIS_DB=0

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*

# WhatsApp API (Twilio or Interakt)
WHATSAPP_PROVIDER=twilio  # Options: twilio, interakt
WHATSAPP_ACCOUNT_SID=your-twilio-account-sid
WHATSAPP_AUTH_TOKEN=your-twilio-auth-token
WHATSAPP_PHONE_NUMBER=whatsapp:+919876543210
WHATSAPP_WEBHOOK_URL=https://api.malar-market-ledger.com/api/v1/webhooks/whatsapp

# Interakt Configuration (if using Interakt)
INTERAKT_API_KEY=your-interakt-api-key
INTERAKT_API_SECRET=your-interakt-api-secret

# Supabase (if using Supabase Auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@malar-market-ledger.com
SMTP_USE_TLS=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=1000
RATE_LIMIT_PER_USER_PER_MINUTE=100

# Logging
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json
LOG_FILE_PATH=logs/app.log

# File Upload (if needed)
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=uploads

# Timezone
TIMEZONE=Asia/Kolkata

# Security
ALLOWED_HOSTS=localhost,127.0.0.1
SECRET_KEY=your-super-secret-key-change-this-in-production
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data

# Monitoring (optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Feature Flags
ENABLE_WHATSAPP_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_OFFLINE_SYNC=true
ENABLE_BILINGUAL_SUPPORT=true
```

---

## Frontend Environment Variables

### File: `frontend/.env.example`

```bash
# Application
VITE_APP_NAME=Malar Market Ledger
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=30000  # 30 seconds in milliseconds

# Authentication
VITE_AUTH_TOKEN_STORAGE=localStorage  # Options: localStorage, sessionStorage
VITE_AUTH_REFRESH_INTERVAL=840000  # 14 minutes in milliseconds (before token expires)

# PWA Configuration
VITE_PWA_ENABLED=true
VITE_PWA_OFFLINE_ENABLED=true
VITE_PWA_CACHE_STRATEGY=networkFirst  # Options: cacheFirst, networkFirst, staleWhileRevalidate

# Internationalization
VITE_I18N_ENABLED=true
VITE_DEFAULT_LANGUAGE=en  # Options: en, ta
VITE_AVAILABLE_LANGUAGES=en,ta

# WhatsApp Integration
VITE_WHATSAPP_ENABLED=true
VITE_WHATSAPP_NUMBER=919876543210

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_REPORTS=true

# UI Configuration
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
VITE_DATE_FORMAT=DD/MM/YYYY
VITE_TIME_FORMAT=HH:mm
VITE_CURRENCY_SYMBOL=₹
VITE_CURRENCY_LOCALE=en-IN

# Timezone
VITE_TIMEZONE=Asia/Kolkata

# Development
VITE_DEV_TOOLS=true
VITE_MOCK_API=false  # Set to true to use mock data for development

# Monitoring (optional)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Analytics (optional)
VITE_GA_TRACKING_ID=
VITE_GTM_ID=
```

---

## Docker Compose Environment Variables

### File: `.env.example` (root level)

```bash
# PostgreSQL Database
POSTGRES_DB=malar_market_ledger
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=
REDIS_HOST=redis
REDIS_PORT=6379

# Backend
BACKEND_HOST=backend
BACKEND_PORT=8000
BACKEND_ENV=development

# Frontend
FRONTEND_HOST=frontend
FRONTEND_PORT=5173
FRONTEND_ENV=development
```

---

## Environment-Specific Configurations

### Development Environment

```bash
# Backend
APP_ENV=development
APP_DEBUG=true
LOG_LEVEL=DEBUG

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_DEV_TOOLS=true
VITE_MOCK_API=true
```

### Staging Environment

```bash
# Backend
APP_ENV=staging
APP_DEBUG=false
LOG_LEVEL=INFO

# Frontend
VITE_API_BASE_URL=https://api-staging.malar-market-ledger.com/api/v1
VITE_DEV_TOOLS=false
VITE_MOCK_API=false
```

### Production Environment

```bash
# Backend
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=WARNING
RATE_LIMIT_ENABLED=true

# Frontend
VITE_API_BASE_URL=https://api.malar-market-ledger.com/api/v1
VITE_DEV_TOOLS=false
VITE_MOCK_API=false
```

---

## Security Best Practices

### 1. Never Commit `.env` Files

Add these lines to your `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
backend/.env
frontend/.env
```

### 2. Use Strong Secrets

Generate cryptographically secure random strings for:
- `JWT_SECRET_KEY`
- `SECRET_KEY`
- `ENCRYPTION_KEY`

Example using Python:

```python
import secrets
print(secrets.token_urlsafe(32))
```

Example using Node.js:

```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

### 3. Rotate Secrets Regularly

- JWT secrets: Every 90 days
- API keys: Every 180 days
- Database passwords: Every 180 days

### 4. Use Environment-Specific Values

Never use the same secrets across environments. Each environment (dev, staging, prod) should have its own set of secrets.

### 5. Limit Access to Secrets

- Use secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Restrict access to `.env` files
- Use IAM roles instead of hardcoded credentials

---

## Required Third-Party Services

### 1. Supabase

Sign up at: https://supabase.com

Required credentials:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Twilio (WhatsApp API)

Sign up at: https://www.twilio.com

Required credentials:
- `WHATSAPP_ACCOUNT_SID`
- `WHATSAPP_AUTH_TOKEN`
- `WHATSAPP_PHONE_NUMBER`

### 3. Interakt (Alternative WhatsApp API)

Sign up at: https://www.interakt.co

Required credentials:
- `INTERAKT_API_KEY`
- `INTERAKT_API_SECRET`

### 4. Sentry (Error Tracking - Optional)

Sign up at: https://sentry.io

Required credentials:
- `SENTRY_DSN`

### 5. Google Analytics (Optional)

Required credentials:
- `VITE_GA_TRACKING_ID`

---

## Validation Checklist

Before running the application, verify:

### Backend
- [ ] All required environment variables are set
- [ ] Database connection string is correct
- [ ] Redis connection string is correct
- [ ] JWT secret key is strong and unique
- [ ] WhatsApp API credentials are valid
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled in production

### Frontend
- [ ] API base URL points to correct environment
- [ ] Authentication token storage is configured
- [ ] PWA settings are appropriate
- [ ] Default language is set
- [ ] Feature flags match requirements
- [ ] Currency and date formats are correct

### Docker Compose
- [ ] PostgreSQL credentials are set
- [ ] Redis configuration is correct
- [ ] Service ports don't conflict with local services
- [ ] Volume mounts are properly configured

---

## Troubleshooting

### Database Connection Issues

**Error**: `could not connect to server`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running: `docker ps`
3. Verify network connectivity
4. Check firewall settings

### Redis Connection Issues

**Error**: `Error connecting to Redis`

**Solution**:
1. Verify `REDIS_URL` is correct
2. Check Redis is running: `docker ps`
3. Verify Redis password (if set)

### WhatsApp API Issues

**Error**: `Failed to send WhatsApp message`

**Solution**:
1. Verify API credentials are correct
2. Check account has sufficient credits
3. Verify phone number format (include country code)
4. Check webhook URL is accessible

### CORS Issues

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
1. Verify `CORS_ORIGINS` includes your frontend URL
2. Check `CORS_ALLOW_CREDENTIALS` is set correctly
3. Verify no proxy is interfering

### JWT Token Issues

**Error**: `Invalid token` or `Token expired`

**Solution**:
1. Verify `JWT_SECRET_KEY` is the same across services
2. Check token expiration times are appropriate
3. Verify token is being sent in `Authorization` header
4. Check system time is synchronized

---

## Environment Variable Reference

### Backend Variables

| Variable | Required | Default | Description |
|-----------|-----------|---------|-------------|
| `APP_NAME` | No | Malar Market Ledger | Application name |
| `APP_ENV` | Yes | development | Environment: development, staging, production |
| `APP_DEBUG` | No | false | Enable debug mode |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `JWT_SECRET_KEY` | Yes | - | JWT signing secret |
| `WHATSAPP_PROVIDER` | Yes | - | WhatsApp provider: twilio, interakt |
| `CORS_ORIGINS` | Yes | - | Allowed CORS origins |

### Frontend Variables

| Variable | Required | Default | Description |
|-----------|-----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API base URL |
| `VITE_DEFAULT_LANGUAGE` | No | en | Default language: en, ta |
| `VITE_PWA_ENABLED` | No | true | Enable PWA features |
| `VITE_CURRENCY_SYMBOL` | No | ₹ | Currency symbol |
| `VITE_TIMEZONE` | No | Asia/Kolkata | Application timezone |

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Twilio WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp)
- [Interakt Documentation](https://www.interakt.co/docs)
- [FastAPI Environment Variables](https://fastapi.tiangolo.com/advanced/settings/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: DevOps Team
