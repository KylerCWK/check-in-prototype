/**
 * Authentication utilities for seamless user experience
 */
import api from '../api.js';

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user);
};

/**
 * Auto-login for seamless demo experience
 * Creates a demo user if none exists and logs them in automatically
 */
export const ensureAuthenticated = async () => {
  try {
    // Check if already authenticated
    if (isAuthenticated()) {
      return true;
    }

    // Try to login with demo credentials
    try {
      const loginResponse = await api.post('/api/auth/login', {
        email: 'demo@bookworm.ai',
        password: 'demo123456'
      });

      if (loginResponse.data.token) {
        setAuthToken(loginResponse.data.token);
        setUser(loginResponse.data.user);
        console.log('✅ Demo user logged in successfully');
        return true;
      }
    } catch (loginError) {
      // If login fails, try to register the demo user
      console.log('🔄 Creating demo user account...');
      
      try {
        await api.post('/api/auth/register', {
          email: 'demo@bookworm.ai',
          password: 'demo123456',
          confirmPassword: 'demo123456'
        });

        // Now login
        const loginResponse = await api.post('/api/auth/login', {
          email: 'demo@bookworm.ai',
          password: 'demo123456'
        });

        if (loginResponse.data.token) {
          setAuthToken(loginResponse.data.token);
          setUser(loginResponse.data.user);
          console.log('✅ Demo user created and logged in successfully');
          return true;
        }
      } catch (registerError) {
        console.error('❌ Failed to create demo user:', registerError);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return false;
  }
};
