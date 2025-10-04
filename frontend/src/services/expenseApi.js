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
      console.log('API: Getting all expenses with filters:', filters);
      const params = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/expenses/?${params}`);
      console.log('API: All expenses response:', response.data);
      
      return { 
        success: true, 
        data: response.data.results || response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get all expenses error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch expenses'
      };
    }
  },

  // Get expenses for current employee (used in employee dashboard)
  getEmployeeExpenses: async () => {
    try {
      console.log('API: Getting employee expenses...');
      const response = await api.get('/expenses/');
      console.log('API: Employee expenses response:', response.data);
      
      return { 
        success: true, 
        data: response.data.results || response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get employee expenses error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch employee expenses'
      };
    }
  },

  // Get expenses pending approval for current manager
  getPendingApprovals: async () => {
    try {
      console.log('API: Getting pending approvals...');
      const response = await api.get('/expenses/pending/');
      console.log('API: Pending approvals response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get pending approvals error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch pending approvals'
      };
    }
  },

  // Submit new expense with file upload support
  submitExpense: async (expenseData) => {
    try {
      console.log('API: Submitting expense:', expenseData);
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
      
      console.log('API: Submit expense response:', response.data);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('API: Submit expense error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.errors || 'Failed to submit expense'
      };
    }
  },

  // Approve or reject expense - FIXED METHOD
  updateExpenseStatus: async (expenseId, decision) => {
    try {
      console.log('API: Updating expense status:', expenseId, decision);
      
      // Handle different input formats
      let action, comment;
      
      if (decision.action) {
        // New format: { action: 'approve', comment: 'text' }
        action = decision.action;
        comment = decision.comment || '';
      } else if (decision.status) {
        // Legacy format: { status: 'approved', comment: 'text' }
        action = decision.status === 'approved' ? 'approve' : 'reject';
        comment = decision.comment || '';
      } else {
        // Direct action string: 'approve' or 'reject'
        action = decision;
        comment = '';
      }
      
      const payload = {
        action: action,
        comment: comment
      };
      
      console.log('API: Sending payload:', payload);
      
      const response = await api.post(`/expenses/${expenseId}/approve/`, payload);
      console.log('API: Update expense status response:', response.data);
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('API: Update expense status error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update expense status'
      };
    }
  },

  // Get expense categories
  getCategories: async () => {
    try {
      console.log('API: Getting categories...');
      const response = await api.get('/expenses/categories/');
      console.log('API: Categories response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get categories error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch categories'
      };
    }
  },

  // Get admin statistics - FIXED METHOD
  getAdminStats: async () => {
    try {
      console.log('API: Getting admin stats...');
      const response = await api.get('/admin/stats/');
      console.log('API: Admin stats response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get admin stats error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch admin statistics'
      };
    }
  },

  // Mock OCR processing (placeholder for future implementation)
  processReceipt: async (file) => {
    console.log('API: Processing receipt (mock)...');
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
  // Get all users (admin only) - FIXED METHOD
  getAllUsers: async () => {
    try {
      console.log('API: Getting all users...');
      const response = await api.get('/admin/users/');
      console.log('API: All users response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Get all users error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      console.log('API: Creating user:', userData);
      const response = await api.post('/admin/users/', userData);
      console.log('API: Create user response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Create user error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.errors || 'Failed to create user'
      };
    }
  },

  // Update user (admin only)
  updateUser: async (userId, updates) => {
    try {
      console.log('API: Updating user:', userId, updates);
      const response = await api.patch(`/admin/users/${userId}/`, updates);
      console.log('API: Update user response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Update user error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update user'
      };
    }
  },

  // Delete/Deactivate user (admin only)
  deleteUser: async (userId) => {
    try {
      console.log('API: Deleting user:', userId);
      const response = await api.delete(`/admin/users/${userId}/`);
      console.log('API: Delete user response:', response.data);
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('API: Delete user error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user'
      };
    }
  },

  // Assign manager to employee - NEW METHOD
  assignManagerEmployee: async (assignData) => {
    try {
      console.log('API: Assigning manager to employee:', assignData);
      const response = await api.post('/assign-manager/', assignData);
      console.log('API: Assign manager response:', response.data);
      
      return { 
        success: true, 
        data: response.data.data || response.data 
      };
    } catch (error) {
      console.error('API: Assign manager error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to assign manager to employee'
      };
    }
  }
};

export const approvalApi = {
  // Get approval rules - PLACEHOLDER METHOD
  getApprovalRules: async () => {
    try {
      console.log('API: Getting approval rules (placeholder)...');
      // For now, return default rules since backend endpoint not yet implemented
      return { 
        success: true, 
        data: [
          {
            id: 1,
            type: 'sequential',
            name: 'Default Sequential Approval',
            rule_type: 'sequential',
            is_active: true,
            is_manager_approver: true,
            levels: [
              { level: 1, approverRole: 'manager', required: true },
              { level: 2, approverRole: 'admin', required: true }
            ]
          }
        ]
      };
    } catch (error) {
      console.error('API: Get approval rules error:', error);
      return {
        success: false,
        error: 'Failed to fetch approval rules'
      };
    }
  },

  // Create approval rule - PLACEHOLDER METHOD
  createApprovalRule: async (ruleData) => {
    try {
      console.log('API: Creating approval rule (placeholder):', ruleData);
      // Placeholder implementation - will be implemented when backend is ready
      await new Promise(resolve => setTimeout(resolve, 400));
      return { 
        success: true, 
        data: { id: Date.now(), ...ruleData, is_active: true }
      };
    } catch (error) {
      console.error('API: Create approval rule error:', error);
      return {
        success: false,
        error: 'Failed to create approval rule'
      };
    }
  },

  // Update approval rules - PLACEHOLDER METHOD
  updateApprovalRules: async (rules) => {
    try {
      console.log('API: Updating approval rules (placeholder):', rules);
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 400));
      return { 
        success: true, 
        data: rules 
      };
    } catch (error) {
      console.error('API: Update approval rules error:', error);
      return {
        success: false,
        error: 'Failed to update approval rules'
      };
    }
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
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
