import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useOffline } from '../context/OfflineContext';
import dailyEntryService from '../services/dailyEntryService';
import { format } from 'date-fns';

const useDailyEntries = () => {
  const { loading, error, executeApiCall } = useApi();
  const { isOnline, addToSyncQueue } = useOffline();
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const fetchEntries = useCallback(async (date) => {
    try {
      setLoadingEntries(true);
      const data = await executeApiCall(
        () => dailyEntryService.getByDate(date),
        'Entries loaded successfully',
        'Failed to load entries'
      );
      setEntries(data);
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  }, [executeApiCall]);

  const addEntry = useCallback(async (entryData) => {
    try {
      if (isOnline) {
        await executeApiCall(
          () => dailyEntryService.create(entryData),
          'Entry saved successfully',
          'Failed to save entry'
        );
      } else {
        // Queue for offline sync
        addToSyncQueue({
          type: 'daily_entry',
          action: 'create',
          data: entryData
        });
      }
      
      // Optimistically update local state
      setEntries(prev => [...prev, { ...entryData, id: `temp-${Date.now()}`, isNew: true }]);
    } catch (err) {
      console.error('Error adding entry:', err);
    }
  }, [executeApiCall, isOnline, addToSyncQueue]);

  const updateEntry = useCallback(async (id, entryData) => {
    try {
      if (isOnline) {
        await executeApiCall(
          () => dailyEntryService.update(id, entryData),
          'Entry updated successfully',
          'Failed to update entry'
        );
      } else {
        addToSyncQueue({
          type: 'daily_entry',
          action: 'update',
          data: { id, ...entryData }
        });
      }
      
      setEntries(prev => prev.map(e => 
        e.id === id ? { ...e, ...entryData } : e
      ));
    } catch (err) {
      console.error('Error updating entry:', err);
    }
  }, [executeApiCall, isOnline, addToSyncQueue]);

  const deleteEntry = useCallback(async (id) => {
    try {
      if (isOnline) {
        await executeApiCall(
          () => dailyEntryService.delete(id),
          'Entry deleted successfully',
          'Failed to delete entry'
        );
      } else {
        addToSyncQueue({
          type: 'daily_entry',
          action: 'delete',
          data: { id }
        });
      }
      
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  }, [executeApiCall, isOnline, addToSyncQueue]);

  const getTodayStats = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntries = entries.filter(e => 
      e.date === today && !e.isNew
    );
    
    const totalWeight = todayEntries.reduce((sum, e) => sum + (parseFloat(e.weight) || 0), 0);
    const totalAmount = todayEntries.reduce((sum, e) => sum + (parseFloat(e.total) || 0), 0);
    
    return {
      count: todayEntries.length,
      totalWeight: totalWeight.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  }, [entries]);

  return {
    entries,
    loading: loadingEntries,
    error,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getTodayStats
  };
};

export default useDailyEntries;
