# 🗺️ Project Map & Architecture Guide (V2 - Verified)

## 🏗️ Core Architecture
Hybrid Modular Pattern (Transitioning from legacy `lib` to `modules`).

This is a **Next.js 14 (App Router)** project with **Supabase** for database & auth.
Route Handlers live in `src/app/api/`, pages in `src/app/`, and all business logic in `src/modules/`.

## 📂 Key Directories

| Path | Purpose |
|------|---------|
| `src/modules/` | **Priority.** Domain logic: Auth, Portal, Admin, Travel, Visa, CMS, Notifications |
| `src/app/api/v1/` | Modern API layer (flights, hotels, visas, trips, bookings, payments) |
| `src/app/api/admin/` | Admin-only API endpoints |
| `src/lib/supabase/` | Supabase client factories (client / server / middleware / auth) |
| `src/lib/api/` | Shared API utilities: response helpers, error classes, auth guards |
| `src/lib/db/schema.ts` | **Source of Truth** for table names — use `TABLES` constant always |
| `src/lib/validations/` | Zod schemas per domain (flights / hotels / visas / trips / payments) |
| `src/types/database.ts` | Auto-generated Supabase types — **never edit manually** |
| `src/types/api.ts` | Shared API request/response types (BookingRequest, BookingResponse…) |
| `supabase/migrations/` | DB history. Current state = `115_final_schema_sync.sql` |

## ⚠️ Red Zones — Deprecated / Conflict

| File / Path | Problem | Correct Alternative |
|-------------|---------|---------------------|
| `src/lib/supabase.ts` (single file) | Deprecated root-level client | `src/lib/supabase/client.ts` or `server.ts` |
| `src/lib/api/supabase-server.ts` | Duplicate client — wraps the real one | `src/lib/supabase/server.ts` → `createServerClient()` |
| `src/lib/api/server-utils.ts` — `successResponse` / `errorResponse` | **CONFLICT:** Duplicate, simpler version of response helpers | Use `src/lib/api/response.ts` instead |
| `src/lib/portal-api/` | Deprecated portal API layer | `src/modules/portal/services/portalService.ts` |
| `src/app/login/` and `src/app/signup/` | Deprecated standalone routes | `src/app/(auth)/login/` and `src/app/(auth)/register/` |

> **Rule:** `src/lib/api/server-utils.ts` is only valid for its auth-guard helpers:
> `requireUser()`, `requireStaff()`, `requireOwnerOrStaff()`, `requireCompleteProfile()`.
> Never use its `successResponse` / `errorResponse` — use `response.ts` instead.

## 🔄 Identity & DB Relationships

```
auth.users.id (UUID)
      ↕  (via profiles.user_id)
profiles.user_id  ← link to auth
profiles.id       ← internal PK used in customer_requests / leads
```

## 🗺️ Module Map

| Module | Path | What it owns |
|--------|------|-------------|
| `admin` | `src/modules/admin/` | CRM status pill, notification dropdown, admin-auth service |
| `auth` | `src/modules/auth/` | LoginForm, SignupForm, AuthGuard, Supabase auth client |
| `portal` | `src/modules/portal/` | RequestCard, DocumentUploader, NotificationBell, portal hooks & realtime |
| `travel` | `src/modules/travel/` | travel-requests-service, travel-endpoints |
| `visa` | `src/modules/visa/` | visa-endpoints, document-upload-service |
| `cms` | `src/modules/cms/` | use-cms-content hook |
| `notifications` | `src/modules/notifications/` | notifications store |
| `hotel-booking` | `src/modules/hotel-booking/` | hotel booking entry point |
