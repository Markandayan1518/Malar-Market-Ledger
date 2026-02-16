import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isOnline, onOnline, onOffline } from '../utils/offlineUtils';
import { getSyncQueueCount, initDB, addToSyncQueue as addToQueue } from '../store/offlineStore';

const OfflineContext = createContext(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize IndexedDB on mount
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await initDB();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    
    initDatabase();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync when coming back online
      if (dbInitialized) {
        syncPendingData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const cleanupOnline = onOnline(handleOnline);
    const cleanupOffline = onOffline(handleOffline);

    return () => {
      cleanupOnline();
      cleanupOffline();
    };
  }, [dbInitialized]);

  // Update sync queue count periodically
  useEffect(() => {
    if (dbInitialized) {
      updateSyncQueueCount();
      const interval = setInterval(updateSyncQueueCount, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [dbInitialized]);

  const updateSyncQueueCount = async () => {
    try {
      if (!dbInitialized) return;
      const count = await getSyncQueueCount();
      setSyncQueueCount(count);
    } catch (error) {
      console.error('Failed to get sync queue count:', error);
    }
  };

  const syncPendingData = async () => {
    try {
      // Request background sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-entries');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const addToSyncQueue = async (item) => {
    if (!dbInitialized) {
      console.error('Database not initialized');
      return null;
    }
    try {
      const id = await addToQueue(item);
      await updateSyncQueueCount();
      return id;
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      return null;
    }
  };

  const value = {
    isOffline,
    syncQueueCount,
    syncPendingData,
    updateSyncQueueCount,
    addToSyncQueue,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
