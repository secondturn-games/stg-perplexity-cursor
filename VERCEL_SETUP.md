# Vercel Deployment Setup

## Environment Variables Required

To fix the console errors, you need to set the following environment variables in your Vercel project:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous key (public key)
   - Found in your Supabase project settings under "API"

### Optional Environment Variables

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Your Supabase service role key (private key)
   - Only needed for server-side operations
   - Found in your Supabase project settings under "API"

4. **NEXT_PUBLIC_APP_URL**
   - Your Vercel deployment URL
   - Example: `https://your-app.vercel.app`

5. **BGG_API_URL**
   - BoardGameGeek API URL
   - Default: `https://www.boardgamegeek.com/xmlapi2`

6. **MAKECOMMERCE_API_KEY**
   - Payment integration API key (if using makeCommerce)

7. **MAKECOMMERCE_API_URL**
   - Payment integration URL (if using makeCommerce)

8. **NEXT_PUBLIC_POSTHOG_KEY**
   - Analytics key (if using PostHog)

9. **NEXT_PUBLIC_POSTHOG_HOST**
   - Analytics host (if using PostHog)

10. **RESEND_API_KEY**
    - Email service API key (if using Resend)

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable with its value
5. Make sure to set the environment (Production, Preview, Development) for each variable
6. Click "Save" after adding each variable

## After Setting Environment Variables

1. Go to the "Deployments" tab
2. Click the "..." menu on your latest deployment
3. Click "Redeploy" to trigger a new deployment with the environment variables

## Console Errors Fixed

The following console errors have been resolved:

- ✅ **ZodError for SUPABASE_SERVICE_ROLE_KEY**: Made the service role key optional since it's only needed for server-side operations
- ✅ **Environment validation**: Updated to handle missing optional environment variables gracefully

## Other Console Warnings (Non-Critical)

These warnings are normal and don't affect functionality:

- **Referrer Policy warning**: This is from Vercel's live feedback system
- **Partitioned cookie warning**: This is from Vercel's live feedback system
- **Font preload warnings**: These are optimization suggestions for fonts

## Testing

After setting the environment variables and redeploying:

1. Check that the ZodError is gone from the browser console
2. Test authentication flows (sign up, sign in)
3. Test the application functionality

## Support

If you continue to see errors after setting the environment variables, please check:

1. All required environment variables are set correctly
2. The Supabase URL and keys are valid
3. The deployment has been redeployed after setting the variables
