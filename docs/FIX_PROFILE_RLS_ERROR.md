# Fix Profile RLS Error

## Problem

When users try to sign up via email, they get this error:

```
new row violates row-level security policy for table "profiles"
```

## Root Cause

The RLS policy requires users to be authenticated to insert profiles, but during signup, the user isn't authenticated until after email verification. The profile creation attempt happens before authentication.

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL script:

```sql
-- Function to handle new user creation
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
    -- Insert profile
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
        'marketing', user_marketing_consent
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
```

### Option 2: Alternative - Modify RLS Policy

If you prefer to keep the current approach, you can modify the RLS policy to allow profile creation during signup:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new policy that allows profile creation for new users
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR
        (auth.uid() IS NULL AND id IN (
            SELECT id FROM auth.users
            WHERE created_at > NOW() - INTERVAL '5 minutes'
        ))
    );
```

## Verification

After applying either solution:

1. Try signing up with a new email
2. Check that the signup process completes without RLS errors
3. Verify that a profile is created in the `profiles` table

## Recommendation

**Use Option 1** (database trigger) as it's more robust and handles the profile creation automatically without relying on RLS policy modifications.
