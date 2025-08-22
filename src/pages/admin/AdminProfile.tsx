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
  Activity,
  BarChart3,
  Calendar,
  Mail,
  UserCheck
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

interface Statistics {
  total_users: number;
  active_users: number;
  total_videos: number;
  published_videos: number;
  total_categories: number;
  total_comments: number;
  pending_comments: number;
  admin_notifications: number;
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={onClose} variant="secondary" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'statistics' | 'activity'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<AdminProfile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
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
      console.error('Failed to fetch profile:', error);
      setErrorMessage('Failed to load profile data');
      setShowErrorModal(true);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axiosClient.get('/admin/profile/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axiosClient.get('/admin/profile/activity');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
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
        setSuccessMessage('Profile updated successfully!');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to update profile');
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
      const response = await axiosClient.put('/admin/profile/password', passwordForm);
      if (response.data.success) {
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        setSuccessMessage('Password updated successfully!');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to update password');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_created':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'category_created':
        return <Settings className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and view dashboard statistics</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile Information', icon: User },
              { id: 'password', label: 'Change Password', icon: Shield },
              { id: 'statistics', label: 'Dashboard Stats', icon: BarChart3 },
              { id: 'activity', label: 'Recent Activity', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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

        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Full Name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.name[0]}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Username"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileInputChange}
                    placeholder="Enter your username"
                    required
                  />
                  {profileErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.username[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileInputChange}
                  placeholder="Enter your email address"
                  required
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.email[0]}</p>
                )}
              </div>

              {profileData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(profileData.created_at)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(profileData.updated_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Password Security</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Choose a strong password with at least 8 characters, including uppercase and lowercase letters, numbers, and special characters.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Enter current password"
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
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Enter new password"
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="new_password_confirmation"
                    value={passwordForm.new_password_confirmation}
                    onChange={handlePasswordInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Confirm new password"
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

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}

          {/* Dashboard Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statistics && [
                  { label: 'Total Users', value: statistics.total_users, icon: UserCheck, color: 'blue' },
                  { label: 'Active Users', value: statistics.active_users, icon: User, color: 'green' },
                  { label: 'Total Videos', value: statistics.total_videos, icon: Activity, color: 'purple' },
                  { label: 'Published Videos', value: statistics.published_videos, icon: CheckCircle, color: 'indigo' },
                  { label: 'Categories', value: statistics.total_categories, icon: Settings, color: 'yellow' },
                  { label: 'Comments', value: statistics.total_comments, icon: Mail, color: 'pink' },
                  { label: 'Pending Comments', value: statistics.pending_comments, icon: AlertCircle, color: 'red' },
                  { label: 'Your Notifications', value: statistics.admin_notifications, icon: Activity, color: 'gray' }
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label} className="p-6">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-3 bg-${color}-100 rounded-lg`}>
                        <Icon className={`h-6 w-6 text-${color}-600`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent System Activity</h3>
                <Button variant="outline" onClick={fetchActivities} size="sm">
                  Refresh
                </Button>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
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

export default AdminProfile;