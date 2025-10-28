import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { useLoading } from '../context/LoadingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL
const API_BASE_URL = 'https://esusu-server.onrender.com/api/merchant';

// Setup axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for slow networks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function to make API calls with loading state
export const useApi = () => {
  const { setLoading } = useLoading();

  const request = async <T>(
    config: AxiosRequestConfig,
    showLoading = true
  ): Promise<T> => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response: AxiosResponse<T> = await api(config);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Common API methods with loading state
  return {
    get: <T>(url: string, config?: AxiosRequestConfig, showLoading = true) => 
      request<T>({ ...config, method: 'get', url }, showLoading),
    
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig, showLoading = true) => 
      request<T>({ ...config, method: 'post', url, data }, showLoading),
    
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig, showLoading = true) => 
      request<T>({ ...config, method: 'put', url, data }, showLoading),
    
    delete: <T>(url: string, config?: AxiosRequestConfig, showLoading = true) => 
      request<T>({ ...config, method: 'delete', url }, showLoading),
  };
};

// Configure API request interceptors for token handling if needed
api.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = await AsyncStorage.getItem('auth_token');
    
    // If token exists, add to headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request headers:', token.substring(0, 20) + '...');
    } else {
      console.log('🚫 No token available for request');
    }
    
    // Log the request in development
    if (__DEV__) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('📋 Request Headers:', config.headers);
      if (config.data) {
        console.log('📦 Request Data:', config.data);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Configure API response interceptors for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    if (__DEV__) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Handle different error status codes
    if (error.response) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response.status}`);
      console.error('❌ Response Data:', error.response.data);
      console.error('❌ Response Headers:', error.response.headers);

      switch (error.response.status) {
        case 401:
          // Handle unauthorized - redirect to login
          console.error('🔒 Unauthorized - Token may be invalid or expired');
          break;
        case 403:
          // Handle forbidden
          console.error('🚫 Forbidden - Access denied to this resource');
          console.error('🔑 Check if the auth token is correct and has proper permissions');
          break;
        case 404:
          // Handle not found
          console.error('🔍 Not Found - The requested resource does not exist');
          break;
        case 500:
          // Handle server error
          console.error('💥 Server Error - Internal server error occurred');
          break;
        default:
          // Handle other errors
          console.error(`⚠️ API Error: ${error.response.status} - ${error.response.statusText}`);
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('🌐 Network Error: The server did not respond.');
      console.error('🔍 Check your internet connection and server status');
    } else {
      // Something happened in setting up the request
      console.error('🔧 Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api; 