# Event System & Sync Integration Guide

## Overview

This document describes the complete event-driven registration and synchronization system for the Portal ↔ CRM data pipeline.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER SIGNUP FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Signup Page (Portal)
   └─> User fills form + clicks "Create Account"

2. authContext.signup()
   └─> Calls crmAdapter.signup(email, password, name, phone)

3. crmAdapter.signup()
   └─> FastAPI /auth/register endpoint
   └─> Creates auth.users + returns session
   └─> Returns immediately

4. Portal: Create profiles record
   └─> Audit trail + sync tracking

5. Dispatch UserRegistered Event (ASYNC)
   ├─> Event ID generated
   ├─> Event logged to event_log table
   └─> Fire-and-forget handlers:
       ├─ Handler 1: Provision CRM profile
       │  └─> Calls crmAdapter.updateProfile()
       │  └─> If success: mark profiles.sync_status = 'synced'
       │
       ├─ Handler 2: Send welcome email (TODO)
       │  └─> Calls email service (SendGrid/Resend)
       │
       └─ Handler 3: Track signup metric (TODO)
          └─> Calls analytics service (Mixpanel/Segment)

6. Background: sync_queue auto-triggers
   └─> Trigger on profiles table INSERT
   └─> queue_for_sync('profile', profile_id, 'portal_to_crm')
   └─> Creates sync_queue entry with status='pending'

7. Sync Processor (runs every 5 minutes via cron)
   └─> GET /api/sync (with X-Sync-Key header)
   └─> processSyncQueue() processes pending items
   ├─ For each item: attempt sync to CRM
   ├─ On success: mark sync_status='synced', update last_sync_at
   └─ On failure: retry logic with exponential backoff
      └─ Max 3 retries
      └─ Next retry after 5, 10, 20 minutes respectively

8. Response to User
   └─> "Account created. Provisioning in progress..."
   └─> Navigate to dashboard or email confirmation page
   └─> CRM provisioning continues in background
```

## Files Created

### 1. **useRegistrationEvents.ts** (React Hook)
- Location: `src/lib/hooks/useRegistrationEvents.ts`
- Purpose: Manage registration event state in React components
- Usage:
  ```typescript
  const { isProcessing, error, lastEventId, dispatchUserRegistered } = useRegistrationEvents();
  await dispatchUserRegistered(userId, email, firstName, lastName, phone);
  ```

### 2. **auth-integration.ts** (Unified Auth Orchestrator)
- Location: `src/lib/auth-integration.ts`
- Purpose: Coordinate signup flow across Portal DB, Auth, and Event Dispatch
- Key Function: `unifiedSignup()` — creates auth user → creates profile → dispatches event
- Returns immediately (event dispatch is async/fire-and-forget)

### 3. **registration-event-dispatcher.ts** (Event Service)
- Location: `src/lib/services/registration-event-dispatcher.ts`
- Purpose: Dispatch UserRegistered event with handlers
- Handlers:
  - `provisionCRMProfile()` — syncs profile to CRM (HTTP call)
  - `sendWelcomeEmail()` — queues welcome email (TODO: email service integration)
  - `trackSignupMetric()` — sends to analytics (TODO: analytics integration)
- Uses `Promise.allSettled()` for error resilience

### 4. **sync-queue-processor.ts** (Background Job)
- Location: `src/lib/services/sync-queue-processor.ts`
- Purpose: Process pending sync items from sync_queue table
- Main Function: `processSyncQueue()` — fetches pending → syncs each → retries on failure
- Entity Sync Handlers:
  - `syncProfile()` — sync Portal profile to CRM
  - `syncTravelRequest()` — sync booking to CRM (TODO: implement)
  - `syncVisaApplication()` — sync visa app to CRM (TODO: implement)
  - `syncPayment()` — sync payment to CRM (TODO: implement)
  - `syncDocument()` — notify CRM of document via crmAdapter

### 5. **Signup Page Update** (`src/app/signup/page.tsx`)
- Imported `useRegistrationEvents` hook
- After successful signup: call `dispatchUserRegistered()` (fire & forget)
- Does not block navigation — user sees "Account created" immediately

### 6. **Sync Queue API** (`src/app/api/sync/route.ts`)
- Endpoint: `POST /api/sync`
- Authentication: `X-Sync-Key: ${process.env.SYNC_PROCESSOR_SECRET}`
- Triggers: `processSyncQueue()`
- Response: `{ processed, succeeded, failed, errors }`
- Setup: Call this via cron job every 5 minutes

## Database Schema Changes

### New Tables (created by migration 003)
1. **event_log** — Audit trail for all registration/sync events
   - Fields: id, event_type, user_id, travel_request_id, data (JSONB), status, error_message, retry_count, created_at
   - Indexes: event_type, user_id, status (pending), created_at DESC

2. **sync_queue** — Queue of items pending sync to CRM
   - Fields: id, entity_type, entity_id, direction, status, payload (JSONB), error_message, retry_count, next_retry_at, created_at
   - Indexes: status (pending), entity_type+entity_id, next_retry_at

### New Columns (added to existing tables)
3. **profiles**
   - `sync_id` (UUID) — External CRM reference
   - `last_sync_at` (TIMESTAMPTZ) — Timestamp of last sync
   - `sync_status` (TEXT) — 'pending', 'synced', or 'failed'
   - `sync_error` (TEXT) — Error message if failed

4. **travel_requests, visa_applications, payment_records, customer_documents**
   - Same sync_* columns as profiles

### New Functions (PL/pgSQL)
- `log_registration_event()` — Create event_log entry
- `queue_for_sync()` — Add to sync_queue
- `mark_synced()` — Update entity sync status
- `get_pending_syncs()` — Fetch pending items (max 100)

### Auto-Triggers
- `trg_profile_queue_sync` — Auto-queue profile on INSERT
- `trg_travel_request_queue_sync` — Auto-queue travel_request on INSERT
- `trg_document_queue_sync` — Auto-queue document on INSERT

## Setup & Deployment

### 1. Deploy Database Migration
```bash
supabase migrations up  # or run SQL directly in Supabase console
```

### 2. Environment Variables
Add to `.env.local`:
```
SYNC_PROCESSOR_SECRET=your-secret-key-here  # Used to authenticate /api/sync calls
```

### 3. Set Up Cron Job
Schedule POST request to sync processor every 5 minutes:

**Option A: Vercel Cron Functions**
```typescript
// src/app/api/sync/cron.ts
export const config = { schedule: '*/5 * * * *' }; // Every 5 minutes
export default async function handler(req, res) {
  await processSyncQueue();
  res.status(200).json({ ok: true });
}
```

**Option B: External Cron Service (e.g., EasyCron, Cronitor)**
```bash
curl -X POST https://yourdomain.com/api/sync \
  -H "X-Sync-Key: ${SYNC_PROCESSOR_SECRET}"
```

**Option C: GitHub Actions Workflow**
```yaml
name: Sync Queue Processor
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync processor
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/sync \
            -H "X-Sync-Key: ${{ secrets.SYNC_PROCESSOR_SECRET }}"
```

### 4. Test the Flow

**Step 1: Test signup**
```bash
# Navigate to /signup and create an account
# You should see:
# - Account created successfully
# - Redirect to dashboard
# - In background: event_log entry + sync_queue entry
```

**Step 2: Check event_log**
```sql
SELECT * FROM public.event_log 
WHERE event_type = 'UserRegistered' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Step 3: Check sync_queue**
```sql
SELECT * FROM public.sync_queue 
WHERE status != 'completed' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Step 4: Manually trigger processor**
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "X-Sync-Key: your-secret-key"
```

**Step 5: Verify sync completion**
```sql
-- Check profiles sync_status
SELECT user_id, sync_status, last_sync_at, sync_error 
FROM public.profiles 
WHERE user_id = 'new-user-id';

-- Check sync_queue status
SELECT * FROM public.sync_queue 
WHERE entity_id = 'profile-id';
```

## Integration Points

### 1. Auth Context Integration
The auth-context's `signup()` method already routes through `crmAdapter.signup()`.
No changes needed — event dispatch happens after successful signup.

### 2. Signup Form Integration
The `/signup` page now:
1. Calls auth context's `signup()` (existing)
2. On success, calls `dispatchUserRegistered()` (new)
3. Navigates to dashboard (existing)

### 3. CRM Adapter Integration
The `crmAdapter` already has:
- `signup()` — creates auth.users via FastAPI
- `updateProfile()` — syncs profile to CRM
- `notifyCrmDocumentUploaded()` — notifies CRM of documents

All these are used by event handlers.

### 4. Database Integration
The Portal Supabase instance now has:
- `event_log` table for audit trail
- `sync_queue` table for retry logic
- Sync columns on profiles, travel_requests, visa_applications, payment_records, customer_documents
- Auto-triggers to queue new entities

## Error Handling & Resilience

### Non-Retryable Errors (4xx client errors)
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden

Marked as failed immediately. Require manual intervention.

### Retryable Errors
- 408 Request Timeout
- 429 Too Many Requests
- 5xx Server Errors
- Network errors

Retry up to 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: +5 minutes
- Attempt 3: +10 minutes
- Attempt 4: +20 minutes
- After 3 retries: Mark as failed, log error

### Event Handler Resilience
The event dispatcher uses `Promise.allSettled()` so:
- If email handler fails → CRM provisioning still completes
- If analytics fails → email is still sent
- All failures logged to system_logs for debugging

## Monitoring & Debugging

### Check Event Log
```sql
-- Recent registration events
SELECT id, event_type, user_id, status, created_at, error_message
FROM public.event_log
WHERE event_type = 'UserRegistered'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Sync Queue
```sql
-- Pending items
SELECT entity_type, entity_id, retry_count, next_retry_at, error_message
FROM public.sync_queue
WHERE status IN ('pending', 'failed')
ORDER BY next_retry_at DESC
LIMIT 20;

-- Completed items (success)
SELECT entity_type, entity_id, processed_at
FROM public.sync_queue
WHERE status = 'completed'
ORDER BY processed_at DESC
LIMIT 20;
```

### Check Profile Sync Status
```sql
-- Profiles with sync_id populated (synced to CRM)
SELECT user_id, sync_status, last_sync_at, sync_error
FROM public.profiles
WHERE sync_id IS NOT NULL
ORDER BY last_sync_at DESC;

-- Profiles still pending sync
SELECT user_id, sync_status, created_at
FROM public.profiles
WHERE sync_status = 'pending'
ORDER BY created_at DESC;
```

### Check System Logs
```sql
SELECT level, event, details, created_at
FROM public.system_logs
WHERE event IN ('user_registration', 'sync_queue_processor_run', 'registration_handler_error')
ORDER BY created_at DESC
LIMIT 50;
```

## Next Steps & TODOs

### Email Service Integration
- [ ] Implement `sendWelcomeEmail()` handler in registration-event-dispatcher.ts
- [ ] Integrate with SendGrid API or Resend
- [ ] Create email template (Arabic + English)
- [ ] Test welcome email delivery

### Analytics Integration
- [ ] Implement `trackSignupMetric()` handler
- [ ] Integrate with Mixpanel or Segment
- [ ] Track: signup_completed, email_confirmation_required, crm_provisioning events

### Entity Sync Handlers
- [ ] Implement `syncTravelRequest()` handler
- [ ] Implement `syncVisaApplication()` handler
- [ ] Implement `syncPayment()` handler
- [ ] Define CRM API endpoints for each entity type

### Real-Time Sync
- [ ] Set up Supabase Realtime subscriptions for sync_queue changes
- [ ] Implement WebSocket listener for real-time sync status updates
- [ ] Show user notification when sync completes

### Status Mapping Layer
- [ ] Create normalization functions for status enums
- [ ] Map Portal status strings ↔ CRM status integers
- [ ] Apply to all status fields (travel_requests, visa_applications, payments)

### Cross-System Linking
- [ ] Use UUID sync_id fields for referencing Portal entities from CRM
- [ ] Implement reverse sync (crm_to_portal) for booking updates
- [ ] Set up bidirectional sync webhooks

## FAQ

**Q: Why dispatch events async instead of waiting for CRM provisioning?**
A: User experience. Signup completes instantly, CRM provisioning happens in background. If CRM is slow, user still gets immediate feedback.

**Q: What if the sync processor doesn't run for an hour?**
A: Items stay in sync_queue with retry_count tracking. When processor runs again, it catches up. No data is lost.

**Q: Can I manually trigger the sync processor?**
A: Yes. Call `curl -X POST /api/sync -H "X-Sync-Key: ${SECRET}"`. Useful for debugging or emergency syncs.

**Q: What happens if a profile is already synced?**
A: Sync queue triggers only on INSERT. Subsequent updates don't auto-queue. To sync updates, either:
1. Add UPDATE trigger (optional)
2. Manually call `/api/sync` after updates
3. Create a separate sync-on-update mechanism

**Q: How do I handle 2-way sync (CRM updates Portal)?**
A: Use `direction='crm_to_portal'` in sync_queue entries. Create separate handlers for bidirectional sync. Currently only portal_to_crm is implemented.

**Q: Can I see sync status in the UI?**
A: Yes. Query `profiles.sync_status` and `last_sync_at` to show user "Syncing..." or "Synced ✓" status.

## Support & Troubleshooting

If the sync processor isn't working:
1. Check environment variable `SYNC_PROCESSOR_SECRET` is set
2. Check cron job is firing (check logs)
3. Check Supabase credentials are valid
4. Check `event_log` and `sync_queue` tables exist
5. Monitor `system_logs` table for errors
6. Check browser console for event dispatch errors
7. Run manual test: `curl -X POST /api/sync -H "X-Sync-Key: ..."`
