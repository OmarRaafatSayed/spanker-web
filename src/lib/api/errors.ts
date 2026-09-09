/**
 * API Error Handling
 * 
 * Standardized error classes and HTTP status code mapping
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Specific Error Classes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RPC Error Code Mapping (from Supabase RPC functions)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Maps RPC error codes to HTTP status codes and user-friendly messages
 */
export const RPC_ERROR_MAP: Record<
  string,
  { statusCode: number; message: string }
> = {
  // Auth errors
  PROFILE_INCOMPLETE: {
    statusCode: 403,
    message: 'Complete your profile before making a booking',
  },
  NOT_AUTHENTICATED: {
    statusCode: 401,
    message: 'Authentication required',
  },
  ACCESS_DENIED: {
    statusCode: 403,
    message: 'Access denied',
  },
  STAFF_ONLY: {
    statusCode: 403,
    message: 'Staff access required',
  },

  // Booking errors
  NO_AVAILABILITY: {
    statusCode: 409,
    message: 'No availability for selected dates/options',
  },
  INSUFFICIENT_SEATS: {
    statusCode: 409,
    message: 'Not enough seats available',
  },
  INSUFFICIENT_ROOMS: {
    statusCode: 409,
    message: 'Not enough rooms available',
  },
  INSUFFICIENT_SPOTS: {
    statusCode: 409,
    message: 'Not enough spots available for this trip',
  },
  BOOKING_NOT_FOUND: {
    statusCode: 404,
    message: 'Booking not found',
  },
  INVALID_BOOKING_STATUS: {
    statusCode: 400,
    message: 'Invalid booking status for this operation',
  },

  // Flight errors
  FLIGHT_NOT_FOUND: {
    statusCode: 404,
    message: 'Flight not found',
  },
  FLIGHT_DISABLED: {
    statusCode: 410,
    message: 'Flight is no longer available',
  },

  // Hotel errors
  HOTEL_NOT_FOUND: {
    statusCode: 404,
    message: 'Hotel not found',
  },
  INVALID_DATE_RANGE: {
    statusCode: 400,
    message: 'Invalid date range',
  },

  // Visa errors
  VISA_NOT_FOUND: {
    statusCode: 404,
    message: 'Visa program not found',
  },
  PASSPORT_EXPIRY_INVALID: {
    statusCode: 400,
    message: 'Passport validity does not meet requirements',
  },
  NATIONALITY_NOT_ELIGIBLE: {
    statusCode: 403,
    message: 'Your nationality is not eligible for this visa program',
  },

  // Trip errors
  TRIP_NOT_FOUND: {
    statusCode: 404,
    message: 'Trip not found',
  },
  TRIP_FULL: {
    statusCode: 409,
    message: 'Trip is fully booked',
  },
  TRIP_DEPARTED: {
    statusCode: 410,
    message: 'Trip has already departed',
  },

  // Payment errors
  PAYMENT_NOT_FOUND: {
    statusCode: 404,
    message: 'Payment not found',
  },
  PAYMENT_ALREADY_CONFIRMED: {
    statusCode: 409,
    message: 'Payment already confirmed',
  },

  // Validation errors
  INVALID_INPUT: {
    statusCode: 400,
    message: 'Invalid input data',
  },
  MISSING_REQUIRED_FIELD: {
    statusCode: 400,
    message: 'Required field missing',
  },
};

/**
 * Convert RPC error response to AppError
 */
export function handleRPCError(rpcResult: {
  ok: boolean;
  code?: string;
  message?: string;
  data?: unknown;
}): never {
  const errorCode = rpcResult.code || 'UNKNOWN_ERROR';
  const errorMapping = RPC_ERROR_MAP[errorCode];

  if (errorMapping) {
    throw new AppError(
      rpcResult.message || errorMapping.message,
      errorMapping.statusCode,
      errorCode,
      rpcResult.data
    );
  }

  // Unknown error
  throw new AppError(
    rpcResult.message || 'Operation failed',
    500,
    errorCode,
    rpcResult.data
  );
}
