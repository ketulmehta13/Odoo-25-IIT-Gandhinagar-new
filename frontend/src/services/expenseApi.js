// Real Django REST API service - Updated from Mock API
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; // Your Django backend URL

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
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
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const expenseApi = {
  // Get all expenses (filtered by user role - admin sees all, manager sees team, employee sees own)
  getAllExpenses: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/expenses/?${params}`);
      
      return { 
        success: true, 
        data: response.data.results || response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get all expenses error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch expenses'
      };
    }
  },

  // Get expenses for current employee (used in employee dashboard)
  getEmployeeExpenses: async () => {
    try {
      const response = await api.get('/expenses/');
      return { 
        success: true, 
        data: response.data.results || response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get employee expenses error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employee expenses'
      };
    }
  },

  // Get expenses pending approval for current manager
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/expenses/pending/');
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch pending approvals'
      };
    }
  },

  // Submit new expense with file upload support
  submitExpense: async (expenseData) => {
    try {
      const formData = new FormData();
      
      // Add all expense data to FormData
      Object.keys(expenseData).forEach(key => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          if (key === 'receipt_image' && expenseData[key] instanceof File) {
            formData.append(key, expenseData[key]);
          } else {
            formData.append(key, expenseData[key]);
          }
        }
      });

      const response = await api.post('/expenses/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Submit expense error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.errors || 'Failed to submit expense'
      };
    }
  },

  // Approve or reject expense
  updateExpenseStatus: async (expenseId, decision) => {
    try {
      const response = await api.post(`/expenses/${expenseId}/approve/`, {
        action: decision.status === 'approved' ? 'approve' : 'reject',
        comment: decision.comment || ''
      });
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Update expense status error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update expense status'
      };
    }
  },

  // Get expense categories
  getCategories: async () => {
    try {
      const response = await api.get('/expenses/categories/');
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch categories'
      };
    }
  },

  // Get admin statistics
  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/stats/');
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get admin stats error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch admin statistics'
      };
    }
  },

  // Mock OCR processing (placeholder for future implementation)
  processReceipt: async (file) => {
    // For now, return mock data since OCR is not implemented in backend
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay
    
    return {
      success: true,
      data: {
        amount: Math.floor(Math.random() * 500) + 50,
        date: new Date().toISOString().split('T')[0],
        merchant: 'Extracted Merchant',
        category: 'Travel'
      }
    };
  }
};

export const userApi = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users/');
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users/', userData);
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.errors || 'Failed to create user'
      };
    }
  },

  // Update user (admin only)
  updateUser: async (userId, updates) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/`, updates);
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user'
      };
    }
  },

  // Delete/Deactivate user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}/`);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user'
      };
    }
  }
};

export const approvalApi = {
  // Get approval rules (placeholder - will be implemented later)
  getApprovalRules: async () => {
    try {
      // For now, return default rules since backend endpoint not yet implemented
      return { 
        success: true, 
        data: [
          {
            id: 1,
            type: 'sequential',
            name: 'Default Sequential Approval',
            levels: [
              { level: 1, approverRole: 'manager', required: true }
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Get approval rules error:', error);
      return {
        success: false,
        error: 'Failed to fetch approval rules'
      };
    }
  },

  // Update approval rules (placeholder - will be implemented later)
  updateApprovalRules: async (rules) => {
    try {
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 400));
      return { 
        success: true, 
        data: rules 
      };
    } catch (error) {
      console.error('Update approval rules error:', error);
      return {
        success: false,
        error: 'Failed to update approval rules'
      };
    }
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
    
    if (status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return 'Session expired. Please login again.';
    } else if (status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (status === 404) {
      return 'The requested resource was not found.';
    } else if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return message;
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// Export default for backward compatibility
export default { expenseApi, userApi, approvalApi };
