import React, { useState } from 'react';
import { Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Play, AlertCircle, User, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, or default routes
  const from = location.state?.from?.pathname || null;

  // Show loading spinner while checking stored authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('Attempting login...');
      const success = await login(username, password);
      
      if (success) {
        // Get updated user info from storage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Login successful, user:', currentUser);
        
        // Determine redirect path
        let redirectPath;
        
        if (from && from !== '/login') {
          // Redirect to intended destination if it was provided
          redirectPath = from;
        } else {
          // Default redirect based on role
          redirectPath = currentUser.role === 'admin' ? '/admin' : '/app/dashboard';
        }
        
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        setError('Invalid credentials or access expired');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only redirect if actually authenticated (not just loading)
  if (isAuthenticated && user) {
    const defaultPath = user.role === 'admin' ? '/admin' : '/app/dashboard';
    const redirectTo = from && from !== '/login' ? from : defaultPath;
    
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-4">
            <Play className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Medicare Clinic
          </h1>
          <p className="text-gray-600 mt-2">Access your learning portal</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-3">Demo Credentials:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full text-left bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                  }}
                  disabled={isSubmitting}
                >
                  <p className="font-medium text-blue-900">Admin Access:</p>
                  <p>
                    Username: <code className="bg-blue-100 px-1 rounded">admin</code>
                  </p>
                  <p>
                    Password: <code className="bg-blue-100 px-1 rounded">admin123</code>
                  </p>
                  <center><span className="text-xs text-blue-700">Click to autofill</span></center>
                </button>
                <button
                  type="button"
                  className="w-full text-left bg-green-50 p-3 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                  onClick={() => {
                    setUsername('client');
                    setPassword('client123');
                  }}
                  disabled={isSubmitting}
                >
                  <p className="font-medium text-green-900">Student Access:</p>
                  <p>
                    Username: <code className="bg-green-100 px-1 rounded">client</code>
                  </p>
                  <p>
                    Password: <code className="bg-green-100 px-1 rounded">client123</code>
                  </p>
                  <center><span className="text-xs text-green-700">Click to autofill</span></center>
                </button>
              </div>
            </div>
          </div>
          
          {/* Return to Landing Page Button */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Home Page
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;