import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, MessageCircle, Trash2, Check, X, User, Calendar, Shield, 
  CheckCircle, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack,
  Settings, Download, Share2, RotateCcw, FastForward, Rewind
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';

interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  role?: string;
}

interface Comment {
  id: number;
  content: string;
  is_approved: boolean;
  user_id: number | null;
  admin_id?: number | null;
  video_id: number;
  user: User | null;
  admin?: User | null;
  created_at: string;
  updated_at: string;
}

interface VideoData {
  id: number;
  title: string;
  description: string;
  video_path?: string;
  video_url?: string;
  cloudinary_url?: string;
  cloudinary_public_id?: string;
  cover_image?: string;
  cover_url?: string;
  cover_cloudinary_url?: string;
  duration?: number;
  file_size?: number;
  is_published: boolean;
  category: Category | null;
  created_at: string;
  updated_at: string;
  comments: Comment[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const Icon = type === 'success' ? CheckCircle : X;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="px-4 py-2">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

const VideoWatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  
  // Comment actions state
  const [commentActions, setCommentActions] = useState<{[key: number]: 'approving' | 'rejecting' | null}>({});
  
  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (id) {
      fetchVideo(parseInt(id));
    }
    fetchCurrentUser();
  }, [id, authUser]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !currentUser || !video) return;

    const updateProgress = () => {
      if (videoElement.duration) {
        const progress = (videoElement.currentTime / videoElement.duration) * 100;
        setVideoProgress(progress);
        setCurrentTime(videoElement.currentTime);
        saveProgress(video.id, progress);
      }
    };

    const handleVideoEnd = () => {
      saveProgress(video.id, 100);
      setIsPlaying(false);
    };

    const handleVideoError = () => {
      setVideoError('Failed to load video. Please try refreshing the page.');
      setVideoLoading(false);
    };

    const handleVideoCanPlay = () => {
      setVideoError(null);
      setDuration(videoElement.duration || 0);
      setVideoLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', updateProgress);
    videoElement.addEventListener('ended', handleVideoEnd);
    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('canplay', handleVideoCanPlay);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('loadedmetadata', handleVideoCanPlay);

    return () => {
      videoElement.removeEventListener('timeupdate', updateProgress);
      videoElement.removeEventListener('ended', handleVideoEnd);
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('canplay', handleVideoCanPlay);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('loadedmetadata', handleVideoCanPlay);
    };
  }, [video, currentUser]);

  // Handle keyboard shortcuts - FIXED: Ignore when typing in form fields
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a form field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }
      
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Add touch event handling for mobile play/pause - FIXED: Mobile button functionality
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoTap = (e: TouchEvent) => {
      e.preventDefault();
      togglePlayPause();
    };

    // Add touch event listener to the video element
    videoElement.addEventListener('touchstart', handleVideoTap, { passive: false });

    return () => {
      videoElement.removeEventListener('touchstart', handleVideoTap);
    };
  }, [isPlaying]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'success'
    });
  };

  const fetchCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    const authType = localStorage.getItem('authType');
    
    console.log('🔍 Auth check:', { userData: !!userData, authType });
    
    if (userData && authType) {
      const user = JSON.parse(userData);
      
      if (authType === 'admin') {
        console.log('👨‍💼 Admin user detected');
        setCurrentUser({ ...user, role: 'admin' });
      } else if (authType === 'user') {
        console.log('👤 Regular user detected');
        setCurrentUser({ ...user, role: 'student' });
      }
    } else if (authUser) {
      // Fallback to auth context
      setCurrentUser({ 
        id: authUser.id,
        name: authUser.name || authUser.username,
        email: authUser.email,
        username: authUser.username,
        role: 'student'
      });
    }
  };

  const fetchVideo = async (videoId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get(`/videos/${videoId}`);
      
      if (response.data && response.data.success) {
        const videoData = response.data.data;
        setVideo(videoData);
      } else {
        setError(response.data?.message || 'Failed to fetch video');
      }
    } catch (error: any) {
      console.error('Failed to fetch video:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch video');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (videoId: number, progress: number) => {
    try {
      if (!currentUser) return;

      // Save locally
      const progressKey = `progress_${currentUser.id}_${videoId}`;
      localStorage.setItem(progressKey, progress.toString());
      
      // Save to backend
      await axiosClient.post('/progress', {
        video_id: videoId,
        progress: progress,
        user_id: currentUser.id
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const getVideoUrl = (): string => {
    if (!video) return '';
    
    // Priority order: Cloudinary URL > video_url > constructed local path
    if (video.cloudinary_url) {
      return video.cloudinary_url;
    }
    
    if (video.video_url && video.video_url.includes('cloudinary')) {
      return video.video_url;
    }
    
    if (video.video_url) {
      return video.video_url;
    }
    
    if (video.video_path) {
      const localUrl = `http://127.0.0.1:8000/storage/${video.video_path}`;
      return localUrl;
    }
    
    return '';
  };

  const getCoverUrl = (): string => {
    if (!video) return '';
    
    // Priority order: Cloudinary cover URL > cover_url > constructed local path
    if (video.cover_cloudinary_url) {
      return video.cover_cloudinary_url;
    }
    
    if (video.cover_url && video.cover_url.includes('cloudinary')) {
      return video.cover_url;
    }
    
    if (video.cover_url) {
      return video.cover_url;
    }
    
    if (video.cover_image) {
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    }
    
    return '';
  };

  // Video control functions
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        setVideoError('Failed to play video. Please try again.');
      });
    }
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      videoRef.current.currentTime + 10,
      videoRef.current.duration
    );
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  const adjustVolume = (change: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + change));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const seekTo = (percentage: number) => {
    if (!videoRef.current || !duration) return;
    const newTime = (percentage / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(error => {
        console.error('Error attempting to enable fullscreen:', error);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadVideo = () => {
    const videoUrl = getVideoUrl();
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = video?.title || 'video';
      link.click();
    }
  };

  const shareVideo = () => {
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      showModal('Link Copied', 'Video link copied to clipboard!', 'success');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser || !video) return;
    
    try {
      setSubmittingComment(true);
      
      const response = await axiosClient.post(`/videos/${video.id}/comments`, {
        content: newComment.trim()
      });
      
      if (response.data && response.data.success) {
        await fetchVideo(video.id);
        setNewComment('');
        
        if (currentUser.role === 'admin') {
          showModal('Comment Added', 'Your comment has been added successfully and is now visible to all users.', 'success');
        } else {
          showModal('Comment Submitted', 'Your comment has been submitted successfully! It will appear after admin approval.', 'success');
        }
      } else {
        showModal('Error', response.data?.message || 'Failed to add comment', 'error');
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      showModal('Error', error.response?.data?.message || 'Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const response = await axiosClient.delete(`/comments/${commentId}`);
      
      if (response.data && response.data.success) {
        setVideo(prev => prev ? {
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== commentId)
        } : null);
        
        showModal('Comment Deleted', 'The comment has been deleted successfully and removed from the video.', 'success');
      } else {
        showModal('Error', response.data?.message || 'Failed to delete comment', 'error');
      }
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      showModal('Error', error.response?.data?.message || 'Failed to delete comment', 'error');
    }
  };

  // Approve comment function
  const handleApproveComment = async (commentId: number) => {
    try {
      setCommentActions(prev => ({ ...prev, [commentId]: 'approving' }));
      
      const response = await axiosClient.patch(`/comments/${commentId}/approve`);
      
      if (response.data && response.data.success) {
        // Update the comment in the video state
        setVideo(prev => prev ? {
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === commentId 
              ? { ...comment, is_approved: true }
              : comment
          )
        } : null);
        
        showModal('Comment Approved', 'The comment has been approved successfully and is now visible to all users.', 'success');
      } else {
        showModal('Error', response.data?.message || 'Failed to approve comment', 'error');
      }
    } catch (error: any) {
      console.error('Failed to approve comment:', error);
      showModal('Error', error.response?.data?.message || 'Failed to approve comment', 'error');
    } finally {
      setCommentActions(prev => ({ ...prev, [commentId]: null }));
    }
  };

  // Reject comment function
  const handleRejectComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to reject this comment?')) {
      return;
    }
    
    try {
      setCommentActions(prev => ({ ...prev, [commentId]: 'rejecting' }));
      
      const response = await axiosClient.patch(`/comments/${commentId}/reject`);
      
      if (response.data && response.data.success) {
        // Update the comment in the video state
        setVideo(prev => prev ? {
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === commentId 
              ? { ...comment, is_approved: false }
              : comment
          )
        } : null);
        
        showModal('Comment Rejected', 'The comment has been rejected and is no longer visible to regular users.', 'success');
      } else {
        showModal('Error', response.data?.message || 'Failed to reject comment', 'error');
      }
    } catch (error: any) {
      console.error('Failed to reject comment:', error);
      showModal('Error', error.response?.data?.message || 'Failed to reject comment', 'error');
    } finally {
      setCommentActions(prev => ({ ...prev, [commentId]: null }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Updated comment visibility logic
  const getVisibleComments = () => {
    if (!video || !video.comments) return [];
    
    const authType = localStorage.getItem('authType');
    
    console.log('🔍 Comment visibility check:', {
      authType,
      currentUserRole: currentUser?.role,
      totalComments: video.comments.length
    });
    
    // Direct check against localStorage for more reliability
    if (authType === 'admin') {
      console.log('👨‍💼 Admin - showing ALL comments');
      return video.comments;
    } else {
      const filteredComments = video.comments.filter(comment => 
        comment.is_approved || 
        (currentUser && comment.user_id === currentUser.id)
      );
      
      console.log('👤 User - showing filtered comments:', {
        total: video.comments.length,
        visible: filteredComments.length
      });
      
      return filteredComments;
    }
  };

  const getCommentAuthor = (comment: Comment) => {
    if (comment.admin_id && comment.admin) {
      return {
        name: comment.admin.name || 'Admin',
        role: 'admin'
      };
    } else if (comment.user_id && comment.user) {
      return {
        name: comment.user.name || comment.user.username || 'User',
        role: 'student'
      };
    } else {
      return {
        name: 'Unknown User',
        role: 'user'
      };
    }
  };

  const canDeleteComment = (comment: Comment) => {
    const authType = localStorage.getItem('authType');
    
    // Admin can delete any comment
    if (authType === 'admin') {
      return true;
    }
    
    // Regular user can only delete their own comments
    if (currentUser && comment.user_id === currentUser.id) {
      return true;
    }
    
    return false;
  };

  const retryVideoLoad = () => {
    if (videoRef.current && getVideoUrl()) {
      videoRef.current.load();
      setVideoError(null);
      setVideoLoading(true);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement de la vidéo...</div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate(-1)} 
          variant="secondary" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <X className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur lors du chargement de la vidéo</h3>
              <p className="text-red-700 text-sm mt-1">{error || 'Vidéo introuvable'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const visibleComments = getVisibleComments();
  const videoUrl = getVideoUrl();
  const coverUrl = getCoverUrl();

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          onClick={() => navigate(-1)} 
          variant="secondary" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Enhanced Video Player Section */}
        <Card className="overflow-hidden mb-8">
          {videoError ? (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Erreur de chargement de la vidéo</p>
                <p className="text-gray-600 text-sm mt-1">{videoError}</p>
                <Button 
                  onClick={retryVideoLoad} 
                  className="mt-4"
                  size="sm"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          ) : videoUrl ? (
            <div className="relative group" 
                 onMouseMove={resetControlsTimeout}
                 onMouseEnter={() => setShowControls(true)}
                 onTouchStart={resetControlsTimeout}>
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              <video
                ref={videoRef}
                className="w-full aspect-video bg-black"
                src={videoUrl}
                poster={coverUrl}
                preload="metadata"
                onClick={togglePlayPause}
                playsInline
                controls={false}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Custom Video Controls */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Top Controls */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <button
                    onClick={shareVideo}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    title="Share video"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={downloadVideo}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    title="Download video"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                {/* Center Play/Pause Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110"
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div 
                      className="w-full h-2 bg-white/30 rounded-full cursor-pointer group/progress"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                        seekTo(percentage);
                      }}
                    >
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-150 group-hover/progress:bg-blue-400"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Skip Backward */}
                      <button
                        onClick={skipBackward}
                        className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Skip backward 10s"
                      >
                        <SkipBack className="h-5 w-5" />
                      </button>

                      {/* Play/Pause */}
                      <button
                        onClick={togglePlayPause}
                        className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>

                      {/* Skip Forward */}
                      <button
                        onClick={skipForward}
                        className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Skip forward 10s"
                      >
                        <SkipForward className="h-5 w-5" />
                      </button>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-2 group/volume">
                        <button
                          onClick={toggleMute}
                          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </button>
                        <div className="w-20 opacity-0 group-hover/volume:opacity-100 transition-opacity">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              setVolume(newVolume);
                              setIsMuted(newVolume === 0);
                              if (videoRef.current) {
                                videoRef.current.volume = newVolume;
                                videoRef.current.muted = newVolume === 0;
                              }
                            }}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Time Display */}
                      <span className="text-white text-sm font-mono">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Settings */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                          title="Settings"
                        >
                          <Settings className="h-5 w-5" />
                        </button>

                        {/* Settings Dropdown */}
                        {showSettings && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-[160px]">
                            <div className="text-white text-sm font-medium mb-2">Playback Speed</div>
                            <div className="space-y-1">
                              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={`w-full text-left px-3 py-1 rounded text-sm transition-colors ${
                                    playbackRate === rate 
                                      ? 'bg-blue-500 text-white' 
                                      : 'text-gray-300 hover:bg-white/20'
                                  }`}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fullscreen */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Vidéo non disponible</p>
              </div>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
              {video.category && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {video.category.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Publié le {formatDate(video.created_at)}</span>
              </div>
              
              {video.duration && (
                <div className="flex items-center">
                  <span>Durée : {formatDuration(video.duration)}</span>
                </div>
              )}
              
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Raccourcis clavier</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                <div><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">Espace</kbd> Lecture/Pause</div>
                <div><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">←/→</kbd> Reculer/Avancer 10s</div>
                <div><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">↑/↓</kbd> Volume</div>
                <div><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">F</kbd> Plein écran</div>
                <div><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">M</kbd> Muet</div>
              </div>
            </div>
            
            {video.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Comments Section */}
        <div className="max-w-2xl">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <MessageCircle className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Commentaires ({visibleComments.length})
              </h2>
            </div>

            {/* Add Comment Form */}
            {currentUser ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="mb-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire…"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={submittingComment}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newComment.trim() || submittingComment}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submittingComment ? 'Publication...' : 'Publier le commentaire'}
                </Button>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 text-sm">Veuillez vous connecter pour ajouter des commentaires</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {visibleComments.length > 0 ? (
                visibleComments.map((comment) => {
                  const author = getCommentAuthor(comment);
                  const isOwnComment = (currentUser?.role === 'admin' && comment.admin_id === currentUser?.id) || 
                                     (currentUser?.role === 'student' && comment.user_id === currentUser?.id);
                  const authType = localStorage.getItem('authType');
                  const isAdmin = authType === 'admin';
                  const actionLoading = commentActions[comment.id];
                  
                  return (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex items-center bg-white rounded-full p-2 mr-3 shadow-sm">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {author.name}
                              {author.role === 'admin' && (
                                <Shield className="h-3 w-3 text-blue-500 ml-1 inline" />
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Admin Action Buttons */}
                          {isAdmin && (
                            <>
                              {!comment.is_approved ? (
                                <button
                                  onClick={() => handleApproveComment(comment.id)}
                                  disabled={actionLoading === 'approving'}
                                  className="flex items-center px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve comment"
                                >
                                  {actionLoading === 'approving' ? (
                                    <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <Check className="h-3 w-3 mr-1" />
                                  )}
                                  {actionLoading === 'approving' ? 'Approving...' : 'Approve'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRejectComment(comment.id)}
                                  disabled={actionLoading === 'rejecting'}
                                  className="flex items-center px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject comment"
                                >
                                  {actionLoading === 'rejecting' ? (
                                    <div className="w-3 h-3 border border-yellow-600 border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <X className="h-3 w-3 mr-1" />
                                  )}
                                  {actionLoading === 'rejecting' ? 'Rejecting...' : 'Reject'}
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Delete Button */}
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                              title="Delete comment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3 bg-white p-3 rounded border-l-4 border-l-blue-200">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {!comment.is_approved ? (
                            <span className="flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse"></div>
                              En attente d'approbation
                            </span>
                          ) : (
                            <span className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approuvé
                            </span>
                          )}
                          
                          {isOwnComment && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Votre commentaire
                            </span>
                          )}
                        </div>
                        
                        {/* Admin indicator for pending comments */}
                        {isAdmin && !comment.is_approved && (
                          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            Action requise
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Aucun commentaire pour le moment</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Soyez le premier à partager vos idées !
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
};

export default VideoWatchPage;