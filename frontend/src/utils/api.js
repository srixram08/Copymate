import axios from 'axios';

const rawHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const host = (rawHost === '0.0.0.0' || !rawHost) ? 'localhost' : rawHost;
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const defaultBaseURL = `${protocol}//${host}:5000/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
});

// Auto-inject JWT token to all requests if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
