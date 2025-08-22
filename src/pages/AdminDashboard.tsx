import React, { useState, useEffect } from 'react';
import { Users, Video, BarChart3, TrendingUp, Settings, Shield, Award, Calendar, Eye, Play } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import axiosClient from '../services/axiosClient';

interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  access_start?: string;
  access_end?: string;
  created_at: string;
}

interface VideoType {
  id: number;
  title: string;
  is_published: boolean;
  created_at: string;
  cover_image?: string;
  cover_url?: string;
  cover_cloudinary_url?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface DashboardStats {
  total_students: number;
  active_students: number;
  active_published_videos: number;
  total_videos: number;
  recent_videos: VideoType[];
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the correct admin routes based on your Laravel setup
      const statsRes = await axiosClient.get('/admin/dashboard/stats');
      setStats(statsRes.data);

      // Also get full lists for additional functionality
      const usersRes = await axiosClient.get('/admin/users');
      const videosRes = await axiosClient.get('/admin/videos');

      // Set the data
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const videosData = Array.isArray(videosRes.data) ? videosRes.data : videosRes.data.data || [];

      setUsers(usersData);
      setVideos(videosData);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayStats = () => {
    if (stats) {
      return {
        totalUsers: stats.total_students,
        activeUsers: stats.active_students,
        publishedVideos: stats.active_published_videos,
        totalVideos: stats.total_videos
      };
    } else {
      const safeUsers = Array.isArray(users) ? users : [];
      const safeVideos = Array.isArray(videos) ? videos : [];

      return {
        totalUsers: safeUsers.length,
        activeUsers: safeUsers.filter((u) => u.is_active).length,
        publishedVideos: safeVideos.filter((v) => v.is_published).length,
        totalVideos: safeVideos.length
      };
    }
  };

  const getCoverImageUrl = (video: VideoType) => {
    if (video.cover_cloudinary_url) {
      return video.cover_cloudinary_url;
    }

    if (video.cover_url) {
      return video.cover_url;
    }

    if (video.cover_image) {
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    }

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const displayStats = getDisplayStats();
  const recentVideos = stats?.recent_videos || videos.slice(0, 5);
  const recentUsers = users.slice(0, 5);
  const completionRate = displayStats.totalVideos > 0
    ? Math.round((displayStats.publishedVideos / displayStats.totalVideos) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 text-center bg-white shadow-xl">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Dashboard Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchData} variant="primary" className="w-full">
            Retry Loading
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Admin Dashboard 🎛️
                </h1>
                <p className="text-indigo-100 text-lg">Manage your learning platform and monitor progress</p>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <div className="text-indigo-200 text-sm">Publish Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{displayStats.activeUsers}</div>
                  <div className="text-indigo-200 text-sm">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.activeUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published Videos</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.publishedVideos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Video className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.totalVideos}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Videos */}
          <Card className="bg-white shadow-lg border-0">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Videos</h2>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {recentVideos.length === 0 ? (
                  <p className="text-gray-500">No recent videos available.</p>
                ) : (
                  recentVideos.map((video) => (
                    <div key={video.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${video.is_published ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                        <p className="text-sm text-gray-500">
                          {video.is_published ? 'Published' : 'Draft'} • {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/MedicareClinic/admin/videos/new"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Add Video</span>
                </a>
                <a
                  href="/MedicareClinic/admin/users"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Manage Users</span>
                </a>
                <a
                  href="/MedicareClinic/admin/progress"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">View Progress</span>
                </a>
                <a
                  href="/MedicareClinic/admin/videos"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Video className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Manage Videos</span>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;