-- Test script to verify database setup and RLS policies
-- Run this after setting up the database to verify everything works

-- Check if tables exist
SELECT 
  table_name,
  row_security
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'project_data', 'user_settings')
ORDER BY table_name;

-- Check if RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('projects', 'project_data', 'user_settings')
ORDER BY tablename, policyname;

-- Check if indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('projects', 'project_data', 'user_settings')
ORDER BY tablename, indexname;

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('projects', 'project_data', 'user_settings')
ORDER BY event_object_table, trigger_name;

-- Test RLS function (this should return the current user ID if authenticated)
SELECT auth.uid() as current_user_id;

-- Check if the user is authenticated
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'User is authenticated'
    ELSE 'User is not authenticated'
  END as authentication_status; 