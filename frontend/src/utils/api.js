import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.kingcreativestudio.my.id/redor-obaba';
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to build full asset/upload URL
 * @param {string} path 
 * @returns {string}
 */
export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
};

// Request Interceptor: Attach Auth Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('redor_obaba_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('redor_obaba_token');
      localStorage.removeItem('redor_obaba_user');
    }
    return Promise.reject(error);
  }
);

export default api;
