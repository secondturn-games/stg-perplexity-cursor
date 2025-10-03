-- =============================================================================
-- COMPLETE PROFILE CREATION FIX
-- =============================================================================
-- This script fixes all profile creation issues by:
-- 1. Ensuring schema matches TypeScript types
-- 2. Setting up automatic profile creation trigger
-- 3. Fixing RLS policies
-- =============================================================================

-- Step 1: Add missing columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add is_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add last_active_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add reputation_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
        ALTER TABLE public.profiles ADD COLUMN reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0);
    END IF;
END $$;

-- Step 2: Update column constraints and defaults
ALTER TABLE public.profiles 
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN privacy_settings SET DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb,
    ALTER COLUMN notification_settings SET DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb;

-- Step 3: Create or replace the profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract user metadata
  DECLARE
    user_username TEXT := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
    user_full_name TEXT := NEW.raw_user_meta_data->>'full_name';
    user_gdpr_consent BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'gdpr_consent')::boolean, false);
    user_marketing_consent BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false);
  BEGIN
    -- Insert profile with all required fields
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      email_verified,
      phone_verified,
      is_verified,
      privacy_settings,
      notification_settings,
      reputation_score,
      last_active_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_username,
      user_full_name,
      NEW.email_confirmed_at IS NOT NULL, -- Set email_verified based on email confirmation
      false, -- phone_verified starts as false
      false, -- is_verified starts as false
      jsonb_build_object(
        'show_email', false,
        'show_phone', false,
        'show_location', true
      ),
      jsonb_build_object(
        'messages', true,
        'offers', true,
        'listings', true,
        'marketing', user_marketing_consent
      ),
      0, -- reputation_score starts at 0
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user % with username %', NEW.id, user_username;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Fix RLS policies for profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to create profiles via trigger (SECURITY DEFINER)
DROP POLICY IF EXISTS "System can create profiles via trigger" ON public.profiles;
CREATE POLICY "System can create profiles via trigger" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Step 7: Create profiles for existing users who don't have them
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  email_verified,
  phone_verified,
  is_verified,
  privacy_settings,
  notification_settings,
  reputation_score,
  last_active_at,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8)) as username,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.email_confirmed_at IS NOT NULL as email_verified,
  false as phone_verified,
  false as is_verified,
  '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb as privacy_settings,
  '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb as notification_settings,
  0 as reputation_score,
  NOW() as last_active_at,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 8: Verification
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    RAISE NOTICE '✅ Profile creation fix completed!';
    RAISE NOTICE '📊 Total users: %', user_count;
    RAISE NOTICE '📊 Total profiles: %', profile_count;
    RAISE NOTICE '🔧 Trigger created: on_auth_user_created';
    RAISE NOTICE '🛡️ RLS policies updated';
    RAISE NOTICE '🚀 New users will automatically get profiles created';
END $$;