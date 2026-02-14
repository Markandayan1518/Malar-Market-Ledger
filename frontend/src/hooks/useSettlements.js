import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import settlementService from '../services/settlementService';

const useSettlements = () => {
  const { loading, error, executeApiCall } = useApi();
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  const fetchSettlements = useCallback(async (filters = {}) => {
    try {
      setLoadingSettlements(true);
      const data = await executeApiCall(
        () => settlementService.getAll(filters),
        'Settlements loaded successfully',
        'Failed to load settlements'
      );
      setSettlements(data);
    } catch (err) {
      console.error('Error fetching settlements:', err);
    } finally {
      setLoadingSettlements(false);
    }
  }, [executeApiCall]);

  const generateSettlement = useCallback(async (settlementData) => {
    try {
      await executeApiCall(
        () => settlementService.generate(settlementData),
        'Settlement generated successfully',
        'Failed to generate settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error generating settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  const approveSettlement = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => settlementService.approve(id),
        'Settlement approved successfully',
        'Failed to approve settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error approving settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  const markAsPaid = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => settlementService.markAsPaid(id),
        'Settlement marked as paid successfully',
        'Failed to mark settlement as paid'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error marking settlement as paid:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  const deleteSettlement = useCallback(async (id) => {
    try {
      await executeApiCall(
        () => settlementService.delete(id),
        'Settlement deleted successfully',
        'Failed to delete settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error deleting settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  return {
    settlements,
    loading: loadingSettlements,
    error,
    fetchSettlements,
    generateSettlement,
    approveSettlement,
    markAsPaid,
    deleteSettlement
  };
};

export default useSettlements;
export { useSettlements };
