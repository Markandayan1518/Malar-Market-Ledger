import axios from 'axios';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          // Handle both wrapped and direct response formats
          const tokenData = response.data.data || response.data;
          const { access_token, refresh_token: newRefreshToken } = tokenData;
          
          // Store new tokens
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config.url);
    }
    
    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Standard API response handler
 * @param {Promise} apiCall - API call promise
 * @returns {Promise} Processed response
 */
export const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall;
    
    // Handle standard response envelope
    if (response.data && typeof response.data === 'object') {
      // Check for standard envelope format
      if ('data' in response.data || 'success' in response.data) {
        if (response.data.success === false) {
          throw new Error(response.data.message || 'Request failed');
        }
        return response.data.data || response.data;
      }
      return response.data;
    }
    
    return response.data;
  } catch (error) {
    // Extract error message from response
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

/**
 * Handle paginated response
 * @param {Promise} apiCall - API call promise
 * @returns {Promise} Processed paginated response
 */
export const handlePaginatedResponse = async (apiCall) => {
  const response = await handleApiResponse(apiCall);
  
  return {
    data: response.items || response.data || [],
    total: response.total || response.count || 0,
    page: response.page || 1,
    pageSize: response.page_size || response.page_size || 10,
    totalPages: response.total_pages || Math.ceil((response.total || 0) / (response.page_size || 10)),
  };
};

/**
 * Upload file
 * @param {File} file - File to upload
 * @param {string} endpoint - Upload endpoint
 * @param {Object} options - Upload options
 * @returns {Promise} Upload response
 */
export const uploadFile = async (file, endpoint, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options.onUploadProgress) {
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        options.onUploadProgress(percentCompleted);
      },
    });
  }
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Cancel pending requests
 * @param {string} requestId - Request ID
 */
export const cancelRequest = (requestId) => {
  if (api[requestId]) {
    api[requestId].cancel('Request cancelled');
    delete api[requestId];
  }
};

/**
 * Create cancel token
 * @param {string} requestId - Request ID
 * @returns {Object} Cancel token
 */
export const createCancelToken = (requestId) => {
  const source = axios.CancelToken.source();
  api[requestId] = source;
  return source.token;
};

export default api;
