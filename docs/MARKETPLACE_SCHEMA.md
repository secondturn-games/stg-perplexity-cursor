# Second Turn Games - Marketplace Database Schema

## Overview

This document describes the complete database schema for the Second Turn Games marketplace, designed specifically for the Baltic market (Estonia, Latvia, Lithuania) with GDPR compliance and modern e-commerce features.

## Schema Architecture

### Core Design Principles

- **GDPR Compliance**: All user data can be exported and anonymized
- **Baltic Market Focus**: Location support for EST/LVA/LTU with EUR currency
- **Performance Optimized**: Comprehensive indexing for fast queries
- **Security First**: Row Level Security (RLS) on all tables
- **Scalable**: Designed for growth with proper normalization

## Database Tables

### 1. Profiles Table (`profiles`)

Extends Supabase's `auth.users` table with marketplace-specific user information.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    location TEXT CHECK (location IN ('EST', 'LVA', 'LTU', 'EU', 'OTHER')),
    phone VARCHAR(20),
    reputation_score INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}',
    notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**

- Baltic location support (EST/LVA/LTU)
- Reputation system for user trust
- Privacy and notification preferences
- GDPR-compliant data structure

### 2. Games Table (`games`)

Caches BoardGameGeek (BGG) data to avoid API rate limits and improve performance.

```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bgg_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    year_published INTEGER,
    min_players INTEGER CHECK (min_players > 0),
    max_players INTEGER CHECK (max_players > 0),
    playing_time INTEGER, -- in minutes
    complexity_rating DECIMAL(2,1) CHECK (complexity_rating >= 1.0 AND complexity_rating <= 5.0),
    image_url TEXT,
    thumbnail_url TEXT,
    categories TEXT[] DEFAULT '{}',
    mechanics TEXT[] DEFAULT '{}',
    designers TEXT[] DEFAULT '{}',
    artists TEXT[] DEFAULT '{}',
    publishers TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    age_rating INTEGER,
    bgg_rating DECIMAL(3,2),
    bgg_rank INTEGER,
    weight_rating DECIMAL(2,1),
    last_bgg_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**

- Full BGG integration with caching
- Array fields for categories, mechanics, designers
- Search-optimized with trigram indexes
- Automatic sync tracking

### 3. Listings Table (`listings`)

Core marketplace listings with comprehensive condition and shipping options.

```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200),
    description TEXT CHECK (LENGTH(description) <= 2000),
    condition listing_condition NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency = 'EUR'),
    images TEXT[] DEFAULT '{}',
    location TEXT NOT NULL,
    shipping_options JSONB DEFAULT '{
        "pickup": {"available": true, "cost": 0},
        "courier": {"available": false, "cost": 0, "regions": []},
        "post": {"available": false, "cost": 0, "regions": []},
        "international": {"available": false, "cost": 0, "countries": []}
    }',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for GDPR
);
```

**Key Features:**

- EUR currency for Baltic market
- Comprehensive shipping options
- Soft delete for GDPR compliance
- View and message tracking
- Featured listings support

### 4. Conversations Table (`conversations`)

Manages buyer-seller communication threads.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    buyer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,
    is_archived_by_buyer BOOLEAN DEFAULT FALSE,
    is_archived_by_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);
```

**Key Features:**

- One conversation per listing per buyer
- Separate unread counts for buyer/seller
- Individual archiving by participants
- Message preview for quick overview

### 5. Messages Table (`messages`)

Individual messages within conversations.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
    message_type message_type DEFAULT 'text',
    metadata JSONB DEFAULT '{}', -- For offer amounts, image URLs, etc.
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**

- Multiple message types (text, offer, image, system)
- Metadata for structured data (offers, attachments)
- Read status tracking
- Edit history support

### 6. User Ratings Table (`user_ratings`)

Reputation system for marketplace trust.

```sql
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rated_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rater_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT CHECK (LENGTH(comment) <= 500),
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rated_user_id, rater_user_id, listing_id)
);
```

**Key Features:**

- One rating per transaction
- Verified purchase tracking
- Comment system for detailed feedback
- Automatic reputation score calculation

### 7. Wishlists Table (`wishlists`)

User wishlists with price alerts and preferences.

```sql
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    max_price DECIMAL(10,2) CHECK (max_price > 0),
    condition_preference listing_condition[],
    location_preference TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);
```

**Key Features:**

- Price alerts with maximum price
- Condition preferences (new, like_new, etc.)
- Location-based filtering
- Notification system integration

### 8. Payments Table (`payments`)

Payment tracking with Baltic payment providers.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency = 'EUR'),
    status payment_status DEFAULT 'pending',
    provider payment_provider NOT NULL,
    payment_intent_id TEXT,
    transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**

- Support for MakeCommerce and Stripe
- EUR currency for Baltic market
- Comprehensive status tracking
- Metadata for provider-specific data

## Enums

### Listing Condition

```sql
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'very_good', 'good', 'fair', 'poor');
```

### Message Type

```sql
CREATE TYPE message_type AS ENUM ('text', 'offer', 'image', 'system');
```

### Payment Status

```sql
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
```

### Payment Provider

```sql
CREATE TYPE payment_provider AS ENUM ('makecommerce', 'stripe');
```

### User Location

```sql
CREATE TYPE user_location AS ENUM ('EST', 'LVA', 'LTU', 'EU', 'OTHER');
```

### Shipping Method

```sql
CREATE TYPE shipping_method AS ENUM ('pickup', 'courier', 'post', 'international');
```

## Indexes

### Performance Indexes

The schema includes comprehensive indexing for optimal query performance:

- **Text Search**: Trigram indexes on titles for fast search
- **Array Fields**: GIN indexes on categories, mechanics, designers
- **Foreign Keys**: All foreign key relationships indexed
- **Filtering**: Indexes on active listings, featured items, price ranges
- **Sorting**: Indexes on created_at, last_message_at, reputation_score

### Key Indexes

```sql
-- Fast text search
CREATE INDEX idx_games_title_trgm ON games USING gin(title gin_trgm_ops);
CREATE INDEX idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);

-- Array field search
CREATE INDEX idx_games_categories ON games USING gin(categories);
CREATE INDEX idx_games_mechanics ON games USING gin(mechanics);

-- Active listings
CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_listings_featured ON listings(is_featured) WHERE is_featured = TRUE;

-- Performance queries
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_profiles_reputation ON profiles(reputation_score DESC);
```

## Functions and Triggers

### Utility Functions

1. **`update_conversation_last_message()`**: Updates conversation metadata when new messages are added
2. **`increment_listing_view_count()`**: Tracks listing views
3. **`update_user_reputation()`**: Calculates reputation scores from ratings
4. **`can_user_rate()`**: Validates if a user can rate another (completed transaction required)

### GDPR Functions

1. **`anonymize_user_data(p_user_id)`**: Anonymizes user data for GDPR deletion
2. **`export_user_data(p_user_id)`**: Exports all user data for GDPR access requests

### Triggers

- **Message triggers**: Automatically update conversation metadata
- **Rating triggers**: Automatically update user reputation scores
- **View tracking**: Increment listing view counts
- **Timestamp updates**: Automatic updated_at field maintenance

## Row Level Security (RLS)

### Security Policies

All tables have comprehensive RLS policies for GDPR compliance and data security:

#### Profiles

- Public read access for marketplace visibility
- Users can only modify their own profiles

#### Games

- Public read access for all games
- Admin-only write access

#### Listings

- Public read access for active listings
- Users can only manage their own listings

#### Conversations & Messages

- Users can only access conversations they participate in
- Message sending restricted to conversation participants

#### User Ratings

- Public read access for transparency
- Users can only rate others after completed transactions
- Users can modify/delete their own ratings

#### Wishlists

- Users can only access their own wishlists

#### Payments

- Users can only access their own payment records

## GDPR Compliance

### Data Export

The `export_user_data()` function provides complete data export for GDPR Article 20 (Right to data portability).

### Data Anonymization

The `anonymize_user_data()` function provides data anonymization for GDPR Article 17 (Right to erasure) while preserving marketplace integrity.

### Soft Deletes

Listings use soft deletes (`deleted_at`) to maintain data integrity while respecting user deletion requests.

## Setup Instructions

### 1. Initial Setup

Run the basic database setup first:

```bash
# Run in Supabase SQL Editor
\i scripts/setup-database.sql
```

### 2. Marketplace Schema

Apply the complete marketplace schema:

```bash
# Run in Supabase SQL Editor
\i scripts/marketplace-schema.sql
```

### 3. Migration (if upgrading)

If you have existing data, use the migration script:

```bash
# Run in Supabase SQL Editor
\i scripts/migrations/001_initial_marketplace_schema.sql
```

### 4. RLS Policies

Apply the security policies:

```bash
# Run in Supabase SQL Editor
\i lib/supabase/rls-policies.sql
```

## Usage Examples

### Creating a Listing

```typescript
const { data, error } = await supabase.from('listings').insert({
  game_id: 'game-uuid',
  seller_id: user.id,
  title: 'Catan - Like New',
  description: 'Played only twice, excellent condition',
  condition: 'like_new',
  price: 35.0,
  currency: 'EUR',
  location: 'Tallinn, Estonia',
  images: ['https://example.com/image1.jpg'],
  shipping_options: {
    pickup: { available: true, cost: 0 },
    courier: { available: true, cost: 5.0, regions: ['EST', 'LVA'] },
  },
});
```

### Searching Games

```typescript
const { data, error } = await supabase
  .from('games')
  .select('*')
  .textSearch('title', 'Catan')
  .contains('categories', ['Strategy'])
  .gte('min_players', 2)
  .lte('max_players', 4);
```

### Creating a Conversation

```typescript
const { data, error } = await supabase.from('conversations').insert({
  listing_id: 'listing-uuid',
  buyer_id: user.id,
  seller_id: 'seller-uuid',
});
```

### Adding a Rating

```typescript
const { data, error } = await supabase.from('user_ratings').insert({
  rated_user_id: 'seller-uuid',
  rater_user_id: user.id,
  listing_id: 'listing-uuid',
  rating: 5,
  comment: 'Great seller, fast shipping!',
  is_verified_purchase: true,
});
```

## Performance Considerations

### Query Optimization

- Use indexes for filtering and sorting
- Limit result sets with pagination
- Use select() to fetch only needed columns

### Caching Strategy

- Games table caches BGG data to avoid API calls
- Consider Redis for frequently accessed data
- Use Supabase's built-in caching for real-time subscriptions

### Monitoring

- Monitor query performance with Supabase dashboard
- Set up alerts for slow queries
- Track RLS policy performance

## Security Best Practices

### Authentication

- Always validate user authentication before database operations
- Use Supabase's built-in auth helpers
- Implement proper session management

### Data Validation

- Validate all inputs on both client and server
- Use TypeScript for type safety
- Implement proper error handling

### Privacy

- Respect user privacy settings
- Implement proper consent mechanisms
- Regular data retention audits

## Maintenance

### Regular Tasks

- Monitor database performance
- Update BGG data regularly
- Clean up expired listings
- Archive old conversations

### Backup Strategy

- Regular database backups
- Test restore procedures
- Monitor backup integrity

### Updates

- Keep Supabase client libraries updated
- Monitor for schema changes
- Test migrations in staging first

---

This schema provides a solid foundation for a modern, GDPR-compliant marketplace specifically designed for the Baltic board game community. The comprehensive indexing, security policies, and utility functions ensure both performance and compliance with European data protection regulations.
