import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCourses } from '../data/courses';
import { Play, Pause, Volume2, Maximize, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import CommentSection from '../components/CommentSection';
import { UserProgress } from '../types';

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, checkAccess } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState<UserProgress[]>([]);

  const courses = getCourses();
  const course = courses.find(c => c.id === courseId && c.isPublished);

  useEffect(() => {
    if (!user) return;
    const savedProgress = localStorage.getItem(`progress_${user.id}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [user]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    if (!user || !course) return;

    const updateProgress = () => {
      const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
      const newProgress = [...progress];
      const existingIndex = newProgress.findIndex(p => p.courseId === course.id && p.userId === user.id);
      
      const progressItem: UserProgress = {
        userId: user.id,
        courseId: course.id,
        progress: Math.round(progressPercent),
        lastWatched: new Date().toISOString(),
        completed: progressPercent >= 90,
        timeSpent: currentTime
      };

      if (existingIndex >= 0) {
        newProgress[existingIndex] = progressItem;
      } else {
        newProgress.push(progressItem);
      }

      setProgress(newProgress);
      localStorage.setItem(`progress_${user.id}`, JSON.stringify(newProgress));
    };

    const interval = setInterval(updateProgress, 5000);
    return () => clearInterval(interval);
  }, [currentTime, duration, user, course, progress]);

  if (!checkAccess()) {
    return <Navigate to="/access-expired" replace />;
  }

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) * duration) / 100;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-4 lg:mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
      </div>

      <div className="bg-black rounded-xl overflow-hidden shadow-2xl mb-6 lg:mb-8">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            src={course.videoUrl}
            poster={course.thumbnail}
          />
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 lg:p-4">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:text-gray-300"
              >
                {isPlaying ? <Pause className="h-4 w-4 lg:h-5 lg:w-5" /> : <Play className="h-4 w-4 lg:h-5 lg:w-5" />}
              </Button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <span className="text-white text-xs lg:text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="hidden sm:flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-12 lg:w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg mb-6 lg:mb-8">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">Course Progress</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {progressPercent >= 90 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">🎉 Congratulations! You've completed this course!</p>
              </div>
            )}
          </div>

          <CommentSection courseId={course.id} />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Course Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{course.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{course.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Published:</span>
                <span className="font-medium">
                  {course.publishedAt ? new Date(course.publishedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;