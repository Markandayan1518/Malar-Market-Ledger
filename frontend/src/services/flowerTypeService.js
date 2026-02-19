import api, { handleApiResponse } from './api';

/**
 * Get all active flower types for dropdowns
 * @returns {Promise} List of active flower types
 */
export const getActiveFlowerTypes = async () => {
  return handleApiResponse(api.get('/flower-types/active'));
};

/**
 * Get all flower types with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 * @param {string} params.search - Search term
 * @param {boolean} params.is_active - Filter by active status
 * @returns {Promise} Paginated list of flower types
 */
export const getFlowerTypes = async (params = {}) => {
  return handleApiResponse(api.get('/flower-types', { params }));
};

/**
 * Get a single flower type by ID
 * @param {string} id - Flower type ID
 * @returns {Promise} Flower type details
 */
export const getFlowerType = async (id) => {
  return handleApiResponse(api.get(`/flower-types/${id}`));
};

/**
 * Create a new flower type
 * @param {Object} data - Flower type data
 * @param {string} data.name - English name
 * @param {string} data.name_ta - Tamil name
 * @param {string} data.unit - Unit of measurement
 * @returns {Promise} Created flower type
 */
export const createFlowerType = async (data) => {
  return handleApiResponse(
    api.post('/flower-types', null, { params: data })
  );
};

/**
 * Update a flower type
 * @param {string} id - Flower type ID
 * @param {Object} data - Updated data
 * @returns {Promise} Updated flower type
 */
export const updateFlowerType = async (id, data) => {
  return handleApiResponse(
    api.put(`/flower-types/${id}`, null, { params: data })
  );
};

/**
 * Delete a flower type (soft delete)
 * @param {string} id - Flower type ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteFlowerType = async (id) => {
  return handleApiResponse(api.delete(`/flower-types/${id}`));
};

/**
 * Deactivate a flower type
 * @param {string} id - Flower type ID
 * @returns {Promise} Updated flower type with is_active = false
 */
export const deactivateFlowerType = async (id) => {
  return handleApiResponse(api.patch(`/flower-types/${id}/deactivate`));
};

/**
 * Activate a flower type
 * @param {string} id - Flower type ID
 * @returns {Promise} Updated flower type with is_active = true
 */
export const activateFlowerType = async (id) => {
  return handleApiResponse(api.patch(`/flower-types/${id}/activate`));
};

const flowerTypeService = {
  getActiveFlowerTypes,
  getFlowerTypes,
  getFlowerType,
  createFlowerType,
  updateFlowerType,
  deleteFlowerType,
  deactivateFlowerType,
  activateFlowerType,
};

export default flowerTypeService;
