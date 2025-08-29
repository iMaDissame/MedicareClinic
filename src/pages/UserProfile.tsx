import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Activity,
  BarChart3,
  Calendar,
  Mail,
  UserCheck,
  Play,
  BookOpen,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import axiosClient from '../services/axiosClient';

interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  access_start: string;
  access_end: string;
  is_active: boolean;
  access_status: string;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

interface UserStatistics {
  assigned_categories: number;
  total_videos: number;
  watched_videos: number;
  in_progress_videos: number;
  overall_progress: number;
  total_comments: number;
  approved_comments: number;
  unread_notifications: number;
  access_status: string;
  days_remaining: number;
}

interface Activity {
  type: string;
  description: string;
  created_at: string;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Succès !</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={onClose} variant="secondary" className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'statistics' | 'activity'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    fetchProfile();
    fetchStatistics();
    fetchActivities();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosClient.get('/profile');
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
      setErrorMessage('Impossible de charger les données du profil');
      setShowErrorModal(true);
    }
  };

  // const fetchStatistics = async () => {
  //   try {
  //     const response = await axiosClient.get('/profile/statistics');
  //     if (response.data.success) {
  //       setStatistics(response.data.data);
  //     }
  //   } catch (error: any) {
  //     // Silently handle statistics fetch error
  //   }
  // };

  const fetchActivities = async () => {
    try {
      const response = await axiosClient.get('/profile/activity');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error: any) {
      // Silently handle activities fetch error
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileErrors({});

    try {
      const response = await axiosClient.put('/profile', profileForm);
      if (response.data.success) {
        setProfileData(response.data.data);
        setSuccessMessage('Profil mis à jour avec succès !');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      } else {
        setErrorMessage(error.response?.data?.message || 'Échec de la mise à jour du profil');
        setShowErrorModal(true);
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
      const response = await axiosClient.put('/profile/password', passwordForm);
      if (response.data.success) {
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        setSuccessMessage('Mot de passe mis à jour avec succès !');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      } else {
        setErrorMessage(error.response?.data?.message || 'Échec de la mise à jour du mot de passe');
        setShowErrorModal(true);
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

  const getAccessStatusInfo = (status: string, daysRemaining: number) => {
    switch (status) {
      case 'active':
        return {
          color: 'green',
          icon: CheckCircle,
          text: `Actif (${daysRemaining} jours restants)`
        };
      case 'expiring_soon':
        return {
          color: 'yellow',
          icon: AlertCircle,
          text: `Expire bientôt (${daysRemaining} jours restants)`
        };
      case 'expired':
        return {
          color: 'red',
          icon: XCircle,
          text: 'Accès expiré'
        };
      case 'inactive':
        return {
          color: 'gray',
          icon: XCircle,
          text: 'Compte inactif'
        };
      default:
        return {
          color: 'blue',
          icon: CheckCircle,
          text: 'Pas d\'expiration'
        };
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'video_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'comment_posted':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-20 pb-8 px-2 sm:px-4"> {/* px-2 for mobile */}
      <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez les paramètres de votre compte et consultez votre progression d'apprentissage</p>
        </div>
      </div>

      {/* Access Status Card */}
      {profileData && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-y-4 sm:gap-y-0">
            <div className="flex items-center space-x-3">
              {(() => {
                const statusInfo = getAccessStatusInfo(profileData.access_status, profileData.days_remaining);
                const StatusIcon = statusInfo.icon;
                return (
                  <>
                    <StatusIcon className={`h-6 w-6 text-${statusInfo.color}-500`} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Statut du compte</p>
                      <p className={`text-xs sm:text-sm text-${statusInfo.color}-600`}>{statusInfo.text}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="text-right sm:text-left w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-500">Période d'accès</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900">
                {formatDate(profileData.access_start)} - {formatDate(profileData.access_end)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card className="p-0">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-2 sm:px-6">
            {[ 
              { id: 'profile', label: 'Informations du profil', icon: User },
              { id: 'password', label: 'Changer le mot de passe', icon: Shield },
              { id: 'activity', label: 'Activité récente', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-2 sm:p-6">
          {/* Informations du profil */}
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

          {/* Changer le mot de passe */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Sécurité du mot de passe</h3>
                    <p className="mt-1 text-xs sm:text-sm text-yellow-700">
                      Choisissez un mot de passe fort d'au moins 8 caractères, incluant des majuscules, minuscules, chiffres et caractères spéciaux.
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

          {/* Statistiques d'apprentissage */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                {statistics && [
                  { 
                    label: 'Catégories assignées', 
                    value: statistics.assigned_categories, 
                    icon: BookOpen, 
                    color: 'blue',
                    description: 'Catégories auxquelles vous avez accès'
                  },
                  { 
                    label: 'Vidéos disponibles', 
                    value: statistics.total_videos, 
                    icon: Play, 
                    color: 'purple',
                    description: 'Nombre total de vidéos dans vos catégories'
                  },
                  { 
                    label: 'Vidéos terminées', 
                    value: statistics.watched_videos, 
                    icon: CheckCircle, 
                    color: 'green',
                    description: 'Vidéos que vous avez terminées'
                  },
                  { 
                    label: 'En cours', 
                    value: statistics.in_progress_videos, 
                    icon: Clock, 
                    color: 'yellow',
                    description: 'Vidéos commencées mais non terminées'
                  },
                  { 
                    label: 'Progression globale', 
                    value: `${statistics.overall_progress}%`, 
                    icon: TrendingUp, 
                    color: 'indigo',
                    description: 'Votre taux de complétion global'
                  },
                  { 
                    label: 'Commentaires publiés', 
                    value: statistics.total_comments, 
                    icon: MessageSquare, 
                    color: 'pink',
                    description: 'Nombre total de commentaires publiés'
                  },
                  { 
                    label: 'Commentaires approuvés', 
                    value: statistics.approved_comments, 
                    icon: UserCheck, 
                    color: 'green',
                    description: 'Commentaires approuvés par les modérateurs'
                  },
                  { 
                    label: 'Notifications non lues', 
                    value: statistics.unread_notifications, 
                    icon: Mail, 
                    color: 'red',
                    description: 'Nouvelles notifications pour vous'
                  }
                ].map(({ label, value, icon: Icon, color, description }) => (
                  <Card key={label} className="p-4 sm:p-6 hover:shadow-md transition-shadow min-w-[220px]">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-2 sm:p-3 bg-${color}-100 rounded-lg`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-600`} />
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Progress Chart */}
              {statistics && (
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vue d'ensemble de la progression</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Complétion globale</span>
                        <span className="text-sm text-gray-600">{statistics.overall_progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${statistics.overall_progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{statistics.watched_videos}</div>
                        <div className="text-sm text-gray-500">Terminées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{statistics.in_progress_videos}</div>
                        <div className="text-sm text-gray-500">En cours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {statistics.total_videos - statistics.watched_videos - statistics.in_progress_videos}
                        </div>
                        <div className="text-sm text-gray-500">Non commencées</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Activité récente */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-y-2 sm:gap-y-0">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Votre activité d'apprentissage récente</h3>
                <Button variant="outline" onClick={fetchActivities} size="sm">
                  Actualiser
                </Button>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune activité récente trouvée</p>
                  <p className="text-sm text-gray-400 mt-2">Commencez à regarder des vidéos pour voir votre activité ici !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={errorMessage}
      />
    </div>
  );
};

export default UserProfile;