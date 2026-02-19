import { openDB, deleteDB } from 'idb';

const DB_NAME = 'MalarLedgerDB';
const DB_VERSION = 2; // Incremented to force upgrade and create missing stores

// Store names
export const STORES = {
  PENDING_ENTRIES: 'pending_entries',
  FARMERS_CACHE: 'farmers_cache',
  MARKET_RATES_CACHE: 'market_rates_cache',
  SYNC_QUEUE: 'sync_queue',
};

// Cached database instance
let dbInstance = null;
let initPromise = null;

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>} Database instance
 */
export const initDB = async () => {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }
  
  // Return existing initialization promise to prevent race conditions
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Version 1 or new database - create all stores
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains(STORES.PENDING_ENTRIES)) {
              db.createObjectStore(STORES.PENDING_ENTRIES, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.FARMERS_CACHE)) {
              db.createObjectStore(STORES.FARMERS_CACHE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.MARKET_RATES_CACHE)) {
              db.createObjectStore(STORES.MARKET_RATES_CACHE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
              db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            }
          }
          
          // Version 2 - ensure all stores exist (fix for corrupted databases)
          if (oldVersion < 2) {
            if (!db.objectStoreNames.contains(STORES.PENDING_ENTRIES)) {
              db.createObjectStore(STORES.PENDING_ENTRIES, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.FARMERS_CACHE)) {
              db.createObjectStore(STORES.FARMERS_CACHE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.MARKET_RATES_CACHE)) {
              db.createObjectStore(STORES.MARKET_RATES_CACHE, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
              db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            }
          }
        },
        blocked() {
          console.warn('IndexedDB upgrade blocked by another connection');
        },
        blocking() {
          console.warn('IndexedDB blocking another connection');
        },
        terminated() {
          console.warn('IndexedDB connection terminated');
          dbInstance = null;
          initPromise = null;
        },
      });
      
      return dbInstance;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      dbInstance = null;
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
};

/**
 * Check if a store exists in the database
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Store name to check
 * @returns {boolean} Whether the store exists
 */
const storeExists = (db, storeName) => {
  return db.objectStoreNames && db.objectStoreNames.contains(storeName);
};

/**
 * Safely perform a database operation with store validation
 * @param {string} storeName - Store name
 * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
 * @param {Function} operation - Operation to perform with the store
 * @returns {Promise<any>} Operation result
 */
const safeDBOperation = async (storeName, mode, operation) => {
  const db = await initDB();
  
  if (!storeExists(db, storeName)) {
    console.warn(`Store "${storeName}" does not exist, reinitializing database...`);
    dbInstance = null;
    const newDb = await initDB();
    
    if (!storeExists(newDb, storeName)) {
      throw new Error(`Failed to create store "${storeName}"`);
    }
  }
  
  try {
    return await operation(db);
  } catch (error) {
    // If transaction fails, try reinitializing once
    if (error.name === 'NotFoundError' || error.message.includes('object store')) {
      console.warn(`Transaction failed for "${storeName}", reinitializing...`);
      dbInstance = null;
      const newDb = await initDB();
      return await operation(newDb);
    }
    throw error;
  }
};

/**
 * Add pending entry
 * @param {Object} entry - Entry to add
 * @returns {Promise<string>} Entry ID
 */
export const addPendingEntry = async (entry) => {
  const db = await initDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add(STORES.PENDING_ENTRIES, { ...entry, id, timestamp: Date.now() });
  return id;
};

/**
 * Get all pending entries
 * @returns {Promise<Array>} Pending entries
 */
export const getPendingEntries = async () => {
  const db = await initDB();
  return db.getAll(STORES.PENDING_ENTRIES);
};

/**
 * Get pending entry by ID
 * @param {string} id - Entry ID
 * @returns {Promise<Object|null>} Entry or null
 */
export const getPendingEntry = async (id) => {
  const db = await initDB();
  return db.get(STORES.PENDING_ENTRIES, id);
};

/**
 * Update pending entry
 * @param {string} id - Entry ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export const updatePendingEntry = async (id, updates) => {
  const db = await initDB();
  const entry = await db.get(STORES.PENDING_ENTRIES, id);
  if (entry) {
    await db.put(STORES.PENDING_ENTRIES, { ...entry, ...updates });
  }
};

/**
 * Delete pending entry
 * @param {string} id - Entry ID
 * @returns {Promise<void>}
 */
export const deletePendingEntry = async (id) => {
  const db = await initDB();
  await db.delete(STORES.PENDING_ENTRIES, id);
};

/**
 * Clear all pending entries
 * @returns {Promise<void>}
 */
export const clearPendingEntries = async () => {
  const db = await initDB();
  await db.clear(STORES.PENDING_ENTRIES);
};

/**
 * Cache farmers
 * @param {Array} farmers - Farmers to cache
 * @returns {Promise<void>}
 */
export const cacheFarmers = async (farmers) => {
  const db = await initDB();
  await db.clear(STORES.FARMERS_CACHE);
  for (const farmer of farmers) {
    await db.put(STORES.FARMERS_CACHE, farmer);
  }
};

/**
 * Get cached farmers
 * @returns {Promise<Array>} Cached farmers
 */
export const getCachedFarmers = async () => {
  const db = await initDB();
  return db.getAll(STORES.FARMERS_CACHE);
};

/**
 * Get cached farmer by ID
 * @param {string} id - Farmer ID
 * @returns {Promise<Object|null>} Farmer or null
 */
export const getCachedFarmer = async (id) => {
  const db = await initDB();
  return db.get(STORES.FARMERS_CACHE, id);
};

/**
 * Cache market rates
 * @param {Array} rates - Market rates to cache
 * @returns {Promise<void>}
 */
export const cacheMarketRates = async (rates) => {
  const db = await initDB();
  await db.clear(STORES.MARKET_RATES_CACHE);
  for (const rate of rates) {
    await db.put(STORES.MARKET_RATES_CACHE, rate);
  }
};

/**
 * Get cached market rates
 * @returns {Promise<Array>} Cached market rates
 */
export const getCachedMarketRates = async () => {
  const db = await initDB();
  return db.getAll(STORES.MARKET_RATES_CACHE);
};

/**
 * Get current cached market rate
 * @returns {Promise<Object|null>} Current rate or null
 */
export const getCurrentCachedRate = async () => {
  const db = await initDB();
  const rates = await db.getAll(STORES.MARKET_RATES_CACHE);
  return rates.find(rate => rate.is_current) || null;
};

/**
 * Add item to sync queue
 * @param {Object} item - Item to sync
 * @returns {Promise<string>} Queue item ID
 */
export const addToSyncQueue = async (item) => {
  const db = await initDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await db.add(STORES.SYNC_QUEUE, { ...item, id, timestamp: Date.now() });
  return id;
};

/**
 * Get sync queue
 * @returns {Promise<Array>} Sync queue items
 */
export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll(STORES.SYNC_QUEUE);
};

/**
 * Remove item from sync queue
 * @param {string} id - Queue item ID
 * @returns {Promise<void>}
 */
export const removeFromSyncQueue = async (id) => {
  const db = await initDB();
  await db.delete(STORES.SYNC_QUEUE, id);
};

/**
 * Clear sync queue
 * @returns {Promise<void>}
 */
export const clearSyncQueue = async () => {
  const db = await initDB();
  await db.clear(STORES.SYNC_QUEUE);
};

/**
 * Get sync queue count
 * @returns {Promise<number>} Number of pending sync items
 */
export const getSyncQueueCount = async () => {
  return safeDBOperation(STORES.SYNC_QUEUE, 'readonly', async (db) => {
    return db.count(STORES.SYNC_QUEUE);
  });
};

/**
 * Clear all cached data
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
  const db = await initDB();
  await db.clear(STORES.FARMERS_CACHE);
  await db.clear(STORES.MARKET_RATES_CACHE);
};

/**
 * Get storage usage
 * @returns {Promise<Object>} Storage usage info
 */
export const getStorageUsage = async () => {
  const db = await initDB();
  
  const [pendingEntries, farmers, rates, queue] = await Promise.all([
    db.count(STORES.PENDING_ENTRIES),
    db.count(STORES.FARMERS_CACHE),
    db.count(STORES.MARKET_RATES_CACHE),
    db.count(STORES.SYNC_QUEUE),
  ]);
  
  return {
    pendingEntries,
    farmers,
    rates,
    queue,
    total: pendingEntries + farmers + rates + queue,
  };
};
