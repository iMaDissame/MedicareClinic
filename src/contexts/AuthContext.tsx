import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default users with both admin and student accounts
const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    accessStart: '2024-01-01',
    accessEnd: '2025-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'client',
    password: 'client123',
    role: 'user',
    accessStart: '2024-01-01',
    accessEnd: '2025-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
  }
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Initialize or update users in localStorage
    const usersInStorage = localStorage.getItem('users');
    
    if (!usersInStorage) {
      // If no users exist, initialize with default users
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      console.log("Default users initialized in localStorage");
    } else {
      // If users exist, ensure default users are included
      try {
        const existingUsers = JSON.parse(usersInStorage);
        let needsUpdate = false;
        
        // Check for admin account
        if (!existingUsers.some((u: User) => u.username === 'admin')) {
          existingUsers.push(defaultUsers[0]);
          needsUpdate = true;
        }
        
        // Check for client account
        if (!existingUsers.some((u: User) => u.username === 'client')) {
          existingUsers.push(defaultUsers[1]);
          needsUpdate = true;
        }
        
        // Update localStorage if changes were made
        if (needsUpdate) {
          localStorage.setItem('users', JSON.stringify(existingUsers));
          console.log("Added missing default users");
        }
      } catch (error) {
        console.error("Error processing users:", error);
        // Reset to defaults if there was an error
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }
    }
    
    // Check for current user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const now = new Date();
        const accessEnd = new Date(user.accessEnd);
        
        if (user.isActive && now <= accessEnd) {
          setAuthState({ user, isAuthenticated: true });
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error("Error processing current user:", error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Get users from localStorage or use defaults
      const usersString = localStorage.getItem('users');
      const users = usersString ? JSON.parse(usersString) : defaultUsers;
      
      console.log("Login attempt for:", username);
      
      // Find user with matching username and password
      const user = users.find((u: User) => 
        u.username === username && u.password === password
      );
      
      if (user && user.isActive) {
        const now = new Date();
        const accessEnd = new Date(user.accessEnd);
        
        if (now <= accessEnd) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          setAuthState({ user, isAuthenticated: true });
          console.log("Login successful for:", username);
          return true;
        } else {
          console.log("Access expired for:", username);
        }
      } else {
        console.log("Invalid credentials or inactive user for:", username);
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setAuthState({ user: null, isAuthenticated: false });
  };

  const checkAccess = (): boolean => {
    if (!authState.user) return false;
    const now = new Date();
    const accessEnd = new Date(authState.user.accessEnd);
    return authState.user.isActive && now <= accessEnd;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};