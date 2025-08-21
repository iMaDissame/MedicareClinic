import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Play, Clock, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import { UserProgress } from '../types';
import axiosClient from '../services/axiosClient';

interface Video {
  id: string;
  title: string;
  description: string;
  video_path: string;
  video_url: string;
  cover_image: string;
  cover_url: string;
  is_published: boolean;
  category: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserVideos();
    const savedProgress = localStorage.getItem(`progress_${user?.id}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
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

  const getVideoProgress = (videoId: string) => {
    return progress.find(p => p.videoId === videoId)?.progress || 0;
  };

  const getAccessDaysRemaining = () => {
    if (!user) return 0;
    const now = new Date();
    const accessEnd = new Date(user.access_end);
    const diffTime = accessEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Available Videos</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{videos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <Play className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {progress.filter(p => p.completed).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Access Expires</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {getAccessDaysRemaining()}d
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Your Videos</h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your videos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {videos.map((video) => {
            const videoProgress = getVideoProgress(video.id);
            return (
              <Card key={video.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
                <div className="relative">
                  <img
                    src={video.cover_url || '/placeholder-cover.jpg'}
                    alt={video.title}
                    className="w-full h-40 sm:h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-cover.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <Link
                      to={`/app/watch/${video.id}`}  // Updated route
                      className="bg-white text-black px-4 lg:px-6 py-2 rounded-full font-medium flex items-center space-x-2 hover:bg-gray-100 transition-colors text-sm lg:text-base"
                    >
                      <Play className="h-4 w-4" />
                      <span>Watch Now</span>
                    </Link>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {video.title}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                      {video.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {/* You might want to add duration to your Video model */}
                      30 min
                    </div>
                    <div>{videoProgress}% Complete</div>
                  </div>
                  {videoProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos Available</h3>
          <p className="text-gray-600">You don't have access to any videos yet or no videos are published in your categories.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;