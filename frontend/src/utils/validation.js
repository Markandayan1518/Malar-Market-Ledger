/**
 * Validation utility functions
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @returns {boolean} True if valid
 */
export const minLength = (value, min) => {
  if (!value || typeof value !== 'string') return false;
  return value.length >= min;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid
 */
export const maxLength = (value, max) => {
  if (!value || typeof value !== 'string') return false;
  return value.length <= max;
};

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid
 */
export const isNumeric = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate positive number
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid
 */
export const isPositive = (value) => {
  return isNumeric(value) && parseFloat(value) > 0;
};

/**
 * Validate non-negative number
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid
 */
export const isNonNegative = (value) => {
  return isNumeric(value) && parseFloat(value) >= 0;
};

/**
 * Validate number in range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export const isInRange = (value, min, max) => {
  if (!isNumeric(value)) return false;
  const num = parseFloat(value);
  return num >= min && num <= max;
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * Validate date is not in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isNotFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  const d = new Date(date);
  return d <= new Date();
};

/**
 * Validate date is not in the past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isNotPastDate = (date) => {
  if (!isValidDate(date)) return false;
  const d = new Date(date);
  return d >= new Date();
};

/**
 * Validate Aadhaar number
 * @param {string} aadhaar - Aadhaar number to validate
 * @returns {boolean} True if valid
 */
export const isValidAadhaar = (aadhaar) => {
  if (!aadhaar || typeof aadhaar !== 'string') return false;
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
};

/**
 * Validate PAN number
 * @param {string} pan - PAN number to validate
 * @returns {boolean} True if valid
 */
export const isValidPAN = (pan) => {
  if (!pan || typeof pan !== 'string') return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase().replace(/\s/g, ''));
};

/**
 * Validate GST number
 * @param {string} gst - GST number to validate
 * @returns {boolean} True if valid
 */
export const isValidGST = (gst) => {
  if (!gst || typeof gst !== 'string') return false;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase().replace(/\s/g, ''));
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate form object
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with errors
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  for (const field in rules) {
    const fieldRules = rules[field];
    const value = formData[field];

    for (const rule of fieldRules) {
      const result = rule(value, formData);
      if (result !== true) {
        errors[field] = result;
        isValid = false;
        break;
      }
    }
  }

  return { isValid, errors };
};

/**
 * Create required validator
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const required = (message = 'This field is required') => {
  return (value) => {
    return isRequired(value) ? true : message;
  };
};

/**
 * Create email validator
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const email = (message = 'Invalid email address') => {
  return (value) => {
    return !isRequired(value) || isValidEmail(value) ? true : message;
  };
};

/**
 * Create phone validator
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const phone = (message = 'Invalid phone number') => {
  return (value) => {
    return !isRequired(value) || isValidPhone(value) ? true : message;
  };
};

/**
 * Create min length validator
 * @param {number} min - Minimum length
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const min = (min, message) => {
  return (value) => {
    return !isRequired(value) || minLength(value, min) ? true : (message || `Minimum ${min} characters required`);
  };
};

/**
 * Create max length validator
 * @param {number} max - Maximum length
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const max = (max, message) => {
  return (value) => {
    return !isRequired(value) || maxLength(value, max) ? true : (message || `Maximum ${max} characters allowed`);
  };
};

/**
 * Create numeric validator
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const numeric = (message = 'Must be a number') => {
  return (value) => {
    return !isRequired(value) || isNumeric(value) ? true : message;
  };
};

/**
 * Create positive validator
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const positive = (message = 'Must be a positive number') => {
  return (value) => {
    return !isRequired(value) || isPositive(value) ? true : message;
  };
};

/**
 * Create range validator
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} message - Error message
 * @returns {Function} Validator function
 */
export const range = (min, max, message) => {
  return (value) => {
    return !isRequired(value) || isInRange(value, min, max) ? true : (message || `Must be between ${min} and ${max}`);
  };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Sanitize number input
 * @param {any} input - Input to sanitize
 * @returns {number|null} Sanitized number
 */
export const sanitizeNumber = (input) => {
  if (!isNumeric(input)) return null;
  return parseFloat(input);
};
