import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { useLoading } from '../context/LoadingContext';

// Base API URL
const API_BASE_URL = 'http://192.168.235.47:8082';

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
  (config) => {
    // Get token from storage
    const token = localStorage.getItem('auth_token');
    
    // If token exists, add to headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
    return response;
  },
  (error) => {
    // Handle different error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized - redirect to login
          // For example: router.push('/login');
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          // Handle other errors
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error: The server did not respond.');
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
); 