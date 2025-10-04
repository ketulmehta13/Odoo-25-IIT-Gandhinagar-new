import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

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
    console.log('AuthContext: Checking for stored user...');
    // Check for stored user on app load
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      console.log('AuthContext: Found stored user:', storedUser);
      setUser(storedUser);
    } else {
      console.log('AuthContext: No valid stored user found');
    }
    setLoading(false);
    console.log('AuthContext: Initial loading complete');
  }, []);

  const login = async (email, password, role) => {
    console.log('AuthContext: Login function called');
    console.log('AuthContext: Email:', email);
    console.log('AuthContext: Role:', role);
    
    const result = await authService.login(email, password, role);
    
    console.log('AuthContext: Login result received:', result);
    
    if (result.success) {
      console.log('AuthContext: Setting user in state:', result.user);
      setUser(result.user);
      console.log('AuthContext: User set successfully');
    } else {
      console.log('AuthContext: Login failed, not setting user');
    }
    
    return result;
  };

  const signup = async (formData) => {
    console.log('AuthContext: Signup function called');
    console.log('AuthContext: Email:', formData.email);
    console.log('AuthContext: Role:', formData.role);
    
    const result = await authService.signup(formData);
    
    console.log('AuthContext: Signup result received:', result);
    
    if (result.success) {
      console.log('AuthContext: Setting user in state:', result.user);
      setUser(result.user);
      console.log('AuthContext: User set successfully');
    } else {
      console.log('AuthContext: Signup failed, not setting user');
    }
    
    return result;
  };

  const logout = async () => {
    console.log('AuthContext: Logout function called');
    await authService.logout();
    setUser(null);
    console.log('AuthContext: User cleared from state');
    console.log('AuthContext: Logout complete');
    return { success: true };
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: authService.isAuthenticated,
  };

  console.log('AuthContext: Current state - User:', !!user, 'Loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
