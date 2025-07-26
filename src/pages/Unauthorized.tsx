import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-6">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        
        <Link to="/dashboard">
          <Button className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default Unauthorized;