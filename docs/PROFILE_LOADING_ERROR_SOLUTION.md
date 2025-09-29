# Profile Loading Error Solution

## Problem

Users are getting "Error loading profile: {}" because profiles don't exist yet when users sign up. This happens because:

1. **RLS Policy Issue**: Profile creation is blocked during signup
2. **Missing Database Trigger**: No automatic profile creation when user is created
3. **Poor Error Handling**: AuthContext doesn't handle missing profiles gracefully

## Solutions

### Option 1: Set Up Database Trigger (Recommended)

**Step 1: Go to Supabase Dashboard → SQL Editor**

**Step 2: Run this SQL:**

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

### Option 2: Manual Profile Creation (Quick Fix)

**For testing purposes, run this script:**

```bash
node scripts/create-test-profile.js
```

**Or manually create a profile in Supabase Dashboard:**

1. Go to **Table Editor** → **profiles**
2. Click **Insert** → **Insert row**
3. Fill in the required fields:
   - `id`: Copy from `auth.users` table
   - `username`: Any unique username
   - `full_name`: User's name
   - `privacy_settings`: `{"show_email": false, "show_phone": false, "show_location": true}`
   - `notification_settings`: `{"messages": true, "offers": true, "listings": true, "marketing": false}`

### Option 3: Improved Error Handling (Already Applied)

The AuthContext has been updated to:

- ✅ Handle missing profiles gracefully
- ✅ Log appropriate messages instead of errors
- ✅ Set profile to null when not found
- ✅ Redirect to onboarding when needed

## Verification

After applying any solution:

1. **Sign up with a new email**
2. **Check browser console** - should see "Profile not found - user needs to complete onboarding" instead of error
3. **User should be redirected to onboarding**
4. **Complete onboarding** - profile should be created
5. **Check Supabase** - profile should exist in `profiles` table

## Expected Behavior

- ✅ **No more console errors** for missing profiles
- ✅ **Smooth redirect to onboarding** for new users
- ✅ **Profile creation** during onboarding process
- ✅ **Proper error handling** for actual errors

## Recommendation

**Use Option 1** (database trigger) for production as it:

- Automatically creates profiles for all new users
- Handles the RLS policy issue
- Provides the best user experience
- Requires no code changes
