-- =====================================================================
-- CMS & Admin Dashboard Migration
-- Site content tables: trip packages, banners
-- Admin role enforcement via RLS
-- =====================================================================

-- 1. Trip packages (public content managed by admin)
CREATE TABLE IF NOT EXISTS public.trip_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  destination TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  duration INTEGER NOT NULL CHECK (duration > 0),
  images JSONB NOT NULL DEFAULT '[]',
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trip_packages_active ON public.trip_packages(is_active);
CREATE INDEX idx_trip_packages_destination ON public.trip_packages(destination);

COMMENT ON TABLE public.trip_packages IS
  'Trip packages managed by admin — shown on public site when is_active = true';

-- 2. Content banners
CREATE TABLE IF NOT EXISTS public.content_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL CHECK (position IN ('hero', 'secondary', 'footer')),
  display_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_banners_position_active ON public.content_banners(position, is_active);
CREATE INDEX idx_banners_display_order ON public.content_banners(display_order);

COMMENT ON TABLE public.content_banners IS
  'Site banners managed by admin — filtered by position and is_active';

-- 3. System logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  event TEXT NOT NULL,
  details TEXT,
  source TEXT NOT NULL CHECK (source IN ('webhook', 'crm', 'cms', 'auth', 'system')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_source ON public.system_logs(source);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);

COMMENT ON TABLE public.system_logs IS
  'System audit log for webhook events, CRM sync, and CMS changes';

-- 4. RLS — Public read for active content

-- Trip packages: public can read active ones
ALTER TABLE public.trip_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_packages"
  ON public.trip_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin_manage_packages"
  ON public.trip_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Banners: public can read active ones
ALTER TABLE public.content_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_banners"
  ON public.content_banners FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "admin_manage_banners"
  ON public.content_banners FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- System logs: admin/staff read only
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "system_insert_logs"
  ON public.system_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Helper function: log event
CREATE OR REPLACE FUNCTION log_system_event(
  p_level TEXT,
  p_event TEXT,
  p_details TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'system',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.system_logs (level, event, details, source, user_id, metadata)
  VALUES (p_level, p_event, p_details, p_source, auth.uid(), p_metadata)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

-- 6. Helper function: get active banners by position
CREATE OR REPLACE FUNCTION get_active_banners(p_position TEXT DEFAULT NULL)
RETURNS SETOF public.content_banners
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.content_banners
  WHERE is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
    AND (p_position IS NULL OR position = p_position)
  ORDER BY display_order ASC;
$$;

-- 7. Helper function: get active packages
CREATE OR REPLACE FUNCTION get_active_packages(p_destination TEXT DEFAULT NULL)
RETURNS SETOF public.trip_packages
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.trip_packages
  WHERE is_active = true
    AND (p_destination IS NULL OR destination ILIKE '%' || p_destination || '%')
  ORDER BY created_at DESC;
$$;

-- =====================================================================
-- CMS MIGRATION COMPLETE ✅
-- Tables: trip_packages, content_banners, system_logs
-- RLS: Public read for active content, admin-only write
-- =====================================================================
