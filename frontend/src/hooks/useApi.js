import { useState, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useOffline } from '../context/OfflineContext';
import api from '../services/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();
  const { isOffline, addToSyncQueue } = useOffline();

  const executeApiCall = useCallback(async (apiCall, successMessage, errorMessage) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (!isOffline) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: successMessage
        });
      } else {
        // Queue for offline sync
        addToSyncQueue({
          type: 'api',
          endpoint: apiCall.name,
          data: result
        });
        
        addNotification({
          type: 'info',
          title: 'Offline Mode',
          message: 'Request queued for sync when online'
        });
      }
      
      return result;
    } catch (err) {
      const errorMsg = errorMessage || err.message || 'An error occurred';
      setError(errorMsg);
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMsg
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isOffline, addNotification, addToSyncQueue]);

  return {
    loading,
    error,
    executeApiCall
  };
};

export default useApi;
export { useApi };
