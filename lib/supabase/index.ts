/**
 * Supabase integration exports
 * Central export point for all Supabase-related utilities
 */

// Main Supabase client and configuration
export * from '../supabase';

// Authentication utilities
export {
  signInWithEmail,
  signUpWithProfile,
  signInWithGoogle,
  signOut,
  updateProfile,
  updatePassword,
  createClientClient as createAuthClient,
} from './auth-client';
export * from './server-auth';

// Storage utilities are already exported from the main supabase file

// Error handling
export * from './errors';

// Database types are already exported from the main supabase file
