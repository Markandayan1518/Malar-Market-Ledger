# Malar Market Digital Ledger - Monitoring Guide

## Table of Contents

1. [Overview](#overview)
2. [Application Monitoring](#application-monitoring)
3. [Error Tracking](#error-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [Log Aggregation](#log-aggregation)
6. [Alert Configuration](#alert-configuration)
7. [Health Check Endpoints](#health-check-endpoints)
8. [Metrics to Track](#metrics-to-track)
9. [Monitoring Tools](#monitoring-tools)

---

## Overview

This guide provides comprehensive procedures for monitoring the Malar Market Digital Ledger to ensure system reliability, performance, and availability.

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Application Monitoring (Sentry)                 │     │
│  │  - Error tracking                                │     │
│  │  - Performance monitoring                        │     │
│  │  - User sessions                                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Performance Monitoring (Vercel Analytics)       │     │
│  │  - Page load times                               │     │
│  │  - API response times                            │     │
│  │  - User engagement                              │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Log Aggregation (CloudWatch/ELK)             │     │
│  │  - Application logs                              │     │
│  │  - Access logs                                 │     │
│  │  - Error logs                                  │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Database Monitoring (Supabase)                │     │
│  │  - Query performance                            │     │
│  │  - Connection pool                              │     │
│  │  - Storage usage                                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Uptime Monitoring (UptimeRobot)                │     │
│  │  - Availability                                  │     │
│  │  - Response times                                │     │
│  │  - Incident tracking                             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Monitoring Goals

- **Availability**: 99.9% uptime (43.8 minutes/month downtime max)
- **Performance**: API response time < 500ms (p95)
- **Error Rate**: < 0.1% error rate
- **User Satisfaction**: > 95% user satisfaction score

---

## Application Monitoring

### Sentry Setup

#### 1. Create Sentry Project

1. Log in to https://sentry.io
2. Create new project: "Malar Market Ledger"
3. Select platform: Python (backend) and JavaScript (frontend)
4. Get DSN (Data Source Name)

#### 2. Backend Integration

```python
# backend/app/config.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration()
    ],
    traces_sample_rate=1.0,
    environment=os.getenv("ENVIRONMENT", "development"),
    release=os.getenv("APP_VERSION", "1.0.0")
)
```

#### 3. Frontend Integration

```javascript
// frontend/src/main.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENVIRONMENT,
  release: import.meta.env.VITE_APP_VERSION,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      maskAllInputs: false,
    }),
  ],
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      event.request.headers = {};
    }
    return event;
  },
});
```

#### 4. Error Context

```python
# backend/app/api/routes.py
from sentry_sdk import capture_exception

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Capture error with context
    capture_exception(exc, {
        'user_id': request.state.user.id if hasattr(request.state, 'user') else None,
        'endpoint': str(request.url),
        'method': request.method,
        'ip_address': request.client.host,
        'user_agent': request.headers.get('user-agent')
    })
    
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )
```

#### 5. Performance Monitoring

```python
# backend/app/api/routes.py
from sentry_sdk import start_span, start_transaction

@app.get("/api/v1/farmers")
async def get_farmers():
    with start_transaction(op="get_farmers", description="Get all farmers"):
        # Your logic here
        farmers = db.query(Farmer).all()
        
        with start_span(op="database_query", description="Query farmers table"):
            return {"success": True, "data": farmers}
```

### Custom Metrics

#### Backend Metrics

```python
# backend/app/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
request_counter = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint'])
request_duration = Histogram('api_request_duration_seconds', 'API request duration', ['endpoint'])
active_users = Gauge('active_users', 'Number of active users')
database_connections = Gauge('database_connections', 'Number of database connections')

# Track requests
def track_request(endpoint: str, method: str, duration: float):
    request_counter.labels(method=method, endpoint=endpoint).inc()
    request_duration.labels(endpoint=endpoint).observe(duration)

# Track active users
def update_active_users(count: int):
    active_users.set(count)
```

#### Frontend Metrics

```javascript
// frontend/src/utils/analytics.js
export const trackEvent = (eventName, properties = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }
  
  // Send to custom analytics
  fetch('/api/v1/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  });
};

export const trackPageView = (pageName) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href
    });
  }
  
  trackEvent('page_view', { page: pageName });
};

export const trackError = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context
  });
  
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    ...context
  });
};
```

---

## Error Tracking

### Error Categories

#### 1. Application Errors

```python
# backend/app/core/error_handler.py
from enum import Enum

class ErrorCategory(Enum):
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    EXTERNAL_SERVICE = "external_service"
    BUSINESS_LOGIC = "business_logic"
    NETWORK = "network"

class ApplicationError(Exception):
    def __init__(self, message: str, category: ErrorCategory, details: dict = None):
        self.message = message
        self.category = category
        self.details = details or {}
        super().__init__(message)
```

#### 2. Error Logging

```python
# backend/app/core/error_handler.py
import logging
from sentry_sdk import capture_exception

logger = logging.getLogger(__name__)

def log_error(error: ApplicationError, context: dict = None):
    """Log error with context"""
    error_data = {
        'category': error.category.value,
        'message': error.message,
        'details': error.details,
        'context': context or {}
    }
    
    # Log to file
    logger.error(f"Application error: {error_data}")
    
    # Send to Sentry
    capture_exception(error, extra=error_data)
    
    # Send to monitoring service
    send_to_monitoring_service(error_data)
```

#### 3. Error Alerts

```python
# backend/app/core/alerting.py
from typing import List

class AlertRule:
    def __init__(self, name: str, condition, threshold: int, window: int):
        self.name = name
        self.condition = condition
        self.threshold = threshold
        self.window = window

# Define alert rules
alert_rules = [
    AlertRule(
        name="High Error Rate",
        condition=lambda errors: len(errors) > threshold,
        threshold=100,
        window=300  # 5 minutes
    ),
    AlertRule(
        name="Database Connection Errors",
        condition=lambda errors: any(e.category == ErrorCategory.DATABASE for e in errors),
        threshold=1,
        window=60  # 1 minute
    ),
    AlertRule(
        name="Authentication Failures",
        condition=lambda errors: any(e.category == ErrorCategory.AUTHENTICATION for e in errors),
        threshold=10,
        window=300  # 5 minutes
    )
]

def check_alerts(errors: List[ApplicationError]):
    """Check if any alert rules are triggered"""
    triggered_alerts = []
    
    for rule in alert_rules:
        recent_errors = [e for e in errors if time.time() - e.timestamp < rule.window]
        if rule.condition(recent_errors):
            triggered_alerts.append({
                'rule': rule.name,
                'count': len(recent_errors),
                'threshold': rule.threshold
            })
    
    return triggered_alerts
```

### Error Dashboard

```python
# backend/app/api/monitoring.py
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/monitoring")

@router.get("/errors")
async def get_error_stats(
    hours: int = 24,
    category: str = None
):
    """Get error statistics"""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    query = db.query(ErrorLog).filter(
        ErrorLog.created_at >= start_time,
        ErrorLog.created_at <= end_time
    )
    
    if category:
        query = query.filter(ErrorLog.category == category)
    
    errors = query.all()
    
    # Calculate statistics
    total_errors = len(errors)
    error_rate = total_errors / hours
    
    # Group by category
    category_counts = {}
    for error in errors:
        category_counts[error.category] = category_counts.get(error.category, 0) + 1
    
    return {
        "total_errors": total_errors,
        "error_rate": error_rate,
        "category_counts": category_counts,
        "period_hours": hours
    }
```

---

## Performance Monitoring

### Backend Performance

#### 1. Response Time Tracking

```python
# backend/app/middleware/performance.py
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Add performance header
        response.headers["X-Response-Time"] = str(duration)
        
        # Track metrics
        track_request(
            endpoint=str(request.url.path),
            method=request.method,
            duration=duration
        )
        
        # Log slow requests
        if duration > 1.0:  # 1 second threshold
            logger.warning(f"Slow request: {request.url.path} took {duration:.3f}s")
        
        return response
```

#### 2. Database Performance

```python
# backend/app/middleware/database_performance.py
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track database query execution"""
    context._query_start_time = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track database query completion"""
    if hasattr(context, '_query_start_time'):
        duration = time.time() - context._query_start_time
        
        # Log slow queries
        if duration > 0.5:  # 500ms threshold
            logger.warning(f"Slow query ({duration:.3f}s): {statement[:100]}")
        
        # Track metrics
        track_database_query(duration, statement)

# Add to SQLAlchemy engine
engine = create_engine(DATABASE_URL, listeners=[
    receive_before_cursor_execute,
    receive_after_cursor_execute
])
```

#### 3. Cache Performance

```python
# backend/app/services/cache_monitor.py
import redis
from typing import Dict

def get_cache_stats() -> Dict:
    """Get cache performance statistics"""
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
    
    info = r.info()
    
    return {
        "hit_rate": calculate_hit_rate(r),
        "memory_used": info['used_memory_human'],
        "memory_peak": info['used_memory_peak_human'],
        "total_keys": info['db0'],
        "expired_keys": info['expired_keys'],
        "evicted_keys": info['evicted_keys']
    }

def calculate_hit_rate(redis_client) -> float:
    """Calculate cache hit rate"""
    stats = redis_client.info('stats')
    hits = int(stats.get('keyspace_hits', 0))
    misses = int(stats.get('keyspace_misses', 0))
    total = hits + misses
    
    return (hits / total * 100) if total > 0 else 0.0
```

### Frontend Performance

#### 1. Page Load Tracking

```javascript
// frontend/src/utils/performance.js
export const trackPageLoad = () => {
  if (window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    
    // Track metrics
    trackEvent('page_load', {
      page_load_time: pageLoadTime,
      dom_content_loaded: domContentLoaded,
      dom_complete: perfData.domComplete - perfData.navigationStart,
      first_paint: perfData.responseStart - perfData.navigationStart
    });
    
    // Check performance thresholds
    if (pageLoadTime > 3000) {  // 3 seconds
      trackError(new Error('Page load time exceeded threshold'), {
        page_load_time: pageLoadTime,
        threshold: 3000
      });
    }
  }
};

// Track on page load
window.addEventListener('load', trackPageLoad);
```

#### 2. API Performance Tracking

```javascript
// frontend/src/services/api.js
export const apiCall = async (url, options = {}) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Track API call performance
    trackEvent('api_call', {
      url: url,
      method: options.method || 'GET',
      duration: duration,
      status: response.status,
      success: response.ok
    });
    
    // Log slow API calls
    if (duration > 1000) {  // 1 second
      trackError(new Error('API call exceeded threshold'), {
        url,
        duration,
        threshold: 1000
      });
    }
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    trackEvent('api_error', {
      url,
      duration,
      error: error.message
    });
    
    throw error;
  }
};
```

#### 3. Core Web Vitals

```javascript
// frontend/src/utils/web-vitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const trackWebVitals = () => {
  // Cumulative Layout Shift (CLS)
  getCLS((metric) => {
    trackEvent('web_vital_cls', {
      value: metric.value,
      rating: getRating(metric.value, 0.1)
    });
  });
  
  // First Input Delay (FID)
  getFID((metric) => {
    trackEvent('web_vital_fid', {
      value: metric.value,
      rating: getRating(metric.value, 100)
    });
  });
  
  // Largest Contentful Paint (LCP)
  getLCP((metric) => {
    trackEvent('web_vital_lcp', {
      value: metric.value,
      rating: getRating(metric.value, 2500)
    });
  });
  
  // First Contentful Paint (FCP)
  getFCP((metric) => {
    trackEvent('web_vital_fcp', {
      value: metric.value,
      rating: getRating(metric.value, 1800)
    });
  });
  
  // Time to First Byte (TTFB)
  getTTFB((metric) => {
    trackEvent('web_vital_ttfb', {
      value: metric.value,
      rating: getRating(metric.value, 600)
    });
  });
};

function getRating(value, threshold) {
  if (value <= threshold) {
    return 'good';
  } else if (value <= threshold * 1.5) {
    return 'needs_improvement';
  } else {
    return 'poor';
  }
}

// Track on page load
window.addEventListener('load', trackWebVitals);
```

---

## Log Aggregation

### Log Structure

```python
# backend/app/core/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        
        return json.dumps(log_data)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/app.log'),
        logging.handlers.RotatingFileHandler(
            'logs/app.log',
            maxBytes=10485760,  # 100MB
            backupCount=5
        )
    ]
)

# Apply JSON formatter
for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())
```

### Log Levels

| Level | Description | Use Case |
|--------|-------------|-----------|
| DEBUG | Detailed diagnostic information | Development, troubleshooting |
| INFO | General informational messages | Normal operation tracking |
| WARNING | Warning messages | Potential issues, degraded performance |
| ERROR | Error events | Application errors, failures |
| CRITICAL | Critical failures | System outages, data loss |

### Log Categories

```python
# backend/app/core/logging.py
class LogCategory(Enum):
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATABASE = "database"
    API = "api"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL_SERVICE = "external_service"
    PERFORMANCE = "performance"
    SECURITY = "security"

def log(category: LogCategory, level: str, message: str, **kwargs):
    """Log with category"""
    extra = {
        'category': category.value,
        **kwargs
    }
    
    if level == 'ERROR':
        logging.error(message, extra=extra)
    elif level == 'WARNING':
        logging.warning(message, extra=extra)
    elif level == 'INFO':
        logging.info(message, extra=extra)
    else:
        logging.debug(message, extra=extra)
```

### Log Aggregation Tools

#### CloudWatch (AWS)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/setup.py \
  --region us-east-1 \
  --aws-access-key-id YOUR_KEY \
  --aws-secret-access-key YOUR_SECRET

# Send custom metrics
aws cloudwatch put-metric-data \
  --namespace MalarMarket \
  --metric-name RequestCount \
  --value 100 \
  --timestamp $(date -u +%Y-%m-%dT%H:%M:%S.000Z)
```

#### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# logstash.conf
input {
  file {
    path => "/var/log/malar-api/*.log"
    start_position => "beginning"
    sincedb_path => "/var/log/.sincedb"
  }
}

filter {
  if [loglevel] == "ERROR" {
    # Send alerts for errors
    elasticsearch {
      hosts => ["localhost:9200"]
      index => "malar-errors"
    }
  } else {
    # Store all logs
    elasticsearch {
      hosts => ["localhost:9200"]
      index => "malar-logs"
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "malar-market-ledger"
  }
}
```

---

## Alert Configuration

### Alert Channels

#### 1. Email Alerts

```python
# backend/app/core/alerting.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_alert(
    subject: str,
    message: str,
    recipients: List[str]
):
    """Send email alert"""
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = f"[ALERT] {subject}"
    msg.attach(MIMEText(message, 'plain'))
    
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

# Alert recipients
ALERT_RECIPIENTS = [
    "admin@malar.com",
    "devops@malar.com",
    "support@malar.com"
]
```

#### 2. Slack Alerts

```python
# backend/app/core/alerting.py
import requests

SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

def send_slack_alert(
    channel: str,
    message: str,
    level: str = "warning"
):
    """Send Slack alert"""
    color = {
        "info": "#36a64f",
        "warning": "#ff9800",
        "error": "#ff0000",
        "critical": "#ff0000"
    }
    
    payload = {
        "channel": channel,
        "username": "Malar Monitor",
        "text": message,
        "attachments": [{
            "color": color[level],
            "title": f"{level.upper()} Alert",
            "text": message,
            "ts": int(time.time())
        }]
    }
    
    requests.post(SLACK_WEBHOOK_URL, json=payload)
```

#### 3. SMS Alerts (Critical Only)

```python
# backend/app/core/alerting.py
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

def send_sms_alert(message: str, recipients: List[str]):
    """Send SMS alert for critical issues"""
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    for phone_number in recipients:
        client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
```

### Alert Rules

#### System Health Alerts

```python
# backend/app/core/alerting.py
class SystemHealthAlert:
    def __init__(self):
        self.checks = {
            'api_response_time': {
                'threshold': 1.0,  # 1 second
                'window': 300,  # 5 minutes
                'severity': 'warning'
            },
            'error_rate': {
                'threshold': 0.01,  # 1%
                'window': 300,  # 5 minutes
                'severity': 'critical'
            },
            'database_connection': {
                'threshold': 0,  # Any connection errors
                'window': 60,  # 1 minute
                'severity': 'critical'
            },
            'disk_space': {
                'threshold': 90,  # 90% full
                'window': 3600,  # 1 hour
                'severity': 'warning'
            }
        }
    
    def check(self, metrics: dict):
        """Check if any alerts should be triggered"""
        alerts = []
        
        for check_name, check_config in self.checks.items():
            if self._should_alert(check_name, metrics, check_config):
                alerts.append({
                    'check': check_name,
                    'severity': check_config['severity'],
                    'value': metrics.get(check_name),
                    'threshold': check_config['threshold']
                })
        
        return alerts
    
    def _should_alert(self, check_name: str, metrics: dict, config: dict) -> bool:
        """Determine if alert should be triggered"""
        value = metrics.get(check_name, 0)
        threshold = config['threshold']
        
        if check_name == 'api_response_time':
            return value > threshold
        elif check_name == 'error_rate':
            return value > threshold
        elif check_name == 'database_connection':
            return value > threshold
        elif check_name == 'disk_space':
            return value > threshold
        
        return False
```

#### Business Logic Alerts

```python
# backend/app/services/alerting.py
def check_business_alerts(db):
    """Check for business logic issues"""
    alerts = []
    
    # Check for negative balances
    negative_balance_farmers = db.query(Farmer).filter(
        Farmer.current_balance < 0
    ).all()
    
    if negative_balance_farmers:
        alerts.append({
            'type': 'negative_balance',
            'severity': 'warning',
            'count': len(negative_balance_farmers),
            'message': f'{len(negative_balance_farmers)} farmers have negative balances'
        })
    
    # Check for pending settlements
    pending_settlements = db.query(Settlement).filter(
        Settlement.status == 'pending_approval'
    ).count()
    
    if pending_settlements > 10:
        alerts.append({
            'type': 'pending_settlements',
            'severity': 'info',
            'count': pending_settlements,
            'message': f'{pending_settlements} settlements pending approval'
        })
    
    # Check for failed WhatsApp messages
    failed_messages = db.query(Notification).filter(
        Notification.status == 'failed',
        Notification.created_at >= datetime.utcnow() - timedelta(hours=1)
    ).count()
    
    if failed_messages > 5:
        alerts.append({
            'type': 'failed_whatsapp_messages',
            'severity': 'warning',
            'count': failed_messages,
            'message': f'{failed_messages} WhatsApp messages failed in last hour'
        })
    
    return alerts
```

---

## Health Check Endpoints

### Backend Health Checks

```python
# backend/app/api/health.py
from fastapi import APIRouter
from datetime import datetime
import psutil

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "unknown")
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {}
    }
    
    # Check database
    try:
        db.execute("SELECT 1")
        health_status["components"]["database"] = {
            "status": "healthy",
            "response_time": measure_db_response_time()
        }
    except Exception as e:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check Redis
    try:
        redis_client.ping()
        health_status["components"]["redis"] = {
            "status": "healthy",
            "response_time": measure_redis_response_time()
        }
    except Exception as e:
        health_status["components"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check WhatsApp service
    try:
        whatsapp_health = check_whatsapp_service()
        health_status["components"]["whatsapp"] = whatsapp_health
    except Exception as e:
        health_status["components"]["whatsapp"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check system resources
    health_status["components"]["system"] = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent
    }
    
    # Determine overall status
    all_healthy = all(
        component["status"] == "healthy" 
        for component in health_status["components"].values()
    )
    
    health_status["status"] = "healthy" if all_healthy else "degraded"
    
    return health_status

def measure_db_response_time() -> float:
    """Measure database response time"""
    start_time = time.time()
    db.execute("SELECT 1")
    return time.time() - start_time

def measure_redis_response_time() -> float:
    """Measure Redis response time"""
    start_time = time.time()
    redis_client.ping()
    return time.time() - start_time
```

### Frontend Health Checks

```javascript
// frontend/src/utils/health.js
export const checkHealth = async () => {
  const healthUrl = import.meta.env.VITE_API_BASE_URL + '/health';
  
  try {
    const response = await fetch(healthUrl);
    const health = await response.json();
    
    return {
      api: health.status === 'healthy',
      database: health.components?.database?.status === 'healthy',
      redis: health.components?.redis?.status === 'healthy',
      whatsapp: health.components?.whatsapp?.status === 'healthy',
      timestamp: health.timestamp
    };
  } catch (error) {
    return {
      api: false,
      error: error.message
    };
  };
};

export const startHealthChecks = (interval = 60000) => {
  // Check health every minute
  setInterval(async () => {
    const health = await checkHealth();
    
    if (!health.api) {
      // Show health warning
      showHealthWarning(health);
      
      // Track health status
      trackEvent('health_check', {
        status: 'unhealthy',
        ...health
      });
    }
  }, interval);
};

function showHealthWarning(health) {
  // Show warning banner
  const banner = document.createElement('div');
  banner.className = 'health-warning-banner';
  banner.innerHTML = `
    <div class="warning-icon">⚠️</div>
    <div class="warning-message">
      System health issue detected. Some features may be unavailable.
      <a href="#" onclick="dismissBanner()">Dismiss</a>
    </div>
  `;
  document.body.appendChild(banner);
}

function dismissBanner() {
  const banner = document.querySelector('.health-warning-banner');
  if (banner) {
    banner.remove();
  }
}

// Start health checks on app load
window.addEventListener('load', startHealthChecks);
```

---

## Metrics to Track

### Key Performance Indicators (KPIs)

#### Backend KPIs

| Metric | Target | Warning | Critical | Description |
|--------|---------|----------|-------------|
| API Response Time (p50) | < 200ms | < 500ms | > 1s | Median API response time |
| API Response Time (p95) | < 500ms | < 1s | > 2s | 95th percentile response time |
| API Response Time (p99) | < 1s | < 2s | > 3s | 99th percentile response time |
| Error Rate | < 0.1% | < 0.5% | > 1% | Percentage of failed requests |
| Database Query Time | < 100ms | < 200ms | > 500ms | Average query duration |
| Database Connection Pool | < 80% | < 90% | > 95% | Connection pool utilization |
| Cache Hit Rate | > 80% | > 70% | < 50% | Percentage of cache hits |
| WhatsApp Success Rate | > 95% | > 90% | < 80% | WhatsApp message delivery rate |

#### Frontend KPIs

| Metric | Target | Warning | Critical | Description |
|--------|---------|----------|-------------|
| Page Load Time | < 2s | < 3s | > 5s | Time to load page |
| First Contentful Paint | < 1.5s | < 2.5s | > 4s | First meaningful paint |
| Largest Contentful Paint | < 2.5s | < 4s | > 6s | Largest content paint |
| First Input Delay | < 100ms | < 300ms | > 500ms | Time to first interaction |
| Cumulative Layout Shift | < 0.1 | < 0.25 | > 0.5 | Layout stability score |
| JavaScript Errors | 0 | < 5/hour | > 20/hour | Number of JS errors |
| Service Worker Active | Yes | No | No | PWA service worker status |

#### Business KPIs

| Metric | Target | Warning | Critical | Description |
|--------|---------|----------|-------------|
| Daily Entries Created | > 100 | < 50 | < 20 | Number of entries per day |
| Settlements Generated | > 10 | < 5 | < 2 | Number of settlements per day |
| WhatsApp Messages Sent | > 50 | < 30 | < 10 | WhatsApp notifications per day |
| Active Users | > 20 | < 10 | < 5 | Concurrent active users |
| Offline Sync Success | > 95% | > 90% | < 80% | Offline sync success rate |

### Metrics Dashboard

```python
# backend/app/api/monitoring.py
@router.get("/metrics")
async def get_metrics():
    """Get all metrics for dashboard"""
    metrics = {
        "performance": get_performance_metrics(),
        "errors": get_error_metrics(),
        "business": get_business_metrics(),
        "system": get_system_metrics()
    }
    
    return metrics

def get_performance_metrics():
    """Get performance metrics"""
    return {
        "api_response_time_p50": get_percentile(api_response_times, 50),
        "api_response_time_p95": get_percentile(api_response_times, 95),
        "api_response_time_p99": get_percentile(api_response_times, 99),
        "database_query_time_avg": get_average(db_query_times),
        "cache_hit_rate": get_cache_hit_rate()
    }

def get_error_metrics():
    """Get error metrics"""
    return {
        "total_errors": get_error_count(hours=24),
        "error_rate": get_error_rate(hours=24),
        "errors_by_category": get_errors_by_category(hours=24),
        "errors_by_endpoint": get_errors_by_endpoint(hours=24)
    }

def get_business_metrics():
    """Get business metrics"""
    return {
        "daily_entries_today": get_daily_entries_count(),
        "settlements_today": get_settlements_count(),
        "whatsapp_messages_today": get_whatsapp_messages_count(),
        "active_users": get_active_users_count()
    }

def get_system_metrics():
    """Get system metrics"""
    return {
        "cpu_usage": psutil.cpu_percent(),
        "memory_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "database_connections": get_db_connection_count(),
        "redis_connections": get_redis_connection_count()
    }
```

---

## Monitoring Tools

### Sentry Dashboard

1. Log in to https://sentry.io
2. Select project: "Malar Market Ledger"
3. View dashboard with:
   - Error rate over time
   - Performance metrics
   - User sessions
   - Release tracking
   - Breadcrumbs (user actions)

### Vercel Analytics

1. Log in to https://vercel.com/dashboard
2. Select project: "Malar Market Ledger"
3. View analytics with:
   - Page views
   - Unique visitors
   - Geographic distribution
   - Device distribution
   - Performance metrics

### Supabase Dashboard

1. Log in to https://supabase.com/dashboard
2. Select project: "Malar Market Ledger"
3. View database metrics with:
   - Query performance
   - Storage usage
   - Connection pool status
   - Backup status

### Uptime Monitoring

#### UptimeRobot Setup

```bash
# Add monitor
curl -X POST https://api.uptimerobot.com/v2/new-monitors \
  -d "{
    \"type\": \"https\",
    \"url\": \"https://api.malar-market-ledger.com/health\",
    \"friendly_name\": \"Malar Market API\",
    \"interval\": 60,
    \"locations\": [\"us-east-1\", \"eu-west-1\"]
  }" \
  -H "Authorization: Bearer YOUR_UPTIMEROBOT_API_KEY"
```

#### Pingdom Setup

```bash
# Add check via API
curl -X POST https://api.pingdom.com/api/3.1/checks \
  -d "{
    \"name\": \"Malar Market API\",
    \"host\": \"api.malar-market-ledger.com\",
    \"type\": \"https\",
    \"resolution\": 1,
    \"paused\": false,
    \"sendtoemail\": \"alerts@malar.com\",
    \"notifywhendown\": 1,
    \"notifywhenbackup\": 1
  }" \
  -H "Authorization: Bearer YOUR_PINGDOM_API_KEY"
```

---

## Best Practices

### Monitoring Best Practices

1. **Set meaningful thresholds** based on business requirements
2. **Monitor from user perspective** (not just system metrics)
3. **Alert on symptoms, not causes** (e.g., slow response time, not high CPU)
4. **Use multiple alert channels** (email, Slack, SMS)
5. **Review alerts regularly** and adjust thresholds
6. **Document alert procedures** for each type of alert
7. **Test alert systems** regularly
8. **Maintain alert fatigue** (avoid too many false positives)

### Log Management Best Practices

1. **Use structured logging** (JSON format)
2. **Include context** in log messages
3. **Rotate logs regularly** to avoid disk space issues
4. **Archive old logs** for compliance
5. **Protect sensitive data** in logs
6. **Monitor log volume** for anomalies
7. **Centralize logs** for easier analysis

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Author**: DevOps Team
