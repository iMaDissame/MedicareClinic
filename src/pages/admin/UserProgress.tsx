import React, { useState, useEffect } from 'react';
import { Users, Video, CheckCircle, Clock, BarChart3, Calendar, Search, ChevronDown, User as UserIcon, TrendingUp, Award } from 'lucide-react';
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
  progress_details: Array<{
    video_id: string;
    video_title: string;
    video_category: string;
    progress: number;
    completed: boolean;
    last_watched: string;
    duration: string;
  }>;
}

const UserProgress: React.FC = () => {
  const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDetails, setUserDetails] = useState<ProgressDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadUsersProgress();
  }, [searchTerm]);

  const loadUsersProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axiosClient.get(`/admin/progress/users?${params.toString()}`);
      setUsersProgress(response.data.data || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user progress');
      console.error('Error loading user progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const response = await axiosClient.get(`/admin/progress/users/${userId}`);
      if (response.data.success) {
        setUserDetails(response.data.data);
        setShowUserModal(true);
      }
    } catch (err: any) {
      setError('Failed to load user details');
      console.error('Error loading user details:', err);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
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

  const stats = getOverallStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Progress Tracking</h1>
        <p className="text-gray-600 mt-2">Monitor student learning progress and engagement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
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
              <p className="text-sm font-medium text-gray-600">Completed Videos</p>
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
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
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
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* User Progress Details */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Individual Progress</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Videos Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Activity
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
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.total_videos_assigned}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {user.videos_completed} completed
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${user.overall_progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{Math.round(user.overall_progress)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.last_activity ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(user.last_activity)}
                      </div>
                    ) : (
                      'No activity'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => loadUserDetails(user.id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      {showUserModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Progress Details for {userDetails.user.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Overall Progress</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(userDetails.overall_progress)}%
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">Videos Completed</h4>
                <div className="text-2xl font-bold text-green-600">
                  {userDetails.videos_completed} / {userDetails.total_videos_assigned}
                </div>
              </Card>
            </div>
            
            <h4 className="font-medium mb-4">Video Progress Details</h4>
            <div className="space-y-3">
              {userDetails.progress_details.map((progress) => (
                <div key={progress.video_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{progress.video_title}</div>
                    <div className="text-sm text-gray-500">{progress.video_category}</div>
                  </div>
                  
                  <div className="w-24 bg-gray-200 rounded-full h-2 mx-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-sm font-medium">
                    {Math.round(progress.progress)}%
                  </div>
                  
                  {progress.completed && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowUserModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProgress;