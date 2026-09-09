  -- Run this FIRST to see what tables actually exist in your database
  SELECT 
    table_name,
    column_name,
    data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (
      'travel_requests',
      'customer_documents', 
      'profiles',
      'portal_notifications',
      'portal_status_log'
    )
  ORDER BY table_name, ordinal_position;
