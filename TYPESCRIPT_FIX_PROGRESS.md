# TypeScript Error Fix Progress Report

## ✅ COMPLETED

### 1. Database Migration (DONE)
- ✅ Applied 15 migrations (100-114) successfully
- ✅ Regenerated types from live schema
- ✅ All new tables and functions are in database.ts

### 2. Await Refactor (MOSTLY DONE)
- ✅ Updated `@/lib/api/index.ts` to export async `createServerClient`
- ✅ Fixed `src/lib/api/auth.ts` - added await (2 instances)
- ✅ Fixed ~8 route files via PowerShell bulk update
- ⚠️ Some routes may still need manual await additions

### 3. Table Name Fixes (DONE)
- ✅ Replaced `"bookings"` → `"travel_requests"` (7 files)
- ✅ Replaced `"hotels"` → `"hotel_offers"` (2 files)

### 4. Portal-API (TEMPORARY FIX)
- ✅ Created minimal working replacement at `src/lib/portal-api/client.ts`
- ⚠️ Still uses generic types, not properly typed yet

### 5. Schema Alias Layer (DONE)
- ✅ Created `src/lib/db/schema.ts` with TABLES constant

## 🔧 REMAINING ISSUES

### Current Error Count: **530** (down from 572)

### Top Error Categories:

1. **No overload matches this call** (98 errors)
   - Mostly from queries to tables with wrong columns
   - Foreign key references that don't match new schema
   
2. **Argument of type '"id"' is not assignable** (51 errors)
   - Likely referencing columns that don't exist in new types
   - Need to verify column names in database.ts
   
3. **Argument of type 'string' is not assignable to 'never'** (31 errors)
   - Table queries returning 'never' type
   - Usually means table doesn't exist in types

4. **Type 'string' is not assignable to type 'never'** (17 errors)
   - Similar to above

5. **Missing properties** (15 errors)
   - Properties like 'contact', 'is_active', etc. not in types

### Known Problem Areas:

#### A. Non-Existent Tables Still Referenced
- `staff` - doesn't exist (staff are profiles with role='staff')
- `hotel_rooms` - doesn't exist (hotel_offers has room info inline)
- `visa_types` - doesn't exist (document_requirements instead)
- `trip_packages` - doesn't exist (trips table instead)
- `financial_transactions` - doesn't exist (payment_records instead)

#### B. Column Mismatches
- Old code uses `profiles.id` when should use `profiles.user_id` for auth references
- Many admin pages query columns that don't exist in new schema
- Foreign keys point to wrong columns

#### C. Portal Pages Need Rewrite
Files still importing portal-api (10 files):
- `src/app/(client)/documents/page.tsx`
- `src/app/(client)/profile/page.tsx`
- `src/app/(client)/profile/setup/page.tsx`
- `src/app/(client)/requests/[id]/page.tsx`
- `src/modules/auth/hooks/useAuth.ts`
- `src/modules/portal/hooks/useDocuments.ts`
- `src/modules/portal/hooks/useNotifications.ts`
- `src/modules/portal/hooks/useRequests.ts`
- `src/modules/portal/hooks/usePortalDashboard.ts`
- `src/modules/portal/services/portalService.ts`

These need proper typing and to handle the new schema.

#### D. Admin Pages Need Schema Updates
Many admin pages query tables that were renamed or restructured:
- `src/app/admin/flights/page.tsx` - needs to use correct column names
- `src/app/admin/hotels/page.tsx` - now hotel_offers, different schema
- `src/app/admin/bookings/*` - now travel_requests
- `src/app/api/admin/hotels/*` - hotel_rooms doesn't exist

## 📋 RECOMMENDED NEXT STEPS

### PHASE 1: Fix Non-Existent Table References (High Impact)
1. Find all references to: `staff`, `hotel_rooms`, `visa_types`, `trip_packages`, `financial_transactions`
2. Replace with correct table names from schema.ts
3. Update queries to use correct columns

### PHASE 2: Fix Column Name Issues
1. Search for `profiles.id` in auth contexts → replace with `profiles.user_id`
2. Fix foreign key references
3. Update select/insert/update statements to match new schema

### PHASE 3: Properly Type Portal-API
1. Create proper TypeScript interfaces for portal-api responses
2. Update all 10 importing files with correct types
3. Handle Json types properly (document_checklist, etc.)

### PHASE 4: Admin Page Rewrites
1. Update admin hotel pages to work with hotel_offers schema
2. Update admin booking pages to work with travel_requests schema
3. Fix all column references

### PHASE 5: Final Cleanup
1. Run `npx tsc --noEmit` until zero errors
2. Run `npm run build` to verify production bundle
3. Test critical flows

## 🎯 CRITICAL FILES NEEDING IMMEDIATE ATTENTION

Based on error frequency:

1. **src/app/admin/hotels/page.tsx** - queries non-existent columns
2. **src/app/admin/bookings/*/page.tsx** - all 4 vertical pages
3. **src/app/api/admin/hotels/**/*.ts** - all hotel admin APIs
4. **src/app/(client)/my-requests/page.tsx** - type conversion error
5. **src/app/(client)/profile/*.tsx** - never type errors

## 📊 ESTIMATED WORK REMAINING

- **High Priority Fixes:** ~100 errors (table/column name issues)
- **Medium Priority:** ~200 errors (type mismatches)
- **Low Priority:** ~230 errors (minor type issues, can use type assertions temporarily)

**Estimated Time:** 2-3 hours of focused work to get to zero errors with proper types.

## 🚀 QUICK WINS

To get the build passing quickly (not recommended for production):

1. Comment out all admin pages temporarily
2. Fix only the client-facing portal pages
3. Get to ~50 errors, then use selective `as unknown as Type` casts

**Better Approach:** Fix systematically by category as outlined above.
