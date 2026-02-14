import api, { handleApiResponse, handlePaginatedResponse } from './api';

export const getCashAdvances = async (params = {}) => {
  return handlePaginatedResponse(api.get('/cash-advances', { params }));
};

export const getCashAdvance = async (id) => {
  return handleApiResponse(api.get(`/cash-advances/${id}`));
};

export const createCashAdvance = async (data) => {
  return handleApiResponse(api.post('/cash-advances', data));
};

export const updateCashAdvance = async (id, data) => {
  return handleApiResponse(api.put(`/cash-advances/${id}`, data));
};

export const approveCashAdvance = async (id) => {
  return handleApiResponse(api.post(`/cash-advances/${id}/approve`));
};

export const rejectCashAdvance = async (id, reason) => {
  return handleApiResponse(api.post(`/cash-advances/${id}/reject`, { reason }));
};

export const deleteCashAdvance = async (id) => {
  return handleApiResponse(api.delete(`/cash-advances/${id}`));
};
