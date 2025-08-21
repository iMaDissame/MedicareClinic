import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Trash2, Check, X, User, Calendar, Shield, CheckCircle } from 'lucide-react';
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
  video_path: string;
  video_url?: string;
  cover_image: string;
  cover_url?: string;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
        saveProgress(video.id, progress);
      }
    };

    const handleVideoEnd = () => {
      saveProgress(video.id, 100);
    };

    videoElement.addEventListener('timeupdate', updateProgress);
    videoElement.addEventListener('ended', handleVideoEnd);

    return () => {
      videoElement.removeEventListener('timeupdate', updateProgress);
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [video, currentUser]);

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
    const adminData = localStorage.getItem('currentAdmin');
    const userData = localStorage.getItem('currentUser');
    
    if (adminData) {
      const admin = JSON.parse(adminData);
      setCurrentUser({ ...admin, role: 'admin' });
    } else if (authUser) {
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
        setVideo(response.data.data);
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

  const getVideoUrl = () => {
    if (!video) return '';
    
    if (video.video_url) {
      return video.video_url;
    }
    
    if (video.video_path) {
      return `http://127.0.0.1:8000/storage/${video.video_path}`;
    }
    
    return '';
  };

  const getCoverUrl = () => {
    if (!video) return '';
    
    if (video.cover_url) {
      return video.cover_url;
    }
    
    if (video.cover_image) {
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    }
    
    return '';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVisibleComments = () => {
    if (!video || !video.comments) return [];
    
    if (currentUser?.role === 'admin') {
      return video.comments;
    } else {
      return video.comments.filter(comment => 
        comment.is_approved || (currentUser && comment.user_id === currentUser.id)
      );
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
    if (currentUser?.role === 'admin') return true;
    if (currentUser && comment.user_id === currentUser.id) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading video...</div>
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
          Go Back
        </Button>
        
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <X className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Video</h3>
              <p className="text-red-700 text-sm mt-1">{error || 'Video not found'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const visibleComments = getVisibleComments();

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          onClick={() => navigate(-1)} 
          variant="secondary" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Video Player Section */}
        <Card className="overflow-hidden mb-8">
          <video
            ref={videoRef}
            controls
            className="w-full aspect-video"
            src={getVideoUrl()}
            poster={getCoverUrl()}
          >
            Your browser does not support the video tag.
          </video>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
              {video.category && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {video.category.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Published on {formatDate(video.created_at)}</span>
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
                Comments ({visibleComments.length})
              </h2>
            </div>

            {/* Add Comment Form */}
            {currentUser ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="mb-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
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
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 text-sm">Please log in to add comments</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {visibleComments.length > 0 ? (
                visibleComments.map((comment) => {
                  const author = getCommentAuthor(comment);
                  const isOwnComment = (currentUser?.role === 'admin' && comment.admin_id === currentUser?.id) || 
                                     (currentUser?.role === 'student' && comment.user_id === currentUser?.id);
                  
                  return (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex items-center bg-gray-100 rounded-full p-2 mr-3">
                            <User className="h-3 w-3 text-gray-600" />
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
                        
                        {canDeleteComment(comment) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
                      
                      <div className="flex items-center space-x-2">
                        {!comment.is_approved && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Pending Approval
                          </span>
                        )}
                        {comment.is_approved && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Approved
                          </span>
                        )}
                        {isOwnComment && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Your comment
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Be the first to share your thoughts!
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