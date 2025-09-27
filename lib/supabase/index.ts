/**
 * Supabase integration exports
 * Central export point for all Supabase-related utilities
 */

// Main Supabase client and configuration
export * from '../supabase';

// Authentication utilities
export * from './auth';

// Storage utilities
export * from './storage';

// Error handling
export * from './errors';

// Database types
export type * from '../../types/database.types';
