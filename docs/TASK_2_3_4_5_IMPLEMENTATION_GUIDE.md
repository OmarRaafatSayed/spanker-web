# TASK 2-5 Implementation Guide
## Unified Data Schema, Registration Hook, Real-time Sync & CRM Module

**Status:** ✅ Complete  
**Deployment Date:** August 2026  
**Components:** 5 Database Migrations + 3 Backend Workers + 1 FastAPI Router

---

## Overview

### TASK 2: Unified Data Schema & Entity Synchronization Audit
**File:** `supabase/migrations/004_unified_schema_audit.sql`

#### What was implemented:
- **customer_profiles table**: Central portal customer profile with auth link + CRM sync tracking
- **booking_aggregates table**: Denormalized view aggregating travel_request + visa + payment
- **entity_sync_state table**: State machine for Portal ↔ CRM synchronization
- **Unified foreign keys**: All core entities (User, Booking, Visa, Payment, Document) use UUID and reference single sources
- **Helper functions**: `upsert_customer_profile()`, `transition_sync_state()`, `get_pending_crm_syncs()`

#### Key Features:
- Single source of truth for customer identity (auth.users → customer_profiles)
- CRM sync tracking with state machine (created → queued → syncing → synced)
- Automatic triggers for travel request sync queueing
- Dashboard views: `pending_crm_syncs`, `customer_booking_summary`

**Status:** Ready to deploy — Run in Supabase SQL Editor

---

### TASK 3: Unified User Registration Hook & Event Dispatcher
**Files:**
- `travel-agency-custom/fastapi-backend/fastapi-backend/app/services/registration_hook.py`
- `travel-agency-custom/fastapi-backend/fastapi-backend/app/routers/auth.py` (updated)

#### What was implemented:
- **RegistrationHook class**: Handles signup flow with transactional writes + async event dispatch
- **EventDispatcher**: Global event bus for registration events
- **Event handlers**: CRM provisioning, welcome email, webhooks
- **Unified signup flow**:
  1. Create auth user
  2. Call registration hook → transactional write to customer_profiles
  3. Queue entity for Portal → CRM sync
  4. Log event to audit trail
  5. Emit async events (CRM provisioning, email, webhooks)

#### Integration:
```python
# In auth router signup endpoint:
registration_hook = get_registration_hook()
registration_result = await registration_hook.handle_signup(
    auth_user_id=user_id,
    email=request.email,
    first_name=request.first_name,
    last_name=request.last_name,
)
```

**Status:** Ready to deploy — Integrated into FastAPI

---

### TASK 4: Real-time Data Synchronization Strategy
**Files:**
- `supabase/migrations/005_realtime_sync_webhooks.sql`
- `travel-agency-custom/fastapi-backend/fastapi-backend/app/workers/webhook_delivery_worker.py`

#### What was implemented:
- **webhook_queue table**: Queue of events waiting delivery to external systems
- **webhook_subscriptions table**: External endpoints subscribed to events
- **PostgreSQL Triggers**: Auto-queue webhooks on entity changes
  - `customer_profile.created/updated` → Auto-queued
  - `travel_request.created/updated/status_changed` → Auto-queued
  - `payment_record.created/updated` → Auto-queued
  - `customer_document.uploaded/status_changed` → Auto-queued
- **WebhookDeliveryWorker**: Async background worker that:
  - Polls webhook_queue for pending deliveries
  - Filters by active subscriptions
  - POSTs to external endpoints with retry + exponential backoff
  - Tracks statistics (delivery_attempts, last_error, etc.)

#### Real-time Flow:
```
Customer Action (e.g., upload document)
    ↓
Database Trigger fires
    ↓
queue_webhook_event() inserts into webhook_queue
    ↓
WebhookDeliveryWorker polls webhook_queue
    ↓
Filter by webhook_subscriptions (event_type match)
    ↓
POST to external endpoints (CRM, third-party systems)
    ↓
Retry with exponential backoff if failed
    ↓
Mark as delivered or failed
```

#### Deployment:
1. Run SQL migration
2. Start webhook delivery worker:
   ```bash
   python -m app.workers.webhook_delivery_worker
   ```

**Status:** Ready to deploy — SQL + Python worker

---

### TASK 5: CRM Customer & Document Tracking Module
**File:** `travel-agency-custom/fastapi-backend/fastapi-backend/app/routers/crm_customers.py`

#### Endpoints:

**GET /api/v1/crm/customers**
- List all registered Portal customers with filters
- Filters: status, kyc_status, email/name search
- Pagination support
- Requires: staff role

**GET /api/v1/crm/customers/{customer_id}**
- Get single customer profile
- Shows: KYC status, profile completion, CRM sync ID
- Requires: staff role

**GET /api/v1/crm/customers/{customer_id}/travel-requests**
- Get all travel requests for customer
- Shows: destination, status, document completion %
- Requires: staff role

**GET /api/v1/crm/documents**
- List all customer documents pending review
- Filters: status, document_type, travel_request_id
- Shows: pending_review_count
- Requires: staff role

**PATCH /api/v1/crm/documents/{document_id}/status**
- Update document review status
- Statuses: uploaded → under_review → approved/rejected
- Sets: reviewed_by, reviewed_at, rejection_reason
- Requires: staff role

**PATCH /api/v1/crm/travel-requests/{request_id}/status**
- Update travel request lifecycle status
- Statuses: pending_documents → documents_review → docs_approved → in_progress → completed
- Requires: staff role

**GET /api/v1/crm/metrics**
- Real-time CRM dashboard metrics
- Shows:
  - total_customers, active_customers, pending_kyc
  - total_travel_requests, pending_documents, in_progress, completed
  - pending_webhooks, pending_crm_syncs
- Requires: staff role

#### Usage Example:
```bash
# List all customers
curl -H "Authorization: Bearer {staff_token}" \
  https://api.example.com/api/v1/crm/customers?status=active&limit=50

# Get customer details
curl -H "Authorization: Bearer {staff_token}" \
  https://api.example.com/api/v1/crm/customers/{customer_id}

# List pending documents
curl -H "Authorization: Bearer {staff_token}" \
  https://api.example.com/api/v1/crm/documents?status=uploaded

# Approve document
curl -X PATCH \
  -H "Authorization: Bearer {staff_token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}' \
  https://api.example.com/api/v1/crm/documents/{doc_id}/status

# Get CRM metrics
curl -H "Authorization: Bearer {staff_token}" \
  https://api.example.com/api/v1/crm/metrics
```

**Status:** Ready to deploy — Integrated into FastAPI

---

## Deployment Checklist

### Phase 1: Database Migrations
- [ ] Run `supabase/migrations/004_unified_schema_audit.sql` in Supabase Dashboard
- [ ] Run `supabase/migrations/005_realtime_sync_webhooks.sql` in Supabase Dashboard
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('customer_profiles', 'booking_aggregates', 'entity_sync_state', 
                     'webhook_queue', 'webhook_subscriptions', 'change_log')
  ```

### Phase 2: Backend Services
- [ ] Update FastAPI main.py (already done):
  - Import `crm_customers` router
  - Include router at `/api/v1/crm`
- [ ] Deploy updated FastAPI backend:
  ```bash
  docker build -t travel-agency-backend:latest .
  docker push travel-agency-backend:latest
  # Deploy new image
  ```

### Phase 3: Background Workers
- [ ] Deploy CRM Sync Worker (async process):
  ```bash
  # Run in separate container/process
  python -m app.workers.crm_sync_worker
  ```
- [ ] Deploy Webhook Delivery Worker (async process):
  ```bash
  # Run in separate container/process
  python -m app.workers.webhook_delivery_worker
  ```

### Phase 4: Configuration
- [ ] Set environment variables:
  ```env
  CRM_API_ENDPOINT=https://crm.example.com/api
  CRM_API_KEY=your_crm_api_key
  WEBHOOK_DELIVERY_ENABLED=true
  ```

### Phase 5: Testing
- [ ] Test signup flow:
  ```bash
  curl -X POST http://localhost:8000/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "secure_pwd",
      "first_name": "Test",
      "last_name": "User"
    }'
  ```
  ✅ Should create: auth user, customer_profile, sync state, event log entry
  ✅ Should emit: UserRegistered event

- [ ] Test CRM customer list:
  ```bash
  curl -H "Authorization: Bearer {staff_token}" \
    http://localhost:8000/api/v1/crm/customers
  ```

- [ ] Monitor workers:
  ```bash
  # Check webhook queue
  SELECT COUNT(*) as pending_webhooks 
  FROM webhook_queue 
  WHERE status = 'pending';
  
  # Check CRM sync queue
  SELECT COUNT(*) as pending_syncs 
  FROM entity_sync_state 
  WHERE state IN ('queued', 'sync_failed');
  ```

---

## Architecture Diagram

```
Portal (Frontend)
    ↓
FastAPI Backend
    ├─ /auth/signup
    │   ├─ Create auth.users
    │   ├─ Call RegistrationHook
    │   │   ├─ Write customer_profiles (transactional)
    │   │   ├─ Queue entity_sync_state
    │   │   ├─ Log event_log
    │   │   └─ Emit events
    │   └─ Return session + customer_profile_id
    │
    ├─ /crm/* (Staff API)
    │   ├─ List customers (customer_profiles)
    │   ├─ View documents (customer_documents)
    │   ├─ Update status (travel_requests)
    │   └─ Get metrics
    │
    └─ Background Workers
        ├─ CRMSyncWorker
        │   └─ Poll entity_sync_state → Call CRM API → Mark synced
        └─ WebhookDeliveryWorker
            └─ Poll webhook_queue → Deliver to subscriptions → Retry

Database (Supabase)
    ├─ auth.users (Supabase Auth)
    ├─ customer_profiles (Portal users)
    ├─ travel_requests (Bookings)
    ├─ customer_documents (Uploads)
    ├─ visa_applications (Legacy CRM)
    ├─ payment_records (Payments)
    ├─ entity_sync_state (Sync tracking)
    ├─ webhook_queue (Event queue)
    ├─ webhook_subscriptions (Subscriptions)
    └─ Triggers (Auto-queue on changes)

External Systems
    ├─ CRM (Called by CRMSyncWorker)
    └─ Third-party systems (Called by WebhookDeliveryWorker)
```

---

## Key Concepts

### Customer Profile Lifecycle
```
1. User signs up → auth.users created
2. RegistrationHook triggers
3. customer_profiles row created (single source)
4. entity_sync_state created in 'queued' state
5. Event emitted (CRM provisioning)
6. CRMSyncWorker picks up and syncs to CRM
7. CRM returns ID → stored in customer_profiles.crm_customer_id
8. entity_sync_state transitions to 'synced'
```

### Document Lifecycle
```
1. Customer uploads passport → customer_documents created (status=uploaded)
2. Trigger fires → webhook_queue event created
3. WebhookDeliveryWorker delivers to CRM webhook
4. Staff reviews via CRM → PATCH /documents/{id}/status → (status=approved)
5. Status change triggers webhook → queued for external systems
```

### Data Synchronization
```
Real-time (Webhooks):
- Customer actions → PostgreSQL triggers → webhook_queue → External systems
- Latency: <1 second

Asynchronous (Polling):
- Pending syncs → CRMSyncWorker polls → CRM API → Retry with backoff
- Latency: 30-300 seconds (configurable)
```

---

## Monitoring & Troubleshooting

### Check Sync Status
```sql
-- Pending CRM syncs
SELECT entity_type, COUNT(*) as count, state
FROM entity_sync_state
WHERE state IN ('queued', 'sync_failed')
GROUP BY entity_type, state;

-- Failed syncs with error
SELECT entity_type, entity_id, last_error, sync_attempts
FROM entity_sync_state
WHERE state = 'sync_failed'
ORDER BY updated_at DESC
LIMIT 10;
```

### Check Webhook Status
```sql
-- Pending webhooks
SELECT event_type, COUNT(*) as count
FROM webhook_queue
WHERE status IN ('pending', 'failed')
GROUP BY event_type;

-- Failed deliveries
SELECT event_type, entity_type, last_error, delivery_attempts
FROM webhook_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Monitor Workers
```bash
# CRM Sync Worker logs
docker logs crm-sync-worker -f

# Webhook Delivery Worker logs
docker logs webhook-delivery-worker -f

# Check worker health
curl http://localhost:8000/health
```

---

## Future Enhancements

1. **Real-time WebSocket Updates**: Push sync status to staff dashboard
2. **CRM Conflict Resolution**: Handle data conflicts when Portal ↔ CRM diverge
3. **Document OCR**: Auto-extract data from uploaded documents
4. **Batch Operations**: Staff actions (bulk approve/reject documents)
5. **Advanced Filtering**: Saved customer search filters
6. **Audit Trail UI**: Visual timeline of customer state changes
7. **Scheduled Jobs**: Automated follow-ups (email reminders, status checks)
8. **Analytics Dashboard**: Customer funnel, conversion rates, document approval times

---

## Support & Questions

- Database: See `supabase/migrations/` for schema details
- Backend: See `app/routers/crm_customers.py` for API documentation
- Workers: See `app/workers/` for async job details

