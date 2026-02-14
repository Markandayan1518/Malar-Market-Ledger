import api, { handleApiResponse, handlePaginatedResponse } from './api';

export const getSettlements = async (params = {}) => {
  return handlePaginatedResponse(api.get('/settlements', { params }));
};

export const getSettlement = async (id) => {
  return handleApiResponse(api.get(`/settlements/${id}`));
};

export const createSettlement = async (data) => {
  return handleApiResponse(api.post('/settlements', data));
};

export const updateSettlement = async (id, data) => {
  return handleApiResponse(api.put(`/settlements/${id}`, data));
};

export const approveSettlement = async (id) => {
  return handleApiResponse(api.post(`/settlements/${id}/approve`));
};

export const markSettlementPaid = async (id, paymentData) => {
  return handleApiResponse(api.post(`/settlements/${id}/pay`, paymentData));
};

export const deleteSettlement = async (id) => {
  return handleApiResponse(api.delete(`/settlements/${id}`));
};

export const generateSettlement = async (farmerId, startDate, endDate) => {
  return handleApiResponse(api.post('/settlements/generate', { farmer_id: farmerId, start_date: startDate, end_date: endDate }));
};

const settlementService = {
  getAll: getSettlements,
  getById: getSettlement,
  create: createSettlement,
  update: updateSettlement,
  approve: approveSettlement,
  markPaid: markSettlementPaid,
  delete: deleteSettlement,
  generate: generateSettlement
};

export default settlementService;
