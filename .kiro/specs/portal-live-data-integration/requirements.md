# Requirements Document

## Introduction

The Spanker travel platform portal is currently running entirely on mock data. Every customer-facing hook (`usePortalDashboard`, `useRequests`, `useDocuments`, `useNotifications`), every portal API route, and the `portalService` module all operate against in-memory fixtures that reset on server restart and carry no real user context. This means customers see fabricated data, uploads are lost immediately, notifications are never persisted, and travel requests created in the UI never reach the database.

This feature replaces all mock-backed logic with real Supabase integration across the full portal stack: API routes, portal hooks, the service layer, document storage, real-time notifications, and consistent API versioning under `/api/v1/portal/`.

---

## Requirements

### 1. Portal Dashboard — Live Data

**1.1** WHEN an authenticated customer requests the portal dashboard (`GET /api/v1/portal/dashboard`), the system SHALL compute and return aggregated stats derived from live Supabase data scoped to `auth.users.id` of the requesting user, including total requests, active requests, completed requests, document counts by status, unread notification count, and the five most recent travel requests.

**1.2** WHEN the dashboard endpoint receives a request without a valid session cookie, the system SHALL return HTTP 401 using `unauthorizedResponse()`.

**1.3** WHEN the `usePortalDashboard` hook is mounted in a client component, the system SHALL call `GET /api/v1/portal/dashboard` instead of returning hardcoded `MOCK_DASHBOARD`, and SHALL expose `isLoading: true` while the request is in-flight.

**1.4** WHEN the dashboard API query against Supabase fails with an error, the system SHALL return HTTP 500 via `errorResponse(err)` and the hook SHALL expose the error message through its `error` state so the UI can render an error boundary.

**1.5** WHEN a customer's dashboard data changes (e.g., a new travel request is confirmed), calling `refresh()` on `usePortalDashboard` SHALL re-fetch live data from the API rather than being a no-op.

---

### 2. Travel Requests — Persistence and Retrieval

**2.1** WHEN an authenticated customer submits a new travel request (`POST /api/v1/travel-requests`), the system SHALL insert a row into `travel_requests` (via `TABLES.travelRequests`) with `client_user_id` set to the authenticated user's `auth.users.id`, and SHALL return the created record via `createdResponse()`.

**2.2** WHEN a request is submitted by an unauthenticated caller, the system SHALL reject it with HTTP 401 via `requireUser(supabase)` before touching the database.

**2.3** WHEN an authenticated customer requests their request list (`GET /api/v1/travel-requests`), the system SHALL query `travel_requests` filtered by `client_user_id = auth.users.id` and SHALL support optional query parameters `status`, `page` (default 1), and `limit` (default 10), returning paginated results with a `meta` object containing `page`, `limit`, `total`, and `total_pages`.

**2.4** WHEN the `status` filter parameter is provided but does not match a valid `RequestStatus` value, the system SHALL return HTTP 400 via `validationErrorResponse()`.

**2.5** WHEN an authenticated customer requests a single travel request by ID (`GET /api/v1/travel-requests/[id]`), the system SHALL join the request with its `portal_status_log` entries and `customer_documents` for that request, and return the combined record. If the request does not belong to the authenticated user, the system SHALL return HTTP 404 via `notFoundResponse()` (never HTTP 403, to avoid leaking existence).

**2.6** WHEN an authenticated customer updates a travel request (`PUT /api/v1/travel-requests/[id]`), the system SHALL only permit updates while `booking_status` is `pending` and SHALL reject modifications to confirmed or cancelled requests with HTTP 409.

**2.7** WHEN the `useRequests` hook calls `createRequest()`, the system SHALL POST to `/api/v1/travel-requests` and optimistically prepend the returned record to local state before the response arrives, reverting on failure.

**2.8** WHEN the `useRequests` hook calls `refresh()`, the system SHALL re-fetch from `/api/v1/travel-requests` with current filter options rather than resetting to the in-memory `_requests` array.

---

### 3. Notifications — Live System

**3.1** WHEN an authenticated customer requests their notifications (`GET /api/v1/portal/notifications`), the system SHALL query `portal_notifications` filtered by the user's profile ID, ordered by `created_at` descending, and SHALL support an optional `unread_only=true` query parameter.

**3.2** WHEN the notifications list endpoint receives an unauthenticated request, the system SHALL return HTTP 401.

**3.3** WHEN an authenticated customer marks a notification as read (`PATCH /api/v1/portal/notifications/[id]/read`), the system SHALL update `is_read = true` in `portal_notifications` only if the notification belongs to the requesting user, returning HTTP 404 if it does not.

**3.4** WHEN an authenticated customer marks all notifications as read (`POST /api/v1/portal/notifications/read-all`), the system SHALL bulk-update all unread rows in `portal_notifications` where `customer_id` matches the user's profile ID.

**3.5** WHEN the `useNotifications` hook is mounted, the system SHALL subscribe to a Supabase Realtime channel on `portal_notifications` filtered by the current user's profile ID (`postgres_changes` event `INSERT`), and SHALL call `pushNotification()` on each incoming event so the UI updates without a manual refresh.

**3.6** WHEN the Realtime channel subscription fails or drops, the system SHALL NOT crash the hook — it SHALL log the error and continue operating with the last-fetched data.

**3.7** WHEN the `useNotifications` hook is unmounted, the system SHALL call `supabase.channel(...).unsubscribe()` to clean up the Realtime subscription and prevent memory leaks.

**3.8** WHEN the `markRead` or `markAllRead` functions are called on the hook, the system SHALL call the corresponding API endpoint and update local state optimistically, reverting if the request fails.

---

### 4. Document Upload — Supabase Storage

**4.1** WHEN an authenticated customer uploads a document (`POST /api/v1/documents/upload`), the system SHALL upload the file binary to Supabase Storage in the `customer-documents` bucket under the path `{user_id}/{request_id}/{filename}`, and SHALL insert a corresponding row in `customer_documents` with the public storage URL, file metadata, and `status = 'uploaded'`.

**4.2** WHEN the upload request is missing required fields (`request_id`, `doc_type`, or the file itself), the system SHALL return HTTP 400 via `validationErrorResponse()` without attempting any storage write.

**4.3** WHEN the Supabase Storage upload fails (e.g., bucket permission error, size limit exceeded), the system SHALL NOT insert a row in `customer_documents`, SHALL return HTTP 500 via `errorResponse()`, and SHALL surface the error to the `useDocuments` hook's `error` state.

**4.4** WHEN an authenticated customer deletes a document (`DELETE /api/v1/documents/[id]`), the system SHALL remove the file from Supabase Storage AND delete the corresponding `customer_documents` row in a single logical operation. If the document does not belong to the requesting user, the system SHALL return HTTP 404.

**4.5** WHEN the `useDocuments` hook calls `uploadDocument()`, the system SHALL POST a `multipart/form-data` request to `/api/v1/documents/upload` rather than using `URL.createObjectURL`, and SHALL expose `isUploading: true` while the request is in-flight.

**4.6** WHEN the `useDocuments` hook calls `deleteDocument()`, the system SHALL call `DELETE /api/v1/documents/[id]` and remove the document from local state on success.

---

### 5. My Bookings — Authenticated User Scope

**5.1** WHEN an authenticated customer calls `GET /api/v1/bookings/my`, the system SHALL query `travel_requests` filtered by `client_user_id = auth.users.id` (scoped to the requesting user) instead of returning `MOCK_MY_BOOKINGS` shared across all callers.

**5.2** WHEN an unauthenticated caller hits `GET /api/v1/bookings/my`, the system SHALL return HTTP 401 via `requireUser(supabase)`.

**5.3** WHEN the bookings query returns results, the system SHALL join each `travel_requests` row with its appropriate detail table (`flight_booking_details`, `hotel_booking_details`, `visa_booking_details`, or `trip_booking_details`) based on the `vertical` column, so the response includes booking-specific fields (e.g., flight number, hotel name).

**5.4** WHEN the `status` or `vertical` filter parameters are provided, the system SHALL apply them at the database level (not in-memory post-fetch) so pagination counts are accurate.

---

### 6. Portal Service Layer

**6.1** WHEN any portal API route needs to query or mutate travel request data, the system SHALL delegate to a method on `portalService` (in `src/modules/portal/services/portalService.ts`) rather than inline Supabase calls — `portalService` SHALL be the single point of contact between portal routes and the database for travel request operations.

**6.2** WHEN `portalService` methods execute Supabase queries, they SHALL use `TABLES.*` constants for all table names, and SHALL throw typed `AppError` subclasses on failure rather than returning raw Supabase error objects.

**6.3** WHEN a `portalService` method builds a query that could return data belonging to other users, it SHALL always include a `client_user_id` or `customer_id` equality filter matching the authenticated user's ID, enforcing application-level scoping in addition to database RLS policies.

**6.4** WHEN portal hooks (`useRequests`, `useNotifications`, `useDocuments`, `usePortalDashboard`) need to interact with data, they SHALL call the portal API routes (`/api/v1/portal/*`, `/api/v1/travel-requests/*`, `/api/v1/documents/*`) rather than calling `portalService` directly, keeping server-only logic out of client components.

---

### 7. API Versioning Standardization

**7.1** WHEN any portal-related API route is created or migrated, the system SHALL place it under `/api/v1/portal/` (for notifications and dashboard) or `/api/v1/travel-requests/` (for request CRUD) or `/api/v1/documents/` (for document operations), consolidating all portal endpoints under the `/api/v1/` prefix.

**7.2** WHEN the legacy routes `POST /api/travel-requests` and `GET|PATCH /api/profile` continue to exist in the codebase, the system SHALL redirect or proxy them to the `/api/v1/` equivalents, and they SHALL NOT contain new business logic.

**7.3** WHEN `GET /api/admin/notifications` and `POST /api/admin/notifications/[id]/read` are requested, the system SHALL return a non-501 response — these SHALL either be implemented at `/api/admin/notifications/` using `requireStaff(supabase)` or removed entirely, and SHALL NOT return 501 in production.

**7.4** WHEN any new portal route is created, it SHALL follow the standard route handler pattern: `createServerClient()` → `requireUser(supabase)` → Supabase query → `successResponse()` / `errorResponse()` → wrapped in try/catch.

---

### 8. Error Handling and Loading States

**8.1** WHEN any portal hook (`usePortalDashboard`, `useRequests`, `useDocuments`, `useNotifications`) initiates a data fetch or mutation, the system SHALL set an `isLoading` state variable to `true` for the duration of the operation and reset it to `false` in a `finally` block regardless of success or failure.

**8.2** WHEN a portal hook receives an error response from its API call, the system SHALL store the error message in the hook's `error` state so the consuming component can conditionally render an error message or retry UI.

**8.3** WHEN a portal hook's `error` state is non-null, calling the hook's `clearError()` function SHALL reset `error` to `null`.

**8.4** WHEN a portal hook fetch fails due to a network error or non-2xx HTTP response, the system SHALL NOT leave the hook's data state in an intermediate or partially-updated condition — it SHALL retain the last successfully fetched data while exposing the error.

**8.5** WHEN a portal hook is used inside a React Server Component boundary, the system SHALL ensure that any client-side error thrown during data fetching is caught by the nearest `error.tsx` boundary rather than crashing the entire page tree.

**8.6** WHEN an API route handler encounters an unexpected error, the system SHALL log the error server-side and return a sanitized HTTP 500 response via `errorResponse(err as Error)` that does not expose internal stack traces or database details to the client.

---

## Glossary

| Term | Definition |
|------|------------|
| Portal | The customer-facing section of the Spanker platform where users manage travel requests, documents, and notifications |
| Mock data | In-memory fixtures defined in `src/lib/mock/data.ts` used during development before live Supabase integration |
| `portalService` | The server-side service object in `src/modules/portal/services/portalService.ts` that encapsulates all Supabase queries for portal operations |
| RLS | Row Level Security — Supabase database policies that restrict which rows a given authenticated user can read or write |
| `TABLES` | A constants object imported from `src/lib/db/schema.ts` used to reference table names without hardcoded strings |
| Supabase Realtime | A Supabase feature that streams database change events (INSERT, UPDATE, DELETE) to subscribed clients over WebSocket |
| `requireUser(supabase)` | An auth guard from `src/lib/api/server-utils.ts` that throws `AuthenticationError` (HTTP 401) if no valid session exists |
| Vertical | The booking category: `flight`, `hotel`, `visa`, or `trip` |
| Travel request | A row in `travel_requests` representing a customer's intent to book a service — master record that links to vertical-specific detail tables |
| `AppError` | Base error class from `src/lib/api/errors.ts` with HTTP status code and typed error code; subclasses include `ValidationError`, `NotFoundError`, `AuthorizationError` |
