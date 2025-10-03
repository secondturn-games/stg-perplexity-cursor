-- =============================================================================
-- QUICK FIX FOR MISSING PROFILE COLUMNS
-- =============================================================================
-- Run this script in Supabase SQL Editor to fix the immediate issue
-- =============================================================================

-- Add the missing columns that are causing the error
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;

-- Update existing profiles with default values
UPDATE public.profiles 
SET 
    privacy_settings = '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb,
    notification_settings = '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb,
    email_verified = FALSE,
    phone_verified = FALSE,
    is_verified = FALSE,
    reputation_score = 0,
    last_active_at = NOW()
WHERE 
    privacy_settings IS NULL 
    OR notification_settings IS NULL 
    OR email_verified IS NULL 
    OR phone_verified IS NULL 
    OR is_verified IS NULL 
    OR reputation_score IS NULL 
    OR last_active_at IS NULL;

-- Verify the fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('privacy_settings', 'notification_settings', 'email_verified', 'phone_verified', 'is_verified')
ORDER BY column_name;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ Profile columns added successfully!';
    RAISE NOTICE '🚀 You can now try the onboarding flow again.';
END $$;