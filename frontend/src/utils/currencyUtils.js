/**
 * Format number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    locale = 'en-IN',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  if (typeof amount !== 'number' || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return formatted;
};

/**
 * Format number without currency symbol
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount, options = {}) => {
  return formatCurrency(amount, { ...options, showSymbol: false });
};

/**
 * Parse currency string to number
 * @param {string} value - Currency string to parse
 * @returns {number|null} Parsed number or null
 */
export const parseCurrency = (value) => {
  if (typeof value !== 'string') return null;
  
  // Remove currency symbol and commas
  const cleaned = value.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
};

/**
 * Calculate percentage change
 * @param {number} oldValue - Old value
 * @param {number} newValue - New value
 * @returns {number} Percentage change
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate total from array of amounts
 * @param {Array<number>} amounts - Array of amounts
 * @returns {number} Total amount
 */
export const calculateTotal = (amounts) => {
  if (!Array.isArray(amounts)) return 0;
  return amounts.reduce((sum, amount) => sum + (typeof amount === 'number' ? amount : 0), 0);
};

/**
 * Calculate average from array of amounts
 * @param {Array<number>} amounts - Array of amounts
 * @returns {number} Average amount
 */
export const calculateAverage = (amounts) => {
  if (!Array.isArray(amounts) || amounts.length === 0) return 0;
  return calculateTotal(amounts) / amounts.length;
};

/**
 * Calculate weighted average
 * @param {Array<{value: number, weight: number}>} items - Array of items with values and weights
 * @returns {number} Weighted average
 */
export const calculateWeightedAverage = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const item of items) {
    if (typeof item.value === 'number' && typeof item.weight === 'number') {
      weightedSum += item.value * item.weight;
      totalWeight += item.weight;
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Round to nearest specified precision
 * @param {number} value - Value to round
 * @param {number} precision - Precision (e.g., 0.01 for 2 decimal places)
 * @returns {number} Rounded value
 */
export const roundToPrecision = (value, precision = 0.01) => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.round(value / precision) * precision;
};

/**
 * Format weight in kg
 * @param {number} weight - Weight in kg
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted weight string
 */
export const formatWeight = (weight, decimals = 2) => {
  if (typeof weight !== 'number' || isNaN(weight)) return '0 kg';
  return `${weight.toFixed(decimals)} kg`;
};

/**
 * Parse weight string to number
 * @param {string} value - Weight string to parse
 * @returns {number|null} Parsed weight in kg
 */
export const parseWeight = (value) => {
  if (typeof value !== 'string') return null;
  
  const cleaned = value.replace(/[kg,\s]/gi, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
};

/**
 * Calculate total amount from weight and rate
 * @param {number} weight - Weight in kg
 * @param {number} rate - Rate per kg
 * @returns {number} Total amount
 */
export const calculateTotalAmount = (weight, rate) => {
  const w = typeof weight === 'number' ? weight : 0;
  const r = typeof rate === 'number' ? rate : 0;
  return w * r;
};

/**
 * Format amount with Indian numbering system (lakhs, crores)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount string
 */
export const formatIndianNumbering = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)} K`;
  }
  
  return formatCurrency(amount);
};

/**
 * Validate currency amount
 * @param {number} amount - Amount to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid
 */
export const isValidCurrency = (amount, options = {}) => {
  const {
    min = 0,
    max = Infinity,
    allowZero = true,
  } = options;

  if (typeof amount !== 'number' || isNaN(amount)) return false;
  if (!allowZero && amount === 0) return false;
  if (amount < min || amount > max) return false;
  
  return true;
};

/**
 * Compare two currency amounts
 * @param {number} a - First amount
 * @param {number} b - Second amount
 * @returns {number} -1 if a < b, 0 if a = b, 1 if a > b
 */
export const compareCurrency = (a, b) => {
  const numA = typeof a === 'number' ? a : 0;
  const numB = typeof b === 'number' ? b : 0;
  
  if (numA < numB) return -1;
  if (numA > numB) return 1;
  return 0;
};
