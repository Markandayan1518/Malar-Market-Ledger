import { format, parseISO, isValid, addDays, startOfDay, endOfDay, isToday, isYesterday, isTomorrow } from 'date-fns';

/**
 * Format date to ISO 8601 string (YYYY-MM-DD)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} ISO 8601 date string
 */
export const formatDateToISO = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
};

/**
 * Format date for display (e.g., "Jan 15, 2024")
 * @param {Date|string} date - Date object or ISO string
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (date, locale = 'en-US') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'MMM dd, yyyy', { locale });
};

/**
 * Format date and time for display (e.g., "Jan 15, 2024 2:30 PM")
 * @param {Date|string} date - Date object or ISO string
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted date-time string
 */
export const formatDateTimeDisplay = (date, locale = 'en-US') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'MMM dd, yyyy h:mm a', { locale });
};

/**
 * Format time for display (e.g., "2:30 PM")
 * @param {Date|string} date - Date object or ISO string
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Formatted time string
 */
export const formatTimeDisplay = (date, locale = 'en-US') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'h:mm a', { locale });
};

/**
 * Get relative date description (Today, Yesterday, Tomorrow, or date)
 * @param {Date|string} date - Date object or ISO string
 * @param {string} locale - Locale code (default: 'en-US')
 * @returns {string} Relative date string
 */
export const getRelativeDate = (date, locale = 'en-US') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';

  if (isToday(d)) {
    return locale === 'ta' ? 'இன்று' : 'Today';
  }
  if (isYesterday(d)) {
    return locale === 'ta' ? 'நேற்று' : 'Yesterday';
  }
  if (isTomorrow(d)) {
    return locale === 'ta' ? 'நாளை' : 'Tomorrow';
  }
  
  return formatDateDisplay(d, locale);
};

/**
 * Get start of day in ISO format
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} ISO 8601 date-time string
 */
export const getStartOfDay = (date = new Date()) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(d).toISOString();
};

/**
 * Get end of day in ISO format
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} ISO 8601 date-time string
 */
export const getEndOfDay = (date = new Date()) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(d).toISOString();
};

/**
 * Get date range for a period (e.g., last 7 days)
 * @param {number} days - Number of days
 * @returns {Object} Start and end dates
 */
export const getDateRange = (days) => {
  const end = new Date();
  const start = addDays(end, -days);
  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end),
  };
};

/**
 * Check if date is within a range
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return isValid(d) && isValid(start) && isValid(end) && d >= start && d <= end;
};

/**
 * Get current date in ISO format
 * @returns {string} Current date in ISO 8601 format
 */
export const getCurrentDateISO = () => {
  return formatDateToISO(new Date());
};

/**
 * Parse ISO date string to Date object
 * @param {string} isoString - ISO 8601 date string
 * @returns {Date|null} Date object or null if invalid
 */
export const parseISODate = (isoString) => {
  try {
    const date = parseISO(isoString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Format date for form input (YYYY-MM-DD)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Date string for input
 */
export const formatDateForInput = (date) => {
  return formatDateToISO(date);
};

/**
 * Get list of dates between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string[]} Array of ISO date strings
 */
export const getDatesInRange = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return [];
  
  const dates = [];
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(formatDateToISO(current));
    current = addDays(current, 1);
  }
  
  return dates;
};
