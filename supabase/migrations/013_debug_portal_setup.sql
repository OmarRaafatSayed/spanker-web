-- =====================================================================
-- Debug: simulate what portal/profile/setup does
-- Run this to find the exact error
-- =====================================================================

-- 1. Check if the test user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test_portal_check@test.com';

-- 2. Check if profiles table has the right columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Try the exact upsert FastAPI does (replace the UUID below with real user id from step 1)
-- INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, role, updated_at, created_at)
-- VALUES ('e32f56f7-574f-4569-837f-4bb40fc3ddc5', 'test@test.com', 'Omar', 'Dawood', null, 'customer', now(), now())
-- ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name;

-- 4. Check RLS policies on profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Check if service_role can write to profiles
SELECT has_table_privilege('service_role', 'public.profiles', 'INSERT') AS can_insert,
       has_table_privilege('service_role', 'public.profiles', 'UPDATE') AS can_update,
       has_table_privilege('service_role', 'public.profiles', 'SELECT') AS can_select;
