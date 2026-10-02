# Implementation Plan

## Overview

Incremental replacement of all mock data reads with live Supabase queries across the portal module. No architectural changes � the schema, response helpers, auth guards, and Supabase client factories are already production-ready. The fix touches 7 existing files and creates 9 new API routes.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3"] },
    { "wave": 3, "tasks": ["4", "5", "6", "7", "8"] },
    { "wave": 4, "tasks": ["9", "10", "11", "12"] },
    { "wave": 5, "tasks": ["13", "14"] },
    { "wave": 6, "tasks": ["15"] }
  ]
}
```


```
Task 3 (portalService)
  |-> Task 4 (dashboard + notifications routes)
  |-> Task 5 (travel-requests routes)
  |-> Task 6 (documents routes � also requires Storage bucket from 6.1)
Task 4, 5, 6, 7, 8 (all routes)
  |-> Task 9  (usePortalDashboard hook)
  |-> Task 10 (useRequests hook)
  |-> Task 11 (useDocuments hook)
  |-> Task 12 (useNotifications hook)
Tasks 9-12
  |-> Task 13 (re-run bug condition tests)
  |-> Task 14 (re-run preservation tests)
Tasks 13, 14
  |-> Task 15 (final checkpoint)

Tasks 1, 2 (test setup) have NO dependencies -- run first, before any fix code.
```

## Tasks


- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Mock Data & Missing Auth Guard
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface concrete counterexamples that prove mock data is served and auth is absent
  - **Scoped PBT Approach**: Scope to the concrete failing cases below for reproducibility
  - Test case A — `GET /api/v1/bookings/my` without a session cookie returns HTTP 200 with `MOCK_MY_BOOKINGS` data (auth guard absent)
  - Test case B — `POST /api/travel-requests` with any body returns `customer_id: "mock-user-001"` (identity hardcoded)
  - Test case C — `GET /api/v1/portal/dashboard` returns HTTP 404 (route does not yet exist)
  - Test case D — `usePortalDashboard` initial state contains values from `MOCK_DASHBOARD` without making a network request (mock imported at module level)
  - Assert for A: response status is 200 AND response body contains a field matching a known MOCK_MY_BOOKINGS entry
  - Assert for B: response body `data.customer_id === "mock-user-001"`
  - Assert for C: response status is 404
  - Assert for D: `data` is non-null and `isLoading` is false immediately on mount (no fetch in-flight)
  - Run tests on **UNFIXED** code
  - **EXPECTED OUTCOME**: All assertions pass on unfixed code (this confirms the bugs exist)
  - Document counterexamples found — e.g., `GET /api/v1/bookings/my` (no cookie) → 200 `{success:true, data:[...MOCK_MY_BOOKINGS]}`
  - Mark task complete when tests are written, run, and failure behavior is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 5.1, 5.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Hook Return Shape & API Response Shape Unchanged
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code, observe, then write assertions
  - Observe `usePortalDashboard` return shape on unfixed code: `{ data, isLoading, error, refresh }` — record exact field names and types
  - Observe `useRequests` return shape: `{ requests, total, isLoading, error, refresh, createRequest, updateRequest }` — all present
  - Observe `useDocuments` return shape: `{ isUploading, error, uploadDocument, deleteDocument, clearError }` — all present
  - Observe `useNotifications` return shape: `{ notifications, total, unreadCount, isLoading, error, refresh, markRead, markAllRead, pushNotification }` — all present
  - Observe `GET /api/v1/bookings/my` response shape: `{ success: true, data: [...], meta: { page, limit, total, total_pages } }`
  - Write property-based test: for any mock `DashboardResponse` object, after `usePortalDashboard` settles, the returned `data` object has exactly the fields from `DashboardResponse` interface (no added, no removed fields)
  - Write property-based test: for any array of `RequestResponse` objects, `useRequests` exposes `requests` with same length and same field names (verifying no shape mutation)
  - Write property-based test: for any pagination inputs `(total: number, page: number, limit: number)` where `limit > 0`, the `meta` object satisfies `total_pages === Math.ceil(total / limit)` and `data.length <= limit`
  - Write test: `useNotifications` exposes `pushNotification` as a callable function (callers depend on this contract)
  - Write test: `useRequest(id)` exposes `applyRealtimeUpdate` as a callable function
  - Write test: `useDocuments` exposes `clearError` as a callable function that sets `error` to null
  - Verify all tests **PASS** on **UNFIXED** code (confirms the baselines we must preserve)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 2.7, 3.8, 4.5, 4.6_

- [x] 3. Implement `portalService` — server-side data access layer
  - Populate `src/modules/portal/services/portalService.ts` (currently `export const portalService = {}`)
  - Import `createServerClient` from `@/lib/supabase/server`, `TABLES` from `@/lib/db/schema`, and all needed `AppError` subclasses from `@/lib/api/errors`
  - Implement `getDashboard(userId: string): Promise<DashboardResponse>`:
    - Run parallel COUNT queries on `TABLES.travelRequests` scoped by `client_user_id = userId`
    - First query profile: `TABLES.profiles` where `user_id = userId` → get `profile.id` for document/notification counts
    - Return assembled `DashboardResponse`; throw `AppError` on any Supabase error
  - Implement `getRequests(userId, opts: { status?, page, limit }): Promise<{ data: RequestResponse[], total: number }>`:
    - Query `TABLES.travelRequests` where `client_user_id = userId`
    - Apply optional `status` filter; apply range pagination `(page-1)*limit` to `page*limit-1`
    - Return `{ data, total }`
  - Implement `getRequestById(requestId, userId): Promise<RequestDetailResponse | null>`:
    - Fetch travel request scoped by both `id` and `client_user_id = userId` (returns null if not found, never leaks existence)
    - Join `TABLES.portalStatusLog` and `TABLES.customerDocuments` for the request
  - Implement `createRequest(userId, body: CreateRequestBody): Promise<RequestResponse>`:
    - INSERT into `TABLES.travelRequests` with `client_user_id = userId`, `user_id = userId`, `vertical = body.request_type`, `booking_status = 'pending'`
  - Implement `getNotifications(profileId, unreadOnly): Promise<NotificationResponse[]>`:
    - Query `TABLES.portalNotifications` where `customer_id = profileId`, ordered by `created_at DESC`
    - Apply `.eq('is_read', false)` when `unreadOnly` is true
  - Implement `markNotificationRead(notifId, profileId): Promise<void>`:
    - UPDATE `TABLES.portalNotifications` set `is_read = true` where `id = notifId AND customer_id = profileId`
    - Throw `NotFoundError` when rows affected = 0 (wrong owner or missing id)
  - Implement `markAllNotificationsRead(profileId): Promise<void>`:
    - UPDATE `TABLES.portalNotifications` set `is_read = true` where `customer_id = profileId AND is_read = false`
  - Every table reference uses `TABLES.*` — no string literals
  - Every Supabase error is re-thrown as a typed `AppError` subclass
  - _Bug_Condition: `portalService` is currently an empty stub (`{}`) — all routes that call it get `undefined` for every method_
  - _Expected_Behavior: every method returns Supabase-backed data scoped to the provided userId/profileId_
  - _Preservation: portalService is server-only; no client component imports it directly_
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4. Create portal dashboard and notifications API routes

  - [x] 4.1 Create `src/app/api/v1/portal/dashboard/route.ts`
    - GET handler: `createServerClient()` → `requireUser(supabase)` → resolve `profile.id` from `TABLES.profiles`
    - Call `portalService.getDashboard(user.id)` and return `successResponse(data)`
    - Wrap in try/catch → `errorResponse(err as Error)` on failure
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 4.2 Create `src/app/api/v1/portal/notifications/route.ts`
    - GET handler: auth guard → profile resolution → call `portalService.getNotifications(profile.id, unreadOnly)`
    - Read `unread_only` from `searchParams`; pass as boolean to service
    - Return `successResponse(data)`
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 Create `src/app/api/v1/portal/notifications/[id]/read/route.ts`
    - PATCH handler: auth guard → profile resolution → call `portalService.markNotificationRead(params.id, profile.id)`
    - Catch `NotFoundError` → return `notFoundResponse('Notification')`
    - _Requirements: 3.3_

  - [x] 4.4 Create `src/app/api/v1/portal/notifications/read-all/route.ts`
    - POST handler: auth guard → profile resolution → call `portalService.markAllNotificationsRead(profile.id)`
    - Return `noContentResponse()`
    - _Requirements: 3.4_

  - _Bug_Condition: routes at `/api/v1/portal/*` do not exist — any request to them returns 404_
  - _Expected_Behavior: each route authenticates the caller and returns Supabase-backed data scoped to that user_
  - _Preservation: response shape `{ success: true, data }` is unchanged; helpers from `@/lib/api/response` are used_
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 7.1, 7.4_

- [x] 5. Create travel requests CRUD API routes

  - [x] 5.1 Create `src/app/api/v1/travel-requests/route.ts`
    - GET handler: auth guard → validate optional `status` param against `RequestStatus` union; return `validationErrorResponse` for unknown values → call `portalService.getRequests(user.id, { status, page, limit })` → return `successResponse(data, undefined, { page, limit, total, total_pages: Math.ceil(total / limit) })`
    - POST handler: auth guard → validate required fields (`full_name`, `request_type`, `destination`); return `validationErrorResponse` if missing → call `portalService.createRequest(user.id, body)` → return `createdResponse(record)`
    - Both handlers wrapped in try/catch → `errorResponse(err as Error)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Create `src/app/api/v1/travel-requests/[id]/route.ts`
    - GET handler: auth guard → call `portalService.getRequestById(params.id, user.id)` → return `notFoundResponse('Travel request')` when null → return `successResponse(data)`
    - PUT handler: auth guard → fetch request; return 404 if not found for this user → check `booking_status !== 'pending'`; return `new ConflictError(...)` when true → UPDATE `TABLES.travelRequests` set body fields → return `successResponse(updated)`
    - _Requirements: 2.5, 2.6_

  - _Bug_Condition: `POST /api/travel-requests` hardcodes `customer_id: "mock-user-001"`; no `/api/v1/travel-requests` routes exist_
  - _Expected_Behavior: POST inserts a real row with `client_user_id = auth.users.id`; GET returns rows scoped to the authenticated user_
  - _Preservation: response shape `{ success: true, data, meta? }` unchanged; pagination meta fields unchanged_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.4_

- [x] 6. Create document upload and delete API routes

  - [x] 6.1 Verify `customer-documents` Supabase Storage bucket exists
    - Check Supabase Dashboard → Storage → Buckets for `customer-documents`
    - If it does NOT exist: create it via Dashboard (Storage → New bucket → name: `customer-documents`, public: false) OR run via admin client:
      ```ts
      const adminClient = await createSupabaseAdminClient()
      await adminClient.storage.createBucket('customer-documents', { public: false })
      ```
    - Confirm bucket is accessible before proceeding to 6.2
    - _Requirements: 4.1_

  - [x] 6.2 Create `src/app/api/v1/documents/upload/route.ts`
    - POST handler (multipart/form-data): auth guard → profile resolution
    - Parse `formData`: extract `file` (File), `request_id` (string), `doc_type` (string)
    - Return `validationErrorResponse` if any of the three are missing (do NOT touch storage)
    - Build `storagePath = \`${user.id}/${requestId}/${file.name}\``
    - Upload to `supabase.storage.from('customer-documents').upload(storagePath, file)`
    - If `storageError`: return `errorResponse(storageError)` — do NOT insert DB row
    - Get public URL via `getPublicUrl(storagePath)`
    - INSERT into `TABLES.customerDocuments` with `customer_id = profile.id`, `request_id`, `doc_type`, `file_url`, `file_name`, `file_size`, `mime_type`, `status = 'uploaded'`
    - Return `createdResponse(inserted row)`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.3 Create `src/app/api/v1/documents/[id]/route.ts`
    - DELETE handler: auth guard → profile resolution
    - SELECT from `TABLES.customerDocuments` where `id = params.id AND customer_id = profile.id`; return `notFoundResponse('Document')` if missing
    - Extract storage path from `file_url`
    - `supabase.storage.from('customer-documents').remove([storagePath])`
    - DELETE from `TABLES.customerDocuments` where `id = params.id`
    - Return `noContentResponse()`
    - _Requirements: 4.4_

  - _Bug_Condition: `useDocuments.uploadDocument` uses `URL.createObjectURL` — blob URL expires on page reload; no Storage write occurs; no DB row is inserted_
  - _Expected_Behavior: file is persisted in Supabase Storage; a permanent public URL is stored in `customer_documents`_
  - _Preservation: `isUploading`, `error`, `clearError` remain in hook return; `uploadDocument` signature unchanged_
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Fix `GET /api/v1/bookings/my` — add auth guard and Supabase query
  - Remove `import { MOCK_MY_BOOKINGS } from '@/lib/mock/data'`
  - Add `import { createServerClient } from '@/lib/supabase/server'`
  - Add `import { requireUser } from '@/lib/api/server-utils'`
  - Add `import { successResponse, errorResponse } from '@/lib/api/response'`
  - Add `import { TABLES } from '@/lib/db/schema'`
  - Wrap entire handler in try/catch → `errorResponse(err as Error)`
  - `supabase = await createServerClient()` → `user = await requireUser(supabase)` (throws 401 for unauthenticated callers)
  - Base query: `TABLES.travelRequests` where `client_user_id = user.id`
  - Apply `status` and `vertical` filters at DB level (`.eq()`) before executing — not post-fetch
  - Get `total` from a COUNT query with the same filters
  - Apply range: `.range((page - 1) * limit, page * limit - 1)`
  - Left-join detail table based on `vertical` value using Supabase select syntax:
    - `flight` → `flight_booking_details(*)`
    - `hotel`  → `hotel_booking_details(*)`
    - `visa`   → `visa_booking_details(*)`
    - `trip`   → `trip_booking_details(*)`
  - Return `successResponse(data, undefined, { page, limit, total, total_pages: Math.ceil(total / limit) })`
  - Replace `NextResponse.json(...)` with `successResponse(...)` throughout
  - _Bug_Condition: route returns `MOCK_MY_BOOKINGS` to all callers with no auth check; `isBugCondition` is true_
  - _Expected_Behavior: unauthenticated callers receive 401; authenticated callers receive only their own bookings_
  - _Preservation: response shape `{ success: true, data, meta: { page, limit, total, total_pages } }` unchanged_
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Fix `POST /api/travel-requests` — proxy to v1 route
  - Remove all business logic from `src/app/api/travel-requests/route.ts`
  - Remove `import { MOCK_REQUESTS }` and `let _requests = [...]`
  - Replace the POST handler body with a `fetch()` proxy to `/api/v1/travel-requests`:
    ```ts
    const origin = request.headers.get('origin') ?? 'http://localhost:3000'
    const response = await fetch(`${origin}/api/v1/travel-requests`, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') ?? 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: request.body,
      duplex: 'half',
    })
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
    ```
  - No new business logic — this file is a transparent proxy only
  - _Bug_Condition: handler writes to module-scope `let _requests` array with hardcoded `customer_id: "mock-user-001"`_
  - _Expected_Behavior: POST proxies to v1 route which inserts a real DB row; response is identical to the v1 route's response_
  - _Preservation: `POST /api/travel-requests` URL and HTTP method remain valid for backward compatibility_
  - _Requirements: 7.2_

- [x] 9. Fix `usePortalDashboard` hook — replace mock with fetch
  - Remove `import { MOCK_DASHBOARD, MOCK_REQUESTS } from '@/lib/mock/data'`
  - Replace `const [data] = useState<DashboardResponse>(...)` with `useState<DashboardResponse | null>(null)`
  - Change `const [isLoading] = useState(false)` to `useState(true)` (loading on mount)
  - Change `const [error] = useState<string | null>(null)` to mutable `useState`
  - Add `useEffect` that calls `fetch('/api/v1/portal/dashboard')` on mount:
    - On success (response.ok): `setData(json.data)`, `setIsLoading(false)`
    - On error: `setError(message)`, `setIsLoading(false)`
    - Use `finally` to always call `setIsLoading(false)`
  - Replace `refresh = useCallback(async () => { /* no-op */ }, [])` with a real re-fetch that resets `isLoading` and calls the same fetch logic
  - Preserve return signature: `{ data, isLoading, error, refresh }` — no field changes
  - _Bug_Condition: hook returns `MOCK_DASHBOARD` with `isLoading: false` immediately; `refresh()` is a no-op_
  - _Expected_Behavior: hook calls `GET /api/v1/portal/dashboard` and returns live data scoped to the authenticated user_
  - _Preservation: return shape `{ data, isLoading, error, refresh }` unchanged; components require zero changes_
  - _Requirements: 1.3, 1.4, 1.5, 8.1, 8.2, 8.4_

- [ ] 10. Fix `useRequests` hook — replace mock with fetch

  - [x] 10.1 Fix the `useRequests` hook
    - Remove `import { MOCK_REQUESTS, MOCK_DOCUMENTS }` and `let _requests = [...MOCK_REQUESTS]`
    - Add `useState` for `requests`, `total`, `isLoading` (initial: true), `error`
    - Add `useEffect` that fetches `/api/v1/travel-requests` with `status_filter`, `page`, and `limit` params; sets `requests` and `total` from response
    - Rewrite `createRequest`:
      1. Build optimistic record and prepend to `requests` state
      2. POST to `/api/v1/travel-requests`
      3. On success: replace optimistic record with returned record
      4. On failure: revert (remove the optimistic record); set `error`
    - Rewrite `updateRequest`:
      1. Optimistically update the matching record in state
      2. PUT to `/api/v1/travel-requests/${id}`
      3. On failure: revert to the pre-update record; set `error`
    - Rewrite `refresh`: re-fetch from API with current options (not reset to `_requests`)
    - Preserve return shape: `{ requests, total, isLoading, error, refresh, createRequest, updateRequest }`
    - _Requirements: 2.7, 2.8, 8.1, 8.2, 8.4_

  - [-] 10.2 Fix the `useRequest(id)` single-request hook
    - Remove dependency on module-scope `_requests` array and `MOCK_DOCUMENTS`
    - Add `useEffect` that fetches `/api/v1/travel-requests/${id}` on mount
    - On success: `setRequest(json.data)`; on error: `setError(message)`
    - Preserve `applyRealtimeUpdate` callback (external callers depend on it)
    - Preserve return shape: `{ request, isLoading, error, refresh, applyRealtimeUpdate }`
    - _Requirements: 2.5, 8.1, 8.2_

  - _Bug_Condition: `useRequests` reads/writes `let _requests` (module-scope); `createRequest` hardcodes `customer_id: "mock-user-001"`_
  - _Expected_Behavior: requests are fetched from and persisted to Supabase scoped to the authenticated user_
  - _Preservation: all return fields unchanged; `updateRequest()` and `refresh()` remain callable_
  - _Requirements: 2.7, 2.8, 8.1, 8.2, 8.3, 8.4_

- [ ] 11. Fix `useDocuments` hook — replace mock with real API calls
  - Remove `import { MOCK_DOCUMENTS }` and `let _documents = [...MOCK_DOCUMENTS]`
  - Rewrite `uploadDocument(requestId, userId, file, docType)`:
    - Build `FormData`: append `file`, `request_id = requestId`, `doc_type = docType`
    - POST to `/api/v1/documents/upload` with `body: formData` (no `content-type` header — browser sets boundary)
    - Remove `URL.createObjectURL` and `setTimeout` simulation
    - On success: return `json.data` as `DocumentResponse`
    - On failure: `setError(message)`; rethrow
    - Keep `setIsUploading(true)` before and `setIsUploading(false)` in `finally`
  - Rewrite `deleteDocument(_requestId, docId)`:
    - `DELETE /api/v1/documents/${docId}`
    - Remove from local state on success
    - On failure: `setError(message)`; rethrow
  - Preserve return shape: `{ isUploading, error, uploadDocument, deleteDocument, clearError }`
  - `clearError` behavior unchanged: sets `error` to null
  - _Bug_Condition: `uploadDocument` uses `URL.createObjectURL` — blob URL is not persisted; no Storage write; no DB row_
  - _Expected_Behavior: file is uploaded to Supabase Storage; permanent URL stored in `customer_documents`_
  - _Preservation: `isUploading`, `error`, `clearError` present; `uploadDocument` and `deleteDocument` signatures unchanged_
  - _Requirements: 4.5, 4.6, 8.1, 8.2, 8.3_

- [ ] 12. Fix `useNotifications` hook — add Realtime subscription and real API calls
  - Remove `import { MOCK_NOTIFICATIONS }` and `let _notifications = [...MOCK_NOTIFICATIONS]`
  - Add `import { createClient } from '@/lib/supabase/client'` (browser singleton — NOT server client)
  - Add `useState` for `notifications`, `total`, `unreadCount`, `isLoading` (initial: true), `error`
  - Add `useEffect` on mount with two steps:
    1. `fetch('/api/v1/portal/notifications?unread_only=' + unread_only)` → `setNotifications`, `setTotal`, `setUnreadCount`
    2. Subscribe to Realtime channel:
       ```ts
       const supabase = createClient()
       const channel = supabase
         .channel(`portal_notifications:${profileId}`)
         .on('postgres_changes', {
           event: 'INSERT',
           schema: 'public',
           table: 'portal_notifications',
           filter: `customer_id=eq.${profileId}`,
         }, (payload) => pushNotification(payload.new as NotificationResponse))
         .subscribe((status) => {
           if (status === 'CHANNEL_ERROR') console.error('Realtime subscription error')
         })
       ```
    3. Return cleanup: `() => { supabase.removeChannel(channel) }`
  - Subscription errors must NOT throw — log via `console.error` and continue (requirement 3.6)
  - Rewrite `markRead(id)`:
    - Optimistically set `is_read = true` in state
    - `PATCH /api/v1/portal/notifications/${id}/read`
    - On failure: revert the optimistic update; set `error`
  - Rewrite `markAllRead()`:
    - Optimistically set all `is_read = true` in state
    - `POST /api/v1/portal/notifications/read-all`
    - On failure: revert; set `error`
  - Preserve `pushNotification()` — called by Realtime handler AND by external callers; signature unchanged
  - Preserve return shape: `{ notifications, total, unreadCount, isLoading, error, refresh, markRead, markAllRead, pushNotification }`
  - Unmount cleanup removes the Realtime channel (requirement 3.7)
  - _Bug_Condition: hook reads `let _notifications` (module-scope); no Realtime subscription; `markRead` is ephemeral_
  - _Expected_Behavior: notifications fetched from Supabase; new INSERTs pushed via Realtime without manual refresh_
  - _Preservation: `pushNotification()` remains callable; all return fields unchanged_
  - _Requirements: 3.5, 3.6, 3.7, 3.8, 8.1, 8.2, 8.3, 8.4_

- [ ] 13. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Mock Data & Missing Auth Guard
  - **IMPORTANT**: Re-run the SAME tests written in task 1 — do NOT write new tests
  - The tests from task 1 encode the expected behavior inversely: they pass when the unfixed behavior is observed
  - After the fix, the assertions need to be inverted to confirm the fix:
    - Assert A (inverted): unauthenticated `GET /api/v1/bookings/my` returns HTTP 401
    - Assert B (inverted): authenticated `POST /api/v1/travel-requests` returns a record with `client_user_id` matching the real `auth.users.id` (not `"mock-user-001"`)
    - Assert C (inverted): `GET /api/v1/portal/dashboard` with auth returns HTTP 200 with `DashboardResponse` shape
    - Assert D (inverted): `usePortalDashboard` has `isLoading: true` on mount and `data: null` before fetch resolves
  - Run on **FIXED** code
  - **EXPECTED OUTCOME**: Tests PASS (confirms bugs are resolved)
  - _Requirements: Expected Behavior Properties from design (Property 1)_

- [ ] 14. Verify preservation tests still pass
  - **Property 2: Preservation** - Hook Return Shape & API Response Shape Unchanged
  - **IMPORTANT**: Re-run the SAME tests written in task 2 — do NOT write new tests
  - Run all preservation tests from task 2 on **FIXED** code
  - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions in interfaces or response shapes)
  - Confirm: `pushNotification()`, `applyRealtimeUpdate()`, `clearError()`, `updateRequest()` are all still present and callable
  - Confirm: `meta` pagination shape `{ page, limit, total, total_pages }` is intact across all list endpoints
  - Confirm: no components that consume these hooks require changes to compile

- [ ] 15. Checkpoint — ensure all tests pass and integration is verified
  - Run full test suite; ensure all tests pass
  - Manually verify end-to-end flow:
    1. Log in as a real test user
    2. Portal dashboard loads live data (not mock) — check Network tab confirms `GET /api/v1/portal/dashboard` returns 200
    3. Create a travel request — verify row appears in Supabase `travel_requests` table with correct `client_user_id`
    4. `GET /api/v1/travel-requests` returns only rows belonging to the logged-in user
    5. Upload a document — verify file appears in Supabase Storage `customer-documents` bucket and row inserted in `customer_documents`
    6. Delete the document — verify removed from Storage and DB
    7. Open `GET /api/v1/bookings/my` in a private/incognito window (no session) — verify HTTP 401
    8. Trigger a notification INSERT directly in Supabase — verify it appears in the portal UI without a page refresh (Realtime working)
  - Ask the user if any questions or edge cases need clarification before marking complete

## Notes

- Storage bucket: Task 6.1 requires manual creation of the customer-documents bucket in Supabase Dashboard before task 6.2 and 6.3 can be tested.
- Profile ID indirection: Tables portal_notifications and customer_documents use customer_id referencing profiles.id (internal PK), not auth.users.id. Every route that touches these tables must perform a two-step lookup: requireUser(supabase) -> query TABLES.profiles where user_id = user.id -> use resulting profile.id.
- Realtime requires Supabase Realtime enabled: Confirm the portal_notifications table has Realtime replication enabled in Supabase Dashboard -> Database -> Replication before testing task 12.
- Legacy proxy (Task 8): POST /api/travel-requests must remain at that URL for backward compatibility with any existing client code. The proxy passes the session cookie through so auth works end-to-end.
- No component changes required: All hook return shapes are preserved. Zero components need to be edited as part of this integration.