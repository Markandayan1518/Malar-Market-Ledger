import api from './api';

export const invoiceService = {
  async getAll(params = {}) {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  async sendInvoice(id) {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  async recordPayment(id, amount, notes = '') {
    const response = await api.post(`/invoices/${id}/payment`, { amount, notes });
    return response.data;
  },

  async cancelInvoice(id, reason) {
    const response = await api.post(`/invoices/${id}/cancel`, { reason });
    return response.data;
  },

  async downloadPdf(id, language = 'en') {
    const response = await api.get(`/invoices/${id}/pdf`, {
      params: { language },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getPdfUrl(id, language = 'en') {
    const baseUrl = api.defaults.baseURL;
    const token = localStorage.getItem('auth_token');
    return `${baseUrl}/invoices/${id}/pdf?language=${language}&token=${token}`;
  }
};

export const businessProfileService = {
  async get() {
    const response = await api.get('/business-profile');
    return response.data;
  },

  async getAll() {
    const response = await api.get('/business-profile/all');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/business-profile', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/business-profile/${id}`, data);
    return response.data;
  },

  async activate(id) {
    const response = await api.post(`/business-profile/${id}/activate`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/business-profile/${id}`);
    return response.data;
  }
};
