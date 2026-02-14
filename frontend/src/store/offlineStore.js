import { openDB } from 'idb';

const DB_NAME = 'MalarLedgerDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  PENDING_ENTRIES: 'pending_entries',
  FARMERS_CACHE: 'farmers_cache',
  MARKET_RATES_CACHE: 'market_rates_cache',
  SYNC_QUEUE: 'sync_queue',
};

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBDatabase>} Database instance
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, (upgradeDB) => {
    // Create stores if they don't exist
    if (!upgradeDB.objectStoreNames.contains(STORES.PENDING_ENTRIES)) {
      upgradeDB.createObjectStore(STORES.PENDING_ENTRIES, { keyPath: 'id' });
    }
    
    if (!upgradeDB.objectStoreNames.contains(STORES.FARMERS_CACHE)) {
      upgradeDB.createObjectStore(STORES.FARMERS_CACHE, { keyPath: 'id' });
    }
    
    if (!upgradeDB.objectStoreNames.contains(STORES.MARKET_RATES_CACHE)) {
      upgradeDB.createObjectStore(STORES.MARKET_RATES_CACHE, { keyPath: 'id' });
    }
    
    if (!upgradeDB.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      upgradeDB.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
    }
  });
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
  const db = await initDB();
  return db.count(STORES.SYNC_QUEUE);
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
