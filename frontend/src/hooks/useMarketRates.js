import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import marketRateService from '../services/marketRateService';

const useMarketRates = () => {
  const { loading, error, executeApiCall } = useApi();
  const [rates, setRates] = useState([]);
  const [currentRate, setCurrentRate] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoadingRates(true);
      const data = await executeApiCall(
        () => marketRateService.getAll(),
        'Market rates loaded successfully',
        'Failed to load market rates'
      );
      setRates(data);
      
      // Set current rate (most recent)
      if (data && data.length > 0) {
        const current = data.find(r => r.is_current);
        setCurrentRate(current?.rate || data[0].rate || 0);
      }
    } catch (err) {
      console.error('Error fetching market rates:', err);
    } finally {
      setLoadingRates(false);
    }
  }, [executeApiCall]);

  const getCurrentRate = useCallback(() => {
    if (rates.length === 0) return null;
    const current = rates.find(r => r.is_current);
    return current?.rate || rates[0]?.rate || 0;
  }, [rates]);

  const addRate = useCallback(async (rateData) => {
    try {
      await executeApiCall(
        () => marketRateService.create(rateData),
        'Market rate added successfully',
        'Failed to add market rate'
      );
      await fetchRates();
    } catch (err) {
      console.error('Error adding market rate:', err);
    }
  }, [executeApiCall, fetchRates]);

  const updateRate = useCallback(async (id, rateData) => {
    try {
      await executeApiCall(
        () => marketRateService.update(id, rateData),
        'Market rate updated successfully',
        'Failed to update market rate'
      );
      await fetchRates();
    } catch (err) {
      console.error('Error updating market rate:', err);
    }
  }, [executeApiCall, fetchRates]);

  const deleteRate = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => marketRateService.delete(id),
        'Market rate deleted successfully',
        'Failed to delete market rate'
      );
      await fetchRates();
    } catch (err) {
      console.error('Error deleting market rate:', err);
    }
  }, [executeApiCall, fetchRates]);

  const setCurrentRateAsCurrent = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => marketRateService.setCurrent(id),
        'Current rate updated successfully',
        'Failed to update current rate'
      );
      await fetchRates();
    } catch (err) {
      console.error('Error setting current rate:', err);
    }
  }, [executeApiCall, fetchRates]);

  return {
    rates,
    currentRate,
    loading: loadingRates,
    error,
    fetchRates,
    getCurrentRate,
    addRate,
    updateRate,
    deleteRate,
    setCurrentRateAsCurrent
  };
};

export default useMarketRates;
export { useMarketRates };
