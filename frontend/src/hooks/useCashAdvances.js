import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import cashAdvanceService from '../services/cashAdvanceService';

const useCashAdvances = () => {
  const { loading, error, executeApiCall } = useApi();
  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);

  const fetchAdvances = useCallback(async (filters = {}) => {
    try {
      setLoadingAdvances(true);
      const data = await executeApiCall(
        () => cashAdvanceService.getAll(filters),
        'Cash advances loaded successfully',
        'Failed to load cash advances'
      );
      setAdvances(data);
    } catch (err) {
      console.error('Error fetching cash advances:', err);
    } finally {
      setLoadingAdvances(false);
    }
  }, [executeApiCall]);

  const addAdvance = useCallback(async (advanceData) => {
    try {
      await executeApiCall(
        () => cashAdvanceService.create(advanceData),
        'Cash advance added successfully',
        'Failed to add cash advance'
      );
      await fetchAdvances();
    } catch (err) {
      console.error('Error adding cash advance:', err);
    }
  }, [executeApiCall, fetchAdvances]);

  const updateAdvance = useCallback(async (id, advanceData) => {
    try {
      await executeApiCall(
        () => cashAdvanceService.update(id, advanceData),
        'Cash advance updated successfully',
        'Failed to update cash advance'
      );
      await fetchAdvances();
    } catch (err) {
      console.error('Error updating cash advance:', err);
    }
  }, [executeApiCall, fetchAdvances]);

  const deleteAdvance = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => cashAdvanceService.delete(id),
        'Cash advance deleted successfully',
        'Failed to delete cash advance'
      );
      await fetchAdvances();
    } catch (err) {
      console.error('Error deleting cash advance:', err);
    }
  }, [executeApiCall, fetchAdvances]);

  const approveAdvance = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => cashAdvanceService.approve(id),
        'Cash advance approved successfully',
        'Failed to approve cash advance'
      );
      await fetchAdvances();
    } catch (err) {
      console.error('Error approving cash advance:', err);
    }
  }, [executeApiCall, fetchAdvances]);

  const rejectAdvance = useCallback(async (id, reason) => {
    try {
      await executeApiCall(
        () => cashAdvanceService.reject(id, reason),
        'Cash advance rejected successfully',
        'Failed to reject cash advance'
      );
      await fetchAdvances();
    } catch (err) {
      console.error('Error rejecting cash advance:', err);
    }
  }, [executeApiCall, fetchAdvances]);

  return {
    advances,
    loading: loadingAdvances,
    error,
    fetchAdvances,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    approveAdvance,
    rejectAdvance
  };
};

export default useCashAdvances;
