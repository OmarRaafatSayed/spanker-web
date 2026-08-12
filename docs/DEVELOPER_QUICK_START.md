# Developer Quick Start: Event-Driven Registration + Code Quality Standards

## 🎯 30-Second Summary

The app now has a complete **event-driven registration system** that:
1. Handles signup → creates auth user → provisions CRM profile
2. Runs CRM provisioning in the **background** (non-blocking)
3. Automatically retries failed syncs with exponential backoff
4. Logs everything for debugging

## Using the New Components

### 1. In Signup Forms

```typescript
import { useRegistrationEvents } from "@/lib/hooks/useRegistrationEvents";

export function MySignupForm() {
  const { dispatchUserRegistered } = useRegistrationEvents();
  
  async function handleSignup(email, password, firstName, lastName, phone) {
    // 1. Call your existing signup logic
    const user = await signup(email, password, firstName, lastName, phone);
    
    // 2. Dispatch registration event (fire & forget)
    await dispatchUserRegistered(
      user.id,
      user.email,
      firstName,
      lastName,
      phone
    );
    
    // 3. Navigate immediately (don't wait for CRM sync)
    router.push("/dashboard");
  }
}
```

### 2. Check Sync Status

```typescript
import { isUserSyncedToCrm } from "@/lib/auth-integration";

// Check if user has been synced to CRM
const synced = await isUserSyncedToCrm(userId);
if (synced) {
  console.log("✅ User is now in CRM");
} else {
  console.log("⏳ Still syncing to CRM...");
}
```

### 3. Monitor Events

```typescript
import { supabase } from "@/lib/supabase";

// Check if a registration event was processed
const { data: event } = await supabase
  .from("event_log")
  .select("*")
  .eq("user_id", userId)
  .eq("event_type", "UserRegistered")
  .single();

console.log(event.status); // 'pending' or 'processed'
if (event.error_message) {
  console.error("Event error:", event.error_message);
}
```

## Environment Setup

### 1. Add to `.env.local`
```env
SYNC_PROCESSOR_SECRET=your-random-secret-key
```

### 2. Set up Cron Job
Schedule this to run **every 5 minutes**:
```bash
curl -X POST https://yourdomain.com/api/sync \
  -H "X-Sync-Key: ${SYNC_PROCESSOR_SECRET}"
```

### 3. Deploy Database Migration
```bash
supabase migrations up
# or run supabase/migrations/003_event_system_and_sync.sql manually
```

## Testing

### Manual Test Flow

```bash
# 1. Go to /signup and create account
# 2. Wait 10 seconds
# 3. Check event_log
curl "http://localhost:3000/api/debug/events?userId=<NEW_USER_ID>"

# 4. Manually trigger sync processor
curl -X POST http://localhost:3000/api/sync \
  -H "X-Sync-Key: test-secret"

# 5. Check profiles table
# SELECT * FROM profiles WHERE user_id = '<NEW_USER_ID>'
# Look for: sync_status = 'synced'
```

### Debug SQL Queries

```sql
-- Check all registration events
SELECT id, event_type, status, error_message, created_at
FROM event_log
WHERE event_type = 'UserRegistered'
ORDER BY created_at DESC;

-- Check pending syncs
SELECT entity_type, entity_id, retry_count, next_retry_at
FROM sync_queue
WHERE status = 'pending'
ORDER BY next_retry_at;

-- Check sync history
SELECT user_id, sync_status, last_sync_at, sync_error
FROM profiles
ORDER BY last_sync_at DESC;

-- Check system logs
SELECT level, event, details, created_at
FROM system_logs
WHERE event IN ('user_registration', 'sync_queue_processor_run')
ORDER BY created_at DESC
LIMIT 50;
```

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/hooks/useRegistrationEvents.ts` | React hook for event state | ✅ Ready |
| `src/lib/auth-integration.ts` | Signup orchestrator | ✅ Ready |
| `src/lib/services/registration-event-dispatcher.ts` | Event handlers | ✅ Ready |
| `src/lib/services/sync-queue-processor.ts` | Background sync | ✅ Ready |
| `src/app/api/sync/route.ts` | Cron endpoint | ✅ Ready |
| `supabase/migrations/003_event_system_and_sync.sql` | Database schema | ✅ Ready |

## Common Questions

**Q: Does signup slow down for users?**
A: No. Event dispatch is async/fire-and-forget. Users see "Account created" immediately.

**Q: What if the sync processor doesn't run?**
A: Items stay in sync_queue. When processor runs again, it catches up. No data is lost.

**Q: How do I force an immediate sync?**
A: Call `curl -X POST /api/sync -H "X-Sync-Key: <secret>"` from any terminal.

**Q: What status codes mean retry vs permanent failure?**
A: 4xx = permanent failure (invalid data). 5xx/network = retry. See sync-queue-processor.ts for details.

**Q: Can I see provisioning status in UI?**
A: Yes. Query `profiles.sync_status` and show "⏳ Syncing..." or "✅ Done".

## 📋 Code Quality Standards (CRM-RULES.md)

### When Writing or Modifying Code

You **MUST** follow these three principles from CRM-RULES.md:

#### 1. **Divide and Conquer (التقسيم)**
- ✅ DO: Break big functions into small, single-responsibility functions
- ✅ DO: Extract helpers for reusable logic
- ❌ DON'T: Write 50-line functions that do 5 things

**Example:**
```python
# ❌ BAD: 50 lines doing 5 things
def handle_signup(...):
    # Get user from DB
    user = db.get_user(...)
    # Validate data
    validate(...)
    # Create profile
    profile = create(...)
    # Send email
    send_email(...)
    # Queue sync
    queue(...)

# ✅ GOOD: Each step is clear
def handle_signup(...):
    user = await _get_user(...)
    await _validate_data(...)
    profile = await _create_profile(...)
    await _send_email(...)
    await _queue_sync(...)
```

#### 2. **Track Data Flow (تتبع البيانات)**
- ✅ DO: Follow data from input → processing → output directly
- ✅ DO: Avoid passing unused variables between functions
- ❌ DON'T: Pass the same data through multiple query layers

**Example:**
```python
# ❌ BAD: Data passing through unnecessary layers
def process_payment(booking_id):
    booking = db.fetch_booking(booking_id)  # Get full object
    trans = booking['transaction']  # Extract from object
    amount = trans['amount']  # Extract again
    # ... use only amount
    
# ✅ GOOD: Get exactly what you need
async def _fetch_payment_amount(transaction_id: str) -> float:
    """Fetch only the amount we need."""
    trans = await db.fetch_transaction(transaction_id)
    return trans['amount']

amount = await _fetch_payment_amount(transaction_id)
```

#### 3. **Use "Why" Not "How" (استخدم اللماذا)**
- ✅ DO: Think about what the code should accomplish (the goal)
- ✅ DO: Look for simpler, more direct solutions
- ❌ DON'T: Stick to complex traditional approaches

**Example:**
```python
# ❌ TRADITIONAL (but complex)
def create_quotation(...):
    items_list = []
    for item in request.items:
        formatted = {
            'type': item.type,
            'amount': item.amount,
            'description': item.description
        }
        items_list.append(formatted)
    rpc_response = supabase.rpc(..., {'items': items_list})
    quote = rpc_response.data[0]
    return QuotationResponse(**quote)

# ✅ SIMPLER (direct approach)
def _serialize_items(items: List[QuotationItem]) -> List[Dict]:
    """Transform items to JSONB format."""
    return [item.model_dump() for item in items]

async def _fetch_quotation(quote_id: str) -> QuotationResponse:
    """Fetch and return quotation."""
    data = await supabase.table("quotations").select("*").eq("id", quote_id)
    return QuotationResponse(**data[0])

async def create_quotation(...):
    quote_id = await supabase.rpc(..., {
        'items': _serialize_items(request.items)
    })
    return await _fetch_quotation(quote_id)
```

### Refactoring Checklist

Before committing code, ask yourself:

- [ ] **Does any function do more than one thing?**
  - If yes → extract to helper function
  
- [ ] **Am I passing data I don't use?**
  - If yes → simplify the function signature
  
- [ ] **Am I querying the same data twice?**
  - If yes → fetch once and reuse
  
- [ ] **Is there a simpler way to do this?**
  - If yes → use the simpler way
  
- [ ] **Would someone understand this in 30 seconds?**
  - If no → add comments or extract methods

### Helper Function Template

When you extract a helper function, follow this pattern:

```python
def _extract_helper_name(input_data: InputType) -> OutputType:
    """
    One-line description of what this does.
    
    Purpose: Clear statement of why this exists
    Input: What goes in
    Output: What comes out
    Blocking: True/False (does it block the main flow?)
    """
    # Implementation
    return result

# Usage:
result = _helper_name(data)
```

**Example from recent refactoring:**
```python
def _build_document_records(documents: List[DocumentUpload]) -> List[Dict]:
    """Transform DocumentUpload objects into JSONB-ready records.
    
    Purpose: Convert frontend format to database format
    Input: List of DocumentUpload objects
    Output: List of dicts ready for JSONB storage
    Blocking: No (pure transformation)
    """
    return [
        {
            "doc_type": doc.doc_type,
            "file_url": doc.file_url,
            "file_size": doc.file_size,
            "status": "UPLOADED",
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        for doc in documents
    ]
```

---

## Troubleshooting

### Sync stuck in "pending"
1. Check cron job is configured and running
2. Check `SYNC_PROCESSOR_SECRET` matches environment
3. Check Supabase credentials are valid
4. Check system_logs for errors

### Event not dispatching
1. Check registration-event-dispatcher logs in browser console
2. Check event_log table for events (might have errors)
3. Check system_logs for handler failures

### CRM provisioning failed
1. Check sync_queue.error_message for details
2. Check system_logs for "provisioning failed"
3. Verify CRM API endpoint is reachable
4. Verify auth token is valid

## Next Steps

- [ ] Integrate email service (sendWelcomeEmail handler)
- [ ] Integrate analytics (trackSignupMetric handler)
- [ ] Implement travel_request/visa_application/payment sync handlers
- [ ] Set up bidirectional CRM sync
- [ ] Add real-time UI updates for sync status

---

## 📚 Documentation & References

- **Full Code Refactoring Report**: `CRM_CODE_REFACTORING_SUMMARY.md`
- **CRM Rules & Standards**: `CRM-RULES.MD`
- **Architecture Overview**: `ARCHITECTURAL_SUMMARY_TASK_2_10.md`
- **Data Pipeline Docs**: `CRM_DATA_PIPELINE_DOCUMENTATION.md`
- **Event System**: `TASK_3_IMPLEMENTATION_COMPLETE.md` and `src/lib/services/EVENT_SYSTEM_INTEGRATION.md`

## 🔗 Recent Changes

**Applied CRM-RULES.md standards to:**
- `app/routers/crm_pipeline.py` (8 helper functions extracted)
- `app/services/registration_hook.py` (simplified data flow)

See `CRM_CODE_REFACTORING_SUMMARY.md` for detailed changes.
