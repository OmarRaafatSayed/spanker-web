# Portal Live Data Integration — Design

## Overview

The Spanker portal currently runs entirely on in-memory mock data. Every hook
(`usePortalDashboard`, `useRequests`, `useDocuments`, `useNotifications`), the
sole legacy route (`POST /api/travel-requests`), and `portalService` are all
detached from the database.

The fix is a targeted **incremental replacement**: no architectural changes, no
new libraries. Every mock read is replaced with a real Supabase query or
`fetch()` call while preserving all existing interfaces, component contracts,
and error surface. The backend infrastructure (schema, `TABLES`, response
helpers, auth guards) is already production-ready.

---

## Glossary

| Term | Definition |
|------|-----------|
| **Bug_Condition (C)** | A code path that reads from a `MOCK_*` fixture or in-memory array instead of Supabase |
| **Property (P)** | The correct behavior: every data read is scoped to the authenticated user and backed by Supabase |
| **Preservation** | All existing hook/component interfaces, response shapes, and non-data-read behaviors must remain unchanged |
| `portalService` | `src/modules/portal/services/portalService.ts` — the server-side service that will own all Supabase queries for portal operations |
| `requireUser(supabase)` | Auth guard from `src/lib/api/server-utils.ts`; throws `AuthenticationError` (401) when no valid session exists |
| `TABLES` | Constants object from `src/lib/db/schema.ts`; must be used for all table name references |
| `createServerClient()` | Async Supabase factory from `src/lib/supabase/server.ts`; must be awaited — the only valid server-side client |
| `createClient()` | Browser Supabase singleton from `src/lib/supabase/client.ts`; used in hooks for Realtime subscriptions |
| Profile resolution | The two-step lookup: `requireUser(supabase)` returns `user.id` (auth UUID); a follow-up query on `TABLES.profiles` where `user_id = user.id` returns `profile.id` (internal PK used in `customer_id` columns) |
| Vertical | Booking category: `flight` \| `hotel` \| `visa` \| `trip` |
| Realtime | Supabase Realtime postgres_changes channel; used by `useNotifications` to push live INSERT events to the UI |
| Optimistic update | Updating local React state before the API response arrives, then reverting on failure |

---

## Bug Details

### Bug Condition

The bug manifests in two layers:

**Server layer**: API routes and `portalService` read from `MOCK_*` arrays
instead of executing Supabase queries. Authentication is bypassed — no
`requireUser()` call means any caller sees mock data for `"mock-user-001"`.

**Client layer**: Portal hooks (`usePortalDashboard`, `useRequests`,
`useDocuments`, `useNotifications`) either return hardcoded mock state directly
(skipping `fetch()` entirely) or operate on module-level `let _xxx = [...]`
arrays that reset on each server restart and are shared across all sessions.

**Formal Specification:**

```
FUNCTION isBugCondition(module)
  INPUT: module — a hook file, route file, or service file
  OUTPUT: boolean

  RETURN (
    module imports from '@/lib/mock/data'
    OR module reads from MOCK_DASHBOARD / MOCK_REQUESTS / MOCK_NOTIFICATIONS
       / MOCK_DOCUMENTS / MOCK_MY_BOOKINGS
    OR module contains `let _requests = [...]` / `let _notifications = [...]`
       / `let _documents = [...]` at module scope
    OR module contains `URL.createObjectURL` for persisting an upload
    OR module is an API route without `requireUser(supabase)` that returns
       user-scoped data
  )
END FUNCTION
```

### Affected Files (bug is confirmed present)

| File | Mock usage |
|------|-----------|
| `src/modules/portal/hooks/usePortalDashboard.ts` | Returns `MOCK_DASHBOARD` directly; `refresh()` is a no-op |
| `src/modules/portal/hooks/useRequests.ts` | Reads/writes `let _requests = [...MOCK_REQUESTS]`; hardcodes `customer_id: "mock-user-001"` |
| `src/modules/portal/hooks/useDocuments.ts` | Uses `URL.createObjectURL`; reads/writes `let _documents = [...MOCK_DOCUMENTS]` |
| `src/modules/portal/hooks/useNotifications.ts` | Reads/writes `let _notifications = [...MOCK_NOTIFICATIONS]`; no Realtime subscription |
| `src/app/api/v1/bookings/my/route.ts` | Reads `MOCK_MY_BOOKINGS`; no auth guard |
| `src/app/api/travel-requests/route.ts` | Writes to `let _requests`; hardcodes `customer_id: "mock-user-001"`; no auth |
| `src/modules/portal/services/portalService.ts` | Empty stub (`export const portalService = {}`) |

### Concrete Examples

- A customer logs in and sees the same 3 fake requests as every other user.
- An uploaded passport document is served as a blob URL that expires on page reload and is never stored.
- Marking a notification as read updates local memory only; after refresh the notification is unread again.
- `GET /api/v1/bookings/my` returns `MOCK_MY_BOOKINGS` to unauthenticated callers.
- Two browser tabs share the same `_requests` module variable; creating a request in tab A appears in tab B instantly (same process), but disappears after any server restart.

---

## Expected Behavior

### Preservation Requirements

These behaviors must be **unchanged** by the fix:

**Unchanged interfaces:**
- All hook return signatures remain identical — same field names, same TypeScript types (`DashboardResponse`, `RequestResponse`, `DocumentResponse`, `NotificationResponse`)
- `useNotifications` continues to expose `pushNotification()` for external callers
- `useRequest(id)` continues to expose `applyRealtimeUpdate()` for external callers
- `useDocuments` continues to expose `clearError()` function
- `useRequests` continues to expose `updateRequest()` function

**Unchanged response shapes:**
- All API routes continue to return `{ success: true, data, meta? }` using the existing response helpers — no shape changes
- Pagination `meta` object format (`page`, `limit`, `total`, `total_pages`) is unchanged

**Unchanged loading/error contract:**
- Hooks that currently expose `isLoading`, `error`, `isUploading` continue to expose those same fields
- Components consuming these hooks require zero changes

**Unchanged route paths:**
- Legacy route `POST /api/travel-requests` continues to exist (proxies to `/api/v1/travel-requests/`)
- `GET /api/v1/bookings/my` URL is unchanged

**Scope:**
All code paths that do NOT match `isBugCondition` (e.g., booking RPCs,
payment routes, admin routes, auth flows, CMS hooks) must be completely
unaffected by these changes.

---

## Hypothesized Root Cause

The mock layer was intentional scaffolding introduced during early development.
The underlying causes of the current state are:

1. **Never wired up**: `portalService` was created as a stub and never
   populated. Routes import mocks directly because the service was empty.

2. **Client/server boundary confusion**: Hooks import `MOCK_*` at the top
   level because there was no `/api/v1/portal/` endpoint to `fetch()` from.
   The routes needed to exist first.

3. **Auth guard skipped**: `bookings/my/route.ts` was prototyped without
   `requireUser()` because filtering by user ID was deferred until real data
   was integrated.

4. **Realtime never connected**: `useNotifications` has `pushNotification()`
   already wired for external callers (good), but the Supabase channel
   subscription was never added because notifications weren't persisted.

5. **Profile ID indirection overlooked**: Several tables use `customer_id`
   which references `profiles.id` (internal PK), not `auth.users.id`. Routes
   that skip auth also skip the two-step profile resolution this requires.

---

## Correctness Properties

Property 1: Bug Condition — Live Data Scoped to Authenticated User

_For any_ request to a portal API route or invocation of a portal hook where
the caller is authenticated, the fixed implementation SHALL read data
exclusively from Supabase filtered by the authenticated user's identity
(either `client_user_id = user.id` or `customer_id = profile.id`), and SHALL
never return data from `MOCK_*` fixtures or module-scoped in-memory arrays.

**Validates: Requirements 1.1, 1.3, 2.1, 2.3, 3.1, 4.1, 5.1, 6.1, 6.3**

Property 2: Preservation — Existing Interfaces and Component Contracts Unchanged

_For any_ component or test that consumes `usePortalDashboard`, `useRequests`,
`useDocuments`, `useNotifications`, or the portal API routes, the fixed
implementation SHALL return data in the same shape and expose the same function
signatures as the original mock implementation, such that no consumer requires
changes to compile or pass its existing tests.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 2.7, 3.8, 4.5, 4.6**

Property 3: Preservation — Auth Guard Enforcement

_For any_ unauthenticated request to a portal API route that returns
user-scoped data, the fixed implementation SHALL return HTTP 401 via
`unauthorizedResponse()` and SHALL NOT return any data row from Supabase.

**Validates: Requirements 1.2, 2.2, 3.2, 5.2**

---

## Fix Implementation

### Layer 1 — New API Routes (create)

These routes do not yet exist and must be created.

**`src/app/api/v1/portal/dashboard/route.ts`**
```
GET handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)
  profile = query TABLES.profiles where user_id = user.id → get profile.id

  Run parallel COUNT queries:
    total_requests      = COUNT travel_requests where client_user_id = user.id
    active_requests     = COUNT travel_requests where client_user_id = user.id
                          AND booking_status IN ('pending','confirmed')
    completed_requests  = COUNT travel_requests where client_user_id = user.id
                          AND booking_status = 'confirmed'
    total_documents     = COUNT customer_documents where customer_id = profile.id
    pending_documents   = COUNT customer_documents where customer_id = profile.id
                          AND status = 'uploaded'
    approved_documents  = COUNT customer_documents where customer_id = profile.id
                          AND status = 'approved'
    rejected_documents  = COUNT customer_documents where customer_id = profile.id
                          AND status = 'rejected'
    unread_notifications = COUNT portal_notifications where customer_id = profile.id
                          AND is_read = false
    latest_requests     = SELECT travel_requests where client_user_id = user.id
                          ORDER BY created_at DESC LIMIT 5

  return successResponse(assembled DashboardResponse)
```

**`src/app/api/v1/portal/notifications/route.ts`**
```
GET handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)
  profile = query TABLES.profiles where user_id = user.id

  unreadOnly = searchParams.get('unread_only') === 'true'

  query = supabase.from(TABLES.portalNotifications)
    .select('*')
    .eq('customer_id', profile.id)
    .order('created_at', { ascending: false })

  if unreadOnly: query = query.eq('is_read', false)

  return successResponse(data)
```

**`src/app/api/v1/portal/notifications/[id]/read/route.ts`**
```
PATCH handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)
  profile = query TABLES.profiles where user_id = user.id

  result = UPDATE TABLES.portalNotifications
    SET is_read = true
    WHERE id = params.id AND customer_id = profile.id

  if rows_affected = 0: return notFoundResponse('Notification')
  return successResponse(result)
```

**`src/app/api/v1/portal/notifications/read-all/route.ts`**
```
POST handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)
  profile = query TABLES.profiles where user_id = user.id

  UPDATE TABLES.portalNotifications
    SET is_read = true
    WHERE customer_id = profile.id AND is_read = false

  return noContentResponse()
```

**`src/app/api/v1/travel-requests/route.ts`**
```
GET handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)

  status = searchParams.get('status')
  page   = parseInt(searchParams.get('page') ?? '1')
  limit  = parseInt(searchParams.get('limit') ?? '10')

  if status is provided AND not a valid RequestStatus:
    return validationErrorResponse('Invalid status value')

  count query = COUNT travel_requests where client_user_id = user.id (+ status filter)
  data  query = SELECT travel_requests where client_user_id = user.id
                (+ status filter) ORDER BY created_at DESC
                RANGE [(page-1)*limit, page*limit-1]

  return successResponse(data, undefined, { page, limit, total, total_pages })

POST handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)

  body = await req.json()
  validate required fields (full_name, request_type, destination)
  if invalid: return validationErrorResponse(...)

  INSERT into TABLES.travelRequests:
    client_user_id = user.id
    user_id        = user.id      ← compatibility alias (migration 115)
    vertical       = body.request_type
    booking_status = 'pending'
    ...body fields

  return createdResponse(inserted row)
```

**`src/app/api/v1/travel-requests/[id]/route.ts`**
```
GET handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)

  SELECT travel_requests where id = params.id AND client_user_id = user.id
  if not found: return notFoundResponse('Travel request')

  SELECT portal_status_log where request_id = params.id
  SELECT customer_documents where request_id = params.id

  return successResponse({ ...request, status_log, documents })

PUT handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)

  fetch = SELECT travel_requests where id = params.id AND client_user_id = user.id
  if not found: return notFoundResponse('Travel request')
  if booking_status != 'pending': return conflict (HTTP 409)

  UPDATE travel_requests set ...body where id = params.id
  return successResponse(updated row)
```

**`src/app/api/v1/documents/upload/route.ts`**
```
POST handler (multipart/form-data):
  supabase = await createServerClient()
  user = await requireUser(supabase)

  formData = await req.formData()
  file      = formData.get('file')
  requestId = formData.get('request_id')
  docType   = formData.get('doc_type')

  if any missing: return validationErrorResponse(...)

  storagePath = `${user.id}/${requestId}/${file.name}`

  { error: storageError } = await supabase.storage
    .from('customer-documents')
    .upload(storagePath, file)

  if storageError: return errorResponse(storageError)  // do NOT insert DB row

  publicUrl = supabase.storage.from('customer-documents').getPublicUrl(storagePath)

  INSERT into TABLES.customerDocuments:
    customer_id = profile.id
    request_id  = requestId
    doc_type    = docType
    file_url    = publicUrl
    file_name   = file.name
    file_size   = file.size
    mime_type   = file.type
    status      = 'uploaded'

  return createdResponse(inserted row)
```

**`src/app/api/v1/documents/[id]/route.ts`**
```
DELETE handler:
  supabase = await createServerClient()
  user = await requireUser(supabase)
  profile = query TABLES.profiles where user_id = user.id

  fetch = SELECT customer_documents where id = params.id AND customer_id = profile.id
  if not found: return notFoundResponse('Document')

  storagePath = extract path from file_url
  supabase.storage.from('customer-documents').remove([storagePath])
  DELETE from TABLES.customerDocuments where id = params.id

  return noContentResponse()
```

---

### Layer 2 — Modify Existing API Routes

**`src/app/api/v1/bookings/my/route.ts`** — add auth + Supabase query

```
Changes:
  - Remove: import { MOCK_MY_BOOKINGS }
  - Add:    import { createServerClient } from '@/lib/supabase/server'
  - Add:    import { requireUser } from '@/lib/api/server-utils'
  - Add:    import { successResponse, errorResponse } from '@/lib/api/response'
  - Add:    import { TABLES } from '@/lib/db/schema'
  - Wrap in try/catch
  - supabase = await createServerClient()
  - user     = await requireUser(supabase)
  - Base query: travel_requests where client_user_id = user.id
  - Add status/vertical filters at DB level (not post-fetch)
  - Left join detail table based on vertical column:
      flight → flight_booking_details
      hotel  → hotel_booking_details
      visa   → visa_booking_details
      trip   → trip_booking_details
  - Apply range for pagination
  - return successResponse(data, undefined, meta)
```

**`src/app/api/travel-requests/route.ts`** — proxy to v1 route

```
Changes:
  - Replace POST handler body with a fetch() proxy:
      response = await fetch(`${origin}/api/v1/travel-requests`, {
        method: 'POST',
        headers: { cookie: req.headers.get('cookie') ?? '' },
        body: req.body,
      })
      return new Response(response.body, { status: response.status, headers: response.headers })
  - No new business logic in this file
```

---

### Layer 3 — portalService (populate)

**`src/modules/portal/services/portalService.ts`**

```ts
// Full typed service — each method uses createServerClient() internally
// Methods are called by API route handlers, never by client components

export const portalService = {
  async getDashboard(userId: string): Promise<DashboardResponse>
  async getRequests(
    userId: string,
    opts: { status?: string; page: number; limit: number }
  ): Promise<{ data: RequestResponse[]; total: number }>
  async getRequestById(
    requestId: string,
    userId: string
  ): Promise<RequestDetailResponse | null>
  async createRequest(
    userId: string,
    body: CreateRequestBody
  ): Promise<RequestResponse>
  async getNotifications(
    profileId: string,
    unreadOnly: boolean
  ): Promise<NotificationResponse[]>
  async markNotificationRead(notifId: string, profileId: string): Promise<void>
  async markAllNotificationsRead(profileId: string): Promise<void>
}
```

Implementation constraints:
- Every method calls `createServerClient()` internally (does not receive a
  client as a parameter) because methods may be called from multiple routes
- Every table reference uses `TABLES.*`
- Every Supabase error is re-thrown as a typed `AppError` subclass
- Every query includes a `client_user_id` or `customer_id` equality filter

---

### Layer 4 — Portal Hooks (swap fetch target)

**`usePortalDashboard.ts`**

```
Changes:
  - Add useState for data (DashboardResponse | null), isLoading, error
  - Add useEffect that calls fetch('/api/v1/portal/dashboard')
    → on success: setData(json.data), setIsLoading(false)
    → on error:   setError(message), setIsLoading(false)
  - refresh = useCallback that re-runs the fetch()
  - Remove: import MOCK_DASHBOARD, MOCK_REQUESTS
  - Const [isLoading] = useState(false) → useState(true) initial value
```

**`useRequests.ts`**

```
Changes:
  - Remove module-level: let _requests = [...MOCK_REQUESTS]
  - Add useEffect that fetches '/api/v1/travel-requests' with
    status_filter/page/limit params
  - createRequest:
      1. POST to '/api/v1/travel-requests'
      2. Optimistically prepend a placeholder to local state BEFORE await
      3. On success: replace placeholder with returned record
      4. On failure: revert (remove the placeholder)
  - updateRequest:
      PUT to '/api/v1/travel-requests/[id]'
      Optimistically update local state, revert on failure
  - refresh: re-fetches from API with current options (not resets to _requests)
  - Remove: import MOCK_REQUESTS, MOCK_DOCUMENTS
  - Preserve all return field names and types
```

**`useDocuments.ts`**

```
Changes:
  - Remove module-level: let _documents = [...MOCK_DOCUMENTS]
  - uploadDocument:
      1. Build FormData: append file, request_id, doc_type
      2. POST to '/api/v1/documents/upload' with body: formData
      3. Remove: URL.createObjectURL, setTimeout simulation
      4. On success: return json.data (DocumentResponse)
      5. On failure: setError(message), rethrow
  - deleteDocument:
      DELETE '/api/v1/documents/[docId]'
      Remove from local state on success
  - Remove: import MOCK_DOCUMENTS
  - Preserve: isUploading, error, clearError return fields
```

**`useNotifications.ts`**

```
Changes:
  - Remove module-level: let _notifications = [...MOCK_NOTIFICATIONS]
  - Add useEffect on mount:
      1. fetch('/api/v1/portal/notifications?unread_only=' + unread_only)
         → setNotifications(data), setTotal, setUnreadCount
      2. Subscribe to Supabase Realtime channel:
           supabase = createClient()   ← browser singleton, NOT server client
           channel = supabase
             .channel('portal_notifications:' + userId)
             .on('postgres_changes', {
               event:  'INSERT',
               schema: 'public',
               table:  'portal_notifications',
               filter: `customer_id=eq.${profileId}`,
             }, (payload) => pushNotification(payload.new as NotificationResponse))
             .subscribe()
  - Add cleanup in useEffect return:
      return () => { supabase.removeChannel(channel) }
  - Channel error: catch subscription errors, log them, do NOT throw
    (requirement 3.6)
  - markRead:
      PATCH '/api/v1/portal/notifications/[id]/read'
      Optimistically set is_read = true, revert on failure
  - markAllRead:
      POST '/api/v1/portal/notifications/read-all'
      Optimistically mark all as read, revert on failure
  - Remove: import MOCK_NOTIFICATIONS
  - Preserve: pushNotification(), notifications, total, unreadCount, error
    return fields (required by existing callers)
```

---

## Testing Strategy

### Validation Approach

Testing follows two phases: first surface counterexamples on the current
(unfixed) code to confirm the root causes, then verify the fix and run
preservation checks across all unaffected code paths.

### Exploratory Bug Condition Checking

**Goal**: Confirm that the mock layer is the only source of data and that auth
is absent — before writing a single line of fix code.

**Test Plan**: Write integration tests that send real HTTP requests (with and
without auth cookies) to each affected route and assert on the response shape.
Run these against the unfixed code.

**Test Cases**:

1. **Unauthenticated bookings/my**: `GET /api/v1/bookings/my` without a
   session cookie → expect 200 with `MOCK_MY_BOOKINGS` data on unfixed code
   (demonstrates missing auth guard)

2. **Dashboard returns mock shape**: `GET /api/v1/portal/dashboard` → expect
   404 on unfixed code (route does not exist yet)

3. **Request create ignores user**: `POST /api/travel-requests` with any body
   → expect `customer_id: "mock-user-001"` in the response on unfixed code

4. **Notification mark-read is ephemeral**: `PATCH` a notification as read,
   then re-fetch → still appears as unread on unfixed code

**Expected Counterexamples**:
- Routes return mock data regardless of which user is authenticated
- Auth is not checked; unauthenticated requests succeed
- State mutations are lost across requests (module-scope arrays reset on redeploy)

### Fix Checking

**Goal**: Verify Property 1 — every portal data read is scoped to the
authenticated user and backed by Supabase.

```
FOR ALL request WHERE isBugCondition(module_under_test) DO
  response := callFixedRoute(request, authenticatedUser)
  ASSERT response.success = true
  ASSERT response.data is scoped to authenticatedUser.id
  ASSERT no MOCK_* field values appear in response.data
END FOR
```

### Preservation Checking

**Goal**: Verify Properties 2 and 3 — interfaces are unchanged, unauthenticated
calls return 401.

```
FOR ALL consumer WHERE NOT isBugCondition(consumer) DO
  ASSERT hookReturnShape(fixed) = hookReturnShape(original)
  ASSERT apiResponseShape(fixed) = apiResponseShape(original)
END FOR

FOR ALL unauthenticated_request TO portal_routes DO
  ASSERT response.status = 401
END FOR
```

**Testing Approach**: Property-based testing is well-suited to preservation
checking here because the hook return shapes have many fields and the
preservation invariant must hold across all possible user IDs, request IDs,
and filter combinations.

### Unit Tests

- `portalService.getDashboard(userId)` returns correct count aggregations for
  a seeded dataset
- `portalService.getRequests` applies pagination math correctly (off-by-one
  edge: page 1 limit 10 returns rows 0–9, page 2 returns rows 10–19)
- `portalService.markNotificationRead` returns not-found when `customer_id`
  doesn't match, never when only `id` matches (ownership enforcement)
- Document upload route: validation path returns 400 when `file`, `request_id`,
  or `doc_type` is missing
- Document upload route: DB insert is skipped when Storage upload fails
- Travel request PUT: returns 409 when `booking_status != 'pending'`
- Travel request GET (list): `status` param validation rejects unknown values

### Property-Based Tests

- **Hook shape preservation**: For any randomly generated `DashboardResponse`
  value returned by the API, the shape returned by `usePortalDashboard` after
  the fetch settles must have the same keys and types as the mock-era interface
- **Pagination invariant**: For any `total` count T, any `page` P, and any
  `limit` L > 0, `total_pages = ceil(T / L)` and the returned slice length ≤ L
- **Optimistic update revert**: For `useRequests.createRequest`, if the POST
  returns a non-2xx status, the local `requests` array must equal its pre-call
  state (length and contents identical)
- **Notification scoping**: For any two distinct profile IDs A and B, a
  notification inserted for A must never appear in the result of
  `getNotifications(B, false)`

### Integration Tests

- Full portal session: authenticate → load dashboard → create travel request →
  verify it appears in request list with correct `client_user_id`
- Realtime flow: insert a row directly into `portal_notifications` for user A →
  verify `useNotifications` hook state updates without a manual `refresh()` call
- Cross-user isolation: authenticate as user A, fetch `GET /api/v1/travel-requests`
  → verify no rows belonging to user B appear
- Document lifecycle: upload → storage key exists + DB row exists → delete →
  storage key removed + DB row gone
- Legacy proxy: `POST /api/travel-requests` with auth cookie → verify record
  appears in `GET /api/v1/travel-requests` (proxy is transparent)
