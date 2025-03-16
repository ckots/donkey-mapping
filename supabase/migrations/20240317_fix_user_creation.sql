-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new user creation
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

-- Create the trigger to call this function when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix RLS policies to ensure users can see their own data
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Allow service role to do everything
DROP POLICY IF EXISTS "Service role can do everything" ON users;
CREATE POLICY "Service role can do everything" ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO service_role;

