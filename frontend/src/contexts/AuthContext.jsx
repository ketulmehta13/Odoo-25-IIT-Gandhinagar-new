import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock authentication - replace with Django API call
    // For demo: admin@company.com, manager@company.com, employee@company.com
    // Password: any string
    const mockUsers = {
      'admin@company.com': {
        id: 1,
        email: 'admin@company.com',
        name: 'John Admin',
        role: 'admin',
        companyId: 1,
        companyCurrency: 'USD'
      },
      'manager@company.com': {
        id: 2,
        email: 'manager@company.com',
        name: 'Sarah Manager',
        role: 'manager',
        companyId: 1,
        companyCurrency: 'USD'
      },
      'employee@company.com': {
        id: 3,
        email: 'employee@company.com',
        name: 'Mike Employee',
        role: 'employee',
        companyId: 1,
        companyCurrency: 'USD',
        managerId: 2
      }
    };

    const userData = mockUsers[email];
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'mock-jwt-token');
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const signup = async (data) => {
    // Mock signup - replace with Django API call
    const newUser = {
      id: Date.now(),
      email: data.email,
      name: data.name,
      role: 'admin', // First user becomes admin
      companyId: Date.now(),
      companyCurrency: data.currency || 'USD'
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', 'mock-jwt-token');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
