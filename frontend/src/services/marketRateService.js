import api, { handleApiResponse, handlePaginatedResponse } from './api';

export const getMarketRates = async (params = {}) => {
  return handlePaginatedResponse(api.get('/market-rates', { params }));
};

export const getCurrentRate = async () => {
  return handleApiResponse(api.get('/market-rates/current'));
};

export const getMarketRate = async (id) => {
  return handleApiResponse(api.get(`/market-rates/${id}`));
};

export const createMarketRate = async (data) => {
  return handleApiResponse(api.post('/market-rates', data));
};

export const updateMarketRate = async (id, data) => {
  return handleApiResponse(api.put(`/market-rates/${id}`, data));
};

export const deleteMarketRate = async (id) => {
  return handleApiResponse(api.delete(`/market-rates/${id}`));
};
