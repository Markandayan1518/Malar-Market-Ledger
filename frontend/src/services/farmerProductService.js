import api, { handleApiResponse } from './api';

/**
 * Get all flower types linked to a farmer
 * @param {string} farmerId - Farmer ID
 * @returns {Promise} List of farmer products with flower type details
 */
export const getFarmerProducts = async (farmerId) => {
  return handleApiResponse(api.get(`/farmers/${farmerId}/products`));
};

/**
 * Add flower types to a farmer's profile
 * @param {string} farmerId - Farmer ID
 * @param {string[]} flowerTypeIds - Array of flower type IDs to add
 * @returns {Promise} Response with added count
 */
export const addFarmerProducts = async (farmerId, flowerTypeIds) => {
  return handleApiResponse(
    api.post(`/farmers/${farmerId}/products`, {
      flower_type_ids: flowerTypeIds,
    })
  );
};

/**
 * Remove a flower type from a farmer's profile
 * @param {string} farmerId - Farmer ID
 * @param {string} productId - FarmerProduct ID to remove
 * @returns {Promise} Response confirming removal
 */
export const removeFarmerProduct = async (farmerId, productId) => {
  return handleApiResponse(
    api.delete(`/farmers/${farmerId}/products/${productId}`)
  );
};

/**
 * Get suggested flower for a farmer based on history
 * @param {string} farmerId - Farmer ID
 * @returns {Promise} Suggested flowers with ranking
 */
export const getSuggestedFlower = async (farmerId) => {
  return handleApiResponse(api.get(`/farmers/${farmerId}/suggested-flower`));
};

/**
 * Sync farmer products (replace all)
 * @param {string} farmerId - Farmer ID
 * @param {string[]} flowerTypeIds - Array of flower type IDs (replaces existing)
 * @returns {Promise} Response with sync result
 */
export const syncFarmerProducts = async (farmerId, flowerTypeIds) => {
  // First get existing products
  const existing = await getFarmerProducts(farmerId);
  const existingIds = (existing.products || []).map((p) => p.flower_type_id);
  
  // Find products to add and remove
  const toAdd = flowerTypeIds.filter((id) => !existingIds.includes(id));
  const toRemove = (existing.products || [])
    .filter((p) => !flowerTypeIds.includes(p.flower_type_id))
    .map((p) => p.id);
  
  // Add new products
  if (toAdd.length > 0) {
    await addFarmerProducts(farmerId, toAdd);
  }
  
  // Remove old products
  for (const productId of toRemove) {
    await removeFarmerProduct(farmerId, productId);
  }
  
  // Return updated list
  return getFarmerProducts(farmerId);
};

const farmerProductService = {
  getFarmerProducts,
  addFarmerProducts,
  removeFarmerProduct,
  getSuggestedFlower,
  syncFarmerProducts,
};

export default farmerProductService;
