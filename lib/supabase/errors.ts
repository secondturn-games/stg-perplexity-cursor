/**
 * Error handling utilities for Supabase operations
 * Provides consistent error handling and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Database errors
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  DB_FOREIGN_KEY_VIOLATION: 'DB_FOREIGN_KEY_VIOLATION',
  DB_UNIQUE_VIOLATION: 'DB_UNIQUE_VIOLATION',
  DB_NOT_NULL_VIOLATION: 'DB_NOT_NULL_VIOLATION',
  DB_CHECK_VIOLATION: 'DB_CHECK_VIOLATION',
  DB_ROW_NOT_FOUND: 'DB_ROW_NOT_FOUND',
  DB_MULTIPLE_ROWS: 'DB_MULTIPLE_ROWS',

  // Storage errors
  STORAGE_FILE_NOT_FOUND: 'STORAGE_FILE_NOT_FOUND',
  STORAGE_FILE_TOO_LARGE: 'STORAGE_FILE_TOO_LARGE',
  STORAGE_INVALID_FILE_TYPE: 'STORAGE_INVALID_FILE_TYPE',
  STORAGE_UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED',
  STORAGE_DELETE_FAILED: 'STORAGE_DELETE_FAILED',

  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_TOO_LONG: 'VALIDATION_TOO_LONG',
  VALIDATION_TOO_SHORT: 'VALIDATION_TOO_SHORT',

  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication errors
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]:
    'Invalid email or password. Please try again.',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]:
    'No account found with this email address.',
  [ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED]:
    'Please check your email and click the confirmation link.',
  [ERROR_CODES.AUTH_WEAK_PASSWORD]:
    'Password must be at least 6 characters long.',
  [ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]:
    'An account with this email already exists.',
  [ERROR_CODES.AUTH_INVALID_EMAIL]: 'Please enter a valid email address.',
  [ERROR_CODES.AUTH_SESSION_EXPIRED]:
    'Your session has expired. Please log in again.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]:
    'You must be logged in to perform this action.',

  // Database errors
  [ERROR_CODES.DB_CONSTRAINT_VIOLATION]:
    'The data you entered violates a constraint. Please check your input.',
  [ERROR_CODES.DB_FOREIGN_KEY_VIOLATION]: 'The referenced item does not exist.',
  [ERROR_CODES.DB_UNIQUE_VIOLATION]:
    'This item already exists. Please choose a different value.',
  [ERROR_CODES.DB_NOT_NULL_VIOLATION]: 'Required field is missing.',
  [ERROR_CODES.DB_CHECK_VIOLATION]: 'The data you entered is invalid.',
  [ERROR_CODES.DB_ROW_NOT_FOUND]: 'The requested item was not found.',
  [ERROR_CODES.DB_MULTIPLE_ROWS]: 'Multiple items found when expecting one.',

  // Storage errors
  [ERROR_CODES.STORAGE_FILE_NOT_FOUND]: 'The requested file was not found.',
  [ERROR_CODES.STORAGE_FILE_TOO_LARGE]:
    'File size is too large. Maximum size is 5MB.',
  [ERROR_CODES.STORAGE_INVALID_FILE_TYPE]:
    'Invalid file type. Please upload a valid image.',
  [ERROR_CODES.STORAGE_UPLOAD_FAILED]:
    'Failed to upload file. Please try again.',
  [ERROR_CODES.STORAGE_DELETE_FAILED]:
    'Failed to delete file. Please try again.',

  // Validation errors
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'This field is required.',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]:
    'Invalid format. Please check your input.',
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Value is out of allowed range.',
  [ERROR_CODES.VALIDATION_TOO_LONG]: 'Text is too long.',
  [ERROR_CODES.VALIDATION_TOO_SHORT]: 'Text is too short.',

  // Network errors
  [ERROR_CODES.NETWORK_TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]:
    'Connection failed. Please check your internet connection.',
  [ERROR_CODES.NETWORK_SERVER_ERROR]: 'Server error. Please try again later.',

  // Generic errors
  [ERROR_CODES.UNKNOWN_ERROR]:
    'An unexpected error occurred. Please try again.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'Internal server error. Please try again later.',
};

/**
 * Parse Supabase error and return standardized error
 */
export function parseSupabaseError(error: any): AppError {
  const timestamp = new Date().toISOString();

  // Handle Supabase Auth errors
  if (error?.message?.includes('Invalid login credentials')) {
    return {
      code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('User not found')) {
    return {
      code: ERROR_CODES.AUTH_USER_NOT_FOUND,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_USER_NOT_FOUND],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('Email not confirmed')) {
    return {
      code: ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('Password should be at least')) {
    return {
      code: ERROR_CODES.AUTH_WEAK_PASSWORD,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_WEAK_PASSWORD],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('User already registered')) {
    return {
      code: ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('Invalid email')) {
    return {
      code: ERROR_CODES.AUTH_INVALID_EMAIL,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_EMAIL],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('JWT expired')) {
    return {
      code: ERROR_CODES.AUTH_SESSION_EXPIRED,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_SESSION_EXPIRED],
      details: error,
      timestamp,
    };
  }

  // Handle PostgreSQL errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return {
          code: ERROR_CODES.DB_UNIQUE_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.DB_UNIQUE_VIOLATION],
          details: error,
          timestamp,
        };
      case '23503': // foreign_key_violation
        return {
          code: ERROR_CODES.DB_FOREIGN_KEY_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.DB_FOREIGN_KEY_VIOLATION],
          details: error,
          timestamp,
        };
      case '23502': // not_null_violation
        return {
          code: ERROR_CODES.DB_NOT_NULL_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.DB_NOT_NULL_VIOLATION],
          details: error,
          timestamp,
        };
      case '23514': // check_violation
        return {
          code: ERROR_CODES.DB_CHECK_VIOLATION,
          message: ERROR_MESSAGES[ERROR_CODES.DB_CHECK_VIOLATION],
          details: error,
          timestamp,
        };
    }
  }

  // Handle storage errors
  if (error?.message?.includes('File not found')) {
    return {
      code: ERROR_CODES.STORAGE_FILE_NOT_FOUND,
      message: ERROR_MESSAGES[ERROR_CODES.STORAGE_FILE_NOT_FOUND],
      details: error,
      timestamp,
    };
  }

  if (error?.message?.includes('File size limit')) {
    return {
      code: ERROR_CODES.STORAGE_FILE_TOO_LARGE,
      message: ERROR_MESSAGES[ERROR_CODES.STORAGE_FILE_TOO_LARGE],
      details: error,
      timestamp,
    };
  }

  // Handle network errors
  if (error?.message?.includes('fetch')) {
    return {
      code: ERROR_CODES.NETWORK_CONNECTION_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_CONNECTION_FAILED],
      details: error,
      timestamp,
    };
  }

  // Default to unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: error,
    timestamp,
  };
}

/**
 * Create a custom error
 */
export function createError(code: ErrorCode, details?: unknown): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle async operations with error catching
 */
export async function handleAsync<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = parseSupabaseError(error);
    return { data: null, error: appError };
  }
}

/**
 * Log error for debugging (development only)
 */
export function logError(error: AppError, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[${context || 'App'}] Error:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
    });
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: AppError): string {
  return error.message;
}

/**
 * Check if error is of a specific type
 */
export function isErrorCode(error: AppError, code: ErrorCode): boolean {
  return error.code === code;
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: AppError): boolean {
  return error.code.startsWith('AUTH_');
}

/**
 * Check if error is database related
 */
export function isDatabaseError(error: AppError): boolean {
  return error.code.startsWith('DB_');
}

/**
 * Check if error is storage related
 */
export function isStorageError(error: AppError): boolean {
  return error.code.startsWith('STORAGE_');
}

/**
 * Check if error is validation related
 */
export function isValidationError(error: AppError): boolean {
  return error.code.startsWith('VALIDATION_');
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: AppError): boolean {
  return error.code.startsWith('NETWORK_');
}
