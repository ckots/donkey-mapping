-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'data_collector', 'visitor')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  points INTEGER DEFAULT 0,
  surveys_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_responses table
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  responses JSONB NOT NULL,
  location JSONB,
  submitted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create claimed_rewards table
CREATE TABLE claimed_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  reward_id UUID NOT NULL REFERENCES rewards(id),
  points INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'delivered', 'cancelled'))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can insert users" ON users
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Allow trigger function to insert users" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Surveys table policies
CREATE POLICY "Anyone can view approved surveys" ON surveys
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own surveys" ON surveys
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create surveys" ON surveys
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update surveys" ON surveys
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Survey responses table policies
CREATE POLICY "Users can view their own responses" ON survey_responses
FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Users can submit responses" ON survey_responses
FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can view all responses" ON survey_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Data collectors can view responses for their surveys" ON survey_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.created_by = auth.uid()
  )
);

-- Rewards table policies
CREATE POLICY "Anyone can view rewards" ON rewards
FOR SELECT USING (true);

CREATE POLICY "Admins can manage rewards" ON rewards
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Claimed rewards table policies
CREATE POLICY "Users can view their own claimed rewards" ON claimed_rewards
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can claim rewards" ON claimed_rewards
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage claimed rewards" ON claimed_rewards
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create functions and triggers
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger for surveys table
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON surveys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    points = points + points_to_add,
    surveys_completed = surveys_completed + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION claim_reward(user_id UUID, reward_id UUID)
RETURNS UUID AS $$
DECLARE
  reward_points INTEGER;
  user_points INTEGER;
  claimed_reward_id UUID;
BEGIN
  -- Get reward points
  SELECT points INTO reward_points FROM rewards WHERE id = reward_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  -- Get user points
  SELECT points INTO user_points FROM users WHERE id = user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user has enough points
  IF user_points < reward_points THEN
    RAISE EXCEPTION 'Not enough points';
  END IF;

  -- Deduct points from user
  UPDATE users SET points = points - reward_points WHERE id = user_id;

  -- Create claimed reward record
  INSERT INTO claimed_rewards (user_id, reward_id, points, status)
  VALUES (user_id, reward_id, reward_points, 'processing')
  RETURNING id INTO claimed_reward_id;

  RETURN claimed_reward_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signups
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
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');

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

-- Create a trigger to call this function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add some sample rewards
INSERT INTO rewards (name, description, points, image) VALUES
('1GB Internet', '1GB of mobile data for your phone', 500, '/rewards/internet.png'),
('T-Shirt', 'Donkey Mapping Initiative T-shirt', 1000, '/rewards/tshirt.png'),
('Coffee Mug', 'Branded coffee mug', 750, '/rewards/mug.png'),
('Wall Clock', 'Decorative wall clock with donkey design', 1200, '/rewards/clock.png'),
('Football', 'Standard size football', 1500, '/rewards/football.png');

-- Grant necessary permissions
GRANT INSERT ON public.users TO service_role;
GRANT INSERT ON public.users TO authenticated;

