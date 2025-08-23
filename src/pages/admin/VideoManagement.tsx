import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
            Annuler
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
  const navigate = useNavigate();
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

  useEffect(() => {
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
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, is_published: !video.is_published }
            : video
        ));
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

  const handleImageClick = (videoId: number) => {
    navigate(`/admin/videos/watch/${videoId}`);
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

  if (error && videos.length === 0 && !loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des vidéos</h1>
            <p className="text-gray-600 mt-2">Gérez vos vidéos de cours et leur statut de publication</p>
          </div>
          <Link to="/admin/videos/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une nouvelle vidéo
            </Button>
          </Link>
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur lors du chargement des vidéos</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button 
            onClick={fetchVideos} 
            variant="secondary" 
            className="mt-4"
          >
            Réessayer
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des vidéos</h1>
            <p className="text-gray-600 mt-2">Chargement des vidéos...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Chargement des vidéos...</div>
        </div>
      </div>
    );
  }

  const publishedVideos = videos.filter(video => video.is_published);
  const unpublishedVideos = videos.filter(video => !video.is_published);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des vidéos</h1>
          <p className="text-gray-600 mt-2">Gérez vos vidéos de cours et leur statut de publication</p>
        </div>
        <Link to="/admin/videos/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une nouvelle vidéo
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
              <p className="text-sm font-medium text-gray-600">Vidéos totales</p>
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
              <p className="text-sm font-medium text-gray-600">Publiées</p>
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
              <p className="text-sm font-medium text-gray-600">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">{unpublishedVideos.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Published Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Vidéos publiées ({publishedVideos.length})
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
              onImageClick={(videoId) => handleImageClick(videoId)}
            />
          ))}
          {publishedVideos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo publiée</h3>
              <p className="text-gray-600 mb-4">
                Vos vidéos publiées apparaîtront ici lorsque vous les publierez.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Draft Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Vidéos brouillon ({unpublishedVideos.length})
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
              onImageClick={(videoId) => handleImageClick(videoId)}
            />
          ))}
          {unpublishedVideos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo brouillon</h3>
              <p className="text-gray-600 mb-4">
                Vos vidéos brouillon apparaîtront ici avant que vous ne les publiiez.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* No Videos at All */}
      {videos.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune vidéo pour le moment</h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre première vidéo de cours.
          </p>
          <Link to="/admin/videos/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer votre première vidéo
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
    </div>
  );
};

interface VideoCardProps {
  video: VideoData;
  onTogglePublish: (videoId: number, videoTitle: string) => void;
  onDelete: (videoId: number, videoTitle: string) => void;
  onImageClick: (videoId: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onTogglePublish, onDelete, onImageClick }) => {
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
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
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
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => onImageClick(video.id)}
          onError={(e) => {
            // Fallback to a placeholder image if the cover image fails to load
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Play button overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center cursor-pointer"
          onClick={() => onImageClick(video.id)}
        >
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform hover:scale-110 transition-transform"
            title="Watch video"
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
            {video.is_published ? 'Publiée' : 'Brouillon'}
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
          {video.description || 'Aucune description fournie'}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            Créée le {formatDate(video.created_at)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Publish/Unpublish button */}
          <Button
            size="sm"
            variant={video.is_published ? 'secondary' : 'primary'}
            onClick={() => onTogglePublish(video.id, video.title)}
            className="col-span-1"
          >
            {video.is_published ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Dépublier
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Publier
              </>
            )}
          </Button>
          
          {/* Edit button */}
          <Link to={`/admin/videos/edit/${video.id}`} className="col-span-1">
            <Button size="sm" variant="ghost" className="w-full" title="Modifier la vidéo">
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
          </Link>
          
          {/* Delete button - spans full width on second row */}
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(video.id, video.title)}
            title="Supprimer la vidéo"
            className="col-span-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoManagement;