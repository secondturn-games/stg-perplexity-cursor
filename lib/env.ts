import { z } from 'zod';

/**
 * Environment variables validation schema
 * Ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Supabase service role key is required'),

  // Application Configuration
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .default('http://localhost:3000'),

  // API Keys (Optional)
  BGG_API_URL: z.string().url().optional(),
  MAKECOMMERCE_API_KEY: z.string().optional(),
  MAKECOMMERCE_API_URL: z.string().url().optional(),

  // Analytics (Optional)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  // Email Configuration (Optional)
  RESEND_API_KEY: z.string().optional(),

  // File Upload Configuration (Optional)
  MAX_FILE_SIZE: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 5 * 1024 * 1024)), // 5MB default
  ALLOWED_FILE_TYPES: z
    .string()
    .optional()
    .default('image/jpeg,image/png,image/webp'),
});

/**
 * Validated environment variables
 * Throws an error if any required environment variables are missing or invalid
 */
export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY'],
  NODE_ENV: process.env['NODE_ENV'],
  NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  BGG_API_URL: process.env['BGG_API_URL'],
  MAKECOMMERCE_API_KEY: process.env['MAKECOMMERCE_API_KEY'],
  MAKECOMMERCE_API_URL: process.env['MAKECOMMERCE_API_URL'],
  NEXT_PUBLIC_POSTHOG_KEY: process.env['NEXT_PUBLIC_POSTHOG_KEY'],
  NEXT_PUBLIC_POSTHOG_HOST: process.env['NEXT_PUBLIC_POSTHOG_HOST'],
  RESEND_API_KEY: process.env['RESEND_API_KEY'],
  MAX_FILE_SIZE: process.env['MAX_FILE_SIZE'],
  ALLOWED_FILE_TYPES: process.env['ALLOWED_FILE_TYPES'],
});

/**
 * Type-safe environment variables for use throughout the application
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Environment validation function
 * Call this at application startup to ensure all required env vars are present
 */
export function validateEnvironment(): void {
  try {
    envSchema.parse(process.env);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
    }
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error(
      'Environment validation failed. Please check your .env file.'
    );
  }
}
