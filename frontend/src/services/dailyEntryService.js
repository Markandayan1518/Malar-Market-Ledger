import api, { handleApiResponse, handlePaginatedResponse } from './api';

export const getDailyEntries = async (params = {}) => {
  return handlePaginatedResponse(api.get('/daily-entries', { params }));
};

export const getDailyEntry = async (id) => {
  return handleApiResponse(api.get(`/daily-entries/${id}`));
};

export const createDailyEntry = async (data) => {
  return handleApiResponse(api.post('/daily-entries', data));
};

export const updateDailyEntry = async (id, data) => {
  return handleApiResponse(api.put(`/daily-entries/${id}`, data));
};

export const deleteDailyEntry = async (id) => {
  return handleApiResponse(api.delete(`/daily-entries/${id}`));
};

export const getDailySummary = async (date) => {
  return handleApiResponse(api.get('/daily-entries/summary', { params: { date } }));
};

export const bulkCreateEntries = async (entries) => {
  return handleApiResponse(api.post('/daily-entries/bulk', { entries }));
};

const dailyEntryService = {
  getAll: getDailyEntries,
  getById: getDailyEntry,
  create: createDailyEntry,
  update: updateDailyEntry,
  delete: deleteDailyEntry,
  getSummary: getDailySummary,
  bulkCreate: bulkCreateEntries
};

export default dailyEntryService;
