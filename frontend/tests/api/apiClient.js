/**
 * API Client for Playwright tests
 * Provides utilities for making API requests to the backend
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * API Client class for making HTTP requests
 */
export class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Get default headers
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Make PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Make PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Make DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed response data
   */
  async handleResponse(response) {
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.detail || data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

/**
 * Test data factories
 */
export const testData = {
  /**
   * Generate test user data
   * @param {Object} overrides - Override fields
   * @returns {Object} User data
   */
  user(overrides = {}) {
    const timestamp = Date.now();
    return {
      email: `test_${timestamp}@example.com`,
      username: `testuser_${timestamp}`,
      password: 'TestPassword123!',
      full_name: 'Test User',
      role: 'staff',
      phone: '+919876543210',
      ...overrides,
    };
  },

  /**
   * Generate test farmer data
   * @param {Object} overrides - Override fields
   * @returns {Object} Farmer data
   */
  farmer(overrides = {}) {
    const timestamp = Date.now();
    return {
      name: `Test Farmer ${timestamp}`,
      phone: `+919876${String(timestamp).slice(-6)}`,
      village: 'Test Village',
      is_active: true,
      ...overrides,
    };
  },

  /**
   * Generate test daily entry data
   * @param {Object} overrides - Override fields
   * @returns {Object} Daily entry data
   */
  dailyEntry(overrides = {}) {
    return {
      farmer_id: '',
      flower_type_id: '',
      time_slot_id: '',
      weight_kg: 10.5,
      rate_per_kg: 50.0,
      total_amount: 525.0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      ...overrides,
    };
  },

  /**
   * Generate test cash advance data
   * @param {Object} overrides - Override fields
   * @returns {Object} Cash advance data
   */
  cashAdvance(overrides = {}) {
    return {
      farmer_id: '',
      amount: 1000.0,
      reason: 'Test cash advance',
      date: new Date().toISOString().split('T')[0],
      ...overrides,
    };
  },
};

/**
 * Wait for API to be healthy
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 */
export async function waitForApi(timeout = 30000, interval = 1000) {
  const startTime = Date.now();
  const client = new ApiClient();

  while (Date.now() - startTime < timeout) {
    try {
      await client.get('/health');
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw new Error('API health check timed out');
}

/**
 * Authenticate and get token
 * @param {ApiClient} client - API client instance
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Auth response with token
 */
export async function authenticate(client, username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${client.baseUrl}/auth/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  client.setToken(data.access_token);
  return data;
}

export default ApiClient;
