import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Settings,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

interface AdminProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<AdminProfile | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Toast function
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosClient.get('/admin/profile');
      if (response.data.success) {
        const profile = response.data.data;
        setProfileData(profile);
        setProfileForm({
          name: profile.name,
          username: profile.username,
          email: profile.email
        });
      }
    } catch (error: any) {
      showToast('Échec du chargement des données du profil', 'error');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileErrors({});

    try {
      const response = await axiosClient.put('/admin/profile', profileForm);
      if (response.data.success) {
        setProfileData(response.data.data);
        showToast('Profil mis à jour avec succès !', 'success');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      } else {
        showToast(error.response?.data?.message || 'Échec de la mise à jour du profil', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordErrors({});

    try {
      const response = await axiosClient.put('/admin/profile/password', passwordForm);
      if (response.data.success) {
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        showToast('Mot de passe mis à jour avec succès !', 'success');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      } else {
        showToast(error.response?.data?.message || 'Échec de la mise à jour du mot de passe', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 pt-20 pb-8 px-2 sm:px-4">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Administrateur</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez les paramètres de votre compte</p>
          </div>
        </div>

        {/* Tab Navigation - Responsive */}
        <Card className="p-0">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-2 sm:px-6">
              {[ 
                { id: 'profile', label: 'Informations du profil', icon: User },
                { id: 'password', label: 'Changer le mot de passe', icon: Shield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">
                    {id === 'profile' && 'Profil'}
                    {id === 'password' && 'Mot de passe'}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-2 sm:p-6">
            {/* Profile Information Tab - Responsive */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Nom complet"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileInputChange}
                      placeholder="Entrez votre nom complet"
                      required
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{profileErrors.name[0]}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Nom d'utilisateur"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileInputChange}
                      placeholder="Entrez votre nom d'utilisateur"
                      required
                    />
                    {profileErrors.username && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{profileErrors.username[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    label="Adresse e-mail"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileInputChange}
                    placeholder="Entrez votre adresse e-mail"
                    required
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{profileErrors.email[0]}</p>
                  )}
                </div>

                {profileData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Compte créé
                      </label>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(profileData.created_at)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Dernière modification
                      </label>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(profileData.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                  </Button>
                </div>
              </form>
            )}

            {/* Change Password Tab - Responsive */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Sécurité du mot de passe</h3>
                      <p className="mt-1 text-xs sm:text-sm text-yellow-700">
                        Choisissez un mot de passe fort d'au moins 8 caractères, comprenant des majuscules, des minuscules, des chiffres et des caractères spéciaux.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Entrez le mot de passe actuel"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Entrez le nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="new_password_confirmation"
                      value={passwordForm.new_password_confirmation}
                      onChange={handlePasswordInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder="Confirmez le nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.new_password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password_confirmation[0]}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Shield className="h-4 w-4 mr-2" />
                    {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-60">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {toast.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-4 text-white hover:text-gray-200 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminProfile;