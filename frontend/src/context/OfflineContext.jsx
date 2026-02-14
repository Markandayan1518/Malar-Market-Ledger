import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isOnline, onOnline, onOffline } from '../utils/offlineUtils';
import { getSyncQueueCount } from '../store/offlineStore';

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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync when coming back online
      syncPendingData();
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
  }, []);

  // Update sync queue count periodically
  useEffect(() => {
    updateSyncQueueCount();
    const interval = setInterval(updateSyncQueueCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updateSyncQueueCount = async () => {
    try {
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

  const value = {
    isOffline,
    syncQueueCount,
    syncPendingData,
    updateSyncQueueCount,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
