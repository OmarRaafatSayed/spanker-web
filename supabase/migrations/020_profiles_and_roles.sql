-- =====================================================================
-- Migration 020: Profiles & Staff Roles
-- =====================================================================
-- Creates/enhances profiles table with completeness tracking
-- Creates staff table with role-based permissions
-- Adds helper functions: is_staff(), has_complete_profile()
-- Adds triggers for profile completion tracking
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. PROFILES TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL THEN first_name
      ELSE email
    END
  ) STORED,
  
  -- Contact
  phone TEXT,
  nationality TEXT,
  date_of_birth DATE,
  
  -- Profile metadata
  avatar_url TEXT,
  locale TEXT DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  
  -- Profile completeness (computed via trigger)
  is_profile_complete BOOLEAN DEFAULT false,
  
  -- Legacy compatibility columns (keep for backward compatibility with existing code)
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff', 'reviewer')),
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  sync_id UUID,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if table already exists (idempotent)
DO $$ 
BEGIN
  -- Add missing columns one by one (IF NOT EXISTS not supported for ALTER TABLE ADD COLUMN in some PG versions)
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'ar';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sync_id UUID;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sync_error TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON public.profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 
  'User profiles — extended auth.users with booking-required fields';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. STAFF TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.staff (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'reviewer')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff(is_active);

COMMENT ON TABLE public.staff IS 
  'Staff members with elevated permissions — separate from customer profiles';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: is_staff
-- Returns true if the given user_id is an active staff member
CREATE OR REPLACE FUNCTION public.is_staff(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE user_id = check_user_id
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_staff IS 
  'Returns true if user is active staff — used in RLS policies';

-- Function: has_complete_profile
-- Returns true if the user has filled all required fields
CREATE OR REPLACE FUNCTION public.has_complete_profile(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT is_profile_complete
      FROM public.profiles
      WHERE id = check_user_id
    ),
    false
  );
$$;

COMMENT ON FUNCTION public.has_complete_profile IS 
  'Returns true if user profile is complete (first_name, last_name, phone all present)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 
  'Auto-creates profile row when new user signs up';

-- Trigger function: recompute profile completeness
CREATE OR REPLACE FUNCTION public.recompute_profile_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_profile_complete := (
    NEW.first_name IS NOT NULL AND NEW.first_name != '' AND
    NEW.last_name IS NOT NULL AND NEW.last_name != '' AND
    NEW.phone IS NOT NULL AND NEW.phone != ''
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_profile_completeness();

COMMENT ON FUNCTION public.recompute_profile_completeness IS 
  'Auto-updates is_profile_complete flag on profile changes';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. INITIAL DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update existing profiles to recompute completeness
UPDATE public.profiles
SET is_profile_complete = (
  first_name IS NOT NULL AND first_name != '' AND
  last_name IS NOT NULL AND last_name != '' AND
  phone IS NOT NULL AND phone != ''
)
WHERE is_profile_complete IS NULL OR is_profile_complete = false;

-- =====================================================================
-- MIGRATION 020 COMPLETE ✅
-- =====================================================================
-- Tables: profiles (enhanced), staff
-- Functions: is_staff(), has_complete_profile()
-- Triggers: auto-create profile, auto-compute completeness
-- =====================================================================
