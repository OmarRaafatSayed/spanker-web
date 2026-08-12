# CRM Data Pipeline - توثيق شامل
## State Machine موحدة + Event-Driven Architecture

**التاريخ:** 12 أغسطس 2026  
**الحالة:** ✅ متكاملة بالكامل  
**الهندسة:** PostgreSQL State Machine + FastAPI Events + Real-time Webhooks

---

## 🏗️ معمارية النظام

```
┌─────────────────────────────────────────────────────────────────┐
│ Portal (Frontend)                                                │
│ - عميل جديد يسجل                                               │
│ - يرفع المستندات                                                │
│ - يقبل العرض                                                    │
│ - يدفع المبلغ                                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │ REST APIs
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│ FastAPI Backend (CRM Pipeline Router)                            │
│ /api/v1/pipeline/users/register                                 │
│ /api/v1/pipeline/visa-applications                              │
│ /api/v1/pipeline/quotations                                     │
│ /api/v1/pipeline/bookings/{id}/payment                          │
└────────────────┬────────────────────────────────────────────────┘
                 │ PostgreSQL Functions
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│ PostgreSQL State Machine (Core Logic)                            │
│ - users (عملاء)                                                │
│ - visa_applications (تأشيرات)                                  │
│ - quotations (عروض أسعار)                                       │
│ - bookings (حجوزات)                                             │
│ - financial_transactions (معاملات مالية)                      │
│ - state_machine_events (سجل التحولات)                          │
│ - crm_notifications (إشعارات)                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │ Webhooks + Real-time Events
                 ├──────────┬──────────┬──────────┬──────────┐
                 ↓          ↓          ↓          ↓          ↓
            [Email]   [SMS]  [Portal]  [CRM]   [External]
           Notifications
```

---

## 📋 مراحل Data Pipeline

### المرحلة 1️⃣: USER REGISTRATION (Lead Ingestion)

**API Endpoint:**
```bash
POST /api/v1/auth/signup
```

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "first_name": "Ahmed",
  "last_name": "Hassan"
}
```

**Behind the Scenes:**
```
1. Create auth.users (Supabase Auth)
   │
2. Call create_lead_from_user() function
   │
   ├─ INSERT INTO users (status = 'LEAD')
   │
   ├─ INSERT INTO state_machine_events
   │  event_type: 'USER_REGISTERED'
   │
   └─ INSERT INTO crm_notifications
      message: "Welcome! Start your journey"
      
3. Return session token + user_id

Output State:
- users.status = 'LEAD'
- Event logged with timestamp
- Notification sent (Portal + Email)
```

**State Diagram:**
```
                    ┌─────────────┐
                    │   (None)    │
                    └──────┬──────┘
                           │ USER_REGISTERED
                           ↓
                    ┌─────────────┐
                    │    LEAD     │ ← عميل جديد
                    └──────┬──────┘
                           │
```

---

### المرحلة 2️⃣: VISA APPLICATION & DOCUMENTS

**API Endpoint:**
```bash
POST /api/v1/pipeline/visa-applications
```

**Request:**
```json
{
  "country_code": "AE",
  "visa_type": "TOURIST",
  "documents": [
    {
      "doc_type": "PASSPORT",
      "file_url": "https://storage.../passport.pdf",
      "file_size": 1024000
    },
    {
      "doc_type": "BANK_STATEMENT",
      "file_url": "https://storage.../bank.pdf",
      "file_size": 512000
    }
  ]
}
```

**Behind the Scenes:**
```
1. Validate user_id from auth context
   │
2. INSERT INTO visa_applications
   - country_code: 'AE'
   - status: 'DOCS_PENDING'
   - documents: JSONB array with upload metadata
   │
3. Log state transition
   - entity_type: 'VISA_APPLICATION'
   - previous_state: NULL
   - new_state: 'DOCS_PENDING'
   - event_type: 'VISA_APPLICATION_CREATED'
   │
4. Send notification to user
   - type: 'STATUS_UPDATE'
   - message: "Your visa application has been received"

Output State:
- visa_applications.status = 'DOCS_PENDING'
- Documents stored as JSONB with timestamps
- Notification delivered
```

**Staff Review (CRM Dashboard):**
```bash
PATCH /api/v1/pipeline/visa-applications/{visa_id}/status
```

**Request:**
```json
{
  "new_status": "UNDER_REVIEW"
}
```

**Behind the Scenes:**
```
1. Check staff authorization (is_staff = true)
   │
2. Call update_visa_status() function
   - Fetch current status (DOCS_PENDING)
   - UPDATE status to UNDER_REVIEW
   │
3. Log state transition
   - previous_state: 'DOCS_PENDING'
   - new_state: 'UNDER_REVIEW'
   - triggered_by: 'CRM_STAFF'
   │
4. Auto-send notification to user
   - type: 'VISA_STATUS_CHANGED'
   - message: "Your documents are under review"
   - action_url: "/visas/{visa_id}"

Output State:
- visa_applications.status = 'UNDER_REVIEW'
- Portal: User sees "Under Review" badge
- CRM: Staff can see change in audit log
```

**State Diagram:**
```
┌─────────────────┐
│   DOCS_PENDING  │ ← عملية حديثة الإنشاء
└────────┬────────┘
         │ Staff approves
         ↓
┌─────────────────┐
│ UNDER_REVIEW    │ ← الموظف يراجع الأوراق
└────────┬────────┘
         │
    ┌────┴────┬─────────────────┐
    │          │                 │
    ↓          ↓                 ↓
┌─────────┐ ┌────────┐ ┌─────────────────┐
│APPROVED │ │REJECTED│ │SUBMITTED_TO_    │
│         │ │        │ │EMBASSY          │
└─────────┘ └────────┘ └─────────────────┘
```

---

### المرحلة 3️⃣: QUOTATION GENERATION

**Staff Creates Quote (CRM):**
```bash
POST /api/v1/pipeline/quotations
```

**Request:**
```json
{
  "visa_application_id": "550e8400-...",
  "items": [
    {
      "type": "FLIGHT",
      "description": "Cairo-Dubai Return (Emirates)",
      "amount": 500.00
    },
    {
      "type": "VISA_FEE",
      "description": "UAE Tourist Visa",
      "amount": 200.00
    },
    {
      "type": "SERVICE_FEE",
      "description": "Our Service Charge",
      "amount": 50.00
    }
  ],
  "total_amount": 750.00,
  "currency": "EGP"
}
```

**Behind the Scenes:**
```
1. Check staff authorization
   │
2. Call create_quotation() function
   - INSERT INTO quotations
   - status: 'DRAFT'
   - items: JSONB array
   │
3. Log state transition
   - event_type: 'QUOTATION_CREATED'
   - state: 'DRAFT'
   │
4. NO notification yet (still in draft)

Output State:
- quotations.status = 'DRAFT'
- Not visible to customer yet
- Ready for staff to review
```

**Send Quote to Customer:**
```bash
POST /api/v1/pipeline/quotations/{quote_id}/send
```

**Behind the Scenes:**
```
1. Check staff authorization
   │
2. Call send_quotation() function
   - UPDATE quotations.status = 'SENT'
   - UPDATE quotations.sent_at = NOW()
   - UPDATE quotations.valid_until = NOW() + 7 days
   │
3. Log state transition
   - previous_state: 'DRAFT'
   - new_state: 'SENT'
   - triggered_by: 'CRM_STAFF'
   │
4. Send notification to user
   - type: 'QUOTATION_SENT'
   - message: "New quotation: 750 EGP for 7 days"
   - action_url: "/quotations/{quote_id}"
   - Include "Accept" button

Output State:
- quotations.status = 'SENT'
- User sees quotation on Portal
- 7-day validity timer starts
- User can Accept/Reject
```

**State Diagram:**
```
┌─────────────────┐
│     DRAFT       │ ← موظف يكتب العرض
└────────┬────────┘
         │ send_quotation()
         ↓
┌─────────────────┐
│     SENT        │ ← عميل يرى العرض
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────┐
    │          │              │          │
    ↓          ↓              ↓          ↓
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ACCEPTED  │ │REJECTED│ │EXPIRED │ │CONVERTED │
│          │ │        │ │(7 days)│ │(→Booking)│
└──────────┘ └────────┘ └────────┘ └──────────┘
```

---

### المرحلة 4️⃣: QUOTATION TO BOOKING

**Customer Accepts Quote (Portal):**
```bash
POST /api/v1/pipeline/quotations/{quote_id}/accept
```

**Behind the Scenes:**
```
1. Check user authorization (owns the quotation)
   │
2. Call accept_quotation_and_create_booking() function
   │
   ├─ UPDATE quotations.status = 'ACCEPTED'
   │
   ├─ INSERT INTO bookings
   │  - booking_reference: 'BK20260812143012abcdef'
   │  - status: 'PENDING_PAYMENT'
   │  - quotation_id: {quote_id}
   │
   ├─ INSERT INTO financial_transactions
   │  - amount_paid: 0
   │  - remaining_balance: 750.00
   │  - payment_method: 'PENDING'
   │
   ├─ Log state changes
   │  QUOTATION: SENT → ACCEPTED
   │  BOOKING: NULL → PENDING_PAYMENT
   │
   └─ Send notification
      message: "Booking confirmed! Pay 750 EGP to complete"

Output State:
- quotations.status = 'ACCEPTED'
- bookings.status = 'PENDING_PAYMENT'
- financial_transactions created with full amount due
- User sees "Complete Payment" on Portal
```

**State Diagram:**
```
Quotation:
┌────────────────┐
│    ACCEPTED    │
└────────────────┘
       │
       └─────────→ CONVERTED (when booking created)

Booking:
┌────────────────┐
│ PENDING_PAYMENT│ ← في انتظار الدفع
└────────┬───────┘
         │
    ┌────┴────┬───────────┐
    │          │           │
    ↓          ↓           ↓
┌────────┐ ┌──────────┐ ┌─────────┐
│CONFIRMED│ │CANCELLED │ │ COMPLETED
│(paid)   │ │          │ │ (fulfilled)
└────────┘ └──────────┘ └─────────┘
```

---

### المرحلة 5️⃣: PAYMENT & VOUCHER GENERATION

**Staff Records Payment (CRM):**
```bash
POST /api/v1/pipeline/bookings/{booking_id}/payment
```

**Request:**
```json
{
  "amount_paid": 750.00,
  "payment_method": "BANK_TRANSFER",
  "receipt_url": "https://storage.../receipt-12345.pdf",
  "receipt_number": "REC-20260812-001"
}
```

**Behind the Scenes:**
```
1. Check staff authorization
   │
2. Get financial_transaction for booking
   │
3. Call record_payment_and_generate_voucher() function
   │
   ├─ UPDATE financial_transactions
   │  - amount_paid: 750.00
   │  - remaining_balance: 0
   │  - payment_method: 'BANK_TRANSFER'
   │  - paid_at: NOW()
   │
   ├─ Check if fully paid (remaining_balance = 0)
   │  │
   │  ├─ YES: Generate voucher
   │  │  ├─ Create PDF with booking details
   │  │  ├─ Store at: /vouchers/{transaction_id}.pdf
   │  │  │
   │  │  ├─ UPDATE bookings.status = 'CONFIRMED'
   │  │  ├─ UPDATE bookings.voucher_url
   │  │  │
   │  │  └─ Log state transition
   │  │     BOOKING: PENDING_PAYMENT → CONFIRMED
   │  │
   │  └─ NO: Keep PENDING_PAYMENT
   │
   ├─ Send notification
   │  type: 'VOUCHER_READY' (if fully paid)
   │  message: "Your voucher is ready! Download it now"
   │  action_url: "/vouchers/{transaction_id}"

Output State:
- financial_transactions.status: PAID
- bookings.status: 'CONFIRMED'
- Voucher generated and ready
- Portal: User can download ticket/receipt
- CRM: Booking marked complete
```

**Voucher PDF Content:**
```
═══════════════════════════════════════════════
         TRAVEL AGENCY BOOKING VOUCHER
═══════════════════════════════════════════════

Booking Reference: BK20260812143012abcdef
Issued: 12-Aug-2026
Customer: Ahmed Hassan (ahmed@example.com)

─────────────────────────────────────────────
FLIGHT DETAILS:
  From: Cairo (CAI)
  To: Dubai (DXB)
  Date: 15-Sep-2026
  Airline: Emirates (EK456)
  Class: Economy

VISA DETAILS:
  Destination: UAE
  Type: Tourist Visa
  Processing: 5-7 business days

PRICING BREAKDOWN:
  Flight: 500.00 EGP
  Visa Fee: 200.00 EGP
  Service: 50.00 EGP
  ─────────────────────
  TOTAL: 750.00 EGP

PAYMENT STATUS: ✓ FULLY PAID
Payment Method: Bank Transfer
Receipt #: REC-20260812-001

═══════════════════════════════════════════════
```

**Final State Diagram:**
```
┌──────────────────────────────────────────────┐
│ COMPLETE CUSTOMER JOURNEY                    │
├──────────────────────────────────────────────┤

Users:           LEAD → ACTIVE_CLIENT
                 ↓
Visa:            DOCS_PENDING → UNDER_REVIEW → APPROVED
                 ↓
Quotations:      DRAFT → SENT → ACCEPTED → CONVERTED
                 ↓
Bookings:        PENDING_PAYMENT → CONFIRMED
                 ↓
Transactions:    UNPAID → PAID
                 ↓
Outcome:         ✓ COMPLETE - Voucher Ready

Time to Complete: 1-10 business days
Customer Experience:
  Day 1: Sign up → LEAD
  Day 1-3: Upload docs → DOCS_PENDING
  Day 3: Staff reviews → UNDER_REVIEW
  Day 3-5: Visa approved → APPROVED
  Day 5: Quote generated → DRAFT
  Day 5: Quote sent → SENT
  Day 6: Customer accepts → ACCEPTED → BOOKING
  Day 6: Customer pays → PAYMENT RECORDED
  Day 6: → CONFIRMED + VOUCHER READY
```

---

## 🗄️ Database Schema

### tables المترابطة:

```
users (الجدول الأساسي)
├─ id (UUID PK)
├─ auth_user_id (FK → auth.users)
├─ email (UNIQUE)
├─ status (ENUM: LEAD, ACTIVE_CLIENT, INACTIVE, ARCHIVED)
└─ created_at, updated_at

    ↓ (user_id FK)
    
visa_applications (التأشيرات)
├─ id (UUID PK)
├─ user_id (FK)
├─ country_code (AE, DE, TR, EG, KSA)
├─ status (ENUM: DOCS_PENDING, UNDER_REVIEW, ..., APPROVED, REJECTED)
├─ documents (JSONB array)
└─ created_at, updated_at

    ↓ (user_id FK + visa_application_id FK)
    
quotations (عروض الأسعار)
├─ id (UUID PK)
├─ user_id (FK)
├─ visa_application_id (FK, nullable)
├─ items (JSONB array)
├─ status (ENUM: DRAFT, SENT, ACCEPTED, EXPIRED, REJECTED, CONVERTED)
├─ sent_at, valid_until, accepted_at
└─ created_at, updated_at

    ↓ (user_id FK + quotation_id FK)
    
bookings (حجوزات مؤكدة)
├─ id (UUID PK)
├─ user_id (FK)
├─ quotation_id (FK)
├─ booking_reference (UNIQUE)
├─ status (ENUM: PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED)
├─ voucher_url, voucher_generated_at
└─ created_at, updated_at

    ↓ (booking_id FK + user_id FK)
    
financial_transactions (معاملات مالية)
├─ id (UUID PK)
├─ booking_id (FK)
├─ user_id (FK)
├─ amount_paid, remaining_balance
├─ payment_method (ENUM: CASH, BANK_TRANSFER, POS, CREDIT_CARD, CHEQUE)
├─ receipt_url, receipt_number
└─ created_at, updated_at

Audit Trail:
state_machine_events (سجل التحولات)
├─ id (UUID PK)
├─ entity_type (USER, VISA_APPLICATION, QUOTATION, BOOKING, FINANCIAL_TRANSACTION)
├─ entity_id (UUID)
├─ previous_state → new_state
├─ event_type, triggered_by
└─ created_at

crm_notifications (الإشعارات)
├─ id (UUID PK)
├─ user_id (FK)
├─ type (ENUM: VISA_STATUS_CHANGED, QUOTATION_SENT, ...)
├─ title, message, action_url
├─ is_read, delivery_methods (JSONB: ["PORTAL", "EMAIL", "SMS"])
└─ created_at
```

---

## 🔄 Event Triggers & Automations

### Auto-Triggered Events:

| When | What Happens | State Change | Notification |
|------|-------------|-------------|---------------|
| User Signs Up | `create_lead_from_user()` | NULL → LEAD | "Welcome!" |
| Visa Status Updated | `update_visa_status()` | Any → New | "Status Changed" |
| Quote Sent | `send_quotation()` | DRAFT → SENT | "Review Quote" |
| Quote Accepted | `accept_quotation_and_create_booking()` | SENT → ACCEPTED + Create Booking | "Booking Confirmed" |
| Payment Recorded | `record_payment_and_generate_voucher()` | PENDING_PAYMENT → CONFIRMED | "Voucher Ready" |

### Real-time Webhooks:

```
Database Events → webhook_queue → External Systems
├─ Email service (SendGrid)
├─ SMS gateway (Twilio)
├─ CRM webhook (if external CRM)
└─ Portal notifications (WebSocket)
```

---

## 📊 API Reference

### 1. User Registration
```bash
POST /api/v1/auth/signup
POST /api/v1/pipeline/users/register
```

### 2. Visa Application
```bash
POST /api/v1/pipeline/visa-applications
GET /api/v1/pipeline/visa-applications/{visa_id}
PATCH /api/v1/pipeline/visa-applications/{visa_id}/status
```

### 3. Quotation
```bash
POST /api/v1/pipeline/quotations
POST /api/v1/pipeline/quotations/{quote_id}/send
POST /api/v1/pipeline/quotations/{quote_id}/accept
```

### 4. Booking & Payment
```bash
POST /api/v1/pipeline/bookings/{booking_id}/payment
```

### 5. Audit Trail
```bash
GET /api/v1/pipeline/state-transitions?entity_type=VISA_APPLICATION&entity_id=...
```

---

## ✅ مقائم الفحص (Implementation Checklist)

- [x] Migration: `007_crm_data_pipeline.sql`
  - [x] users table مع status enum
  - [x] visa_applications مع JSONB documents
  - [x] quotations مع items JSON
  - [x] bookings مع voucher tracking
  - [x] financial_transactions
  - [x] state_machine_events للـ audit
  - [x] crm_notifications للـ alerts

- [x] FastAPI Router: `crm_pipeline.py`
  - [x] `/users/register` - Lead creation
  - [x] `/visa-applications` - Document upload
  - [x] `/visa-applications/{id}/status` - Status updates
  - [x] `/quotations` - Quote generation
  - [x] `/quotations/{id}/send` - Send quote
  - [x] `/quotations/{id}/accept` - Accept quote
  - [x] `/bookings/{id}/payment` - Record payment
  - [x] `/state-transitions` - Audit trail

- [x] PostgreSQL Functions
  - [x] `create_lead_from_user()` - Lead creation
  - [x] `update_visa_status()` - Status transitions
  - [x] `create_quotation()` - Quote creation
  - [x] `send_quotation()` - Send quote
  - [x] `accept_quotation_and_create_booking()` - Convert to booking
  - [x] `record_payment_and_generate_voucher()` - Payment + voucher

- [x] Triggers
  - [x] Auto-log user status changes
  - [x] Auto-send notifications
  - [x] Auto-generate audit trail

- [x] Views
  - [x] `customer_journey_overview` - Complete view
  - [x] `pending_crm_actions` - Staff dashboard

---

## 🚀 الخطوات التالية

1. **Deploy Migration**
   ```bash
   # في Supabase Dashboard
   supabase db push supabase/migrations/007_crm_data_pipeline.sql
   ```

2. **Start FastAPI**
   ```bash
   cd travel-agency-custom/fastapi-backend
   uvicorn main:app --reload
   ```

3. **Test Full Flow**
   - Register user → LEAD
   - Upload docs → DOCS_PENDING
   - Staff reviews → UNDER_REVIEW
   - Generate quote → DRAFT
   - Send quote → SENT
   - Accept quote → CONFIRMED
   - Record payment → VOUCHER READY

4. **Monitor Events**
   ```sql
   -- Check state machine audit
   SELECT * FROM public.state_machine_events ORDER BY created_at DESC LIMIT 20;
   ```

---

## 📈 الفائدة

✅ **Single Source of Truth**: كل الـ state محفوظ في PostgreSQL  
✅ **Complete Audit Trail**: كل انتقال حالة مسجل مع الوقت والمسؤول  
✅ **Real-time Notifications**: عميل يعرف كل شيء فوراً  
✅ **Automated Workflow**: الموظف ما بحاجة يعمل clicks إضافية  
✅ **Data Consistency**: Foreign keys بتضمن عدم ترك سجلات معطوبة  
✅ **Scalable**: JSONB للـ documents و items تعطي flexibility  
✅ **Type-Safe**: PostgreSQL enums بتضمن valid states فقط  

