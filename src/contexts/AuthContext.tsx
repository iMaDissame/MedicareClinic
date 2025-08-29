import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '../services/axiosClient';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  authType: 'admin' | 'user' | null;
}

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
    authType: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Clear all authentication storage
  const clearAuthStorage = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authType');
  };

  useEffect(() => {
    const validateStoredAuth = async () => {
      const savedUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');
      const savedAuthType = localStorage.getItem('authType');

      if (savedUser && authToken && savedAuthType) {
        try {
          const user = JSON.parse(savedUser);
          const authType = savedAuthType as 'admin' | 'user';
          
          // Set auth state first (optimistic update)
          setAuthState({
            user,
            isAuthenticated: true,
            authType,
          });
          
          // Then validate with server - but don't clear auth on failure
          const endpoint = authType === 'admin' ? '/admin/me' : '/auth/me';
          
          try {
            const response = await axiosClient.get(endpoint);
            
            // Update with fresh user data from server
            setAuthState({
              user: response.data,
              isAuthenticated: true,
              authType,
            });
          } catch (requestError: any) {
            // Only clear auth if it's a definitive auth failure (not network issues)
            if (requestError.response?.status === 401 && 
                requestError.response?.data?.message === 'Unauthenticated.') {
              clearAuthStorage();
              setAuthState({
                user: null,
                isAuthenticated: false,
                authType: null,
              });
            }
            // For other errors (network, server issues), keep existing auth
          }
        } catch (parseError) {
          clearAuthStorage();
          setAuthState({
            user: null,
            isAuthenticated: false,
            authType: null,
          });
        }
      } else {
        clearAuthStorage();
        setAuthState({
          user: null,
          isAuthenticated: false,
          authType: null,
        });
      }
      
      setIsLoading(false);
    };

    validateStoredAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      // Try admin login first
      try {
        const adminResponse = await axiosClient.post('/admin/login', {
          login: usernameOrEmail,
          password,
        });
        
        if (adminResponse?.data?.access_token && adminResponse?.data?.user) {
          localStorage.setItem('authToken', adminResponse.data.access_token);
          localStorage.setItem('currentUser', JSON.stringify(adminResponse.data.user));
          localStorage.setItem('authType', 'admin');

          setAuthState({
            user: adminResponse.data.user,
            isAuthenticated: true,
            authType: 'admin',
          });

          return true;
        }
      } catch (adminError: any) {
        // Silent handling for admin login failure
      }
      
      // If admin login fails, try user login
      try {
        const userResponse = await axiosClient.post('/auth/login', {
          login: usernameOrEmail,
          password,
        });
        
        if (userResponse?.data?.access_token && userResponse?.data?.user) {
          localStorage.setItem('authToken', userResponse.data.access_token);
          localStorage.setItem('currentUser', JSON.stringify(userResponse.data.user));
          localStorage.setItem('authType', 'user');

          setAuthState({
            user: userResponse.data.user,
            isAuthenticated: true,
            authType: 'user',
          });

          return true;
        }
      } catch (userError: any) {
        // Silent handling for user login failure
      }
      
      return false;
    } catch (error: any) {
      return false;
    }
  };

  const logout = () => {
    clearAuthStorage();
    setAuthState({
      user: null,
      isAuthenticated: false,
      authType: null,
    });
  };

  const checkAccess = (): boolean => {
    return authState.isAuthenticated && !!authState.user;
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