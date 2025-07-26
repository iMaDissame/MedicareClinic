import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AccessExpired: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Expired</h1>
        
        <div className="flex items-center justify-center space-x-2 text-gray-600 mb-6">
          <Clock className="h-5 w-5" />
          <span>Your learning access has expired</span>
        </div>
        
        <p className="text-gray-600 mb-8">
          Your access to the course content has expired. Please contact your administrator to renew your access or extend your subscription.
        </p>
        
        <div className="space-y-4">
          <Button onClick={handleLogout} className="w-full">
            Return to Login
          </Button>
          
          <div className="text-sm text-gray-500">
            <p>Need help? Contact your administrator</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccessExpired;