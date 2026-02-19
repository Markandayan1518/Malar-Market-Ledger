/**
 * Unit tests for useFarmerFlowerSuggestion hook
 * Tests online/offline fallback logic and caching behavior
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFarmerFlowerSuggestion } from '../useFarmerFlowerSuggestion';
import { farmerProductService } from '../../services/farmerProductService';
import { getCachedFarmerProductsByFarmer } from '../../store/offlineStore';

// Mock dependencies
jest.mock('../../services/farmerProductService');
jest.mock('../../store/offlineStore');

describe('useFarmerFlowerSuggestion Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSuggestedFlower - Online Mode', () => {
    it('should return suggestion from API when online', async () => {
      const mockSuggestion = {
        flower_type_id: 'flower-1',
        flower_name: 'Jasmine',
        entry_count: 10,
        is_offline: false
      };

      farmerProductService.getSuggestedFlower.mockResolvedValueOnce(mockSuggestion);
      getCachedFarmerProductsByFarmer.mockResolvedValue([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion).toEqual(mockSuggestion);
      expect(farmerProductService.getSuggestedFlower).toHaveBeenCalledWith('farmer-1');
    });

    it('should cache the result in memory', async () => {
      const mockSuggestion = {
        flower_type_id: 'flower-1',
        flower_name: 'Jasmine',
      };

      farmerProductService.getSuggestedFlower.mockResolvedValueOnce(mockSuggestion);
      getCachedFarmerProductsByFarmer.mockResolvedValue([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      // First call
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      // Second call should use cache
      await act(async () => {
        const cached = await result.current.getSuggestedFlower('farmer-1');
        expect(cached).toEqual(mockSuggestion);
      });

      // API should only be called once
      expect(farmerProductService.getSuggestedFlower).toHaveBeenCalledTimes(1);
    });

    it('should return null for null farmerId', async () => {
      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      const suggestion = await result.current.getSuggestedFlower(null);

      expect(suggestion).toBeNull();
      expect(farmerProductService.getSuggestedFlower).not.toHaveBeenCalled();
    });

    it('should return null for empty farmerId', async () => {
      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      const suggestion = await result.current.getSuggestedFlower('');

      expect(suggestion).toBeNull();
    });
  });

  describe('getSuggestedFlower - Offline Fallback', () => {
    it('should fallback to offline cache when API fails', async () => {
      // API fails
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));

      // Offline cache has data
      const mockOfflineProducts = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10, flower_name: 'Jasmine' },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 5, flower_name: 'Rose' },
      ];
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce(mockOfflineProducts);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion.is_offline).toBe(true);
      expect(suggestion.flower_type_id).toBe('flower-1'); // Highest entry_count
      expect(suggestion.flower_name).toBe('Jasmine');
      expect(getCachedFarmerProductsByFarmer).toHaveBeenCalledWith('farmer-1');
    });

    it('should sort offline products by entry_count descending', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));

      // Products not sorted by entry_count
      const mockOfflineProducts = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-3', entry_count: 3, flower_name: 'Marigold' },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 15, flower_name: 'Jasmine' },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 7, flower_name: 'Rose' },
      ];
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce(mockOfflineProducts);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      // Should return the one with highest entry_count
      expect(suggestion.flower_type_id).toBe('flower-1');
      expect(suggestion.entry_count).toBe(15);
    });

    it('should include all_products in offline result', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));

      const mockOfflineProducts = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10, flower_name: 'Jasmine' },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 5, flower_name: 'Rose' },
      ];
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce(mockOfflineProducts);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion.all_products).toHaveLength(2);
      expect(suggestion.all_products[0].entry_count).toBeGreaterThanOrEqual(
        suggestion.all_products[1].entry_count
      );
    });

    it('should return null when both API and offline cache fail', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));
      getCachedFarmerProductsByFarmer.mockRejectedValueOnce(new Error('IndexedDB error'));

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion).toBeNull();
    });

    it('should return null when offline cache is empty', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion).toBeNull();
    });

    it('should handle products with missing entry_count', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));

      const mockOfflineProducts = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', flower_name: 'Jasmine' }, // No entry_count
      ];
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce(mockOfflineProducts);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      let suggestion;
      await act(async () => {
        suggestion = await result.current.getSuggestedFlower('farmer-1');
      });

      expect(suggestion).not.toBeNull();
      expect(suggestion.entry_count).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should set loading to true during fetch', async () => {
      let resolveApi;
      farmerProductService.getSuggestedFlower.mockImplementation(() => 
        new Promise(resolve => { resolveApi = resolve; })
      );
      getCachedFarmerProductsByFarmer.mockResolvedValue([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      const promise = act(async () => {
        result.current.getSuggestedFlower('farmer-1');
      });

      // Loading should be true during fetch
      expect(result.current.loading).toBe(true);

      // Resolve the API call
      await act(async () => {
        resolveApi({ flower_type_id: 'flower-1' });
      });

      await promise;

      // Loading should be false after fetch
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should set error when API fails and no offline data', async () => {
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should clear error on successful fetch', async () => {
      // First call fails
      farmerProductService.getSuggestedFlower.mockRejectedValueOnce(new Error('Network error'));
      getCachedFarmerProductsByFarmer.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      expect(result.current.error).toBe('Network error');

      // Second call succeeds
      farmerProductService.getSuggestedFlower.mockResolvedValueOnce({ flower_type_id: 'flower-1' });

      await act(async () => {
        await result.current.getSuggestedFlower('farmer-2');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('clearCache should clear all cached suggestions', async () => {
      const mockSuggestion = { flower_type_id: 'flower-1' };
      farmerProductService.getSuggestedFlower.mockResolvedValue(mockSuggestion);
      getCachedFarmerProductsByFarmer.mockResolvedValue([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      // Cache a suggestion
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Next call should hit API again
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      expect(farmerProductService.getSuggestedFlower).toHaveBeenCalledTimes(2);
    });

    it('clearFarmerCache should clear only specific farmer', async () => {
      farmerProductService.getSuggestedFlower.mockResolvedValue({ flower_type_id: 'flower-1' });
      getCachedFarmerProductsByFarmer.mockResolvedValue([]);

      const { result } = renderHook(() => useFarmerFlowerSuggestion());

      // Cache two farmers
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
        await result.current.getSuggestedFlower('farmer-2');
      });

      // Clear only farmer-1
      act(() => {
        result.current.clearFarmerCache('farmer-1');
      });

      // farmer-1 should hit API again
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-1');
      });

      // farmer-2 should use cache
      await act(async () => {
        await result.current.getSuggestedFlower('farmer-2');
      });

      // farmer-1: 2 calls, farmer-2: 1 call
      expect(farmerProductService.getSuggestedFlower).toHaveBeenCalledTimes(3);
    });
  });
});
