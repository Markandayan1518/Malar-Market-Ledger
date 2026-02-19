import { useState, useCallback } from 'react';
import { farmerProductService } from '../services/farmerProductService';
import { getCachedFarmerProductsByFarmer } from '../store/offlineStore';

/**
 * Custom hook for fetching and managing farmer flower suggestions
 * 
 * Used in the daily entry screen to:
 * - Auto-select flower type if farmer has only one linked flower
 * - Provide ranked suggestions based on entry history
 * 
 * Supports offline mode by falling back to IndexedDB cache
 * 
 * @returns {Object} { getSuggestedFlower, loading, error }
 */
export const useFarmerFlowerSuggestion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  /**
   * Get suggested flower for a farmer
   * Uses caching to avoid repeated API calls for the same farmer
   * Falls back to offline cache if network fails
   * 
   * @param {string} farmerId - The farmer's ID
   * @returns {Promise<Object|null>} Suggested flower data or null
   */
  const getSuggestedFlower = useCallback(async (farmerId) => {
    if (!farmerId) {
      return null;
    }

    // Check memory cache first
    if (cache[farmerId]) {
      return cache[farmerId];
    }

    setLoading(true);
    setError(null);

    try {
      const result = await farmerProductService.getSuggestedFlower(farmerId);
      
      // Cache the result in memory
      setCache(prev => ({
        ...prev,
        [farmerId]: result
      }));

      return result;
    } catch (err) {
      console.error('Error fetching flower suggestion:', err);
      setError(err.message || 'Failed to fetch suggestion');
      
      // Try offline cache as fallback
      try {
        const offlineProducts = await getCachedFarmerProductsByFarmer(farmerId);
        
        if (offlineProducts && offlineProducts.length > 0) {
          // Sort by entry_count descending to get the most common flower
          const sortedProducts = [...offlineProducts].sort(
            (a, b) => (b.entry_count || 0) - (a.entry_count || 0)
          );
          
          const topProduct = sortedProducts[0];
          
          // Build a suggestion object similar to the API response
          const offlineResult = {
            flower_type_id: topProduct.flower_type_id,
            flower_name: topProduct.flower_name || '',
            entry_count: topProduct.entry_count || 0,
            last_entry_at: topProduct.last_entry_at,
            is_offline: true, // Flag to indicate this came from offline cache
            all_products: sortedProducts.map(p => ({
              flower_type_id: p.flower_type_id,
              flower_name: p.flower_name || '',
              entry_count: p.entry_count || 0
            }))
          };
          
          // Cache the offline result
          setCache(prev => ({
            ...prev,
            [farmerId]: offlineResult
          }));
          
          console.log('Using offline cached suggestion for farmer:', farmerId);
          return offlineResult;
        }
      } catch (offlineErr) {
        console.error('Offline cache fallback also failed:', offlineErr);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  /**
   * Clear the suggestion cache (useful when farmer products are updated)
   */
  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  /**
   * Clear cache for a specific farmer
   * @param {string} farmerId - The farmer's ID
   */
  const clearFarmerCache = useCallback((farmerId) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[farmerId];
      return newCache;
    });
  }, []);

  return {
    getSuggestedFlower,
    clearCache,
    clearFarmerCache,
    loading,
    error
  };
};

export default useFarmerFlowerSuggestion;
