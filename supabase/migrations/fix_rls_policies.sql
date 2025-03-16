-- Update the RLS policy for the users table to allow service_role to insert users
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users" ON users
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add a policy to allow authenticated users to select their own user data
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Add a policy to allow server-side operations to insert users
DROP POLICY IF EXISTS "Server can insert users" ON users;
CREATE POLICY "Server can insert users" ON users
FOR INSERT 
USING (true);

-- Grant necessary permissions
GRANT INSERT, SELECT ON public.users TO service_role;
GRANT SELECT ON public.users TO authenticated;

