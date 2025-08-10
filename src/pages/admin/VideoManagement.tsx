import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Edit, Trash2, Eye, EyeOff, Plus, Calendar, AlertCircle, Play, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

interface Category {
  id: number;
  name: string;
}

interface VideoData {
  id: number;
  title: string;
  description: string;
  video_path: string;
  video_url?: string;
  cover_image: string;
  cover_url?: string;
  is_published: boolean;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoData | null;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  const getVideoUrl = () => {
    if (video.video_url) {
      return video.video_url;
    }
    
    if (video.video_path) {
      // Use the Laravel backend URL + storage path
      // The API should return the path like "videos/filename.mp4"
      const fullUrl = `http://127.0.0.1:8000/storage/${video.video_path}`;
      console.log('Constructed video URL:', fullUrl, 'from path:', video.video_path);
      return fullUrl;
    }
    
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{video.title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <video
            controls
            className="w-full max-h-[60vh]"
            src={getVideoUrl()}
            poster={video.cover_url}
          >
            Your browser does not support the video tag.
          </video>
          {video.description && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 text-sm">{video.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  isDestructive = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertCircle className={`h-6 w-6 mr-3 ${isDestructive ? 'text-red-500' : 'text-blue-500'}`} />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={isDestructive ? 'danger' : 'primary'}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'publish' | 'unpublish' | null;
    videoId: number | null;
    videoTitle: string;
  }>({
    isOpen: false,
    action: null,
    videoId: null,
    videoTitle: ''
  });
  const [videoPlayerModal, setVideoPlayerModal] = useState<{
    isOpen: boolean;
    video: VideoData | null;
  }>({
    isOpen: false,
    video: null
  });

  useEffect(() => {
    // Add error boundary for useEffect
    try {
      fetchVideos();
    } catch (error) {
      console.error('Error in useEffect:', error);
      setError('Failed to initialize component');
      setLoading(false);
    }
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching videos...');
      
      const response = await axiosClient.get('/admin/videos');
      console.log('Videos response:', response.data);
      
      if (response.data && response.data.success) {
        setVideos(response.data.data || []);
      } else {
        setError(response.data?.message || 'Failed to fetch videos');
      }
    } catch (error: any) {
      console.error('Failed to fetch videos:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublishStatus = async (videoId: number) => {
    try {
      const response = await axiosClient.patch(`/admin/videos/${videoId}/toggle-publish`);
      
      if (response.data.success) {
        // Update the video in the local state
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, is_published: !video.is_published }
            : video
        ));
        
        // Show success message (you could use a toast notification here)
        alert(response.data.message);
      } else {
        alert(response.data.message || 'Failed to update publish status');
      }
    } catch (error: any) {
      console.error('Failed to toggle publish status:', error);
      alert(error.response?.data?.message || 'Failed to update publish status');
    }
    
    setConfirmModal({ isOpen: false, action: null, videoId: null, videoTitle: '' });
  };

  const handleDeleteVideo = async (videoId: number) => {
    try {
      const response = await axiosClient.delete(`/admin/videos/${videoId}`);
      
      if (response.data.success) {
        // Remove the video from local state
        setVideos(prev => prev.filter(video => video.id !== videoId));
        alert(response.data.message);
      } else {
        alert(response.data.message || 'Failed to delete video');
      }
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      alert(error.response?.data?.message || 'Failed to delete video');
    }
    
    setConfirmModal({ isOpen: false, action: null, videoId: null, videoTitle: '' });
  };

  const openConfirmModal = (action: 'delete' | 'publish' | 'unpublish', videoId: number, videoTitle: string) => {
    setConfirmModal({
      isOpen: true,
      action,
      videoId,
      videoTitle
    });
  };

  const openVideoPlayer = (video: VideoData) => {
    setVideoPlayerModal({
      isOpen: true,
      video
    });
  };

  const closeVideoPlayer = () => {
    setVideoPlayerModal({
      isOpen: false,
      video: null
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.videoId && confirmModal.action) {
      if (confirmModal.action === 'delete') {
        handleDeleteVideo(confirmModal.videoId);
      } else {
        handleTogglePublishStatus(confirmModal.videoId);
      }
    }
  };

  const getConfirmModalProps = () => {
    switch (confirmModal.action) {
      case 'delete':
        return {
          title: 'Delete Video',
          message: `Are you sure you want to delete "${confirmModal.videoTitle}"? This action cannot be undone.`,
          confirmText: 'Delete',
          isDestructive: true
        };
      case 'publish':
        return {
          title: 'Publish Video',
          message: `Are you sure you want to publish "${confirmModal.videoTitle}"? It will be visible to students.`,
          confirmText: 'Publish',
          isDestructive: false
        };
      case 'unpublish':
        return {
          title: 'Unpublish Video',
          message: `Are you sure you want to unpublish "${confirmModal.videoTitle}"? It will no longer be visible to students.`,
          confirmText: 'Unpublish',
          isDestructive: false
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: 'Confirm',
          isDestructive: false
        };
    }
  };

  // Add early return for any critical errors
  if (error && videos.length === 0 && !loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
            <p className="text-gray-600 mt-2">Manage your course videos and publishing status</p>
          </div>
          <Link to="/admin/videos/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Video
            </Button>
          </Link>
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Videos</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchVideos} 
            variant="secondary" 
            className="mt-4"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
            <p className="text-gray-600 mt-2">Loading videos...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading videos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
            <p className="text-gray-600 mt-2">Manage your course videos and publishing status</p>
          </div>
          <Link to="/admin/videos/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Video
            </Button>
          </Link>
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Videos</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchVideos} 
            variant="secondary" 
            className="mt-4"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const publishedVideos = videos.filter(video => video.is_published);
  const unpublishedVideos = videos.filter(video => !video.is_published);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
          <p className="text-gray-600 mt-2">Manage your course videos and publishing status</p>
        </div>
        <Link to="/admin/videos/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Video
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{publishedVideos.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <EyeOff className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{unpublishedVideos.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Published Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Published Videos ({publishedVideos.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onTogglePublish={(videoId, videoTitle) => 
                openConfirmModal('unpublish', videoId, videoTitle)
              }
              onDelete={(videoId, videoTitle) => 
                openConfirmModal('delete', videoId, videoTitle)
              }
              onPlay={(video) => openVideoPlayer(video)}
            />
          ))}
          {publishedVideos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Videos</h3>
              <p className="text-gray-600 mb-4">
                Your published videos will appear here when you publish them.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Draft Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Draft Videos ({unpublishedVideos.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unpublishedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onTogglePublish={(videoId, videoTitle) => 
                openConfirmModal('publish', videoId, videoTitle)
              }
              onDelete={(videoId, videoTitle) => 
                openConfirmModal('delete', videoId, videoTitle)
              }
              onPlay={(video) => openVideoPlayer(video)}
            />
          ))}
          {unpublishedVideos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Videos</h3>
              <p className="text-gray-600 mb-4">
                Your draft videos will appear here before you publish them.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* No Videos at All */}
      {videos.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Videos Yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first course video.
          </p>
          <Link to="/admin/videos/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Video
            </Button>
          </Link>
        </Card>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, videoId: null, videoTitle: '' })}
        onConfirm={handleConfirmAction}
        {...getConfirmModalProps()}
      />

      <VideoPlayerModal
        isOpen={videoPlayerModal.isOpen}
        onClose={closeVideoPlayer}
        video={videoPlayerModal.video}
      />
    </div>
  );
};

interface VideoCardProps {
  video: VideoData;
  onTogglePublish: (videoId: number, videoTitle: string) => void;
  onDelete: (videoId: number, videoTitle: string) => void;
  onPlay: (video: VideoData) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onTogglePublish, onDelete, onPlay }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCoverImageUrl = () => {
    // If cover_url is provided by the API, use it
    if (video.cover_url) {
      return video.cover_url;
    }
    
    // If we have a cover_image path, construct the URL for Laravel storage
    if (video.cover_image) {
      // Use the Laravel backend URL + storage path
      // Remove 'covers/' from the path if it's already included
      const cleanPath = video.cover_image.startsWith('covers/') ? video.cover_image : `covers/${video.cover_image}`;
      return `http://127.0.0.1:8000/storage/${cleanPath}`;
    }
    
    // Return placeholder image if no cover image
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative group">
        <img
          src={getCoverImageUrl()}
          alt={video.title}
          className="w-full h-32 object-cover"
          onError={(e) => {
            // Fallback to a placeholder image if the cover image fails to load
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={() => onPlay(video)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform hover:scale-110 transition-transform"
            title="Play video"
          >
            <Play className="h-6 w-6 text-gray-700 ml-1" />
          </button>
        </div>
        
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            video.is_published 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {video.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
        {video.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {video.category.name}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={video.title}>
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={video.description}>
          {video.description || 'No description provided'}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            Created {formatDate(video.created_at)}
          </span>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={video.is_published ? 'secondary' : 'primary'}
            onClick={() => onTogglePublish(video.id, video.title)}
            className="flex-1"
          >
            {video.is_published ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Publish
              </>
            )}
          </Button>
          <Link to={`/admin/videos/edit/${video.id}`}>
            <Button size="sm" variant="ghost" title="Edit video">
              <Edit className="h-3 w-3" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(video.id, video.title)}
            title="Delete video"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoManagement;