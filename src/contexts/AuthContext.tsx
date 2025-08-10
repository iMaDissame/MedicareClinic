import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '../services/axiosClient';
import { AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: () => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateStoredAuth = async () => {
      const savedUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');
      
      if (savedUser && authToken) {
        try {
          const user = JSON.parse(savedUser);
          
          // Choose the correct endpoint based on user role
          const endpoint = user.role === 'admin' ? '/admin/me' : '/auth/me';
          const response = await axiosClient.get(endpoint);
          
          if (response.data) {
            setAuthState({
              user: response.data,
              isAuthenticated: true,
            });
          } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.log('Stored auth token is invalid:', error);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
          setAuthState({
            user: null,
            isAuthenticated: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
        });
      }
      
      setIsLoading(false);
    };

    validateStoredAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with:', { login: usernameOrEmail });
      
      // Try admin login first
      let response;
      let isAdmin = false;
      
      try {
        response = await axiosClient.post('/admin/login', {
          login: usernameOrEmail,
          password,
        });
        isAdmin = true;
        console.log('Admin login successful:', response.data);
      } catch (adminError) {
        console.log('Admin login failed, trying user login:', adminError.response?.status);
        
        // If admin login fails, try user login
        try {
          response = await axiosClient.post('/auth/login', {
            login: usernameOrEmail,
            password,
          });
          console.log('User login successful:', response.data);
        } catch (userError) {
          console.log('Both login attempts failed');
          return false;
        }
      }

      if (response?.data?.access_token && response?.data?.user) {
        localStorage.setItem('authToken', response.data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));

        setAuthState({
          user: response.data.user,
          isAuthenticated: true,
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setAuthState({ user: null, isAuthenticated: false });
  };

  const checkAccess = (): boolean => {
    return !!authState.user && authState.isAuthenticated;
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      checkAccess, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};