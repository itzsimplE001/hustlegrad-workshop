# Production Security & Payment Checklist
Stack: FastAPI + PostgreSQL + Razorpay + Nginx + Linux VPS

Goal:
Create a production-grade secure payment backend with Razorpay (UPI preferred), protected infrastructure, and secure database handling.
---
# 4. FASTAPI SECURITY

## 4.1 Environment Variables

Never store secrets in code.

Create:

.env

Example:

RAZORPAY_KEY_ID=xxxx
RAZORPAY_SECRET=xxxx
DATABASE_URL=postgresql://user:pass@localhost/db
JWT_SECRET=random32charactersecret

Load with:

python-dotenv

---

## 4.2 Pydantic Validation

Validate every request.

Example:

class OrderRequest(BaseModel):
    ticket_type: Literal["EARLY_BIRD","STANDARD"]

Reject anything else.

---

## 4.3 Input Sanitization

Never insert raw user input into SQL.

Use:

SQLAlchemy ORM

or

parameterized queries.

---

## 4.4 Rate Limiting

Install:

slowapi

Example:

@limiter.limit("5/minute")

Protect:

/create-order  
/payment-confirmation  
/login

---

## 4.5 CORS

Never allow wildcard.

Example:

allow_origins=[
    "https://yourdomain.com"
]

---

# 5. PAYMENT SECURITY (RAZORPAY)

## 5.1 Backend Creates Orders

Frontend sends:

{
 "ticket_type":"EARLY_BIRD"
}

Backend determines price.

Never accept price from frontend.

---

## 5.2 Order Creation

Backend calls Razorpay API:

amount = 29900
currency = INR

Return order_id to frontend.

---

## 5.3 Payment Signature Verification

Razorpay returns:

razorpay_payment_id  
razorpay_order_id  
razorpay_signature

Verify signature using HMAC SHA256.

Reject if mismatch.

---

## 5.4 Razorpay Webhook

Create endpoint:

POST /webhooks/razorpay

Verify webhook signature.

Process events:

payment.captured  
payment.failed

Never trust frontend success event.

---

# 6. EARLY BIRD SEAT LOGIC

Early bird seats = 7

Database query:

SELECT COUNT(*) FROM tickets WHERE type='EARLY_BIRD'

If count < 7

price = 299

Else

price = 499

All logic must run on backend.

---

# 7. DATABASE SECURITY

## 7.1 Install PostgreSQL

sudo apt install postgresql

---

## 7.2 Restrict Network Access

Edit:

postgresql.conf

Set:

listen_addresses = 'localhost'

Database not accessible from internet.

---

## 7.3 Strong Credentials

Example:

user: ticket_api  
password: 32+ char random

---

## 7.4 Use SSL Mode

Connection string:

?sslmode=require

---

## 7.5 Role Permissions

Create restricted role.

Only allow:

SELECT  
INSERT

Block:

DROP  
ALTER

---

## 7.6 Automatic Backups

Daily backup:

pg_dump database > backup.sql

Use cron job.

---

# 8. APPLICATION SECURITY

## 8.1 Logging

Log:

payment attempts  
failed signatures  
errors  
IP addresses

Use:

structlog or logging module.

---

## 8.2 Error Handling

Never expose stack traces to users.

Return generic errors.

Example:

"Payment verification failed"

---

## 8.3 Secrets Management

Never commit:

.env  
private keys

Use:

.gitignore

---

# 9. DEPLOYMENT

Run FastAPI with production server.

Install:

gunicorn

Run:

gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4

Bind:

127.0.0.1:8000

Never expose FastAPI directly.

---

# 10. JS SECURITY (OBFUSCATION)

Frontend JS is always visible.

But can reduce readability using:

javascript-obfuscator

or

NextJS production build.

Important:

Never put secrets in frontend.

---

# 11. MONITORING

Install:

htop  
netdata (optional)

Monitor:

CPU  
memory  
connections

---

# 12. ADDITIONAL SECURITY (OPTIONAL BUT GOOD)

Add:

Cloudflare proxy  
DDoS protection  
Web Application Firewall (WAF)

Enable:

Bot filtering  
Rate limiting  
IP blocking

---

# 13. TESTING BEFORE LAUNCH

Test:

Fake payment attempts  
Duplicate webhook events  
High request spam  
Invalid signatures  
SQL injection attempts

---

# 14. BACKUP PLAN

Have:

Database backup  
Server snapshot  
Rollback strategy

---

# FINAL RULES

Never trust frontend.

Always verify Razorpay signatures.

Never expose database to the internet.

Store all secrets in environment variables.

Run backend behind nginx with HTTPS only.