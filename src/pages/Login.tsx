import React, { useState } from 'react';
import { Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, User, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import logoimagelogin from '../assets/MDClogo.png';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
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

    console.group('🔐 Login Component - handleSubmit');
    console.log('📝 Form submitted:', { username, passwordLength: password.length });

    try {
      console.log('🔄 Calling auth.login()...');
      const success = await login(username, password);

      if (success) {
        // Get auth type from storage
        const authType = localStorage.getItem('authType');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

        console.log('✅ Login successful:', {
          authType,
          user: currentUser,
          from: from || 'none'
        });

        // Determine redirect path based on auth type
        let redirectPath;

        if (from && from !== '/login') {
          redirectPath = from;
          console.log('📍 Redirecting to intended destination:', redirectPath);
        } else {
          redirectPath = authType === 'admin' ? '/admin' : '/app/dashboard';
          console.log('📍 Redirecting to default path:', redirectPath);
        }

        navigate(redirectPath, { replace: true });
      } else {
        console.warn('❌ Login failed - invalid credentials');
        setError('Invalid credentials or access expired');
      }
    } catch (err: any) {
      console.error('💥 Login error:', {
        message: err.message,
        stack: err.stack
      });
      setError('Login failed. Please try again.');
    } finally {
      console.groupEnd();
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoimagelogin}
              alt="Medicare Clinic Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-lg font-medium bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Accédez à votre portail d'apprentissage
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
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
                placeholder="Entrez votre mot de passe"
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

          {/* Return to Landing Page Button */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la page d'accueil
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;