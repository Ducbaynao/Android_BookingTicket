import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:8080' 
    : 'http://localhost:8080'
  : 'http://your-production-url.com';

// Enhanced API error class
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  responseType: 'json',
});

// Request interceptor with enhanced error handling
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(new ApiError('Request configuration failed', 0, error));
  }
);

// Enhanced response interceptor with user-friendly error messages
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    let errorMessage = 'An error occurred. Please try again.';
    let statusCode = 0;
    
    if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      
      switch (statusCode) {
        case 401:
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userRole');
          errorMessage = 'Session expired. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Requested data not found.';
          break;
        case 422:
          errorMessage = error.response.data?.message || 'Invalid data.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server is busy. Please try again in a few minutes.';
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    } else if (error.request) {
      // Network error
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection too slow. Please check your network and try again.';
      } else {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
    }
    
    const apiError = new ApiError(errorMessage, statusCode, error.response?.data);
    const isExpectedRefreshProfile404 =
      statusCode === 404 &&
      error.config?.method === 'get' &&
      error.config?.url === '/api/auth/me';
    const isExpectedRooms404 =
      statusCode === 404 &&
      error.config?.method === 'get' &&
      String(error.config?.url || '').includes('/api/rooms');
    const isExpectedCombos404 =
      statusCode === 404 &&
      error.config?.method === 'get' &&
      error.config?.url === '/api/combos';
    
    // Log error for debugging (only in development)
    if (__DEV__ && !isExpectedRefreshProfile404 && !isExpectedRooms404 && !isExpectedCombos404) {
      console.error('API Error:', {
        message: errorMessage,
        status: statusCode,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
      });
    }
    
    return Promise.reject(apiError);
  }
);

// Enhanced API client with retry functionality
export const apiClientWithRetry = {
  async request(requestConfig, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiClient.request(requestConfig);
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) or authentication issues
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 second delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  },

  get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  },

  post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  },

  put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  },

  delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  },
};

// Network status checker
export const checkNetworkConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

export { apiClient, API_BASE_URL };
