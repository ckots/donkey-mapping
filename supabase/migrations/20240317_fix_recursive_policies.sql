-- Drop the problematic policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Create simpler policies that don't cause recursion
-- Allow service_role to do everything
CREATE POLICY "Service role can do everything" ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to view their own data
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
FOR SELECT 
USING (auth.uid() = id);

-- Allow authenticated users to insert their own record
DROP POLICY IF EXISTS "Allow trigger function to insert users" ON users;
CREATE POLICY "Authenticated users can insert their own record" ON users
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

