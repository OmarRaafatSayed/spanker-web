-- =====================================================================
-- QUICK FIX: Profile Database Schema
-- Run this in Supabase SQL Editor to fix all profile-related issues
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. ADD MISSING PROFILE COLUMNS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$ 
BEGIN
  -- Add nationality column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN nationality TEXT;
  END IF;

  -- Add date_of_birth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
  END IF;

  -- Add avatar_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add locale column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'locale'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN locale TEXT DEFAULT 'ar';
  END IF;

  -- Add is_profile_complete column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_profile_complete'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_profile_complete BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add locale constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_locale_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_locale_check 
    CHECK (locale IN ('ar', 'en'));
  END IF;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. CREATE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS idx_profiles_nationality ON public.profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON public.profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_locale ON public.profiles(locale);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. CREATE PROFILE COMPLETENESS TRIGGER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_profile_completeness();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. UPDATE EXISTING PROFILES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Set default locale for existing profiles
UPDATE public.profiles
SET locale = 'ar'
WHERE locale IS NULL;

-- Recompute completeness for all existing profiles
UPDATE public.profiles
SET is_profile_complete = (
  first_name IS NOT NULL AND first_name != '' AND
  last_name IS NOT NULL AND last_name != '' AND
  phone IS NOT NULL AND phone != ''
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. CREATE AVATARS STORAGE BUCKET
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy: Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can upload
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. VERIFICATION QUERIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Check profiles table structure
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('nationality', 'date_of_birth', 'avatar_url', 'locale', 'is_profile_complete');
  
  RAISE NOTICE '✓ Found % required profile columns', col_count;
  
  IF col_count < 5 THEN
    RAISE WARNING '⚠ Missing some profile columns. Expected 5, found %', col_count;
  END IF;
END $$;

-- Check avatars bucket
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✓ Avatars storage bucket exists';
  ELSE
    RAISE WARNING '⚠ Avatars bucket not found';
  END IF;
END $$;

-- Summary
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN is_profile_complete THEN 1 END) as complete_profiles,
  COUNT(CASE WHEN avatar_url IS NOT NULL THEN 1 END) as profiles_with_avatar
FROM public.profiles;

-- =====================================================================
-- QUICK FIX COMPLETE ✅
-- =====================================================================
