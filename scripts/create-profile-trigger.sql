-- =============================================================================
-- PROFILE CREATION TRIGGER
-- =============================================================================
-- Automatically creates a profile when a new user is created in auth.users
-- =============================================================================

-- Function to handle new user creation
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
