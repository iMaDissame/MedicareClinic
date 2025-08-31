import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, MessageCircle, Trash2, Check, X, User, Calendar, Shield,
  CheckCircle, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack,
  Settings, 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';

interface Category { id: number; name: string; }

interface UserT { // avoid clashing with DOM User type
  id: number;
  name: string;
  email: string;
  username?: string;
  role?: string;
}

interface CommentT {
  id: number;
  content: string;
  is_approved: boolean;
  user_id: number | null;
  admin_id?: number | null;
  video_id: number;
  user: UserT | null;
  admin?: UserT | null;
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
  comments: CommentT[];
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0"><Icon className={`h-8 w-8 ${iconColor}`} /></div>
          <div className="ml-3"><h3 className="text-lg font-medium text-gray-900">{title}</h3></div>
        </div>
        <div className="mb-6"><p className="text-gray-600">{message}</p></div>
        <div className="flex justify-end"><Button onClick={onClose} className="px-4 py-2">OK</Button></div>
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

  // comments
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentActions, setCommentActions] = useState<{[key: number]: 'approving' | 'rejecting' | null}>({});

  // auth/current user
  const [currentUser, setCurrentUser] = useState<UserT | null>(null);

  // player refs/state
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  // timers/guards
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredProgressRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUIUpdateRef = useRef(0);
  const [lastTap, setLastTap] = useState(0);

  // modal
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error'; }>({
    isOpen: false, title: '', message: '', type: 'success'
  });
  const showModal = (title: string, message: string, type: 'success' | 'error' = 'success') =>
    setModal({ isOpen: true, title, message, type });
  const closeModal = () => setModal({ isOpen: false, title: '', message: '', type: 'success' });

  // --------------------------------
  // fetchers
  // --------------------------------
  useEffect(() => {
    if (id) fetchVideo(parseInt(id, 10));
    fetchCurrentUser();
  }, [id, authUser]);

  const fetchCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    const authType = localStorage.getItem('authType');
    if (userData && authType) {
      const user = JSON.parse(userData);
      setCurrentUser({ ...user, role: authType === 'admin' ? 'admin' : 'student' });
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
      if (response.data?.success) {
        setVideo(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to fetch video');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to fetch video');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // video events
  // --------------------------------
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !currentUser || !video) return;

    const saveDebounced = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!el.duration) return;
        saveProgress(video.id, el.currentTime, el.duration);
      }, 1500);
    };

    const onTimeUpdate = () => {
      if (!el.duration) return;
      const now = performance.now();
      if (now - lastUIUpdateRef.current > 250) {
        lastUIUpdateRef.current = now;
        setCurrentTime(el.currentTime);
        setVideoProgress((el.currentTime / el.duration) * 100);
      }
      saveDebounced();
    };

    const onEnded = () => {
      if (!el.duration) return;
      saveProgress(video.id, el.duration, el.duration);
      setIsPlaying(false);
    };

    const onError = () => {
      setVideoError('Failed to load video. Please try refreshing the page.');
      setVideoLoading(false);
    };

    const onLoadedMetadata = async () => {
      setDuration(el.duration || 0);
      setVideoLoading(false);
      if (hasRestoredProgressRef.current) return;
      hasRestoredProgressRef.current = true;

      try {
        // Ensure you added: Route::get('user-progress/{user}/{video}', [ProgressController::class, 'getUserVideoProgress']);
        const r = await axiosClient.get(`/user-progress/${currentUser.id}/${video.id}`);
        const saved = r?.data?.data;
        if (saved?.current_time && saved.current_time > 30 && saved.current_time < (el.duration ?? Infinity)) {
          el.currentTime = saved.current_time;
          setCurrentTime(saved.current_time);
          setVideoProgress(saved.progress ?? (saved.current_time / el.duration) * 100);
        } else {
          const key = `progress_${currentUser.id}_${video.id}`;
          const s = localStorage.getItem(key);
          if (s) {
            const loc = JSON.parse(s);
            if (loc?.current_time > 30 && loc.current_time < (el.duration ?? Infinity)) {
              el.currentTime = loc.current_time;
              setCurrentTime(loc.current_time);
              setVideoProgress(loc.progress ?? (loc.current_time / el.duration) * 100);
            }
          }
        }
      } catch {
        // ignore, fallback already attempted
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [video, currentUser]);

  // reset restore guard when video changes
  useEffect(() => { hasRestoredProgressRef.current = false; }, [video?.id]);

  // fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // keyboard
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); skipBackward(); break;
        case 'ArrowRight': e.preventDefault(); skipForward(); break;
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break;
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  // touch: single = play/pause, double = fullscreen
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const handleVideoTap = () => {
      const now = Date.now();
      const DOUBLE = 300;
      if (now - lastTap < DOUBLE) {
        toggleFullscreen();
      } else {
        setTimeout(() => {
          if (Date.now() - lastTap >= DOUBLE) togglePlayPause();
        }, DOUBLE);
      }
      setLastTap(now);
    };
    el.addEventListener('touchend', handleVideoTap, { passive: true });
    return () => el.removeEventListener('touchend', handleVideoTap);
  }, [lastTap]);

  // auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 3000);
  };

  // --------------------------------
  // progress helpers
  // --------------------------------
  const saveProgress = async (videoId: number, currentTimeSeconds: number, durationSeconds: number) => {
    if (!currentUser?.id || !videoId || !durationSeconds || durationSeconds <= 0) return;
    const progressPercentage = Math.min(100, Math.max(0, (currentTimeSeconds / durationSeconds) * 100));
    if (!isFinite(progressPercentage)) return;

    try {
      await axiosClient.post('/progress', {
        video_id: videoId,
        user_id: currentUser.id,
        progress: progressPercentage,
        current_time: currentTimeSeconds,
        duration: durationSeconds
      });
      // backup
      const key = `progress_${currentUser.id}_${videoId}`;
      localStorage.setItem(key, JSON.stringify({
        videoId: String(videoId),
        video_id: videoId,
        progress: progressPercentage,
        current_time: currentTimeSeconds,
        duration: durationSeconds,
        completed: progressPercentage >= 95,
        last_updated: new Date().toISOString()
      }));
    } catch {
      const key = `progress_${currentUser.id}_${videoId}`;
      localStorage.setItem(key, JSON.stringify({
        videoId: String(videoId),
        video_id: videoId,
        progress: progressPercentage,
        current_time: currentTimeSeconds,
        duration: durationSeconds,
        completed: progressPercentage >= 95,
        last_updated: new Date().toISOString()
      }));
    }
  };

  const saveNow = () => {
    const el = videoRef.current;
    if (!el || !video) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (el.duration) saveProgress(video.id, el.currentTime, el.duration);
  };

  // --------------------------------
  // controls
  // --------------------------------
  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) el.pause();
    else el.play().catch(() => setVideoError('Failed to play video. Please try again.'));
  };

  const skipForward = () => {
    const el = videoRef.current;
    if (!el || el.readyState < 2) return;
    el.currentTime = Math.min((el.currentTime || 0) + 10, el.duration || el.currentTime + 10);
    setCurrentTime(el.currentTime);
    if (isPlaying) el.play(); // keep playing so icon updates
    saveNow();
  };

  const skipBackward = () => {
    const el = videoRef.current;
    if (!el || el.readyState < 2) return;
    el.currentTime = Math.max((el.currentTime || 0) - 10, 0);
    setCurrentTime(el.currentTime);
    if (isPlaying) el.play();
    saveNow();
  };

  const seekTo = (percentage: number) => {
    const el = videoRef.current;
    if (!el || !duration || el.readyState < 2) return;
    const t = Math.max(0, Math.min(duration * (percentage / 100), duration));
    el.currentTime = t;
    setCurrentTime(t);
    if (isPlaying) el.play();
    saveNow();
  };

  const adjustVolume = (change: number) => {
    const el = videoRef.current;
    if (!el) return;
    const newVolume = Math.max(0, Math.min(1, volume + change));
    setVolume(newVolume);
    el.volume = newVolume;
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    const muted = !isMuted;
    setIsMuted(muted);
    el.muted = muted;
  };

  const changePlaybackRate = (rate: number) => {
    const el = videoRef.current;
    if (!el) return;
    setPlaybackRate(rate);
    el.playbackRate = rate;
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    const container = videoContainerRef.current;
    const el = videoRef.current;
    if (!container || !el) return;
    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
        else if ((container as any).webkitRequestFullscreen) (container as any).webkitRequestFullscreen();
        else if ((el as any).webkitEnterFullscreen) (el as any).webkitEnterFullscreen(); // iOS
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showModal('Fullscreen Error', 'Unable to toggle fullscreen mode on this device.', 'error');
    }
  };

  // const downloadVideo = () => {
  //   const url = getVideoUrl();
  //   if (url) {
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = video?.title || 'video';
  //     link.click();
  //   }
  // };

  // const shareVideo = () => {
  //   if (navigator.share && video) {
  //     navigator.share({ title: video.title, url: window.location.href });
  //   } else {
  //     navigator.clipboard.writeText(window.location.href);
  //     showModal('Link Copied', 'Video link copied to clipboard!', 'success');
  //   }
  // };

  // --------------------------------
  // utils
  // --------------------------------
  const getVideoUrl = (): string => {
    if (!video) return '';
    if (video.cloudinary_url) return video.cloudinary_url;
    if (video.video_url) return video.video_url;
    if (video.video_path) return `http://127.0.0.1:8000/storage/${video.video_path}`;
    return '';
  };

  const getCoverUrl = (): string => {
    if (!video) return '';
    if (video.cover_cloudinary_url) return video.cover_cloudinary_url;
    if (video.cover_url) return video.cover_url;
    if (video.cover_image) return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    return '';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --------------------------------
  // comments (your original logic preserved)
  // --------------------------------
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !video) return;
    try {
      setSubmittingComment(true);
      const response = await axiosClient.post(`/videos/${video.id}/comments`, { content: newComment.trim() });
      if (response.data?.success) {
        await fetchVideo(video.id);
        setNewComment('');
        if (currentUser.role === 'admin') {
          showModal('Commentaire ajouté', 'Votre commentaire a été ajouté avec succès et est maintenant visible pour tous les utilisateurs.', 'success');
        } else {
          showModal('Commentaire soumis', 'Votre commentaire a été soumis avec succès ! Il apparaîtra après validation par un administrateur.', 'success');
        }
      } else {
        showModal('Erreur', response.data?.message || "Échec de l'ajout du commentaire", 'error');
      }
    } catch (error: any) {
      showModal('Erreur', error.response?.data?.message || "Échec de l'ajout du commentaire", 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await axiosClient.delete(`/comments/${commentId}`);
      if (response.data?.success) {
        setVideo(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== commentId) } : null);
        showModal('Commentaire supprimé', 'Le commentaire a été supprimé avec succès et retiré de la vidéo.', 'success');
      } else {
        showModal('Erreur', response.data?.message || "Échec de la suppression du commentaire", 'error');
      }
    } catch (error: any) {
      showModal('Erreur', error.response?.data?.message || "Échec de la suppression du commentaire", 'error');
    }
  };

  const handleApproveComment = async (commentId: number) => {
    try {
      setCommentActions(prev => ({ ...prev, [commentId]: 'approving' }));
      const response = await axiosClient.patch(`/comments/${commentId}/approve`);
      if (response.data?.success) {
        setVideo(prev => prev ? {
          ...prev,
          comments: prev.comments.map(c => c.id === commentId ? { ...c, is_approved: true } : c)
        } : null);
        showModal('Commentaire approuvé', 'Le commentaire a été approuvé avec succès et est maintenant visible pour tous les utilisateurs.', 'success');
      } else {
        showModal('Erreur', response.data?.message || "Échec de l'approbation du commentaire", 'error');
      }
    } catch (error: any) {
      showModal('Erreur', error.response?.data?.message || "Échec de l'approbation du commentaire", 'error');
    } finally {
      setCommentActions(prev => ({ ...prev, [commentId]: null }));
    }
  };

  const handleRejectComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to reject this comment?')) return;
    try {
      setCommentActions(prev => ({ ...prev, [commentId]: 'rejecting' }));
      const response = await axiosClient.patch(`/comments/${commentId}/reject`);
      if (response.data?.success) {
        setVideo(prev => prev ? {
          ...prev,
          comments: prev.comments.map(c => c.id === commentId ? { ...c, is_approved: false } : c)
        } : null);
        showModal('Commentaire rejeté', "Le commentaire a été rejeté et n'est plus visible pour les utilisateurs réguliers.", 'success');
      } else {
        showModal('Erreur', response.data?.message || "Échec du rejet du commentaire", 'error');
      }
    } catch (error: any) {
      showModal('Erreur', error.response?.data?.message || "Échec du rejet du commentaire", 'error');
    } finally {
      setCommentActions(prev => ({ ...prev, [commentId]: null }));
    }
  };

  const getVisibleComments = () => {
    if (!video?.comments) return [];
    const authType = localStorage.getItem('authType');
    if (authType === 'admin') return video.comments;
    return video.comments.filter(comment =>
      comment.is_approved || (currentUser && comment.user_id === currentUser.id)
    );
  };

  const getCommentAuthor = (comment: CommentT) => {
    if (comment.admin_id && comment.admin) {
      return { name: comment.admin.name || 'Admin', role: 'admin' as const };
    } else if (comment.user_id && comment.user) {
      return { name: comment.user.name || comment.user.username || 'User', role: 'student' as const };
    } else {
      return { name: 'Unknown User', role: 'user' as const };
    }
  };

  const canDeleteComment = (comment: CommentT) => {
    const authType = localStorage.getItem('authType');
    if (authType === 'admin') return true;
    return !!currentUser && comment.user_id === currentUser.id;
    };

  const retryVideoLoad = () => {
    if (videoRef.current && getVideoUrl()) {
      videoRef.current.load();
      setVideoError(null);
      setVideoLoading(true);
    }
  };

  // --------------------------------
  // render
  // --------------------------------
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
        <Button onClick={() => navigate(-1)} variant="secondary" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
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
        <Button onClick={() => navigate(-1)} variant="secondary" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        {/* Player */}
        <Card className="overflow-hidden mb-8">
          {videoError ? (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-medium">Erreur de chargement de la vidéo</p>
                <p className="text-gray-600 text-sm mt-1">{videoError}</p>
                <Button onClick={retryVideoLoad} className="mt-4" size="sm">Réessayer</Button>
              </div>
            </div>
          ) : videoUrl ? (
            <div
              ref={videoContainerRef}
              className="relative group"
              onMouseMove={resetControlsTimeout}
              onMouseEnter={() => setShowControls(true)}
              onTouchStart={resetControlsTimeout}
            >
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full aspect-video bg-black"
                src={videoUrl}
                poster={coverUrl}
                preload="metadata"
                playsInline
                controls={false}
              />

              {/* Overlay/Controls */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                {/* Top Right */}
                {/* <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <button onClick={shareVideo} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white" title="Share video">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={downloadVideo} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white" title="Download video">
                    <Download className="h-4 w-4" />
                  </button>
                </div> */}

                {/* Center Play/Pause */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 hover:scale-110 touch-manipulation"
                  >
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                  </button>
                </div>

                {/* Mobile hint */}
                <div className="absolute top-4 left-4 md:hidden">
                  <div className="bg-black/50 rounded-full p-2 text-white text-xs">Double-tap for fullscreen</div>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress */}
                  <div className="mb-4">
                    <div
                      className="w-full h-2 bg-white/30 rounded-full cursor-pointer group/progress touch-manipulation"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                        seekTo(percentage);
                      }}
                      onTouchEnd={(e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const percentage = ((touch.clientX - rect.left) / rect.width) * 100;
                        seekTo(percentage);
                      }}
                    >
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-150 group-hover/progress:bg-blue-400"
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Buttons row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button onClick={skipBackward} className="p-2 hover:bg-white/20 rounded-full text-white touch-manipulation" title="Skip backward 10s">
                        <SkipBack className="h-5 w-5" />
                      </button>
                      <button onClick={togglePlayPause} className="p-2 hover:bg-white/20 rounded-full text-white touch-manipulation">
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button onClick={skipForward} className="p-2 hover:bg-white/20 rounded-full text-white touch-manipulation" title="Skip forward 10s">
                        <SkipForward className="h-5 w-5" />
                      </button>

                      {/* Volume */}
                      <div className="hidden md:flex items-center space-x-2 group/volume">
                        <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full text-white">
                          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </button>
                        <div className="w-20 opacity-0 group-hover/volume:opacity-100 transition-opacity">
                          <input
                            type="range" min="0" max="1" step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setVolume(v); setIsMuted(v === 0);
                              if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
                            }}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <span className="text-white text-sm font-mono hidden sm:block">
                        {formatDuration(currentTime)} / {formatDuration(duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative hidden md:block">
                        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/20 rounded-full text-white" title="Settings">
                          <Settings className="h-5 w-5" />
                        </button>
                        {showSettings && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-[160px]">
                            <div className="text-white text-sm font-medium mb-2">Playback Speed</div>
                            <div className="space-y-1">
                              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                                <button key={rate} onClick={() => changePlaybackRate(rate)}
                                  className={`w-full text-left px-3 py-1 rounded text-sm transition-colors ${playbackRate === rate ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-white/20'}`}>
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full text-white touch-manipulation" title="Fullscreen">
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

          {/* Meta */}
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

            {/* Shortcuts */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contrôles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="md:hidden"><strong>Mobile:</strong> Tap to play/pause • Double-tap for fullscreen</div>
                <div className="hidden md:block"><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">Espace</kbd> Lecture/Pause</div>
                <div className="hidden md:block"><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">←/→</kbd> Reculer/Avancer 10s</div>
                <div className="hidden md:block"><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">↑/↓</kbd> Volume</div>
                <div className="hidden md:block"><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">F</kbd> Plein écran</div>
                <div className="hidden md:block"><kbd className="px-1 py-0.5 bg-white rounded border text-gray-800">M</kbd> Muet</div>
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

        {/* Comments */}
        <div className="max-w-2xl">
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <MessageCircle className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Commentaires ({visibleComments.length})
              </h2>
            </div>

            {/* Add comment */}
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
                <Button type="submit" size="sm" disabled={!newComment.trim() || submittingComment} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {submittingComment ? 'Publication...' : 'Publier le commentaire'}
                </Button>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 text-sm">Veuillez vous connecter pour ajouter des commentaires</p>
              </div>
            )}

            {/* List */}
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
                              {author.role === 'admin' && <Shield className="h-3 w-3 text-blue-500 ml-1 inline" />}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Admin approve/reject */}
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

                          {/* Delete */}
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
                              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
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
                  <p className="text-gray-400 text-xs mt-1">Soyez le premier à partager vos idées !</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} />
    </>
  );
};

export default VideoWatchPage;
