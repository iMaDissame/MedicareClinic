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
      console.group('🔐 AuthProvider - validateStoredAuth');
      
      const savedUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');
      const savedAuthType = localStorage.getItem('authType');
      
      console.log('📦 Storage contents:', {
        savedUser: savedUser ? 'Exists' : 'Missing',
        authToken: authToken ? `Exists (${authToken.length} chars)` : 'Missing',
        savedAuthType: savedAuthType || 'Missing'
      });

      if (savedUser && authToken && savedAuthType) {
        try {
          const user = JSON.parse(savedUser);
          const authType = savedAuthType as 'admin' | 'user';
          
          console.log('👤 Parsed user:', user);
          console.log('🔑 Auth type:', authType);
          
          // Use the correct endpoint based on stored auth type
          const endpoint = authType === 'admin' ? '/admin/me' : '/auth/me';
          console.log('🌐 Making request to:', endpoint);
          
          try {
            const response = await axiosClient.get(endpoint);
            
            console.log('✅ Validation response:', response.data);
            
            if (response.data) {
              setAuthState({
                user: response.data,
                isAuthenticated: true,
                authType,
              });
              console.log('🎉 Authentication validated successfully');
            } else {
              console.warn('❌ No data in validation response');
              clearAuthStorage();
              setAuthState({
                user: null,
                isAuthenticated: false,
                authType: null,
              });
            }
          } catch (requestError: any) {
            console.error('❌ API request failed:', {
              message: requestError.message,
              status: requestError.response?.status,
              statusText: requestError.response?.statusText,
              url: requestError.config?.url
            });
            clearAuthStorage();
            setAuthState({
              user: null,
              isAuthenticated: false,
              authType: null,
            });
          }
        } catch (parseError) {
          console.error('❌ Error parsing stored data:', parseError);
          clearAuthStorage();
          setAuthState({
            user: null,
            isAuthenticated: false,
            authType: null,
          });
        }
      } else {
        console.log('📭 No valid authentication data found in storage');
        clearAuthStorage();
        setAuthState({
          user: null,
          isAuthenticated: false,
          authType: null,
        });
      }
      
      console.groupEnd();
      setIsLoading(false);
    };

    validateStoredAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    console.group('🔐 AuthProvider - login');
    console.log('📝 Login attempt with:', { usernameOrEmail, passwordLength: password.length });
    
    try {
      // Try admin login first
      console.log('👨‍💼 Attempting admin login...');
      try {
        const adminResponse = await axiosClient.post('/admin/login', {
          login: usernameOrEmail,
          password,
        });
        
        console.log('✅ Admin login response:', adminResponse.data);
        
        if (adminResponse?.data?.access_token && adminResponse?.data?.user) {
          localStorage.setItem('authToken', adminResponse.data.access_token);
          localStorage.setItem('currentUser', JSON.stringify(adminResponse.data.user));
          localStorage.setItem('authType', 'admin');

          setAuthState({
            user: adminResponse.data.user,
            isAuthenticated: true,
            authType: 'admin',
          });

          console.log('🎉 Admin login successful');
          console.groupEnd();
          return true;
        } else {
          console.warn('⚠️ Admin login response missing token or user data');
        }
      } catch (adminError: any) {
        console.log('❌ Admin login failed:', {
          status: adminError.response?.status,
          statusText: adminError.response?.statusText,
          message: adminError.message,
          url: adminError.config?.url
        });
      }
      
      // If admin login fails, try user login
      console.log('👤 Attempting user login...');
      try {
        const userResponse = await axiosClient.post('/auth/login', {
          login: usernameOrEmail,
          password,
        });
        
        console.log('✅ User login response:', userResponse.data);
        
        if (userResponse?.data?.access_token && userResponse?.data?.user) {
          localStorage.setItem('authToken', userResponse.data.access_token);
          localStorage.setItem('currentUser', JSON.stringify(userResponse.data.user));
          localStorage.setItem('authType', 'user');

          setAuthState({
            user: userResponse.data.user,
            isAuthenticated: true,
            authType: 'user',
          });

          console.log('🎉 User login successful');
          console.groupEnd();
          return true;
        } else {
          console.warn('⚠️ User login response missing token or user data');
        }
      } catch (userError: any) {
        console.error('❌ User login failed:', {
          status: userError.response?.status,
          statusText: userError.response?.statusText,
          message: userError.message,
          url: userError.config?.url,
          data: userError.response?.data
        });
      }
      
      console.log('❌ Both login attempts failed');
      console.groupEnd();
      return false;
    } catch (error: any) {
      console.error('💥 Unexpected login error:', {
        message: error.message,
        stack: error.stack
      });
      console.groupEnd();
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out');
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