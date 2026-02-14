# Malar Market Digital Ledger - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [SSL/HTTPS Configuration](#sslhttps-configuration)
8. [Domain and DNS Setup](#domain-and-dns-setup)
9. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for deploying the Malar Market Digital Ledger to production environments. The deployment follows a modern microservices architecture with separate frontend and backend deployments.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Frontend (Vercel)                             │     │
│  │  - React PWA                                     │     │
│  │  - Static Assets                                   │     │
│  │  - CDN Distribution                                │     │
│  └────────────────┬────────────────────────────────────┘     │
│                   │                                        │
│                   │ HTTPS                                  │
│                   │                                        │
│  ┌────────────────▼────────────────────────────────────┐     │
│  │  Backend (Render/DigitalOcean)                   │     │
│  │  - FastAPI Application                          │     │
│  │  - API Endpoints                               │     │
│  │  - WhatsApp Integration                          │     │
│  └────────────────┬────────────────────────────────────┘     │
│                   │                                        │
│                   │                                        │
│  ┌────────────────▼────────────────────────────────────┐     │
│  │  Database (Supabase)                           │     │
│  │  - PostgreSQL                                   │     │
│  │  - Connection Pooling                            │     │
│  │  - Automatic Backups                             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Cache (Redis)                                 │     │
│  │  - Session Storage                              │     │
│  │  - Rate Limiting                               │     │
│  │  - Market Rate Caching                          │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Environments

| Environment | Purpose | URL | Access |
|-------------|----------|------|--------|
| Development | Local development | localhost | Local developers |
| Staging | Pre-production testing | staging.malar-market-ledger.com | QA team |
| Production | Live production | malar-market-ledger.com | End users |

---

## Prerequisites

### Required Accounts

1. **Vercel Account** (Frontend hosting)
   - Sign up at https://vercel.com
   - Connect GitHub repository
   - Configure deployment settings

2. **Render Account** or **DigitalOcean Account** (Backend hosting)
   - Sign up at https://render.com or https://digitalocean.com
   - Connect GitHub repository
   - Configure deployment settings

3. **Supabase Account** (Database hosting)
   - Sign up at https://supabase.com
   - Create new project
   - Configure database settings

4. **Domain Registrar** (Custom domain)
   - Purchase domain from registrar (GoDaddy, Namecheap, etc.)
   - Configure DNS records

5. **WhatsApp Business API Provider** (Twilio or Interakt)
   - Sign up for WhatsApp Business API
   - Get API credentials
   - Configure webhook endpoints

### Required Tools

```bash
# Version Control
git --version  # 2.0+

# Backend
python --version  # 3.11+
pip --version  # 23.0+

# Frontend
node --version  # 18+
npm --version  # 9+

# Database
psql --version  # 15+

# Docker (optional)
docker --version  # 20.10+
docker-compose --version  # 2.0+
```

### System Requirements

**Backend Server:**
- CPU: 2+ cores
- RAM: 4GB+ (8GB recommended for production)
- Storage: 50GB+ SSD
- OS: Ubuntu 22.04 LTS or similar

**Database:**
- PostgreSQL 15+
- Connection pooling enabled
- Automatic backups configured

---

## Environment Configuration

### Backend Environment Variables

Create `.env` file in backend directory:

```bash
# Application
APP_NAME=Malar Market Digital Ledger
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-super-secret-key-change-this-in-production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database_name
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://host:6379/0

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
FRONTEND_URL=https://malar-market-ledger.com
ALLOWED_ORIGINS=https://malar-market-ledger.com,https://www.malar-market-ledger.com

# WhatsApp Integration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+919876543210
TWILIO_WEBHOOK_URL=https://api.malar-market-ledger.com/api/v1/whatsapp/webhook

# WhatsApp Integration (Interakt)
INTERAKT_API_KEY=your-interakt-api-key
INTERAKT_WEBHOOK_URL=https://api.malar-market-ledger.com/api/v1/whatsapp/webhook

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@malar-market-ledger.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000
RATE_LIMIT_PER_HOUR=10000
```

### Frontend Environment Variables

Create `.env` file in frontend directory:

```bash
# Application
VITE_APP_NAME=Malar Market Digital Ledger
VITE_APP_ENVIRONMENT=production

# API
VITE_API_BASE_URL=https://api.malar-market-ledger.com/api/v1
VITE_WS_URL=wss://api.malar-market-ledger.com/ws

# Features
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_WHATSAPP=true
VITE_ENABLE_PDF=true

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_ANALYTICS=true

# WhatsApp (for bot commands)
VITE_WHATSAPP_NUMBER=+919876543210
```

### Environment-Specific Configurations

**Development (.env.development):**
```bash
ENVIRONMENT=development
DEBUG=true
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Staging (.env.staging):**
```bash
ENVIRONMENT=staging
DEBUG=false
VITE_API_BASE_URL=https://api-staging.malar-market-ledger.com/api/v1
```

**Production (.env.production):**
```bash
ENVIRONMENT=production
DEBUG=false
VITE_API_BASE_URL=https://api.malar-market-ledger.com/api/v1
```

---

## Database Setup

### Supabase Setup

#### 1. Create Supabase Project

1. Log in to https://supabase.com
2. Click "New Project"
3. Configure project:
   - Name: `malar-market-ledger`
   - Database Password: Generate strong password
   - Region: Choose nearest region (e.g., Singapore for India)
4. Wait for project to be created (~2 minutes)

#### 2. Configure Database

```sql
-- Connect to Supabase SQL Editor
-- Run migrations

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (run migration scripts)
-- See database-migration-guide.md for details
```

#### 3. Set Up Connection Pooling

```bash
# Install PgBouncer (connection pooler)
# Supabase provides built-in connection pooling
# Configure in Supabase dashboard:
# Settings > Database > Connection Pooling
# Mode: Transaction
# Pool Size: 20
```

#### 4. Configure Backups

```bash
# Supabase automatic backups
# Settings > Database > Backups
# Enable daily backups
# Retention period: 30 days
# Point-in-time recovery: 7 days
```

#### 5. Get Connection String

```bash
# From Supabase dashboard:
# Settings > Database > Connection String
# Choose "URI" format
# Copy connection string

# Example:
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Database Migration

```bash
# Install Alembic (if not already installed)
pip install alembic

# Initialize Alembic (first time only)
cd backend
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Run migration
alembic upgrade head

# Verify migration
alembic current
```

### Seed Data

```bash
# Run seed data script
python scripts/seed_database.py

# Or use Alembic
alembic upgrade head +seed
```

---

## Backend Deployment

### Option 1: Render Deployment

#### 1. Create Render Service

1. Log in to https://render.com
2. Click "New +" > "Web Service"
3. Connect GitHub repository
4. Configure build and deploy settings:

**Build & Deploy Settings:**
```yaml
# render.yaml (in root directory)
services:
  - type: web
    name: malar-market-ledger-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: JWT_SECRET_KEY
        generateValue: true
    plan: free  # or starter/pro
```

#### 2. Configure Environment Variables

In Render dashboard, add all environment variables from [Environment Configuration](#environment-configuration).

#### 3. Deploy

```bash
# Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# Render will automatically deploy on push to main branch
# Monitor deployment in Render dashboard
```

#### 4. Verify Deployment

```bash
# Check health endpoint
curl https://api.malar-market-ledger.com/health

# Expected response:
{"status": "healthy", "timestamp": "2026-02-14T05:00:00Z"}
```

### Option 2: DigitalOcean Deployment

#### 1. Create Droplet

```bash
# Create Ubuntu 22.04 droplet
# Size: 4GB RAM, 2 CPU, 80GB SSD
# Region: Choose nearest region
# SSH Key: Add your SSH key
```

#### 2. Connect to Server

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3.11 python3-pip postgresql-client nginx certbot python3-certbot-nginx
```

#### 3. Set Up Application

```bash
# Create application user
adduser malar
usermod -aG sudo malar

# Create application directory
mkdir -p /var/www/malar-market-ledger
chown malar:malar /var/www/malar-market-ledger

# Switch to application user
su - malar

# Clone repository
cd /var/www/malar-market-ledger
git clone https://github.com/your-org/malar-market-ledger.git .

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

#### 4. Configure Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/malar-api.service
```

```ini
[Unit]
Description=Malar Market Ledger API
After=network.target

[Service]
User=malar
WorkingDirectory=/var/www/malar-market-ledger/backend
Environment="PATH=/var/www/malar-market-ledger/backend/venv/bin"
ExecStart=/var/www/malar-market-ledger/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable malar-api
sudo systemctl start malar-api
sudo systemctl status malar-api
```

#### 5. Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/malar-api
```

```nginx
server {
    listen 80;
    server_name api.malar-market-ledger.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/malar-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.malar-market-ledger.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## Frontend Deployment

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy to Vercel

```bash
cd frontend

# First deployment
vercel

# Production deployment
vercel --prod
```

#### 4. Configure Project Settings

In Vercel dashboard:

**Build Settings:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**
Add all frontend environment variables from [Environment Configuration](#environment-configuration).

**Domains:**
- Add custom domain: `malar-market-ledger.com`
- Configure DNS records (see [Domain and DNS Setup](#domain-and-dns-setup))

#### 5. Configure Rewrites

Create `vercel.json` in frontend root:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.malar-market-ledger.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 6. Deploy

```bash
# Push to GitHub
git add .
git commit -m "Deploy frontend to production"
git push origin main

# Vercel will automatically deploy on push to main branch
# Monitor deployment in Vercel dashboard
```

---

## SSL/HTTPS Configuration

### Let's Encrypt (Free SSL)

#### For Nginx (Backend)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.malar-market-ledger.com

# Test renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

#### For Apache (Alternative)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d api.malar-market-ledger.com
```

### Cloudflare SSL (Optional)

1. Add domain to Cloudflare
2. Enable "Full SSL" mode
3. Configure SSL/TLS settings:
   - SSL/TLS encryption mode: Full
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On

### SSL Verification

```bash
# Check SSL certificate
openssl s_client -connect api.malar-market-ledger.com:443 -servername api.malar-market-ledger.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

---

## Domain and DNS Setup

### DNS Configuration

#### For Vercel Frontend

```
Type    Name              Value
A        @                 76.76.21.21  (Vercel IP)
A        www               76.76.21.21  (Vercel IP)
CNAME    api               your-render-app.onrender.com
```

#### For Render Backend

```
Type    Name              Value
CNAME    api               your-render-app.onrender.com
```

### Subdomains

| Subdomain | Purpose | Target |
|-----------|----------|---------|
| @ | Frontend | Vercel |
| www | Frontend (redirect) | Vercel |
| api | Backend API | Render/DigitalOcean |
| staging | Staging environment | Vercel (preview) |

### DNS Verification

```bash
# Check DNS propagation
dig api.malar-market-ledger.com
dig malar-market-ledger.com

# Check from multiple locations
# Visit: https://www.whatsmydns.net/
```

---

## CI/CD Pipeline Setup

### GitHub Actions

#### Backend CI/CD

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
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
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
          wait-for-success: true
```

#### Frontend CI/CD

Create `.github/workflows/frontend-deploy.yml`:

```yaml
name: Frontend Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
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
      
      - name: Build
        run: |
          cd frontend
          npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

### Secrets Configuration

Add secrets to GitHub repository:

**Backend Secrets:**
- `RENDER_SERVICE_ID`: Render service ID
- `RENDER_API_KEY`: Render API key

**Frontend Secrets:**
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

---

## Post-Deployment Verification

### Health Checks

#### Backend Health Check

```bash
# Check health endpoint
curl https://api.malar-market-ledger.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-02-14T05:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Frontend Health Check

```bash
# Check frontend loads
curl -I https://malar-market-ledger.com

# Expected response:
HTTP/2 200
content-type: text/html; charset=utf-8
```

### Database Connectivity Check

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Expected: PostgreSQL version information
```

### API Endpoint Verification

```bash
# Test authentication endpoint
curl -X POST https://api.malar-market-ledger.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected endpoint
curl https://api.malar-market-ledger.com/api/v1/farmers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PWA Verification

```bash
# Check service worker registration
curl -I https://malar-market-ledger.com/sw.js

# Check manifest
curl -I https://malar-market-ledger.com/manifest.json

# Verify PWA installation
# Open Chrome DevTools > Application > Service Workers
# Should see service worker registered and active
```

### SSL Verification

```bash
# Check SSL certificate
openssl s_client -connect malar-market-ledger.com:443 -servername malar-market-ledger.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
# Target: A+ rating
```

### Performance Verification

```bash
# Test API response time
time curl https://api.malar-market-ledger.com/health

# Target: < 500ms

# Test frontend load time
# Use Lighthouse in Chrome DevTools
# Target: Performance score > 90
```

### Monitoring Setup

```bash
# Verify monitoring tools
# Check Sentry dashboard for errors
# Check application logs
# Check database performance metrics
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Deployment Fails

**Problem**: Deployment fails with build error

**Solution**:
```bash
# Check build logs in Render dashboard
# Verify requirements.txt is correct
# Check Python version compatibility
# Verify all dependencies are installable

# Local test:
cd backend
pip install -r requirements.txt
```

#### 2. Frontend Deployment Fails

**Problem**: Vercel deployment fails

**Solution**:
```bash
# Check build logs in Vercel dashboard
# Verify package.json scripts
# Check for missing dependencies
# Verify environment variables

# Local test:
cd frontend
npm run build
```

#### 3. Database Connection Error

**Problem**: Cannot connect to database

**Solution**:
```bash
# Verify DATABASE_URL is correct
# Check database is accessible
# Verify firewall allows connection

# Test connection:
psql $DATABASE_URL -c "SELECT 1;"
```

#### 4. CORS Error

**Problem**: Frontend cannot connect to backend

**Solution**:
```bash
# Verify CORS settings in backend
# Check ALLOWED_ORIGINS includes frontend URL
# Verify frontend API_BASE_URL is correct

# Test CORS:
curl -H "Origin: https://malar-market-ledger.com" \
  https://api.malar-market-ledger.com/health
```

#### 5. SSL Certificate Error

**Problem**: SSL certificate not trusted

**Solution**:
```bash
# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. WhatsApp Webhook Not Working

**Problem**: WhatsApp webhook not receiving messages

**Solution**:
```bash
# Verify webhook URL is accessible
curl https://api.malar-market-ledger.com/api/v1/whatsapp/webhook

# Check webhook configuration in WhatsApp dashboard
# Verify SSL certificate is valid
# Check firewall allows incoming requests
```

#### 7. Offline Sync Not Working

**Problem**: Offline entries not syncing

**Solution**:
```bash
# Check service worker is registered
# Verify IndexedDB is accessible
# Check browser console for errors
# Verify sync queue is not full

# Clear sync queue:
# In browser DevTools > Application > IndexedDB
# Delete sync_queue store
```

### Log Collection

#### Backend Logs

```bash
# Render logs (via dashboard)
# DigitalOcean logs:
sudo journalctl -u malar-api -f

# Application logs:
tail -f /var/www/malar-market-ledger/backend/logs/app.log
```

#### Frontend Logs

```bash
# Vercel logs (via dashboard)
# Browser console logs:
# Open DevTools > Console
# Check for JavaScript errors
```

### Rollback Procedures

#### Backend Rollback

```bash
# Rollback to previous commit
git log --oneline
git checkout <previous-commit-hash>
git push -f origin main

# Or use Render dashboard to rollback
# Deployments > Select previous deployment > Redeploy
```

#### Frontend Rollback

```bash
# Rollback to previous commit
git log --oneline
git checkout <previous-commit-hash>
git push -f origin main

# Or use Vercel dashboard to rollback
# Deployments > Select previous deployment > Redeploy
```

#### Database Rollback

```bash
# Restore from backup
# Supabase dashboard > Database > Backups
# Select backup > Restore

# Or use point-in-time recovery
# Supabase dashboard > Database > Point-in-Time Recovery
# Select timestamp > Restore
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify backup completion

**Weekly:**
- Review performance metrics
- Check disk space usage
- Update dependencies

**Monthly:**
- Security audit
- Backup verification
- SSL certificate renewal check
- Database optimization

### Dependency Updates

```bash
# Backend dependencies
cd backend
pip list --outdated
pip install --upgrade <package-name>

# Frontend dependencies
cd frontend
npm outdated
npm update <package-name>
```

### Database Maintenance

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE;

-- Reindex tables
REINDEX TABLE daily_entries;
REINDEX TABLE settlements;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong secrets for JWT
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated
- [ ] Enable audit logging

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Scaling

### Horizontal Scaling

#### Backend Scaling

```bash
# Add more instances in Render
# Settings > Scale > Add instance
# Configure load balancer

# Or use DigitalOcean Load Balancer
# Create load balancer
# Add droplets behind load balancer
```

#### Frontend Scaling

```bash
# Vercel automatically scales
# Configure edge locations
# Enable CDN caching
```

### Vertical Scaling

#### Backend Resources

```bash
# Upgrade Render plan
# Settings > Scale > Change plan
# More CPU, RAM, and storage

# Or upgrade DigitalOcean droplet
# Resize droplet
# More resources
```

---

## Cost Optimization

### Cost Monitoring

**Backend (Render):**
- Free: $0/month (limited resources)
- Starter: $7/month (better resources)
- Pro: $25/month (best performance)

**Frontend (Vercel):**
- Hobby: $0/month (limited bandwidth)
- Pro: $20/month (unlimited bandwidth)

**Database (Supabase):**
- Free: $0/month (500MB database)
- Pro: $25/month (8GB database)

**Total Estimated Cost:**
- Development: $0/month
- Production: $50-70/month

### Cost Optimization Tips

1. **Use caching** to reduce database queries
2. **Optimize images** to reduce bandwidth
3. **Use CDN** for static assets
4. **Monitor usage** and scale as needed
5. **Use reserved instances** for consistent workloads

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: DevOps Team
