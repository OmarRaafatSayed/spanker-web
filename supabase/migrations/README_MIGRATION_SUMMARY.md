# Migration Summary: Unified Booking System

## Overview
These migrations extend `travel_requests` to support a unified booking workflow for all verticals (flight, hotel, visa, trip), with proper inventory management, locking, and cancellation policies.

## Migration Order

1. **100_fix_handle_new_user_search_path.sql** - Security fix for SECURITY DEFINER function
2. **101_extend_travel_requests_for_bookings.sql** - Add booking columns to travel_requests
3. **102_create_inventory_tables.sql** - Create flights and trips inventory tables
4. **103_create_booking_details_tables.sql** - Create 4 detail tables (1:1 with travel_requests)
5. **104_create_booking_policies_table.sql** - Create booking_policies with seed data
6. **105_create_visa_status_mapping_table.sql** - Map visa_applications.status (integer) to booking_status
7. **106_add_document_requirements_rls_policy.sql** - Add missing RLS policy
8. **107_create_helper_functions.sql** - is_staff() and generate_booking_reference()
9. **108_create_flight_booking_function.sql** - create_flight_booking() with inventory locking
10. **109_create_hotel_booking_function.sql** - create_hotel_booking() with inventory locking
11. **110_create_trip_booking_function.sql** - create_trip_booking() with inventory locking
12. **111_create_visa_booking_function.sql** - create_visa_booking() (no inventory)
13. **112_create_confirm_booking_function.sql** - confirm_booking() (staff-only)
14. **113_create_cancel_booking_function.sql** - cancel_booking() with idempotent inventory restoration
15. **114_create_expire_bookings_function.sql** - expire_pending_bookings() background job

## Key Features

### Inventory Locking
- All booking functions use `SELECT ... FOR UPDATE NOWAIT` on inventory
- Locking order: travel_requests → inventory → payment_records (prevents deadlocks)
- Atomic inventory decrement with guard: `UPDATE ... SET available = available - N WHERE available >= N`
- Double-booking impossible at DB level

### Idempotent Cancellation
- `cancel_booking()` checks `cancelled_at IS NOT NULL` before any action
- `WHERE cancelled_at IS NULL` on final UPDATE ensures single execution
- Safe to call multiple times - returns "ALREADY_CANCELLED" without side effects

### Security
- All SECURITY DEFINER functions include `SET search_path = public, pg_temp`
- Ownership checks on all booking operations
- Staff-only operations validated via `is_staff()` helper

### Business Rules
- Booking references: `SPK-{PREFIX}-{YYYY}-{RANDOM}` with collision retry
- Expiration derived from `booking_policies.payment_due_hours` per vertical
- Cancellation penalties calculated from `booking_policies` based on time until departure
- Payment records auto-created and linked

## Tables NOT Modified
- `customer_requests` - left as-is (legacy lead capture)
- `travel_requests.status` - NOT renamed (keeps document workflow intact)
- `sync_queue` triggers - left firing (harmless if unprocessed)
- Duplicate hotel_offers policies - reported but not dropped (requires separate approval)

## Multi-Tenancy
- `organization_id` added to NEW tables only (flights, trips, all detail tables, booking_policies)
- Existing tables NOT modified (deferred to separate project per C1 scope control)

## Unverified Data
- `visa_status_mapping` table contains BEST GUESS mapping of visa_applications.status (1-7) to booking_status
- Requires user verification before production use

## Next Steps After Migration

1. Run `npx supabase db push` to apply migrations
2. Regenerate types: `npx supabase gen types typescript --linked --schema public > src/types/database.ts`
3. Fix 275+ TypeScript errors (mostly missing `await` on `createSupabaseServerClient()`)
4. Remove `src/lib/portal-api/` stub and rewrite 10 importers
5. Run `npx tsc --noEmit` until zero errors
6. Run `npm run build` to verify clean build

## Tables Missing organization_id (Information Only)
- `travel_requests` (NOW HAS IT after migration 101)
- `customer_requests`
- `visa_applications`
- `customer_documents`
- `customer_communications`
- `payment_records` (ALREADY HAS IT)

## Duplicate Policies Found (Awaiting Approval)
hotel_offers:
- `hotel_auth_select` ≡ `hotel_offers_auth_select` (both SELECT TO authenticated)
- `hotel_service_all` ≡ `hotel_offers_service_all` (both ALL TO service_role)

Proposed cleanup (NOT YET APPLIED):
```sql
DROP POLICY hotel_auth_select ON hotel_offers;
DROP POLICY hotel_service_all ON hotel_offers;
```
