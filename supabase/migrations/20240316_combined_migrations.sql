-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to handle new user signups with OTP
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

  -- Check if the user already exists in the users table
  -- This is important for OTP flow where the auth user might be created before verification
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Insert the user into the public users table
    INSERT INTO public.users (id, name, email, role, status)
    VALUES (
      NEW.id,
      user_name,
      NEW.email,
      user_role,
      user_status
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't prevent the auth user from being created
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the RLS policy for the users table
CREATE POLICY "Service role can insert users" ON users
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add a policy to allow the trigger function to insert into users table
CREATE POLICY "Allow trigger function to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.users TO service_role;
GRANT INSERT ON public.users TO authenticated;

