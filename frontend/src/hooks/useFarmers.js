import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import farmerService from '../services/farmerService';

const useFarmers = () => {
  const { loading, error, executeApiCall } = useApi();
  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  const fetchFarmers = useCallback(async () => {
    try {
      setLoadingFarmers(true);
      const data = await executeApiCall(
        () => farmerService.getAll(),
        'Farmers loaded successfully',
        'Failed to load farmers'
      );
      setFarmers(Array.isArray(data) ? data : (data?.data || []));
      setFilteredFarmers(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Error fetching farmers:', err);
    } finally {
      setLoadingFarmers(false);
    }
  }, [executeApiCall]);

  const searchFarmers = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredFarmers(farmers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = farmers.filter(farmer =>
      farmer.name?.toLowerCase().includes(term) ||
      farmer.phone?.includes(term) ||
      farmer.village?.toLowerCase().includes(term)
    );
    
    setFilteredFarmers(filtered);
  }, [farmers]);

  const getFarmerById = useCallback((id) => {
    return farmers.find(f => f.id === id);
  }, [farmers]);

  const addFarmer = useCallback(async (farmerData) => {
    try {
      await executeApiCall(
        () => farmerService.create(farmerData),
        'Farmer added successfully',
        'Failed to add farmer'
      );
      await fetchFarmers();
    } catch (err) {
      console.error('Error adding farmer:', err);
    }
  }, [executeApiCall, fetchFarmers]);

  const updateFarmer = useCallback(async (id, farmerData) => {
    try {
      await executeApiCall(
        () => farmerService.update(id, farmerData),
        'Farmer updated successfully',
        'Failed to update farmer'
      );
      await fetchFarmers();
    } catch (err) {
      console.error('Error updating farmer:', err);
    }
  }, [executeApiCall, fetchFarmers]);

  const deleteFarmer = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => farmerService.delete(id),
        'Farmer deleted successfully',
        'Failed to delete farmer'
      );
      await fetchFarmers();
    } catch (err) {
      console.error('Error deleting farmer:', err);
    }
  }, [executeApiCall, fetchFarmers]);

  return {
    farmers,
    filteredFarmers,
    loading: loadingFarmers,
    error,
    fetchFarmers,
    searchFarmers,
    getFarmerById,
    addFarmer,
    updateFarmer,
    deleteFarmer
  };
};

export default useFarmers;
export { useFarmers };
