import React, { useState, useEffect } from 'react';
import { Users, Video, BarChart3, TrendingUp, User, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
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
}

interface DashboardStats {
  total_students: number;
  active_students: number;
  active_published_videos: number;
  total_videos: number;
  recent_videos: VideoType[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axiosClient.get('/admin/dashboard/stats');
        setStats(statsRes.data);
        
        const usersRes = await axiosClient.get('/admin/users');
        const videosRes = await axiosClient.get('/admin/videos');
        
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
        const videosData = Array.isArray(videosRes.data) ? videosRes.data : [];
        
        setUsers(usersData);
        setVideos(videosData);

        setLoading(false);
      } catch (err) {
        setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEngagementRate = () => {
    const { totalUsers, activeUsers } = getDisplayStats();
    return totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  };

  const getContentCompletionRate = () => {
    const { totalVideos, publishedVideos } = getDisplayStats();
    return totalVideos > 0 ? Math.round((publishedVideos / totalVideos) * 100) : 0;
  };

  const displayStats = getDisplayStats();
  const recentVideos = stats?.recent_videos || videos.slice(0, 5);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex justify-center items-center h-full p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Chargement du tableau de bord...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="p-8 text-center text-red-600 font-semibold">
            {error}
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Admin Welcome Header */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 flex items-center justify-center md:justify-start">
                <Shield className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" />
                Bienvenue, Admin {user.username} ! 👩🏻‍⚕

              </h1>
              <p className="text-purple-100 text-base md:text-lg mb-3 md:mb-2">
                Gérez votre plateforme d'apprentissage en toute simplicité
              </p>
              <div className="flex items-center justify-center md:justify-start">
                <User className="h-4 w-4 mr-2" />
                <span className="text-purple-200 text-sm">
                  Administrateur depuis {formatDate(user.created_at || new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg md:rounded-xl">
                  <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Étudiants totaux</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{displayStats.totalUsers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl">
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Étudiants actifs</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{displayStats.activeUsers}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-purple-100 rounded-lg md:rounded-xl">
                  <Video className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Vidéos publiées</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{displayStats.publishedVideos}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-yellow-100 rounded-lg md:rounded-xl">
                  <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Vidéos totales</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{displayStats.totalVideos}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <Card className="bg-white shadow-lg border-0">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Vidéos récentes</h2>
              </div>
              <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-80 md:max-h-96 overflow-y-auto">
                {recentVideos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune vidéo récente disponible.</p>
                ) : (
                  recentVideos.map((video) => (
                    <div key={video.id} className="flex items-center space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${video.is_published ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{video.title}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {video.is_published ? 'Publiée' : 'Brouillon'} • {formatDate(video.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <h2 className="text-base md:text-lg font-semibold text-gray-900">Actions rapides</h2>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <a
                    href="/admin/videos/new"
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-center group"
                  >
                    <Video className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs md:text-sm font-medium text-gray-900">Ajouter une vidéo</span>
                  </a>
                  <a
                    href="/admin/users"
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-center group"
                  >
                    <Users className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs md:text-sm font-medium text-gray-900">Gérer les utilisateurs</span>
                  </a>
                  <a
                    href="/admin/progress"
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 text-center group"
                  >
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs md:text-sm font-medium text-gray-900">Voir la progression</span>
                  </a>
                  <a
                    href="/admin/videos"
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 text-center group"
                  >
                    <Video className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 text-yellow-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs md:text-sm font-medium text-gray-900">Gérer les vidéos</span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;