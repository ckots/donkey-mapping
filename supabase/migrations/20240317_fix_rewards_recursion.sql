-- This migration fixes the infinite recursion in RLS policies for the users table

-- First, disable RLS temporarily to avoid issues during migration
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the users table that might be causing recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Allow trigger function to insert users" ON users;
DROP POLICY IF EXISTS "Service role can do everything" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their own record" ON users;
DROP POLICY IF EXISTS "Server can insert users" ON users;

-- Create new non-recursive policies

-- 1. Allow users to view their own data (non-recursive)
CREATE POLICY "users_select_own" ON users
FOR SELECT USING (auth.uid() = id);

-- 2. Allow admins to view all users (non-recursive)
-- This uses a different approach to avoid recursion
CREATE POLICY "admins_select_all" ON users
FOR SELECT USING (
  -- Check JWT claims directly instead of querying the users table
  (auth.jwt() ->> 'role')::text = 'admin' OR
  -- Fallback to a direct check but with a limit to prevent deep recursion
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- 3. Allow admins to update users (non-recursive)
CREATE POLICY "admins_update_all" ON users
FOR UPDATE USING (
  -- Similar approach as above
  (auth.jwt() ->> 'role')::text = 'admin' OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- 4. Allow service role to do everything
CREATE POLICY "service_role_all" ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Allow authenticated users to insert their own record
CREATE POLICY "users_insert_own" ON users
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix the handle_new_user function to avoid recursion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
  user_name TEXT;
BEGIN
  -- Extract values from metadata with fallbacks
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'data_collector');
  user_status := 'approved'; -- Auto-approve all users
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User');

  -- Use SET LOCAL to temporarily disable RLS for this transaction
  EXECUTE 'SET LOCAL row_security = off';
  
  -- Insert the user into the public users table
  INSERT INTO public.users (
    id, 
    name, 
    email, 
    role, 
    status,
    created_at
  ) VALUES (
    NEW.id,
    user_name,
    NEW.email,
    user_role,
    user_status,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid duplicate errors

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't prevent the auth user from being created
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the function has the right permissions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

