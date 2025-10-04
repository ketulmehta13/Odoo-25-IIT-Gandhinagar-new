import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  login: async (email, password, role) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
        role,
      });
      
      const { data } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors || error.response?.data?.error || 'Login failed',
      };
    }
  },

  // Register user
  signup: async (formData) => {
    try {
      const response = await api.post('/auth/register/', {
        email: formData.email,
        username: formData.name.toLowerCase().replace(/\s+/g, ''),
        password: formData.password,
        password_confirm: formData.password,
        first_name: formData.name.split(' ')[0],
        last_name: formData.name.split(' ').slice(1).join(' '),
        role: formData.role,
        company_name: formData.companyName,
        currency: formData.currency,
      });
      
      const { data } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errors || error.response?.data?.error || 'Signup failed',
      };
    }
  },

  // Logout user - Fixed version
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Try to blacklist the token on the server
        await api.post('/auth/logout/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      // Log error but don't prevent logout
      console.warn('Server logout failed, proceeding with local logout:', error.message);
    } finally {
      // Always clear local storage regardless of server response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    
    return { success: true };
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/profile/');
      return {
        success: true,
        user: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }
  },

  // Get stored user from localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },
};
