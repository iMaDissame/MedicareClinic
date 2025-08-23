import React, { useState, useEffect } from 'react';
import { Users, Video, CheckCircle, Clock, BarChart3, Calendar, Search, ChevronDown, User, TrendingUp, Award, RefreshCw, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import axiosClient from '../../services/axiosClient';

interface UserProgress {
  id: string;
  name: string;
  email: string;
  username: string;
  total_videos_assigned: number;
  videos_started: number;
  videos_completed: number;
  overall_progress: number;
  last_activity: string;
}

interface VideoProgress {
  videoId: string;
  video_id: number;
  video_title: string;
  video_category: string;
  progress: number;
  current_time: number;
  duration: number;
  completed: boolean;
  last_watched: string;
}

interface ProgressDetails {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  overall_progress: number;
  videos_completed: number;
  total_videos_assigned: number;
  progress_details: VideoProgress[];
}

interface DebugInfo {
  userId: string;
  localStorage: any[];
  database: any[];
  inconsistencies: string[];
}

const UserProgress: React.FC = () => {
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDetails, setUserDetails] = useState<ProgressDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [refreshingUser, setRefreshingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsersProgress();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== '') {
        loadUsersProgress();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadUsersProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const response = await axiosClient.get(`/admin/progress/all-users?${params.toString()}`);
      
      if (response.data.success) {
        setUsersProgress(response.data.data || []);
      } else if (response.data.data) {
        // Handle paginated response
        setUsersProgress(response.data.data);
      } else {
        setUsersProgress([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user progress');
      console.error('Error loading user progress:', err);
      setUsersProgress([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    console.log('loadUserDetails called with userId:', userId); // Debug log
    
    try {
      setLoading(true);
      console.log('Making API call to:', `/admin/progress/users/${userId}`); // Debug log
      
      const response = await axiosClient.get(`/admin/progress/users/${userId}`);
      console.log('API response:', response.data); // Debug log
      
      if (response.data.success) {
        // Ensure progress_details has proper structure
        const progressDetails = response.data.data.progress_details || [];
        const formattedDetails = progressDetails.map((detail: any) => ({
          videoId: detail.videoId || detail.video_id?.toString(),
          video_id: detail.video_id,
          video_title: detail.video_title,
          video_category: detail.video_category || 'Uncategorized',
          progress: parseFloat(detail.progress) || 0,
          current_time: parseFloat(detail.current_time) || 0,
          duration: parseFloat(detail.duration) || 0,
          completed: detail.completed || false,
          last_watched: detail.last_watched
        }));

        setUserDetails({
          ...response.data.data,
          progress_details: formattedDetails
        });
        setShowUserModal(true);
        console.log('Modal should be shown now'); // Debug log
      } else {
        console.error('API returned success: false'); // Debug log
        setError('Failed to load user details: API returned success: false');
      }
    } catch (err: any) {
      const errorMsg = 'Failed to load user details: ' + (err.response?.data?.message || err.message);
      console.error('Error in loadUserDetails:', err); // Debug log
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const debugUserProgress = async (userId: string) => {
    console.log('debugUserProgress called with userId:', userId); // Debug log
    
    try {
      setLoading(true);
      
      // Get database progress
      const dbResponse = await axiosClient.get(`/admin/progress/users/${userId}`);
      const databaseProgress = dbResponse.data.success ? dbResponse.data.data.progress_details || [] : [];
      
      // Simulate getting localStorage data (this would normally be done on frontend)
      const localStorageData = [];
      
      // Find inconsistencies
      const inconsistencies = [];
      
      databaseProgress.forEach((dbItem: any) => {
        if (dbItem.progress < 0 || dbItem.progress > 100) {
          inconsistencies.push(`Video ${dbItem.video_title}: Invalid progress value ${dbItem.progress}%`);
        }
        
        if (dbItem.progress >= 95 && !dbItem.completed) {
          inconsistencies.push(`Video ${dbItem.video_title}: Progress is ${dbItem.progress}% but not marked as completed`);
        }
        
        if (dbItem.current_time && dbItem.duration && dbItem.current_time > dbItem.duration) {
          inconsistencies.push(`Video ${dbItem.video_title}: Current time (${dbItem.current_time}s) exceeds duration (${dbItem.duration}s)`);
        }
      });
      
      setDebugInfo({
        userId,
        localStorage: localStorageData,
        database: databaseProgress,
        inconsistencies
      });
      
      setShowDebugModal(true);
      console.log('Debug modal should be shown now'); // Debug log
    } catch (err: any) {
      console.error('Error in debugUserProgress:', err); // Debug log
      setError('Failed to debug user progress: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetUserProgress = async (userId: string, videoId?: number) => {
    const confirmMessage = videoId 
      ? 'Are you sure you want to reset progress for this specific video?' 
      : 'Are you sure you want to reset ALL progress for this user?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setRefreshingUser(userId);
      
      if (videoId) {
        await axiosClient.delete(`/admin/user-progress/${userId}/${videoId}/reset`, {
          data: { confirm: true }
        });
      } else {
        // Reset all progress for user
        await axiosClient.delete(`/admin/user-progress/${userId}/reset-all`, {
          data: { confirm: true }
        });
      }
      
      // Refresh data
      await loadUsersProgress();
      if (showUserModal && userDetails?.user.id === userId) {
        await loadUserDetails(userId);
      }
      
      setError(null);
      alert('Progress reset successfully!');
    } catch (err: any) {
      setError('Failed to reset progress: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefreshingUser(null);
    }
  };

  const recalculateUserProgress = async (userId: string) => {
    console.log('recalculateUserProgress called with userId:', userId); // Debug log
    
    if (!window.confirm('This will recalculate progress based on current video positions. Continue?')) return;

    try {
      setRefreshingUser(userId);
      await axiosClient.post(`/admin/user-progress/${userId}/recalculate`);
      
      // Refresh data
      await loadUsersProgress();
      if (showUserModal && userDetails?.user.id === userId) {
        await loadUserDetails(userId);
      }
      
      alert('Progress recalculated successfully!');
    } catch (err: any) {
      console.error('Error in recalculateUserProgress:', err); // Debug log
      setError('Failed to recalculate progress: ' + (err.response?.data?.message || err.message));
    } finally {
      setRefreshingUser(null);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate overall statistics
  const getOverallStats = () => {
    const totalUsers = usersProgress.length;
    const activeUsers = usersProgress.filter(user => user.last_activity).length;
    const completedCourses = usersProgress.reduce((sum, user) => sum + user.videos_completed, 0);
    const avgProgress = usersProgress.length > 0 
      ? Math.round(usersProgress.reduce((sum, user) => sum + user.overall_progress, 0) / usersProgress.length)
      : 0;

    return { totalUsers, activeUsers, completedCourses, avgProgress };
  };

  // Test function to verify button clicks work
  const testButtonClick = (userId: string, action: string) => {
    console.log(`Test button clicked for user ${userId}, action: ${action}`);
    alert(`Button clicked: ${action} for user ${userId}`);
  };

  const stats = getOverallStats();

  if (loading && usersProgress.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading user progress...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suivi de la progression des utilisateurs</h1>
          <p className="text-gray-600 mt-2">Surveillez la progression et l'engagement des étudiants</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={loadUsersProgress} 
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Étudiants totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vidéos complétées</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Progression moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher des utilisateurs par nom, email ou nom d'utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* User Progress Details */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Progression individuelle</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Étudiant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vidéos assignées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commencées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Complétées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progression
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersProgress.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {user.total_videos_assigned}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.videos_started}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {user.videos_completed}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            user.overall_progress >= 80 ? 'bg-green-500' :
                            user.overall_progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, user.overall_progress))}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 min-w-[3rem]">
                        {Math.round(user.overall_progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => loadUserDetails(user.id)}
                      >
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => recalculateUserProgress(user.id)}
                        disabled={refreshingUser === user.id}
                        title="Recalculate progress"
                      >
                        <RotateCcw className={`h-4 w-4 ${refreshingUser === user.id ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usersProgress.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur trouvé.'}
            </div>
          )}
        </div>
      </Card>

      {/* User Details Modal */}
      {showUserModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Détails de la progression pour {userDetails.user.name}
              </h3>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => resetUserProgress(userDetails.user.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Reset All
                </Button>
                <Button onClick={() => setShowUserModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Progression globale</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(userDetails.overall_progress)}%
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">Vidéos complétées</h4>
                <div className="text-2xl font-bold text-green-600">
                  {userDetails.videos_completed} / {userDetails.total_videos_assigned}
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">Informations utilisateur</h4>
                <div className="text-sm text-gray-600">
                  <div>Email: {userDetails.user.email}</div>
                  <div>Username: @{userDetails.user.username}</div>
                </div>
              </Card>
            </div>
            
            <h4 className="font-medium mb-4">Détails de progression des vidéos</h4>
            <div className="space-y-3">
              {userDetails.progress_details.length > 0 ? (
                userDetails.progress_details.map((progress) => (
                  <div key={progress.video_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{progress.video_title}</div>
                      <div className="text-sm text-gray-500">
                        {progress.video_category}
                        {progress.last_watched && (
                          <span className="ml-2">
                            • Dernière vue: {formatDate(progress.last_watched)}
                          </span>
                        )}
                      </div>
 
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress.progress >= 95 ? 'bg-green-500' :
                            progress.progress >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm font-medium min-w-[3rem] text-right">
                        {Math.round(progress.progress)}%
                      </div>
                      
                      {progress.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetUserProgress(userDetails.user.id, progress.video_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Reset progress for this video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune progression trouvée pour cet utilisateur.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && debugInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Debug Progress Issues - User ID: {debugInfo.userId}
              </h3>
              <Button onClick={() => setShowDebugModal(false)}>Fermer</Button>
            </div>
            
            {debugInfo.inconsistencies.length > 0 && (
              <Card className="p-4 mb-4 border-red-200 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {debugInfo.inconsistencies.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Database Progress ({debugInfo.database.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {debugInfo.database.map((item: any, index) => (
                    <div key={index} className="text-sm border-l-2 border-blue-200 pl-2">
                      <div className="font-medium">{item.video_title}</div>
                      <div className="text-gray-600">
                        Progress: {item.progress}% | 
                        Time: {formatDuration(item.current_time)} / {formatDuration(item.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">LocalStorage Progress ({debugInfo.localStorage.length})</h4>
                <div className="text-sm text-gray-600">
                  <p>LocalStorage data would be shown here on the frontend.</p>
                  <p className="mt-2">To view localStorage data, use browser developer tools.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProgress;