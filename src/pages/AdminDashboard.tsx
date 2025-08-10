import React, { useState, useEffect } from 'react';
import { Users, Video, BarChart3, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import axiosClient from '../services/axiosClient'; // Your axios setup

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
    const fetchData = async () => {
      try {
        // Use the correct admin routes based on your Laravel setup
        const statsRes = await axiosClient.get('/admin/dashboard/stats');
        setStats(statsRes.data);
        
        // Also get full lists for additional functionality
        const usersRes = await axiosClient.get('/admin/users');
        const videosRes = await axiosClient.get('/admin/videos');
        
        // Set the data
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
        const videosData = Array.isArray(videosRes.data) ? videosRes.data : [];
        
        setUsers(usersData);
        setVideos(videosData);

        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        console.error('Error details:', err.response?.data);
        setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDisplayStats = () => {
    if (stats) {
      // Use the stats from the API
      return {
        totalUsers: stats.total_students,
        activeUsers: stats.active_students,
        publishedVideos: stats.active_published_videos,
        totalVideos: stats.total_videos
      };
    } else {
      // Fallback to calculating from arrays if stats API failed
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

  const displayStats = getDisplayStats();
  const recentVideos = stats?.recent_videos || videos.slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {error}
        <div className="mt-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your learning platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Videos</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.publishedVideos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.totalVideos}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
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
  );
};

export default AdminDashboard;