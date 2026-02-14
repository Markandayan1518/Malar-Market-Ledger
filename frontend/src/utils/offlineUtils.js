/**
 * Offline utility functions
 */

/**
 * Check if browser is online
 * @returns {boolean} True if online
 */
export const isOnline = () => {
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  return true;
};

/**
 * Register online event listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export const onOnline = (callback) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  }
  return () => {};
};

/**
 * Register offline event listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export const onOffline = (callback) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  }
  return () => {};
};

/**
 * Register service worker
 * @param {string} scriptURL - Service worker script URL
 * @returns {Promise<ServiceWorkerRegistration>} Service worker registration
 */
export const registerServiceWorker = async (scriptURL = '/sw.js') => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(scriptURL);
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  throw new Error('Service Worker not supported');
};

/**
 * Check if service worker is registered
 * @returns {Promise<boolean>} True if registered
 */
export const isServiceWorkerRegistered = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  }
  return false;
};

/**
 * Request background sync
 * @param {string} tag - Sync tag
 * @returns {Promise<boolean>} True if sync requested
 */
export const requestBackgroundSync = async (tag) => {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    return true;
  }
  return false;
};

/**
 * Post message to service worker
 * @param {any} message - Message to send
 * @returns {Promise<void>}
 */
export const postMessageToSW = async (message) => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    }
  }
};

/**
 * Listen for messages from service worker
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export const onMessageFromSW = (callback) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      callback(event.data);
    });
    return () => {
      navigator.serviceWorker.removeEventListener('message', callback);
    };
  }
  return () => {};
};

/**
 * Get network information
 * @returns {NetworkInformation|null} Network information
 */
export const getNetworkInfo = () => {
  if ('connection' in navigator) {
    return navigator.connection;
  }
  return null;
};

/**
 * Check if connection is slow
 * @returns {boolean} True if connection is slow
 */
export const isSlowConnection = () => {
  const connection = getNetworkInfo();
  if (connection) {
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData === true;
  }
  return false;
};

/**
 * Estimate connection speed
 * @returns {string} Connection speed description
 */
export const getConnectionSpeed = () => {
  const connection = getNetworkInfo();
  if (connection) {
    if (connection.effectiveType) {
      const types = {
        'slow-2g': 'Very Slow',
        '2g': 'Slow',
        '3g': 'Medium',
        '4g': 'Fast',
      };
      return types[connection.effectiveType] || 'Unknown';
    }
    if (connection.downlink) {
      return `${connection.downlink} Mbps`;
    }
  }
  return 'Unknown';
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise<any>} Result of function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Queue operation for when online
 * @param {Function} operation - Operation to queue
 * @returns {Promise<any>} Result of operation
 */
export const queueWhenOnline = async (operation) => {
  if (isOnline()) {
    return await operation();
  }
  
  return new Promise((resolve, reject) => {
    const handleOnline = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        window.removeEventListener('online', handleOnline);
      }
    };
    
    window.addEventListener('online', handleOnline);
  });
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Store data in localStorage with expiration
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in ms
 */
export const setWithExpiration = (key, value, ttl) => {
  const item = {
    value,
    expiry: Date.now() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Get data from localStorage with expiration check
 * @param {string} key - Storage key
 * @returns {any|null} Stored value or null
 */
export const getWithExpiration = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    return null;
  }
};

/**
 * Clear expired items from localStorage
 */
export const clearExpiredItems = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    const itemStr = localStorage.getItem(key);
    if (itemStr) {
      try {
        const item = JSON.parse(itemStr);
        if (item.expiry && Date.now() > item.expiry) {
          localStorage.removeItem(key);
        }
      } catch {
        // Skip invalid JSON
      }
    }
  });
};
