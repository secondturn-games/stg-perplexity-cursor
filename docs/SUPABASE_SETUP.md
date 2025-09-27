# Supabase Integration Setup

This document outlines the complete Supabase integration for the Second Turn Games marketplace.

## Overview

The Supabase integration provides:

- **Authentication**: User sign-up, sign-in, and session management
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: File uploads for images (listings, profiles, games)
- **Real-time**: Live updates for messaging and listings
- **Type Safety**: Full TypeScript support with generated types

## Files Created

### Core Configuration

- `lib/supabase.ts` - Main Supabase client configurations
- `lib/supabase/auth.ts` - Authentication utilities
- `lib/supabase/storage.ts` - File storage utilities
- `lib/supabase/errors.ts` - Error handling and user-friendly messages
- `lib/supabase/index.ts` - Central export point
- `middleware.ts` - Route protection and authentication middleware

### Database & Types

- `types/database.types.ts` - Generated TypeScript types for database
- `lib/supabase/rls-policies.sql` - Row Level Security policies
- `scripts/setup-database.sql` - Complete database schema setup

### Environment & Validation

- `lib/env.ts` - Environment variable validation (updated)
- `scripts/validate-env.js` - Environment validation script

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional API Keys
BGG_API_URL=https://api.geekdo.com/xmlapi2
MAKECOMMERCE_API_KEY=your_makecommerce_key
MAKECOMMERCE_API_URL=your_makecommerce_url

# Optional Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

# Optional Email
RESEND_API_KEY=your_resend_key
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Run Database Schema

**Option A: Complete Fresh Setup (Recommended)**
Execute the SQL in `scripts/complete-setup.sql` in your Supabase SQL editor:

```sql
-- This script safely drops all existing objects and creates everything fresh
-- No conflicts or "already exists" errors
```

**Option B: Manual Setup (if you prefer step-by-step)**

1. Run `scripts/reset-database.sql` to clean up existing objects
2. Run `scripts/setup-database.sql` to create tables and functions
3. Run `lib/supabase/rls-policies.sql` to set up security policies

### 3. Apply Row Level Security Policies

Execute the SQL in `lib/supabase/rls-policies.sql` in your Supabase SQL editor:

```sql
-- This sets up all RLS policies and storage bucket policies
```

### 4. Create Storage Buckets

The RLS policies script will create these buckets:

- `listing-images` - For listing photos
- `profile-avatars` - For user profile pictures
- `game-images` - For game cover images

## Usage Examples

### Authentication

```typescript
import { signInWithEmail, signOut, getCurrentUser } from '@/lib/supabase/auth';

// Sign in
const { data, error } = await signInWithEmail('user@example.com', 'password');

// Sign out
await signOut();

// Get current user (server-side)
const { user } = await getCurrentUser();
```

### Database Operations

```typescript
import { db } from '@/lib/supabase';

// Get listings
const { data: listings } = await db.getListings({
  status: 'active',
  limit: 20,
});

// Create listing
const { data, error } = await db.createListing({
  user_id: user.id,
  game_id: 'game-uuid',
  title: 'Great Game for Sale',
  description: 'Excellent condition',
  price: 25.0,
  condition: 'very_good',
  location: 'Tallinn, Estonia',
});
```

### File Upload

```typescript
import { imageUpload, storage } from '@/lib/supabase/storage';

// Upload listing image
const { data, error } = await imageUpload.uploadListingImage(
  listingId,
  file,
  1 // sortOrder
);

// Get public URL
const { publicUrl } = storage.getPublicUrl(
  'LISTING_IMAGES',
  'path/to/file.jpg'
);
```

### Error Handling

```typescript
import { handleAsync, parseSupabaseError } from '@/lib/supabase/errors';

// Safe async operation
const { data, error } = await handleAsync(async () => {
  return await db.createListing(listingData);
});

if (error) {
  console.error('User-friendly error:', error.message);
}
```

### Real-time Subscriptions

```typescript
import { realtime } from '@/lib/supabase';

// Subscribe to listing updates
const subscription = realtime.subscribeToListings(payload => {
  console.log('Listing updated:', payload);
});

// Subscribe to messages
const messageSubscription = realtime.subscribeToMessages(
  conversationId,
  payload => {
    console.log('New message:', payload);
  }
);
```

## Middleware Protection

The `middleware.ts` file automatically protects routes:

- **Protected routes**: `/profile`, `/sell`, `/messages`, `/dashboard`, `/admin`
- **Auth routes**: `/login`, `/register` (redirects authenticated users)
- **Public routes**: `/`, `/marketplace`, `/games`, etc.

## Type Safety

All database operations are fully typed:

```typescript
import type {
  Profile,
  Game,
  Listing,
  ListingInsert,
  GameCondition,
  ListingStatus,
} from '@/types/database.types';

// Type-safe operations
const listing: ListingInsert = {
  user_id: user.id,
  game_id: gameId,
  title: 'My Game',
  description: 'Great condition',
  price: 30.0,
  condition: 'like_new', // TypeScript enforces valid values
  status: 'active',
  location: 'Tallinn',
};
```

## Security Features

### Row Level Security (RLS)

- Users can only access their own data
- Public read access for active listings
- Secure message access based on participation
- Protected file uploads with user ownership

### Environment Validation

- All required environment variables validated at startup
- Type-safe configuration with Zod
- Clear error messages for missing variables

### Error Handling

- User-friendly error messages
- No sensitive data exposed in client
- Comprehensive error logging for debugging

## Testing

### Environment Validation

```bash
node scripts/validate-env.js
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Next Steps

1. **Set up your Supabase project** with the provided schema
2. **Configure environment variables** in `.env.local`
3. **Test authentication** with sign-up/sign-in flows
4. **Implement listing creation** with image uploads
5. **Add real-time messaging** for buyer-seller communication
6. **Set up payment integration** with makeCommerce

## Troubleshooting

### Common Issues

1. **Environment validation fails**
   - Check all required variables are set in `.env.local`
   - Ensure Supabase project is created and keys are correct

2. **Database setup errors**
   - **"trigger already exists"**: Use `scripts/reset-database.sql` first, then run setup again
   - **"policy already exists"**: Use `scripts/reset-database.sql` first, then run setup again
   - **"syntax error at or near 'order'"**: Fixed - the `order` column was renamed to `sort_order`
   - **"storage bucket already exists"**: This is handled with `ON CONFLICT DO NOTHING`

3. **RLS policies blocking access**
   - Verify user is authenticated
   - Check policy conditions match your use case
   - Review Supabase logs for policy violations

4. **File upload fails**
   - Check storage bucket policies
   - Verify file size and type restrictions
   - Ensure user has proper permissions

5. **Type errors**
   - Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts`
   - Check database schema matches TypeScript types

### Debug Mode

Set `NODE_ENV=development` to enable detailed error logging and console output.

## Support

For issues with this integration:

1. Check Supabase documentation
2. Review error logs in development mode
3. Validate environment variables
4. Test with Supabase dashboard tools
