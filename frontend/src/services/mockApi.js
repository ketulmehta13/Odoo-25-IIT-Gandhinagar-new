// Mock API service - Ready to be replaced with Django REST API calls

const API_BASE = '/api'; // Replace with your Django backend URL

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (replace with actual API calls)
let mockExpenses = [
  {
    id: 1,
    employeeId: 3,
    employeeName: 'Mike Employee',
    amount: 150.00,
    currency: 'USD',
    convertedAmount: 150.00,
    companyCurrency: 'USD',
    category: 'Travel',
    description: 'Taxi to client meeting',
    date: '2025-01-15',
    receiptUrl: '/placeholder.svg',
    status: 'pending',
    approvalLevel: 1,
    approvers: [
      { id: 2, name: 'Sarah Manager', role: 'manager', status: 'pending' }
    ],
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 2,
    employeeId: 3,
    employeeName: 'Mike Employee',
    amount: 500.00,
    currency: 'EUR',
    convertedAmount: 545.00,
    companyCurrency: 'USD',
    category: 'Meals',
    description: 'Team dinner with clients',
    date: '2025-01-10',
    receiptUrl: '/placeholder.svg',
    status: 'approved',
    approvalLevel: 1,
    approvers: [
      { id: 2, name: 'Sarah Manager', role: 'manager', status: 'approved', comment: 'Approved for business development' }
    ],
    createdAt: '2025-01-10T15:30:00Z'
  }
];

let mockUsers = [
  { id: 1, name: 'John Admin', email: 'admin@company.com', role: 'admin', companyId: 1 },
  { id: 2, name: 'Sarah Manager', email: 'manager@company.com', role: 'manager', companyId: 1 },
  { id: 3, name: 'Mike Employee', email: 'employee@company.com', role: 'employee', companyId: 1, managerId: 2 },
];

let mockApprovalRules = [
  {
    id: 1,
    type: 'sequential',
    levels: [
      { level: 1, approverRole: 'manager', required: true }
    ]
  }
];

export const expenseApi = {
  // Get all expenses (admin view)
  getAllExpenses: async (filters = {}) => {
    await delay(300);
    let filtered = [...mockExpenses];
    
    if (filters.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }
    
    return { success: true, data: filtered };
  },

  // Get expenses for a specific employee
  getEmployeeExpenses: async (employeeId) => {
    await delay(300);
    const expenses = mockExpenses.filter(e => e.employeeId === employeeId);
    return { success: true, data: expenses };
  },

  // Get expenses pending approval for a manager
  getPendingApprovals: async (managerId) => {
    await delay(300);
    const pending = mockExpenses.filter(e => 
      e.status === 'pending' && 
      e.approvers.some(a => a.id === managerId && a.status === 'pending')
    );
    return { success: true, data: pending };
  },

  // Submit new expense
  submitExpense: async (expenseData) => {
    await delay(500);
    const newExpense = {
      id: mockExpenses.length + 1,
      ...expenseData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    mockExpenses.push(newExpense);
    return { success: true, data: newExpense };
  },

  // Approve/Reject expense
  updateExpenseStatus: async (expenseId, decision) => {
    await delay(400);
    const expense = mockExpenses.find(e => e.id === expenseId);
    if (expense) {
      const approver = expense.approvers.find(a => a.id === decision.approverId);
      if (approver) {
        approver.status = decision.status;
        approver.comment = decision.comment;
        
        // Update overall expense status
        if (decision.status === 'rejected') {
          expense.status = 'rejected';
        } else if (expense.approvers.every(a => a.status === 'approved')) {
          expense.status = 'approved';
        }
      }
      return { success: true, data: expense };
    }
    return { success: false, error: 'Expense not found' };
  },

  // Mock OCR processing
  processReceipt: async (file) => {
    await delay(1500);
    // Mock extracted data
    return {
      success: true,
      data: {
        amount: Math.floor(Math.random() * 500) + 50,
        date: new Date().toISOString().split('T')[0],
        merchant: 'Sample Merchant',
        category: 'Meals'
      }
    };
  }
};

export const userApi = {
  // Get all users (admin)
  getAllUsers: async () => {
    await delay(300);
    return { success: true, data: mockUsers };
  },

  // Create user
  createUser: async (userData) => {
    await delay(400);
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      companyId: 1
    };
    mockUsers.push(newUser);
    return { success: true, data: newUser };
  },

  // Update user
  updateUser: async (userId, updates) => {
    await delay(400);
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
      return { success: true, data: mockUsers[userIndex] };
    }
    return { success: false, error: 'User not found' };
  },

  // Delete user
  deleteUser: async (userId) => {
    await delay(400);
    mockUsers = mockUsers.filter(u => u.id !== userId);
    return { success: true };
  }
};

export const approvalApi = {
  // Get approval rules
  getApprovalRules: async () => {
    await delay(300);
    return { success: true, data: mockApprovalRules };
  },

  // Update approval rules
  updateApprovalRules: async (rules) => {
    await delay(400);
    mockApprovalRules = rules;
    return { success: true, data: mockApprovalRules };
  }
};
