/**
 * Input validation and sanitization utilities
 * Provides security and data integrity checks
 */

// Maximum length constraints
export const MAX_LENGTHS = {
  FLIGHT_NUMBER: 10,
  LOCATION: 200,
  NAME: 100,
  EMAIL: 255,
  PHONE: 20,
  LICENSE_NUMBER: 50,
} as const;

// Flight number pattern: 2-3 letters followed by 1-4 digits (e.g., AA1234, UAL123)
const FLIGHT_NUMBER_PATTERN = /^[A-Z]{2,3}\d{1,4}$/i;

// Email pattern (RFC 5322 simplified)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number pattern (flexible: allows various formats)
const PHONE_PATTERN = /^[\d\s\-\+\(\)]+$/;

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input: string | null | undefined, maxLength?: number): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and control characters (except newlines, tabs, carriage returns)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Apply max length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize flight number
 */
export function validateFlightNumber(flightNumber: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!flightNumber) {
    return { isValid: false, sanitized: '', error: 'Flight number is required' };
  }
  
  const sanitized = sanitizeString(flightNumber, MAX_LENGTHS.FLIGHT_NUMBER).toUpperCase();
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Flight number cannot be empty' };
  }
  
  if (sanitized.length < 3 || sanitized.length > MAX_LENGTHS.FLIGHT_NUMBER) {
    return {
      isValid: false,
      sanitized,
      error: `Flight number must be between 3 and ${MAX_LENGTHS.FLIGHT_NUMBER} characters`,
    };
  }
  
  if (!FLIGHT_NUMBER_PATTERN.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Flight number must be 2-3 letters followed by 1-4 digits (e.g., AA1234)',
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!email) {
    return { isValid: true, sanitized: '' }; // Email is optional
  }
  
  const sanitized = sanitizeString(email, MAX_LENGTHS.EMAIL).toLowerCase();
  
  if (sanitized.length === 0) {
    return { isValid: true, sanitized: '' }; // Empty email is valid (optional field)
  }
  
  if (sanitized.length > MAX_LENGTHS.EMAIL) {
    return {
      isValid: false,
      sanitized,
      error: `Email must be no more than ${MAX_LENGTHS.EMAIL} characters`,
    };
  }
  
  if (!EMAIL_PATTERN.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Please enter a valid email address',
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize phone number
 */
export function validatePhone(phone: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!phone) {
    return { isValid: true, sanitized: '' }; // Phone is optional
  }
  
  const sanitized = sanitizeString(phone, MAX_LENGTHS.PHONE);
  
  if (sanitized.length === 0) {
    return { isValid: true, sanitized: '' }; // Empty phone is valid (optional field)
  }
  
  if (sanitized.length > MAX_LENGTHS.PHONE) {
    return {
      isValid: false,
      sanitized,
      error: `Phone number must be no more than ${MAX_LENGTHS.PHONE} characters`,
    };
  }
  
  // Remove common formatting characters for validation
  const digitsOnly = sanitized.replace(/[\s\-\+\(\)]/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return {
      isValid: false,
      sanitized,
      error: 'Phone number must contain 10-15 digits',
    };
  }
  
  if (!PHONE_PATTERN.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Phone number contains invalid characters',
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize name
 */
export function validateName(name: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!name) {
    return { isValid: false, sanitized: '', error: 'Name is required' };
  }
  
  const sanitized = sanitizeString(name, MAX_LENGTHS.NAME);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Name cannot be empty' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Name must be at least 2 characters' };
  }
  
  if (sanitized.length > MAX_LENGTHS.NAME) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, MAX_LENGTHS.NAME),
      error: `Name must be no more than ${MAX_LENGTHS.NAME} characters`,
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize location
 */
export function validateLocation(location: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!location) {
    return { isValid: false, sanitized: '', error: 'Location is required' };
  }
  
  const sanitized = sanitizeString(location, MAX_LENGTHS.LOCATION);
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Location cannot be empty' };
  }
  
  if (sanitized.length < 3) {
    return { isValid: false, sanitized, error: 'Location must be at least 3 characters' };
  }
  
  if (sanitized.length > MAX_LENGTHS.LOCATION) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, MAX_LENGTHS.LOCATION),
      error: `Location must be no more than ${MAX_LENGTHS.LOCATION} characters`,
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate number of passengers
 */
export function validatePassengers(count: number | string | null | undefined): {
  isValid: boolean;
  value: number;
  error?: string;
} {
  if (count === null || count === undefined || count === '') {
    return { isValid: false, value: 1, error: 'Number of passengers is required' };
  }
  
  const numValue = typeof count === 'number' ? count : parseInt(String(count), 10);
  
  if (isNaN(numValue)) {
    return { isValid: false, value: 1, error: 'Number of passengers must be a valid number' };
  }
  
  if (numValue < 1) {
    return { isValid: false, value: 1, error: 'Number of passengers must be at least 1' };
  }
  
  if (numValue > 100) {
    return { isValid: false, value: numValue, error: 'Number of passengers cannot exceed 100' };
  }
  
  return { isValid: true, value: numValue };
}

/**
 * Validate date is in the future (for pickup dates)
 */
export function validateFutureDate(date: Date | string | null | undefined): {
  isValid: boolean;
  date?: Date;
  error?: string;
} {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const dateOnly = new Date(dateObj);
  dateOnly.setHours(0, 0, 0, 0);
  
  // Allow dates from today onwards (not past dates)
  if (dateOnly < now) {
    return { isValid: false, date: dateObj, error: 'Date cannot be in the past' };
  }
  
  // Check reasonable future limit (e.g., 2 years)
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
  
  if (dateObj > twoYearsFromNow) {
    return { isValid: false, date: dateObj, error: 'Date cannot be more than 2 years in the future' };
  }
  
  return { isValid: true, date: dateObj };
}

/**
 * Validate recurring end date is after start date
 */
export function validateRecurringEndDate(
  startDate: Date | string,
  endDate: Date | string | null | undefined
): {
  isValid: boolean;
  date?: Date;
  error?: string;
} {
  if (!endDate) {
    return { isValid: false, error: 'Recurring end date is required' };
  }
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  if (end <= start) {
    return { isValid: false, date: end, error: 'End date must be after start date' };
  }
  
  // Check reasonable limit (e.g., 5 years)
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
  
  if (end > fiveYearsFromNow) {
    return { isValid: false, date: end, error: 'End date cannot be more than 5 years in the future' };
  }
  
  return { isValid: true, date: end };
}

/**
 * Format flight number for display (adds space if needed)
 */
export function formatFlightNumber(flightNumber: string): string {
  const validated = validateFlightNumber(flightNumber);
  if (!validated.isValid) {
    return flightNumber; // Return original if invalid
  }
  
  // Format: AA 1234 -> AA1234 (already formatted by validation)
  return validated.sanitized;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const validated = validatePhone(phone);
  if (!validated.isValid) {
    return phone; // Return original if invalid
  }
  
  const digits = validated.sanitized.replace(/\D/g, '');
  
  // Format US numbers: (123) 456-7890
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Format international: +1 (123) 456-7890
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return as-is if not standard format
  return validated.sanitized;
}

/**
 * Validate URL (for logo URLs, etc.)
 */
export function validateUrl(url: string | null | undefined): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!url) {
    return { isValid: true, sanitized: '' }; // URL is optional
  }
  
  const sanitized = sanitizeString(url, 2048); // Max URL length
  
  if (sanitized.length === 0) {
    return { isValid: true, sanitized: '' }; // Empty URL is valid (optional field)
  }
  
  // Basic URL pattern validation
  try {
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        sanitized,
        error: 'URL must use http:// or https:// protocol',
      };
    }
    
    // Check for suspicious patterns (basic XSS prevention)
    if (sanitized.includes('javascript:') || sanitized.includes('data:') || sanitized.includes('vbscript:')) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Invalid URL format',
      };
    }
    
    return { isValid: true, sanitized };
  } catch {
    return {
      isValid: false,
      sanitized,
      error: 'Please enter a valid URL (e.g., https://onyxdispatch.us/logo.png)',
    };
  }
}
