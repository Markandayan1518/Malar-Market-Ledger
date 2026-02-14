import api, { handleApiResponse, handlePaginatedResponse } from './api';

export const getFarmers = async (params = {}) => {
  return handlePaginatedResponse(api.get('/farmers', { params }));
};

export const getFarmer = async (id) => {
  return handleApiResponse(api.get(`/farmers/${id}`));
};

export const createFarmer = async (data) => {
  return handleApiResponse(api.post('/farmers', data));
};

export const updateFarmer = async (id, data) => {
  return handleApiResponse(api.put(`/farmers/${id}`, data));
};

export const deleteFarmer = async (id) => {
  return handleApiResponse(api.delete(`/farmers/${id}`));
};

export const searchFarmers = async (query) => {
  return handleApiResponse(api.get('/farmers/search', { params: { q: query } }));
};
