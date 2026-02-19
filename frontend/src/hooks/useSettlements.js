import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import settlementService from '../services/settlementService';

/**
 * Custom hook for managing settlements data
 * Follows the same pattern as useCashAdvances
 */
const useSettlements = () => {
  const { loading, error, executeApiCall } = useApi();
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  /**
   * Fetch settlements with optional filters
   * @param {Object} filters - Filter parameters
   */
  const fetchSettlements = useCallback(async (filters = {}) => {
    try {
      setLoadingSettlements(true);
      const params = {
        page: filters.page || 1,
        page_size: filters.pageSize || 20,
        ...filters
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const result = await executeApiCall(
        () => settlementService.getAll(params),
        'Settlements loaded successfully',
        'Failed to load settlements'
      );
      
      // Handle paginated response
      const data = result?.data || result || [];
      setSettlements(Array.isArray(data) ? data : []);
      setPagination({
        page: result.page || 1,
        pageSize: result.pageSize || 20,
        total: result.total || data.length,
        totalPages: result.totalPages || 1
      });
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setSettlements([]);
    } finally {
      setLoadingSettlements(false);
    }
  }, [executeApiCall]);

  /**
   * Create a new settlement
   * @param {Object} settlementData - Settlement data
   */
  const createSettlement = useCallback(async (settlementData) => {
    try {
      await executeApiCall(
        () => settlementService.create(settlementData),
        'Settlement created successfully',
        'Failed to create settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error creating settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  /**
   * Generate a new settlement for a farmer
   * @param {string} farmerId - Farmer ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   */
  const generateSettlement = useCallback(async (farmerId, startDate, endDate) => {
    try {
      await executeApiCall(
        () => settlementService.generate(farmerId, startDate, endDate),
        'Settlement generated successfully',
        'Failed to generate settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error generating settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  /**
   * Update an existing settlement
   * @param {string} id - Settlement ID
   * @param {Object} settlementData - Updated settlement data
   */
  const updateSettlement = useCallback(async (id, settlementData) => {
    try {
      await executeApiCall(
        () => settlementService.update(id, settlementData),
        'Settlement updated successfully',
        'Failed to update settlement'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error updating settlement:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  /**
   * Approve a settlement
   * @param {string} id - Settlement ID
   */
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

  /**
   * Mark a settlement as paid
   * @param {string} id - Settlement ID
   * @param {Object} paymentData - Payment details
   */
  const markAsPaid = useCallback(async (id, paymentData = {}) => {
    try {
      await executeApiCall(
        () => settlementService.markPaid(id, paymentData),
        'Settlement marked as paid successfully',
        'Failed to mark settlement as paid'
      );
      await fetchSettlements();
    } catch (err) {
      console.error('Error marking settlement as paid:', err);
    }
  }, [executeApiCall, fetchSettlements]);

  /**
   * Delete a settlement
   * @param {string} id - Settlement ID
   */
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

  // Initial fetch on mount
  useEffect(() => {
    fetchSettlements();
  }, []);

  return {
    settlements,
    loading: loadingSettlements,
    error,
    pagination,
    fetchSettlements,
    createSettlement,
    generateSettlement,
    updateSettlement,
    approveSettlement,
    markAsPaid,
    deleteSettlement
  };
};

export default useSettlements;
export { useSettlements };
