-- Create a database function to safely create a user if they don't exist
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'data_collector'
) RETURNS VOID AS $$
BEGIN
  -- Use INSERT with ON CONFLICT DO NOTHING to safely insert the user
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    created_at
  ) VALUES (
    user_id,
    user_email,
    user_name,
    user_role,
    'approved',
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO authenticated;

-- Also fix the handle_new_user trigger function to use ON CONFLICT DO NOTHING
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

  -- Insert the user into the public users table with ON CONFLICT DO NOTHING
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
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't prevent the auth user from being created
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

