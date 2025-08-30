import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAuthType?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredAuthType 
}) => {
  const { isAuthenticated, authType, isLoading } = useAuth();

  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    
    return <Navigate to="/login" replace />;
  }

  if (requiredAuthType && authType !== requiredAuthType) {
    
    return <Navigate to="/unauthorized" replace />;
  }

  
  return <>{children}</>;
};

export default ProtectedRoute;