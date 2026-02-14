import api, { handleApiResponse } from './api';

/**
 * Authentication Service
 */

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @returns {Promise} Login response
 */
export const login = async (credentials) => {
  return handleApiResponse(api.post('/auth/login', credentials));
};

/**
 * Logout user
 * @returns {Promise} Logout response
 */
export const logout = async () => {
  return handleApiResponse(api.post('/auth/logout'));
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise} Token refresh response
 */
export const refreshToken = async (refreshToken) => {
  return handleApiResponse(api.post('/auth/refresh', { refresh_token: refreshToken }));
};

/**
 * Get current user
 * @returns {Promise} User data
 */
export const getCurrentUser = async () => {
  return handleApiResponse(api.get('/auth/me'));
};

/**
 * Change password
 * @param {Object} data - Password change data
 * @returns {Promise} Password change response
 */
export const changePassword = async (data) => {
  return handleApiResponse(api.post('/auth/change-password', data));
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise} Password reset response
 */
export const requestPasswordReset = async (email) => {
  return handleApiResponse(api.post('/auth/reset-password', { email }));
};

/**
 * Reset password with token
 * @param {Object} data - Password reset data
 * @returns {Promise} Password reset response
 */
export const resetPassword = async (data) => {
  return handleApiResponse(api.post('/auth/reset-password/confirm', data));
};
