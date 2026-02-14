# WhatsApp Integration Setup Guide

This guide explains how to set up WhatsApp integration for the Malar Market Digital Ledger.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Twilio Setup](#twilio-setup)
5. [Interakt Setup](#interakt-setup)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The WhatsApp integration provides:
- Automated receipts after daily entries
- Farmer self-service bot for queries
- Bilingual support (English & Tamil)
- Message queue with Redis
- Delivery tracking and retry logic
- Provider-agnostic design (Twilio/Interakt)

---

## Prerequisites

### Required Services

1. **Redis Server**
   - Required for message queue
   - Default: `redis://localhost:6379/0`
   - Can be configured via `REDIS_URL` environment variable

2. **WhatsApp Provider Account**
   - Choose one: Twilio or Interakt
   - See provider-specific setup below

3. **Database**
   - PostgreSQL with `whatsapp_logs` table
   - See [Database Schema](database-schema.md) for details

---

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# WhatsApp Provider Configuration
WHATSAPP_PROVIDER=twilio  # or 'interakt'
WHATSAPP_ENABLED=true

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238888

# Interakt Configuration (if using Interakt)
INTERAKT_API_KEY=your_api_key
INTERAKT_PHONE_NUMBER_ID=your_phone_number_id

# Webhook Configuration
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/v1/whatsapp/webhook

# Optional: Template IDs (for template-based messages)
WHATSAPP_TEMPLATE_RECEIPT=your_receipt_template_id
WHATSAPP_TEMPLATE_SETTLEMENT=your_settlement_template_id
```

### Application Configuration

The WhatsApp integration is configured in [`backend/app/config.py`](../backend/app/config.py):

```python
# WhatsApp API
whatsapp_provider: str = "twilio"  # or "interakt"
whatsapp_api_key: str = ""
whatsapp_api_secret: str = ""
whatsapp_phone_number: str = ""
whatsapp_from_number: str = ""
whatsapp_webhook_url: str = ""
whatsapp_template_receipt: str = ""
whatsapp_template_settlement: str = ""
whatsapp_enabled: bool = True
```

---

## Twilio Setup

### Step 1: Create Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up or log in
3. Navigate to Messaging → Try it out → Send a WhatsApp message
4. Follow the setup wizard

### Step 2: Get Credentials

1. From Twilio Console, get:
   - Account SID (starts with `AC`)
   - Auth Token
   - WhatsApp Sandbox Number (for testing)

### Step 3: Configure Environment

Add to `.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238888
```

### Step 4: Test Connection

Run the test utility:

```bash
cd backend
python -m app.services.whatsapp_test
```

This will test all message templates and provider connectivity.

### Step 5: Configure Webhook

1. In Twilio Console, go to Messaging → Settings → WhatsApp Sandbox Settings
2. Add your webhook URL: `https://your-domain.com/api/v1/whatsapp/webhook`
3. Twilio will send a verification request to your webhook
4. The integration will automatically verify the webhook

### Step 6: Request Production Access

1. In Twilio Console, go to Messaging → Settings → WhatsApp
2. Click "Request Access" for production WhatsApp
3. Complete the verification process
4. Update your `.env` with the production number

---

## Interakt Setup

### Step 1: Create Interakt Account

1. Go to [Interakt Dashboard](https://app.interakt.ai/)
2. Sign up or log in
3. Navigate to API Keys section

### Step 2: Get Credentials

1. From Interakt Dashboard, get:
   - API Key
   - Phone Number ID (from WhatsApp Business API)

### Step 3: Configure Environment

Add to `.env`:

```bash
WHATSAPP_PROVIDER=interakt
INTERAKT_API_KEY=your_api_key_here
INTERAKT_PHONE_NUMBER_ID=your_phone_number_id_here
```

### Step 4: Test Connection

Run the test utility:

```bash
cd backend
python -m app.services.whatsapp_test
```

### Step 5: Configure Webhook

1. In Interakt Dashboard, go to Webhooks section
2. Add your webhook URL: `https://your-domain.com/api/v1/whatsapp/webhook`
3. Configure the webhook to receive incoming messages

### Step 6: Verify Business Account

1. Ensure your WhatsApp Business account is linked to Interakt
2. Verify phone number is active
3. Test sending a message from the dashboard

---

## Webhook Configuration

### Public Webhook URL

Your webhook must be publicly accessible:

```
https://your-domain.com/api/v1/whatsapp/webhook
```

### Webhook Security

The integration validates webhook signatures:

- **Twilio**: Validates `X-Twilio-Signature` header
- **Interakt**: Validates API key in request body

### Webhook Endpoints

The webhook endpoint handles:

1. **Incoming Messages**: Receives messages from farmers
2. **Delivery Status**: Updates message delivery status
3. **Error Callbacks**: Handles delivery failures

---

## Testing

### Run Test Suite

```bash
cd backend
python -m app.services.whatsapp_test
```

This will run all tests:
1. Entry receipt templates (English & Tamil)
2. Daily summary templates
3. Monthly summary templates
4. Advance status templates
5. Settlement notification templates
6. Language detection
7. Bot command parsing
8. Send message functionality

### Test Bot Commands

Send test messages to your WhatsApp number:

**English Commands:**
- `1` - Get today's summary
- `2` - Get monthly summary
- `3` - Get advance status
- `help` - Show help

**Tamil Commands:**
- `இன்றைய வரவு` - Get today's summary
- `மாதாந்திர அறிக்கை` - Get monthly summary
- `முன்பணம்` - Get advance status
- `உதவி` - Show help

### Test Message Queue

Check queue status via API:

```bash
curl -X GET http://localhost:8000/api/v1/whatsapp/status \
  -H "Authorization: Bearer your_token"
```

Response:
```json
{
  "status": "operational",
  "provider": "TwilioProvider",
  "queue_status": {
    "high_priority": 0,
    "normal": 5,
    "retry": 2,
    "total": 7
  },
  "last_check": "2026-02-14T05:00:00Z"
}
```

---

## Troubleshooting

### Messages Not Sending

**Check:**
1. Redis is running: `redis-cli ping`
2. Provider credentials are correct in `.env`
3. `whatsapp_enabled` is `true`
4. Queue worker is running

**Solution:**
```bash
# Check Redis
redis-cli ping

# Start queue worker
python -m app.services.queue_worker

# Check logs
tail -f logs/whatsapp.log
```

### Webhook Not Receiving

**Check:**
1. Webhook URL is publicly accessible
2. Firewall allows incoming requests
3. Provider webhook is configured correctly

**Solution:**
```bash
# Test webhook accessibility
curl -X POST https://your-domain.com/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check firewall rules
sudo ufw allow 8000/tcp
```

### Tamil Text Not Displaying

**Check:**
1. Database and tables use UTF-8 encoding
2. Messages are sent with correct UTF-8 characters
3. WhatsApp app supports Tamil fonts

**Solution:**
```python
# Ensure UTF-8 encoding in database connection
DATABASE_URL=postgresql://user:password@localhost/malar_market?client_encoding=utf8

# Verify Tamil text in logs
logger.info(f"Tamil message: {tamil_message}")
```

### Rate Limit Exceeded

**Check:**
1. Farmer is sending too many commands
2. Rate limit is set correctly (default: 10/minute)

**Solution:**
- Wait and retry after 1 minute
- Contact admin if persistent issues

### Queue Backlog

**Check:**
1. Queue worker is processing messages
2. No errors in worker logs
3. Redis has available memory

**Solution:**
```bash
# Check queue status
curl -X GET http://localhost:8000/api/v1/whatsapp/status \
  -H "Authorization: Bearer your_token"

# Clear queue if needed (admin only)
curl -X POST http://localhost:8000/api/v1/whatsapp/queue/clear \
  -H "Authorization: Bearer your_token"
```

---

## Production Checklist

Before going to production, ensure:

- [ ] Provider account is in production mode (not sandbox)
- [ ] Webhook URL uses HTTPS
- [ ] Redis is configured for persistence
- [ ] Database backups are enabled
- [ ] Error monitoring is configured
- [ ] Rate limiting is tested
- [ ] All templates are tested with both languages
- [ ] Queue worker is running as a service
- [ ] Logging is configured for debugging
- [ ] Security headers are validated
- [ ] Farmer phone numbers are verified

---

## Monitoring

### Key Metrics to Monitor

1. **Message Queue Size**: Number of pending messages
2. **Delivery Rate**: Messages per minute
3. **Success Rate**: Percentage of successful deliveries
4. **Failure Rate**: Percentage of failed deliveries
5. **Bot Response Time**: Average time to respond to farmer queries
6. **Queue Processing Time**: Average time to process messages

### Log Locations

- Application logs: `logs/whatsapp.log`
- Database logs: `whatsapp_logs` table
- Error logs: `logs/error.log`

---

## Support

For issues or questions:

1. Check the [API Documentation](api-design.md)
2. Review [Troubleshooting](#troubleshooting) section
3. Check application logs
4. Review provider documentation:
   - [Twilio Docs](https://www.twilio.com/docs/whatsapp)
   - [Interakt Docs](https://docs.interakt.ai/)

---

## Security Best Practices

1. **Never commit credentials**: Use environment variables only
2. **Validate webhooks**: Always verify webhook signatures
3. **Rate limit**: Prevent abuse of bot commands
4. **Sanitize input**: Clean all incoming messages
5. **Log everything**: Track all bot interactions for security
6. **Use HTTPS**: All webhooks must use HTTPS in production
7. **Rotate secrets**: Regularly update API keys and tokens
8. **Monitor logs**: Review security logs regularly

---

**Last Updated**: 2026-02-14
**Version**: 1.0.0
