# CMS Dashboard — Technical Structure Document

**Project:** Athar Travel Agency — Admin Control Panel  
**Stack:** Next.js 16 · Supabase · FastAPI (CRM backend) · Tailwind CSS v4 · shadcn/ui  
**Deployment:** Vercel (serverless) + Supabase hosted DB + FastAPI on Railway/Render  
**Auth model:** Role-based — `admin` | `staff` | `customer` (stored in `profiles.role`)

---

## Overview

The dashboard is a **single-tenant admin CMS** mounted at `/admin/*`. It manages all content and operations for the travel agency: visa services, trip packages, hotel listings, offers, leads/bookings, customer records, financial transactions, CRM synchronisation, and site content (banners, home sections).

The build is split into **10 implementation phases**: phases 1–5 cover backend (APIs, DB, business logic); phases 6–10 cover frontend (pages, components, UI).

---

## Deployment Notes (Vercel)

- All `/api/*` routes are serverless functions — no persistent memory.
- Long-running jobs (CRM sync, document processing) must use Supabase edge functions or external queues, not serverless handlers.
- Environment variables required on Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BACKEND_INTERNAL_URL` (FastAPI base URL)
  - `CRM_WEBHOOK_SECRET`
  - `SYNC_PROCESSOR_SECRET`
- Static assets (banner images, package images) → Supabase Storage, not Vercel blob (avoid cold-start size limits).
- All admin routes must enforce role check server-side; do not rely on client-side redirect only.

---

## Database Schema (Existing + Extended)

### Existing Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles — `admin`, `staff`, `customer` roles |
| `travel_requests` | Customer travel/visa requests with document checklist |
| `document_requirements` | Per-country, per-travel-type required documents |
| `customer_documents` | Uploaded files per travel request |
| `customer_communications` | Email/WhatsApp/SMS/call log per request |
| `trip_packages` | Travel packages shown on site |
| `content_banners` | Hero/secondary/footer banners |
| `system_logs` | Audit log for all system events |
| `users` | CRM base user table with lifecycle status |
| `visa_applications` | Visa apps with state machine |
| `quotations` | Price quotes with state machine |
| `bookings` | Confirmed bookings |
| `financial_transactions` | Payment records per booking |
| `state_machine_events` | Full audit trail of all FSM transitions |
| `crm_notifications` | In-app + email notifications |

### New Tables Required (Phases 1–5)

#### `visa_types`
Manages visa product catalog per country. Replaces hardcoded price lists.

```sql
CREATE TABLE public.visa_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,              -- 'AE', 'TR', 'HU', etc.
  country_name TEXT NOT NULL,
  visa_name TEXT NOT NULL,                 -- 'تأشيرة شهر VIP'
  duration_days INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'vip', 'standard', 'urgent', 'multi_entry', 'extension'
  )),
  profession_tier TEXT CHECK (profession_tier IN (
    'high', 'medium', 'weak', 'none'
  )),
  price NUMERIC(12,2) NOT NULL,
  deposit_amount NUMERIC(12,2) DEFAULT 0,  -- مبلغ التأمين المسترد
  child_price NUMERIC(12,2),
  processing_days INTEGER NOT NULL DEFAULT 3,
  is_urgent_available BOOLEAN DEFAULT FALSE,
  urgent_price NUMERIC(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `hotels`
Hotel catalog with full metadata.

```sql
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  google_maps_url TEXT,
  amenities JSONB DEFAULT '[]',            -- ['pool','wifi','gym','parking','restaurant','airport_transfer']
  check_in_time TEXT,
  check_out_time TEXT,
  cancellation_policy TEXT,
  booking_conditions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  cover_image TEXT,
  images JSONB DEFAULT '[]',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `hotel_rooms`
Room types per hotel.

```sql
CREATE TABLE public.hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,                 -- 'standard', 'deluxe', 'suite'
  board_type TEXT NOT NULL CHECK (board_type IN (
    'room_only', 'bed_breakfast', 'half_board', 'full_board'
  )),
  price_per_night NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  max_occupancy INTEGER DEFAULT 2,
  description TEXT,
  images JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `offers`
Special offers / promotional listings.

```sql
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN (
    'flight', 'hotel', 'visa', 'package'
  )),
  destination TEXT NOT NULL,
  original_price NUMERIC(12,2),
  discounted_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  currency TEXT DEFAULT 'EGP',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT,
  terms_and_conditions TEXT,
  images JSONB DEFAULT '[]',
  available_slots INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `visa_document_requirements`
Dynamic per-country document requirements (replaces hardcoded checklist).

```sql
CREATE TABLE public.visa_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  visa_type_id UUID REFERENCES public.visa_types(id) ON DELETE CASCADE,
  document_key TEXT NOT NULL,              -- 'passport_copy', 'bank_statement', etc.
  document_label TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  conditions JSONB DEFAULT '{}',           -- e.g. { "min_validity_months": 6 }
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Existing API Inventory

| Method | Route | Status | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Live | Proxy to FastAPI login |
| `POST` | `/api/auth/signup` | Live | Proxy to FastAPI signup |
| `GET` | `/api/profile` | Live | Get authenticated user profile |
| `PATCH` | `/api/profile` | Live | Update profile fields |
| `POST` | `/api/travel-requests` | Live | Create travel request |
| `GET` | `/api/travel-requests/my-requests` | Live | Customer's own requests |
| `POST` | `/api/travel-requests/upload-document` | Live | Upload document for request |
| `GET` | `/api/visa/my-applications` | Live | Customer's visa apps (proxies FastAPI) |
| `GET` | `/api/payments/my-payments` | Live | Customer's payments (proxies FastAPI) |
| `GET` | `/api/admin/customers` | Live | All customers with stats |
| `GET/PATCH` | `/api/admin/customers/[id]` | Partial | Single customer detail |
| `POST` | `/api/webhooks/crm` | Live | Receive CRM status updates (HMAC secured) |
| `GET/POST` | `/api/sync` | Live | Trigger sync queue (key secured) |
| `GET` | `/api/design-tokens` | Live | Design system tokens |

---

## Phase Breakdown

---

### Phase 1 — Database Migrations & Core Admin APIs

**Goal:** Extend the DB schema with new tables and build CRUD APIs for visa types, hotels, and offers.

#### Tasks

1. Run migrations for `visa_types`, `hotels`, `hotel_rooms`, `offers`, `visa_document_requirements`.
2. Add RLS policies: public read for active records; admin/staff full access.
3. Implement `GET/POST /api/admin/visa-types` — list and create visa type products.
4. Implement `GET/PATCH/DELETE /api/admin/visa-types/[id]` — manage individual visa type.
5. Implement `GET/POST /api/admin/hotels` — list and create hotels.
6. Implement `GET/PATCH/DELETE /api/admin/hotels/[id]` — manage individual hotel.
7. Implement `POST /api/admin/hotels/[id]/rooms` + `DELETE /api/admin/hotels/[id]/rooms/[roomId]` — manage hotel rooms.
8. Implement `GET/POST /api/admin/offers` — list and create offers.
9. Implement `GET/PATCH/DELETE /api/admin/offers/[id]` — manage individual offer.
10. Implement `GET/POST /api/admin/visa-documents` — manage document requirements per country/visa type.
11. All responses follow `{ success: boolean, data: T, error?: string }` shape.
12. All write operations log to `system_logs` via `log_system_event()`.

#### API Contracts

```
GET    /api/admin/visa-types?country=AE&active=true
POST   /api/admin/visa-types         body: { country_code, country_name, visa_name, duration_days, category, price, ... }
PATCH  /api/admin/visa-types/[id]    body: partial VisaType fields
DELETE /api/admin/visa-types/[id]

GET    /api/admin/hotels?country=AE&active=true
POST   /api/admin/hotels             body: { name, stars, country, city, address, ... }
PATCH  /api/admin/hotels/[id]
DELETE /api/admin/hotels/[id]
POST   /api/admin/hotels/[id]/rooms  body: { room_type, board_type, price_per_night, ... }
DELETE /api/admin/hotels/[id]/rooms/[roomId]

GET    /api/admin/offers?type=visa&active=true
POST   /api/admin/offers             body: { title, offer_type, destination, discounted_price, ... }
PATCH  /api/admin/offers/[id]
DELETE /api/admin/offers/[id]

GET    /api/admin/visa-documents?country=AE&visa_type_id=UUID
POST   /api/admin/visa-documents     body: { country_code, visa_type_id, document_key, document_label, is_required }
DELETE /api/admin/visa-documents/[id]
```

---

### Phase 2 — Leads & Travel Requests Admin APIs

**Goal:** Build the full admin-side API surface for managing customer travel requests and visa applications.

#### Tasks

1. Implement `GET /api/admin/leads` — paginated list of all travel requests with client info, status, CRM sync state. Supports filters: `status`, `country`, `travel_type`, `assigned_staff`, `date_from`, `date_to`, search by name/tracking ID.
2. Implement `GET /api/admin/leads/[id]` — single travel request with full document checklist, communication log, and linked visa application.
3. Implement `PATCH /api/admin/leads/[id]/status` — update request status with FSM validation (enforces `ALLOWED_PORTAL_TRANSITIONS`). Logs to `state_machine_events`.
4. Implement `PATCH /api/admin/leads/[id]/assign` — assign staff member to a request.
5. Implement `POST /api/admin/leads/[id]/note` — add staff note to a request.
6. Implement `GET /api/admin/leads/[id]/documents` — list all customer documents for a request.
7. Implement `PATCH /api/admin/leads/[id]/documents/[docId]` — approve or reject a document with optional rejection reason.
8. Implement `POST /api/admin/leads/[id]/communicate` — log a communication (email/WhatsApp/call/SMS) against a request.
9. Implement `POST /api/admin/leads/[id]/sync-crm` — push the lead to FastAPI CRM (`BACKEND_INTERNAL_URL/visa/applications`). Mark `crm_synced = true` on success.

#### API Contracts

```
GET    /api/admin/leads?status=pending_documents&page=1&limit=20
GET    /api/admin/leads/[id]
PATCH  /api/admin/leads/[id]/status       body: { status: PortalStatus }
PATCH  /api/admin/leads/[id]/assign       body: { staff_id: string }
POST   /api/admin/leads/[id]/note         body: { note: string }
GET    /api/admin/leads/[id]/documents
PATCH  /api/admin/leads/[id]/documents/[docId]  body: { status: 'approved'|'rejected', rejection_reason?: string }
POST   /api/admin/leads/[id]/communicate  body: { type: CommunicationType, subject?, message }
POST   /api/admin/leads/[id]/sync-crm
```

---

### Phase 3 — Customers, Quotations & Bookings Admin APIs

**Goal:** Build admin APIs for customer management, quotation lifecycle, and booking management.

#### Tasks

1. Extend `GET /api/admin/customers/[id]` — return full profile, travel history, documents, communications, quotations, bookings, financial transactions.
2. Implement `PATCH /api/admin/customers/[id]` — update customer profile fields.
3. Implement `PATCH /api/admin/customers/[id]/role` — change role between `customer` / `staff` / `admin`. Restricted to `admin` role only.
4. Implement `GET /api/admin/quotations` — list all quotations with status filter.
5. Implement `POST /api/admin/quotations` — create quotation for a customer (wraps `create_quotation()` DB function). Body: `{ user_id, visa_application_id?, items: QuotationItem[], total_amount, currency }`.
6. Implement `POST /api/admin/quotations/[id]/send` — change status to `SENT` (wraps `send_quotation()` DB function).
7. Implement `POST /api/admin/quotations/[id]/convert` — accept quotation and create booking (wraps `accept_quotation_and_create_booking()`).
8. Implement `GET /api/admin/bookings` — list all bookings with status filter.
9. Implement `GET /api/admin/bookings/[id]` — full booking detail with financial transactions.
10. Implement `POST /api/admin/bookings/[id]/payment` — record payment (wraps `record_payment_and_generate_voucher()`). Body: `{ amount_paid, payment_method, receipt_url? }`.
11. Implement `PATCH /api/admin/bookings/[id]/status` — manual status override for edge cases.

#### API Contracts

```
GET    /api/admin/customers/[id]
PATCH  /api/admin/customers/[id]
PATCH  /api/admin/customers/[id]/role     body: { role: 'admin'|'staff'|'customer' }

GET    /api/admin/quotations?status=sent&user_id=UUID
POST   /api/admin/quotations              body: { user_id, visa_application_id?, items, total_amount, currency }
POST   /api/admin/quotations/[id]/send
POST   /api/admin/quotations/[id]/convert

GET    /api/admin/bookings?status=confirmed&page=1
GET    /api/admin/bookings/[id]
POST   /api/admin/bookings/[id]/payment   body: { amount_paid, payment_method, receipt_url? }
PATCH  /api/admin/bookings/[id]/status    body: { status: BookingStatus }
```

---

### Phase 4 — CMS Content APIs (Packages, Banners, Offers, Site Config)

**Goal:** Full CRUD APIs for all site-managed content. All changes reflected live on the public site.

#### Tasks

1. Implement `GET/POST /api/admin/packages` — list all packages; create new package. Supports image upload via Supabase Storage.
2. Implement `GET/PATCH/DELETE /api/admin/packages/[id]` — manage individual package.
3. Implement `PATCH /api/admin/packages/[id]/toggle` — toggle `is_active` without full update.
4. Implement `GET/POST /api/admin/banners` — list all banners; create banner with position control.
5. Implement `PATCH/DELETE /api/admin/banners/[id]` — update or delete banner.
6. Implement `PATCH /api/admin/banners/reorder` — update `display_order` for multiple banners in one request. Body: `{ updates: { id, display_order }[] }`.
7. Implement `GET/POST /api/admin/offers` (if not done in Phase 1 — consolidate here).
8. Implement `POST /api/admin/upload/image` — generic image upload to Supabase Storage. Returns public URL. Accepts multipart/form-data with `bucket` param: `packages`, `banners`, `offers`, `hotels`.
9. Validate file type (jpg, png, webp only), max size 5 MB, sanitise filename.

#### API Contracts

```
GET    /api/admin/packages?active=true&destination=Dubai
POST   /api/admin/packages              body: { title, description, destination, price, currency, duration, features[], images[], is_active }
PATCH  /api/admin/packages/[id]
DELETE /api/admin/packages/[id]
PATCH  /api/admin/packages/[id]/toggle  body: { is_active: boolean }

GET    /api/admin/banners?position=hero
POST   /api/admin/banners               body: { title, subtitle?, image_url, link_url?, position, display_order, is_active, start_date?, end_date? }
PATCH  /api/admin/banners/[id]
DELETE /api/admin/banners/[id]
PATCH  /api/admin/banners/reorder       body: { updates: [{ id, display_order }] }

POST   /api/admin/upload/image          multipart: file, bucket
```

---

### Phase 5 — Analytics, System Logs & Operational APIs

**Goal:** Aggregated stats for the dashboard overview, system health, CRM sync status, and background operation triggers.

#### Tasks

1. Implement `GET /api/admin/stats` — dashboard overview card data:
   - `total_customers` — count of profiles with `role = 'customer'`
   - `leads_this_month` — travel requests created in the current calendar month
   - `pending_leads` — count where `status IN ('pending_documents', 'documents_review')`
   - `active_packages` — count of `trip_packages` where `is_active = true`
   - `active_offers` — count of `offers` where `is_active = true` and not expired
   - `completed_requests` — all-time count where `status = 'completed'`
   - `total_revenue_month` — sum of `financial_transactions.amount_paid` in current month
   - `crm_sync_status` — check if `BACKEND_INTERNAL_URL` is reachable (`'ok'|'error'|'degraded'`)
   - `last_crm_sync` — timestamp of last successful webhook receipt from `system_logs`
   - `pending_documents_count` — documents with `status = 'uploaded'` awaiting review
2. Implement `GET /api/admin/logs` — paginated system log with filters: `level`, `source`, `date_from`, `date_to`. Max 200 records per page.
3. Implement `DELETE /api/admin/logs` — purge logs older than `days` param. Restricted to `admin` role. Soft-safe: requires `?confirm=true` query param.
4. Implement `GET /api/admin/crm/status` — ping FastAPI health endpoint. Returns `{ reachable: boolean, latency_ms: number, version?: string }`.
5. Implement `POST /api/admin/crm/sync-all` — trigger full re-sync of unsynced leads to CRM. Queues via `SYNC_PROCESSOR_SECRET`. Returns job ID.
6. Implement `GET /api/admin/notifications` — list admin/staff notifications from `crm_notifications`, unread first.
7. Implement `PATCH /api/admin/notifications/[id]/read` — mark notification as read.
8. Confirm `POST /api/sync` is secured and operational (already exists — validate env var).
9. Confirm `POST /api/webhooks/crm` HMAC validation works end-to-end with a test payload.

#### API Contracts

```
GET    /api/admin/stats
GET    /api/admin/logs?level=error&source=crm&page=1&limit=50
DELETE /api/admin/logs?days=90&confirm=true

GET    /api/admin/crm/status
POST   /api/admin/crm/sync-all

GET    /api/admin/notifications?unread=true
PATCH  /api/admin/notifications/[id]/read
```

---

### Phase 6 — Dashboard Shell & Navigation

**Goal:** Build the persistent admin shell — sidebar, top bar, mobile nav, role gate — on top of the existing `/admin/layout.tsx`.

#### What to build

The existing layout has a basic sidebar. This phase extends it to support all new sections.

**Sidebar Navigation Structure:**

```
لوحة التحكم          /admin
── إدارة المحتوى
   الباقات والعروض   /admin/packages
   عروض خاصة         /admin/offers
   البانرات          /admin/banners
   التأشيرات         /admin/visas
   الفنادق           /admin/hotels
── إدارة العمليات
   العملاء المحتملون /admin/leads
   العملاء           /admin/customers
   عروض الأسعار      /admin/quotations
   الحجوزات          /admin/bookings
── النظام
   المدفوعات         /admin/payments
   سجل النظام        /admin/logs
   الإعدادات         /admin/settings
```

**Components:**

- `AdminShell` — root layout wrapper. Reads user role. If role is not `admin` or `staff`, redirect to `/`.
- `AdminSidebar` — collapsible sidebar with section grouping. Persists open/closed state in `localStorage`.
- `AdminTopBar` — current page title, user avatar, notification bell with unread count badge, CRM status indicator (green/yellow/red dot).
- `AdminMobileNav` — bottom sheet or drawer for mobile (`< md` breakpoint).
- `NotificationDropdown` — fetches `/api/admin/notifications` on click. Shows last 10, marks read on click.
- `CrmStatusPill` — polls `/api/admin/crm/status` every 60 seconds.

---

### Phase 7 — Visa Management & Hotel Management Pages

**Goal:** Full CRUD UI for the visa product catalog and hotel catalog.

#### Visa Management `/admin/visas`

**Page: Visa Types List**

- Table: country name, visa name, duration, category, price, deposit, urgency available, status toggle.
- Filter bar: country dropdown, category filter, active/inactive toggle.
- Quick actions: activate/deactivate, edit, delete.
- Inline price editor: click a price cell to edit and save without opening a full modal.

**Visa Type Form (modal or side drawer)**

Fields:
- Country (searchable dropdown of supported countries)
- Visa name (Arabic text)
- Duration (days — numeric)
- Category: VIP / Standard / Urgent / Multi-entry / Extension
- Profession tier: High / Medium / Weak / None
- Price (EGP)
- Child price (EGP, optional)
- Deposit amount (EGP, for refundable security deposit)
- Processing days
- Urgent available toggle + urgent price field (conditional)
- Notes (textarea)
- Active toggle

**Document Requirements Sub-section**

Below the visa type table, a collapsible section per country showing the document checklist. Add/remove/reorder documents. Each row: document key, label, required toggle, sort order drag handle.

#### Hotel Management `/admin/hotels`

**Page: Hotels List**

- Card grid (not table) showing hotel cover image, name, stars, city, country, active status.
- Filter: country, city, star rating.
- Add hotel button → opens hotel form.

**Hotel Form (full-page form or large modal)**

Fields: name, star rating (1–5 star picker), country, city, address, Google Maps URL, description, amenities (checkbox group: pool, Wi-Fi, gym, parking, restaurant, airport transfer), check-in/check-out times, cancellation policy, booking conditions, active toggle, cover image upload, gallery upload (multi-file, max 10).

**Hotel Detail Page `/admin/hotels/[id]`**

Shows hotel info + room types table. Room form fields: room type name, board type (Room Only / B&B / Half Board / Full Board), price/night, currency, max occupancy, description, images. Inline add/delete rooms.

---

### Phase 8 — Offers, Packages & Banners Pages

**Goal:** UI for all public-facing content management.

#### Offers Page `/admin/offers`

- Table: title, type badge (flight/hotel/visa/package), destination, original price, discounted price, discount %, dates, slots, status.
- Offer form: all fields from `offers` table. Date pickers for start/end. Image upload. Terms textarea.
- Expiry indicator: highlight rows where `end_date` is within 3 days.

#### Packages Page `/admin/packages`

The existing `/admin/packages/page.tsx` is UI-only with mock data. This phase wires it to the real API.

- Replace `INITIAL_PACKAGES` mock with `GET /api/admin/packages`.
- Form submit calls `POST /api/admin/packages` or `PATCH /api/admin/packages/[id]`.
- Delete calls `DELETE /api/admin/packages/[id]`.
- Toggle calls `PATCH /api/admin/packages/[id]/toggle`.
- Add image upload field via `/api/admin/upload/image`.

#### Banners Page `/admin/banners`

- Three-column layout showing Hero / Secondary / Footer zones visually.
- Within each zone: drag-to-reorder list (uses `/api/admin/banners/reorder`).
- Banner card: thumbnail preview, title, dates, active status toggle, edit/delete.
- Banner form: title, subtitle, image upload, link URL, position selector, date range pickers, display order, active toggle.
- Live preview: when editing a hero banner, show a scaled site-width preview below the form.

---

### Phase 9 — Leads, Customers, Quotations & Bookings Pages

**Goal:** Operational management UI for the full customer lifecycle.

#### Leads Page `/admin/leads`

The existing `/admin/leads/page.tsx` is UI-only with mock data. This phase wires it to the real API.

- Replace mocks with `GET /api/admin/leads` (paginated, 20 per page).
- Status update calls `PATCH /api/admin/leads/[id]/status`.
- CRM sync calls `POST /api/admin/leads/[id]/sync-crm`.
- Detail panel expansion: show document checklist with approve/reject buttons per doc (`PATCH /api/admin/leads/[id]/documents/[docId]`).
- Staff assignment dropdown using profiles list filtered by role `staff`.
- Communication log tab: lists past comms, form to log new communication.
- Timeline view: visual FSM state history from `state_machine_events`.

#### Customers Page `/admin/customers`

Already wired to real API. Extend:

- Customer detail page `/admin/customers/[id]`: tabs for Profile, Requests, Documents, Quotations, Bookings, Payments, Communications.
- Role change UI (admin only): button triggers `PATCH /api/admin/customers/[id]/role` with confirmation modal.

#### Quotations Page `/admin/quotations`

New page. Features:
- Table: customer name, total amount, currency, status badge, created date, valid until, actions.
- Create quotation button → form: customer search (autocomplete from `GET /api/admin/customers`), optional linked visa application, line items (dynamic rows: type, description, amount), total auto-calculated, currency picker.
- Send button (status `DRAFT` → `SENT`): confirmation prompt, then calls `/send`.
- Convert button (status `SENT` + accepted client): calls `/convert` to create booking.

#### Bookings Page `/admin/bookings`

New page. Features:
- Table: booking reference, customer, total amount, amount paid, remaining balance, status badge, created date.
- Detail page `/admin/bookings/[id]`: booking summary, linked quotation, financial transaction history, record payment form, voucher download link.
- Record payment form: amount, payment method (Cash / Bank Transfer / POS / Credit Card / Cheque), receipt upload.

---

### Phase 10 — Analytics Dashboard, System Logs & Settings

**Goal:** Admin overview page with real data, system health, log viewer, and settings panel.

#### Dashboard Overview `/admin`

The existing `/admin/page.tsx` uses hardcoded stats. This phase replaces it with live data.

- Fetch `GET /api/admin/stats` on page load. Show spinner for each card while loading.
- Stats cards: Customers this month, Pending leads, Active packages, Active offers, Completed requests, Revenue this month (EGP), Pending document reviews.
- CRM status badge: live via `/api/admin/crm/status` with auto-refresh every 60 seconds.
- Recent leads table: last 10 from `GET /api/admin/leads?limit=10&sort=created_at:desc`.
- Pending actions widget: leads with `status = 'pending_documents'` or unreviewed documents.
- Quick actions grid: links to create package, create offer, add banner, sync CRM.

#### System Logs `/admin/logs`

- Table: timestamp, level badge (info/success/warning/error), event name, source, details (expandable row).
- Filters: level, source, date range, free-text search.
- Pagination: 50 per page.
- Export button: downloads filtered results as CSV.
- Purge old logs section (admin only): input for number of days, confirmation checkbox, calls `DELETE /api/admin/logs?days=N&confirm=true`.

#### Settings Page `/admin/settings`

- **Agency Info:** name, logo upload, contact email, contact phone, WhatsApp number.
- **CRM Integration:** `BACKEND_INTERNAL_URL` display (masked), ping test button, webhook URL display for CRM configuration.
- **Supported Countries:** list of countries available for visa applications. Add/remove countries. Each entry links to visa types for that country.
- **Staff Management:** list of users with `role = 'staff'`. Add staff by email (sends invite). Remove staff.
- **Notification Preferences:** toggle email/SMS notifications per event type.

Settings that affect environment variables (like `BACKEND_INTERNAL_URL`) are read-only display — they must be changed in Vercel environment config, not through the UI.

---

## Component Library (Shared)

All pages use these shared components from `src/components/ui/` and new `src/components/admin/`:

| Component | Purpose |
|---|---|
| `DataTable` | Sortable, filterable table with pagination. Accepts column config + data array. |
| `StatusBadge` | Renders coloured badge from `PortalStatus` or custom status map. |
| `ConfirmModal` | Generic confirmation dialog. Accepts title, description, onConfirm. |
| `FileUpload` | Drag-and-drop image upload. Calls `/api/admin/upload/image`. Returns URL. |
| `FormDrawer` | Side drawer containing a form. Used for create/edit flows. |
| `SearchableSelect` | Async combobox for large lists (customers, countries). |
| `StatsCard` | KPI card with label, value, sub-label, colour variant. |
| `TimelineItem` | Single event in a vertical timeline (used in lead detail). |
| `PageHeader` | Title + subtitle + action button slot. |
| `FilterBar` | Horizontal row of filter chips, search input, and sort dropdown. |

---

## Auth & Role Enforcement

- All `/api/admin/*` routes: extract user from Supabase JWT via `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Check `profiles.role IN ('admin', 'staff')`. Return `403` if not authorised.
- Role-specific restrictions:
  - `DELETE` on logs, `PATCH` on customer role → `admin` only.
  - All other admin routes → `admin` or `staff`.
- Client-side: `AdminShell` reads auth from `useAuth()` context. Redirects to `/login` if no session. Redirects to `/` if role is `customer`.
- Do not store admin-only data in `localStorage` or expose via public API responses.

---

## State Management

- Server state: `@tanstack/react-query` for all API calls. Each route has a dedicated query key.
- Cache invalidation: after any mutation, invalidate the relevant list query key.
- Global UI state: `zustand` store (`src/lib/store.ts`) — sidebar open state, active notifications count.
- Forms: `react-hook-form` with `zod` schema validation. All form schemas in `src/lib/schemas/admin/`.

---

## Error Handling Convention

All API routes return:

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, details?: string }
```

Frontend: catch all API errors in React Query's `onError`. Show toast notifications (use `shadcn/ui` toast). Never swallow errors silently.

---

## Summary of All Phases

| Phase | Type | Scope |
|---|---|---|
| 1 | Backend | DB migrations + visa types, hotels, offers CRUD APIs |
| 2 | Backend | Leads/travel requests admin APIs — status, docs, CRM sync |
| 3 | Backend | Customers, quotations, bookings admin APIs |
| 4 | Backend | CMS content APIs — packages, banners, image upload |
| 5 | Backend | Analytics stats, logs, CRM health, notifications APIs |
| 6 | Frontend | Dashboard shell — sidebar, topbar, mobile nav, auth gate |
| 7 | Frontend | Visa catalog UI + hotel catalog UI |
| 8 | Frontend | Offers, packages, banners content management UI |
| 9 | Frontend | Leads (live), customers detail, quotations, bookings UI |
| 10 | Frontend | Live analytics dashboard, log viewer, settings panel |
