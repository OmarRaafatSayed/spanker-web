# Bug Condition Exploration - Counterexamples Found

**Test Date:** 2026-10-02  
**Test Status:** ✅ All 4 bug conditions confirmed on unfixed code

## Summary

This document captures the concrete counterexamples that prove the portal mock data bugs exist in the current (unfixed) codebase.

## Counterexample A: Missing Auth Guard on `/api/v1/bookings/my`

**Test:** Make unauthenticated request to `GET /api/v1/bookings/my` (no session cookie)

**Expected on FIXED code:** HTTP 401 Unauthorized

**Actual on UNFIXED code:**
- HTTP 200 OK
- Returns mock data structure with pagination
- Response structure:
  ```json
  {
    "success": true,
    "data": [...], // Array of 2 bookings
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "total_pages": 1
    }
  }
  ```

**Proof of bug:** Auth guard is absent; unauthenticated requests succeed and return data.

---

## Counterexample B: Hardcoded `customer_id` in Travel Request Creation

**Test:** POST to `/api/travel-requests` with any request body

**Expected on FIXED code:** `customer_id` should be set to the authenticated user's ID from `auth.users.id`

**Actual on UNFIXED code:**
- Returns `customer_id: "mock-user-001"` regardless of authentication
- Sample response:
  ```json
  {
    "success": true,
    "data": {
      "id": "req-1790958669952",
      "customer_id": "mock-user-001",  // ← Hardcoded!
      "status": "new",
      "full_name": "Test User",
      "phone": "+201234567890",
      "email": "test@example.com",
      "request_type": "flight",
      "destination": "Test Destination",
      "travel_date": "2026-12-01",
      "num_travelers": 1,
      "created_at": "2026-10-02T16:31:09.952Z",
      "updated_at": "2026-10-02T16:31:09.952Z"
    }
  }
  ```

**Proof of bug:** Identity is hardcoded to `"mock-user-001"` instead of being scoped to the authenticated user.

---

## Counterexample C: Dashboard Route Not Implemented

**Test:** `GET /api/v1/portal/dashboard`

**Expected on FIXED code:** HTTP 200 with aggregated dashboard stats from Supabase

**Actual on UNFIXED code:**
- HTTP 404 Not Found
- Route does not exist in the codebase

**Proof of bug:** The `/api/v1/portal/dashboard` API endpoint has not been created yet.

---

## Counterexample D: `usePortalDashboard` Returns Mock Data Immediately

**Test:** Examine `MOCK_DASHBOARD` structure used by `usePortalDashboard` hook

**Expected on FIXED code:** 
- Hook should fetch from `/api/v1/portal/dashboard` on mount
- `isLoading: true` while fetch is in-flight
- Data populated from API response

**Actual on UNFIXED code:**
- Returns `MOCK_DASHBOARD` directly without any network request
- Data available immediately on mount (no loading state)
- Sample mock data structure:
  ```javascript
  {
    total_requests: 6,
    active_requests: 3,
    completed_requests: 2,
    total_documents: 9,
    pending_documents: 2,
    approved_documents: 5,
    rejected_documents: 1,
    unread_notifications: 3,
    latest_requests: []
  }
  ```

**Proof of bug:** Hook imports and returns mock data at module level instead of fetching from API.

---

## Verification After Fix

Once the fix is implemented, these same tests should **FAIL** (or behave differently):

- **Test A:** Should return HTTP 401 (not 200)
- **Test B:** Should return real user's ID (not `"mock-user-001"`)
- **Test C:** Should return HTTP 200 with dashboard data (not 404)
- **Test D:** Hook should fetch from API with `isLoading: true` (not return mock immediately)

---

## Files Affected

Based on these counterexamples, the following files contain the bugs:

1. `src/app/api/v1/bookings/my/route.ts` — Missing `requireUser()` auth guard
2. `src/app/api/travel-requests/route.ts` — Hardcoded `customer_id: "mock-user-001"`
3. `src/app/api/v1/portal/dashboard/route.ts` — Does not exist (needs to be created)
4. `src/modules/portal/hooks/usePortalDashboard.ts` — Returns `MOCK_DASHBOARD` instead of fetching

---

## Test Output

```
✅ Counterexample A found: GET /api/v1/bookings/my (no cookie) → 200 with mock structure
✅ Counterexample B found: POST /api/travel-requests → hardcoded customer_id
✅ Counterexample C found: GET /api/v1/portal/dashboard → 404 (route not implemented)
✅ Counterexample D found: usePortalDashboard returns MOCK_DASHBOARD immediately (no fetch)
```

All four test cases passed on UNFIXED code, confirming the bugs exist.
