import axios from 'axios';

// Determine the base URL
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // In development, the empty baseURL allows the proxy to handle /api paths
    return '';
  } else {
    // In production, use the environment variable or default to a relative path
    return import.meta.env.VITE_API_BASE_URL || '';
  }
};

// Function to check API availability
const checkApiAvailability = async (baseUrl) => {
  try {
    const response = await axios.get(`${baseUrl}/api/health`, { 
      timeout: 2000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    console.log('API connection successful:', response.status);
    return true;
  } catch (error) {
    console.warn('API connection check failed:', error.message);
    return false;
  }
};

// Create an axios instance with base URL
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create a network resilience interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if we've already retried, or if it's a POST request (avoid duplicate submissions)
    if (originalRequest._retry || originalRequest.method === 'post') {
      return Promise.reject(error);
    }
    
    // Handle connection errors or 5xx server errors
    if (
      (error.code === 'ECONNABORTED' || 
       !error.response || 
       (error.response && error.response.status >= 500)) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log('Retrying request due to connection issue:', originalRequest.url);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(originalRequest);
    }
    
    // Token expiration
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token and redirect to login
      console.log('Session expired, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and other errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token has expired or is invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Authentication helper functions
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return token && token !== 'null' && token !== 'undefined';
};

const getUserId = () => {
  const user = localStorage.getItem('user');
  if (user && user !== 'null') {
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser.id;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  return null;
};

// Test user ID for development when not authenticated
const TEST_USER_ID = '60d5ecb74b24a000154f1234';

// Recommendation API calls
export const getRecommendations = async (limit = 10) => {
  if (isAuthenticated()) {
    const response = await api.get(`/api/recommendations?limit=${limit}`);
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.get(`/api/recommendations/test/${TEST_USER_ID}?limit=${limit}`);
    return response.data;
  }
};

export const getDailyRecommendation = async () => {
  if (isAuthenticated()) {
    const response = await api.get('/api/recommendations/daily');
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.get(`/api/recommendations/test-daily/${TEST_USER_ID}`);
    return response.data;
  }
};

export const getNewReleases = async (limit = 5) => {
  if (isAuthenticated()) {
    const response = await api.get(`/api/recommendations/new-releases?limit=${limit}`);
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.get(`/api/recommendations/test-new-releases/${TEST_USER_ID}?limit=${limit}`);
    return response.data;
  }
};

export const getGenericNewReleases = async (limit = 5) => {
  // This endpoint doesn't require authentication
  const response = await api.get(`/api/recommendations/generic-new-releases?limit=${limit}`);
  return response.data;
};

export const getSimilarBooks = async (bookId, limit = 5) => {
  if (isAuthenticated()) {
    const response = await api.get(`/api/recommendations/similar/${bookId}?limit=${limit}`);
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.get(`/api/recommendations/test-similar/${TEST_USER_ID}/${bookId}?limit=${limit}`);
    return response.data;
  }
};

export const updateUserAIProfile = async () => {
  const response = await api.put('/api/recommendations/profile');
  return response.data;
};

// Favorite books API calls
export const getFavorites = async () => {
  if (isAuthenticated()) {
    const response = await api.get('/api/favorites');
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.get(`/api/favorites/test/${TEST_USER_ID}`);
    return response.data;
  }
};

export const addToFavorites = async (bookId) => {
  if (isAuthenticated()) {
    const response = await api.post('/api/favorites', { bookId });
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.post(`/api/favorites/test/${TEST_USER_ID}`, { bookId });
    return response.data;
  }
};

export const removeFromFavorites = async (bookId) => {
  if (isAuthenticated()) {
    const response = await api.delete(`/api/favorites/${bookId}`);
    return response.data;
  } else {
    // Fallback to test route in development
    const response = await api.delete(`/api/favorites/test/${TEST_USER_ID}/${bookId}`);
    return response.data;
  }
};

// Book view tracking API for improving recommendations
export const trackBookView = async (bookId, viewDuration) => {
  const response = await api.post('/api/tracking/book-view', { 
    bookId, 
    viewDuration 
  });
  return response.data;
};

// Contextual recommendations and analytics API calls
export const getContextualRecommendations = async (context, limit = 10) => {
  const response = await api.post('/api/recommendations/contextual', {
    ...context,
    limit
  });
  return response.data;
};

export const getRecommendationAnalytics = async () => {
  const response = await api.get('/api/recommendations/analytics');
  return response.data;
};

export const recordRecommendationEngagement = async (type) => {
  const response = await api.post('/api/recommendations/engagement', { type });
  return response.data;
};
