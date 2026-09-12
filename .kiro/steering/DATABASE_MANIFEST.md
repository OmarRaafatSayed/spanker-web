# 🗄️ Database Manifest (Current State — Migration 115)

## 📊 Unified Booking System

### Master Table: `travel_requests`
الجدول الرئيسي لكل أنواع الحجوزات.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `client_user_id` | UUID | → `auth.users.id` |
| `user_id` | UUID | Alias for `client_user_id` (added in migration 115 for compatibility) |
| `booking_status` | text | Lifecycle: `pending` → `confirmed` → `cancelled` / `expired` |
| `status` | text | Document/review status |
| `vertical` | text | `flight` / `hotel` / `visa` / `trip` |

### Detail Tables (1:1 with `travel_requests`)

| Table | TABLES key | Used for |
|-------|-----------|---------|
| `flight_booking_details` | `TABLES.flightBookingDetails` | Flight: passengers, seats, flight_id |
| `hotel_booking_details` | `TABLES.hotelBookingDetails` | Hotel: rooms, dates, guests |
| `trip_booking_details` | `TABLES.tripBookingDetails` | Trip: travelers, trip_id |
| `visa_booking_details` | `TABLES.visaBookingDetails` | Visa: applicant, passport, nationality |

---

## 🔐 Identity Mapping

```
auth.users.id (UUID)
      ↕
profiles.user_id  ←  الرابط الرئيسي مع الـ auth
profiles.id       ←  Internal PK — يُستخدم في customer_requests والـ leads
```

---

## ⚙️ RPC Functions الفعلية

> ⚠️ **تحذير مهم:** يوجد اسمان مختلفان لنفس العملية في الـ migrations:
> - Migration 028: `book_flight(p_user, p_flight, ...)`
> - Migrations 108–111: `create_flight_booking(...)` وأخواتها
>
> **الكود الحالي في `src/app/api/v1/bookings/route.ts` يستخدم أسماء migration 028.**
> قبل استدعاء أي RPC، تحقق من `src/types/database.ts` في قسم `Functions` للتأكد من الاسم الصحيح.

### Booking RPCs (Migration 028 — Active in codebase)

| Function | Parameters | Returns |
|----------|-----------|---------|
| `book_flight` | `p_user, p_flight, p_passengers, p_contact` | `{ ok, code?, message?, data? }` |
| `book_hotel` | `p_customer_id, p_hotel_id, p_checkin_date, p_checkout_date, p_room_type, p_rooms_count, p_guests, p_contact, p_special_requests` | `{ ok, code?, message?, data? }` |
| `book_trip` | `p_customer_id, p_trip_id, p_travelers, p_contact, p_special_requests, p_dietary_requirements` | `{ ok, code?, message?, data? }` |
| `submit_visa_application` | `p_customer_id, p_visa_id, p_applicant, p_contact, p_travel_dates, p_purpose_of_visit, p_document_ids` | `{ ok, code?, message?, data? }` |

### Lifecycle RPCs

| Function | Parameters | Notes |
|----------|-----------|-------|
| `cancel_booking` | `p_request_id` | Client or staff |
| `confirm_booking` | `p_request_id` | Staff only |
| `expire_pending_bookings` | none | Cron job — expires stale pending bookings |
| `review_visa_application` | `p_request_id, p_decision, ...` | Staff only |

---

## 📋 All Tables via `TABLES` constant

```ts
import { TABLES } from '@/lib/db/schema';
```

| TABLES key | Actual table name | Category |
|-----------|------------------|---------|
| `TABLES.profiles` | `profiles` | Identity |
| `TABLES.organizations` | `organizations` | Identity |
| `TABLES.travelRequests` | `travel_requests` | Booking — Master |
| `TABLES.customerRequests` | `customer_requests` | Booking — Legacy |
| `TABLES.flightBookingDetails` | `flight_booking_details` | Booking — Detail |
| `TABLES.hotelBookingDetails` | `hotel_booking_details` | Booking — Detail |
| `TABLES.visaBookingDetails` | `visa_booking_details` | Booking — Detail |
| `TABLES.tripBookingDetails` | `trip_booking_details` | Booking — Detail |
| `TABLES.flights` | `flights` | Inventory |
| `TABLES.trips` | `trips` | Inventory |
| `TABLES.hotelOffers` | `hotel_offers` | Inventory |
| `TABLES.hotelRoomAvailability` | `hotel_room_availability` | Inventory |
| `TABLES.flightSearchCache` | `flight_search_cache` | Inventory |
| `TABLES.paymentRecords` | `payment_records` | Financial |
| `TABLES.visaApplications` | `visa_applications` | Visa |
| `TABLES.documentRequirements` | `document_requirements` | Visa |
| `TABLES.customerDocuments` | `customer_documents` | Documents |
| `TABLES.portalDocuments` | `portal_documents` | Documents |
| `TABLES.customerCommunications` | `customer_communications` | Communications |
| `TABLES.portalNotifications` | `portal_notifications` | Portal |
| `TABLES.portalStatusLog` | `portal_status_log` | Portal |
| `TABLES.contentBanners` | `content_banners` | CMS |
| `TABLES.stateMachineEvents` | `state_machine_events` | Events |
| `TABLES.bookingPolicies` | `booking_policies` | Config |
| `TABLES.visaStatusMapping` | `visa_status_mapping` | Config |
| `TABLES.syncQueue` | `sync_queue` | Internal |
| `TABLES.systemLogs` | `system_logs` | Internal |
| `TABLES.webhookProcessingLog` | `webhook_processing_log` | Internal |
