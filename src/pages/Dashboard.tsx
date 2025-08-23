import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Play, Clock, BookOpen, Calendar, AlertCircle, Eye, TrendingUp, Award, User, BarChart3, Target, Star } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { UserProgress } from '../types';
import axiosClient from '../services/axiosClient';

interface Category {
  id: number;
  name: string;
}

interface Video {
  id: number;
  title: string;
  description: string;
  video_path: string;
  video_url?: string;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  cover_image: string;
  cover_url?: string;
  cover_cloudinary_url?: string;
  duration?: number;
  file_size?: number;
  is_published: boolean;
  category: Category | null;
  created_at: string;
  updated_at: string;
  views_count?: number;
  average_rating?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalWatchTime: 0,
    favoriteCategory: '',
    lastWatched: null as Video | null,
    achievements: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadUserVideos();
      loadUserProgress();
      loadUserStats();
    }
  }, [user?.id]);

  const loadUserVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get('/my-videos');
      if (response.data.success) {
        setVideos(response.data.data);
      } else {
        setError('Failed to load videos');
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.response?.data?.message || 'Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced loadUserProgress function for Dashboard.tsx
  const loadUserProgress = async () => {
    try {
      // Load progress from API if available
      const response = await axiosClient.get(`/user-progress/${user?.id}`);
      if (response.data.success) {
        const apiProgress = response.data.data.progress_details || [];
        console.log('Progress from API:', apiProgress);
        setProgress(apiProgress);
      } else {
        throw new Error('API response not successful');
      }
    } catch (err: any) {
      console.warn('Failed to load progress from API, using localStorage fallback:', err);
      
      // Enhanced localStorage fallback
      try {
        const allProgressData: UserProgress[] = [];
        
        // Iterate through all localStorage keys to find progress data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`progress_${user?.id}_`)) {
            const progressStr = localStorage.getItem(key);
            if (progressStr) {
              try {
                const progressData = JSON.parse(progressStr);
                // Ensure the data has the expected structure
                if (progressData.videoId || progressData.video_id) {
                  allProgressData.push({
                    videoId: progressData.videoId || progressData.video_id?.toString(),
                    video_id: progressData.video_id || parseInt(progressData.videoId),
                    progress: parseFloat(progressData.progress) || 0,
                    current_time: parseFloat(progressData.current_time) || 0,
                    completed: progressData.completed || progressData.progress >= 95,
                    last_updated: progressData.last_updated || new Date().toISOString()
                  });
                }
              } catch (parseError) {
                console.error('Failed to parse progress data:', parseError);
              }
            }
          }
        }
        
        console.log('Progress from localStorage:', allProgressData);
        setProgress(allProgressData);
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
        setProgress([]);
      }
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await axiosClient.get(`/user-stats/${user?.id}`);
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load user stats:', err);
    }
  };

  // Enhanced getVideoProgress function
  const getVideoProgress = (videoId: number): number => {
    const progressItem = progress.find(p => {
      // Handle both string and number videoId comparisons
      const pVideoId = typeof p.videoId === 'string' ? parseInt(p.videoId) : p.videoId;
      const pVideoIdAlt = typeof p.video_id === 'number' ? p.video_id : parseInt(p.video_id?.toString() || '0');
      
      return pVideoId === videoId || pVideoIdAlt === videoId;
    });
    
    if (progressItem) {
      const progressValue = parseFloat(progressItem.progress?.toString() || '0');
      console.log(`Progress for video ${videoId}:`, progressValue, progressItem);
      return Math.max(0, Math.min(100, progressValue)); // Ensure it's between 0-100
    }
    
    return 0;
  };

  const getAccessDaysRemaining = () => {
    if (!user?.access_end) return 0;
    const now = new Date();
    const accessEnd = new Date(user.access_end);
    const diffTime = accessEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCoverImageUrl = (video: Video) => {
    // Priority order: cover_cloudinary_url > cover_url > constructed URL from cover_image > placeholder
    if (video.cover_cloudinary_url) {
      return video.cover_cloudinary_url;
    }

    if (video.cover_url) {
      return video.cover_url;
    }

    if (video.cover_image) {
      // Check if it's already a full URL
      if (video.cover_image.startsWith('http')) {
        return video.cover_image;
      }
      // Handle local storage paths
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    }

    // Enhanced placeholder matching VideoManagement style
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const formatDuration = (durationInSeconds?: number) => {
    if (!durationInSeconds) return 'N/A';

    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Enhanced progress calculation for statistics
  const completedVideos = progress.filter(p => {
    const progressValue = parseFloat(p.progress?.toString() || '0');
    return p.completed === true || progressValue >= 95;
  }).length;

  const inProgressVideos = progress.filter(p => {
    const progressValue = parseFloat(p.progress?.toString() || '0');
    return progressValue > 0 && progressValue < 95 && !p.completed;
  }).length;

  const notStartedVideos = Math.max(0, videos.length - completedVideos - inProgressVideos);

  const averageProgress = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => {
        const progressValue = parseFloat(p.progress?.toString() || '0');
        return sum + progressValue;
      }, 0) / progress.length)
    : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
            <div className="text-center md:text-left">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                Bienvenue, {user.username} ! 👋
              </h1>
              <p className="text-blue-100 text-base md:text-lg mb-3 md:mb-2">
                Prêt à poursuivre votre parcours d'apprentissage ?
              </p>
              <div className="flex items-center justify-center md:justify-start">
                <User className="h-4 w-4 mr-2" />
                <span className="text-blue-200 text-sm">
                  Membre depuis {formatDate(user.created_at || new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 border border-red-200 bg-red-50 rounded-xl shadow-sm">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm md:text-base">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800 font-bold text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg md:rounded-xl">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Vidéos disponibles</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{videos.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl">
                <Award className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{completedVideos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-orange-100 rounded-lg md:rounded-xl">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">En cours</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{inProgressVideos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-yellow-100 rounded-lg md:rounded-xl">
                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Expiration de l'accès</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{getAccessDaysRemaining()}d</p>
              </div>
            </div>
          </Card>
        </div>

        {/* User Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="p-4 md:p-6 bg-white shadow-lg border-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 mr-2 text-indigo-600" />
              Progression d'apprentissage
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div>
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="text-gray-600">Terminées</span>
                  <span className="font-medium">{completedVideos} vidéos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${videos.length > 0 ? (completedVideos / videos.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="text-gray-600">En cours</span>
                  <span className="font-medium">{inProgressVideos} vidéos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${videos.length > 0 ? (inProgressVideos / videos.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="text-gray-600">Non commencées</span>
                  <span className="font-medium">{notStartedVideos} vidéos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gray-400"
                    style={{ width: `${videos.length > 0 ? (notStartedVideos / videos.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 bg-white shadow-lg border-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-4 w-4 md:h-5 md:w-5 mr-2 text-indigo-600" />
              Statistiques d'apprentissage
            </h3>
            <div className="space-y-2 md:space-y-3">
              {userStats.favoriteCategory && (
                <div className="flex justify-between">
                  <span className="text-xs md:text-sm text-gray-600">Catégorie préférée :</span>
                  <span className="text-xs md:text-sm font-medium">{userStats.favoriteCategory}</span>
                </div>
              )}
              {userStats.totalWatchTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs md:text-sm text-gray-600">Temps total de visionnage :</span>
                  <span className="text-xs md:text-sm font-medium">{formatDuration(userStats.totalWatchTime)}</span>
                </div>
              )}
              {userStats.lastWatched && (
                <div className="flex justify-between">
                  <span className="text-xs md:text-sm text-gray-600">Dernière vidéo vue :</span>
                  <span className="text-xs md:text-sm font-medium text-right">{userStats.lastWatched.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs md:text-sm text-gray-600">Progression moyenne :</span>
                <span className="text-xs md:text-sm font-medium">{averageProgress}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Videos Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Votre contenu d'apprentissage</h2>
            <div className="text-xs md:text-sm text-gray-600">
              {videos.length} vidéo{videos.length !== 1 ? 's' : ''} disponibles • {completedVideos} terminées
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 md:py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-base md:text-lg">Chargement de vos vidéos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {videos.map((video) => {
              const videoProgress = getVideoProgress(video.id);
              const isCompleted = videoProgress >= 95;
              const hasStarted = videoProgress > 0;

              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  videoProgress={videoProgress}
                  isCompleted={isCompleted}
                  hasStarted={hasStarted}
                  getCoverImageUrl={getCoverImageUrl}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                  formatFileSize={formatFileSize}
                />
              );
            })}
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="text-center py-12 md:py-16">
            <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Aucune vidéo disponible pour le moment</h3>
            <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto">
              Il semble qu'aucun contenu d'apprentissage ne vous ait encore été attribué. Revenez plus tard ou contactez votre instructeur pour plus d'informations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface VideoCardProps {
  video: Video;
  videoProgress: number;
  isCompleted: boolean;
  hasStarted: boolean;
  getCoverImageUrl: (video: Video) => string;
  formatDate: (dateString: string) => string;
  formatDuration: (duration?: number) => string;
  formatFileSize: (bytes?: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  videoProgress,
  isCompleted,
  hasStarted,
  getCoverImageUrl,
  formatDate,
  formatDuration,
  formatFileSize
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white h-full flex flex-col">
      <div className="relative group">
        <img
          src={getCoverImageUrl(video)}
          alt={video.title}
          className="w-full h-36 md:h-48 object-cover cursor-pointer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center cursor-pointer">
          <Link
            to={`/app/watch/${video.id}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 md:p-3 transform hover:scale-110 transition-transform"
            title="Watch video"
          >
            <Play className="h-5 w-5 md:h-6 md:w-6 text-gray-700 ml-1" />
          </Link>
        </div>

        {/* Status badge - top right */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${video.is_published
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
            }`}>
            {video.is_published ? 'Publiée' : 'Brouillon'}
          </span>
        </div>

        {/* Category badge - top left */}
        {video.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {video.category.name}
            </span>
          </div>
        )}

        {/* Completion badge */}
        {isCompleted && (
          <div className="absolute top-12 right-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500 text-white">
              ✓ Terminée
            </span>
          </div>
        )}

        {/* Rating badge if available */}
        {video.average_rating && video.average_rating > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center">
              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
              {video.average_rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Views count if available */}
        {video.views_count !== undefined && (
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {video.views_count}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base" title={video.title}>
          {video.title}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2 flex-grow" title={video.description}>
          {video.description || 'Aucune description fournie'}
        </p>

        {/* Video metadata */}
        <div className="space-y-2 text-xs text-gray-500 mb-3 md:mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDuration(video.duration)}</span>
            </div>
            <div>
              <span>{formatFileSize(video.file_size)}</span>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Ajoutée le {formatDate(video.created_at)}</span>
          </div>
        </div>

        {/* Progress section */}
        {hasStarted && (
          <div className="mb-3 md:mb-4">
            <div className="flex justify-between text-xs md:text-sm mb-2">
              <span className="text-gray-600">Votre progression</span>
              <span className="font-medium text-gray-900">{Math.round(videoProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                style={{ width: `${videoProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action button */}
        <Link to={`/app/watch/${video.id}`} className="mt-auto">
          <Button
            size="sm"
            variant={isCompleted ? 'secondary' : 'primary'}
            className="w-full text-xs md:text-sm"
          >
            <Play className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            {isCompleted ? 'Revoir la vidéo' : hasStarted ? 'Continuer l\'apprentissage' : 'Commencer l\'apprentissage'}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default Dashboard;