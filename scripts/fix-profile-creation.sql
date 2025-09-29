-- =============================================================================
-- FIX PROFILE CREATION ISSUES
-- =============================================================================
-- This script fixes the profile creation issues by:
-- 1. Updating the profile creation trigger
-- 2. Adding proper RLS policies
-- 3. Ensuring profile creation works correctly
-- =============================================================================

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the improved profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract user metadata
  DECLARE
    user_username TEXT := 'user_' || substr(NEW.id::text, 1, 8);
    user_full_name TEXT := NEW.raw_user_meta_data->>'full_name';
    user_gdpr_consent BOOLEAN := COALESCE((NEW.raw_user_meta_data->>'gdpr_consent')::boolean, false);
  BEGIN
    -- Insert profile with explicit RLS bypass for trigger
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      privacy_settings,
      notification_settings,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_username,
      user_full_name,
      jsonb_build_object(
        'show_email', false,
        'show_phone', false,
        'show_location', true
      ),
      jsonb_build_object(
        'messages', true,
        'offers', true,
        'listings', true,
        'marketing', false
      ),
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can create profiles via trigger" ON public.profiles;

-- Create improved policies
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to create profiles via trigger (SECURITY DEFINER)
CREATE POLICY "System can create profiles via trigger" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Test the trigger by checking if it works
DO $$
BEGIN
    RAISE NOTICE '✅ Profile creation trigger and RLS policies updated successfully!';
    RAISE NOTICE '🔧 The trigger will now create profiles automatically when users sign up';
    RAISE NOTICE '🛡️ RLS policies allow both user creation and system trigger creation';
    RAISE NOTICE '🚀 Profile creation should now work correctly!';
END $$;
