import api, { handleApiResponse } from './api';

export const getDailySummary = async (date) => {
  return handleApiResponse(api.get('/reports/daily-summary', { params: { date } }));
};

export const getFarmerSummary = async (farmerId, startDate, endDate) => {
  return handleApiResponse(api.get('/reports/farmer-summary', { params: { farmer_id: farmerId, start_date: startDate, end_date: endDate } }));
};

export const getMarketAnalytics = async (startDate, endDate) => {
  return handleApiResponse(api.get('/reports/market-analytics', { params: { start_date: startDate, end_date: endDate } }));
};

export const getSettlementReport = async (startDate, endDate) => {
  return handleApiResponse(api.get('/reports/settlements', { params: { start_date: startDate, end_date: endDate } }));
};

export const getCashAdvanceReport = async (startDate, endDate) => {
  return handleApiResponse(api.get('/reports/cash-advances', { params: { start_date: startDate, end_date: endDate } }));
};

export const exportReport = async (reportType, params) => {
  return handleApiResponse(api.get(`/reports/${reportType}/export`, { params, responseType: 'blob' }));
};

const reportService = {
  getDailySummary,
  getFarmerSummary,
  getMarketAnalytics,
  getSettlementReport,
  getCashAdvanceReport,
  export: exportReport
};

export default reportService;
