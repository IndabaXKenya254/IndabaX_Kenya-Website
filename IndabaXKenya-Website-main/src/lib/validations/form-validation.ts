/**
 * Form Validation Utilities
 * Centralized validation functions for email, phone, and other common form fields
 */

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Email validation pattern (RFC 5322 simplified)
 * Matches standard email formats
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation pattern (E.164 format)
 * Supports international phone numbers with optional + prefix
 * Examples: +254712345678, 254712345678, +1234567890
 */
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

/**
 * East African phone number pattern (flexible)
 * Supports common formats used in Kenya, Uganda, Tanzania, Rwanda, etc.
 * Examples:
 *   - 0712345678 (local format)
 *   - +254712345678 (international)
 *   - 254712345678 (without +)
 *   - 0712 345 678 (with spaces)
 *   - +254 712 345 678 (international with spaces)
 * Minimum 9 digits, maximum 15 digits (after removing formatting)
 */
export const PHONE_REGEX_EAST_AFRICA = /^[\+]?[0-9][\s\-\.0-9]{7,17}$/;

/**
 * More lenient phone pattern that allows common formats
 * Allows: spaces, hyphens, parentheses
 * Examples: +254 712 345 678, (254) 712-345-678, +1-234-567-8900
 */
export const PHONE_REGEX_LENIENT = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * URL validation pattern
 */
export const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email address
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number with country code requirement
 * Issue #14: When phone is provided, REQUIRE country code (+ prefix)
 * @param phone - Phone number to validate
 * @param required - Whether the field is required
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string, required = false): boolean {
  if (!phone || typeof phone !== 'string') {
    return !required; // If not required and empty, it's valid
  }

  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    return !required;
  }

  // Issue #14 FIX: REQUIRE country code (+ prefix) when phone is provided
  // Must start with + followed by country code
  if (!trimmedPhone.startsWith('+')) {
    return false;
  }

  // Use flexible format for the rest
  if (!PHONE_REGEX_EAST_AFRICA.test(trimmedPhone)) {
    return false;
  }

  // Additional check: ensure minimum 9 digits after removing formatting
  const digitsOnly = trimmedPhone.replace(/[\s\-\.\(\)\+]/g, '');
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return false;
  }

  return true;
}

/**
 * Validate phone number (lenient format - allows common formatting)
 * @param phone - Phone number to validate
 * @param required - Whether the field is required
 * @returns true if valid, false otherwise
 */
export function isValidPhoneLenient(phone: string, required = false): boolean {
  if (!phone || typeof phone !== 'string') {
    return !required;
  }

  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    return !required;
  }

  // Use flexible East African format (same as isValidPhone now)
  return isValidPhone(trimmedPhone, required);
}

/**
 * Validate URL
 * @param url - URL to validate
 * @param required - Whether the field is required
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string, required = false): boolean {
  if (!url || typeof url !== 'string') {
    return !required;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return !required;
  }

  return URL_REGEX.test(trimmedUrl);
}

/**
 * Normalize phone number to E.164 format
 * Removes spaces, hyphens, parentheses
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';

  const normalized = normalizePhone(phone);

  // If it starts with +, keep it
  if (normalized.startsWith('+')) {
    // Format as: +XXX XXX XXX XXX
    return normalized.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }

  // Otherwise format as: XXX XXX XXX XXX
  return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
}

// ============================================================================
// VALIDATION ERROR MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    example: 'e.g., john@example.com',
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Please enter a valid phone number (9-15 digits)',
    // Issue #14 FIX: Require country code
    invalidStrict: 'Phone number must include country code starting with + (e.g., +254712345678 for Kenya, +256712345678 for Uganda)',
    noCountryCode: 'Please include country code starting with + (e.g., +254 for Kenya, +256 for Uganda, +255 for Tanzania)',
    example: 'e.g., +254712345678',
  },
  url: {
    required: 'URL is required',
    invalid: 'Please enter a valid URL',
    example: 'e.g., https://example.com',
  },
  name: {
    required: 'Name is required',
    tooShort: 'Name must be at least 2 characters',
    example: 'e.g., John Doe',
  },
  password: {
    required: 'Password is required',
    tooShort: 'Password must be at least 8 characters',
    noUppercase: 'Password must contain at least one uppercase letter',
    noNumber: 'Password must contain at least one number',
    noSpecialChar: 'Password must contain at least one special character',
    example: 'e.g., MyP@ssw0rd123',
  },
  message: {
    required: 'Message is required',
    tooShort: 'Message must be at least 10 characters',
  },
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email with detailed result
 * @param email - Email to validate
 * @param required - Whether the field is required
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: string, required = true): ValidationResult {
  if (!email || !email.trim()) {
    return {
      isValid: !required,
      error: required ? VALIDATION_MESSAGES.email.required : undefined,
    };
  }

  const isValid = isValidEmail(email);
  return {
    isValid,
    error: isValid ? undefined : VALIDATION_MESSAGES.email.invalid,
  };
}

/**
 * Validate phone number with detailed result
 * @param phone - Phone number to validate
 * @param required - Whether the field is required
 * @param strict - Whether to use strict E.164 validation (default: true)
 * @returns Validation result with error message if invalid
 */
export function validatePhone(
  phone: string,
  required = false,
  strict = true
): ValidationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: !required,
      error: required ? VALIDATION_MESSAGES.phone.required : undefined,
    };
  }

  const isValid = strict ? isValidPhone(phone, required) : isValidPhoneLenient(phone, required);
  return {
    isValid,
    error: isValid
      ? undefined
      : strict
      ? VALIDATION_MESSAGES.phone.invalidStrict
      : VALIDATION_MESSAGES.phone.invalid,
  };
}

/**
 * Validate URL with detailed result
 * @param url - URL to validate
 * @param required - Whether the field is required
 * @returns Validation result with error message if invalid
 */
export function validateUrl(url: string, required = false): ValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: !required,
      error: required ? VALIDATION_MESSAGES.url.required : undefined,
    };
  }

  const isValid = isValidUrl(url, required);
  return {
    isValid,
    error: isValid ? undefined : VALIDATION_MESSAGES.url.invalid,
  };
}

/**
 * Validate name field
 * @param name - Name to validate
 * @param minLength - Minimum length (default: 2)
 * @returns Validation result with error message if invalid
 */
export function validateName(name: string, minLength = 2): ValidationResult {
  if (!name || !name.trim()) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.required,
    };
  }

  if (name.trim().length < minLength) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.tooShort,
    };
  }

  return { isValid: true };
}

/**
 * Validate password field
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.password.required,
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.password.tooShort,
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.password.noUppercase,
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.password.noNumber,
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.password.noSpecialChar,
    };
  }

  return { isValid: true };
}

/**
 * Validate message/textarea field
 * @param message - Message to validate
 * @param minLength - Minimum length (default: 10)
 * @returns Validation result with error message if invalid
 */
export function validateMessage(message: string, minLength = 10): ValidationResult {
  if (!message || !message.trim()) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.message.required,
    };
  }

  if (message.trim().length < minLength) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.message.tooShort,
    };
  }

  return { isValid: true };
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

export interface FieldValidation {
  field: string;
  value: string;
  type: 'email' | 'phone' | 'url' | 'name' | 'password' | 'message';
  required?: boolean;
  minLength?: number;
  strict?: boolean;
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate multiple fields at once
 * @param fields - Array of field validations
 * @returns Batch validation result with all errors
 */
export function validateFields(fields: FieldValidation[]): BatchValidationResult {
  const errors: Record<string, string> = {};

  fields.forEach(({ field, value, type, required, minLength, strict }) => {
    let result: ValidationResult;

    switch (type) {
      case 'email':
        result = validateEmail(value, required);
        break;
      case 'phone':
        result = validatePhone(value, required, strict);
        break;
      case 'url':
        result = validateUrl(value, required);
        break;
      case 'name':
        result = validateName(value, minLength);
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'message':
        result = validateMessage(value, minLength);
        break;
      default:
        result = { isValid: true };
    }

    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
