import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, BookOpen, Calendar, User, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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

// Mock data for preview - replace with actual API calls
const mockUser = {
  id: 1,
  username: "Étudiant Demo",
  email: "student@example.com",
  access_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  created_at: "2024-01-15T10:00:00Z"
};

const mockVideos: Video[] = [
  {
    id: 1,
    title: "Introduction aux Concepts de Base",
    description: "Une introduction complète aux concepts fondamentaux que vous devez maîtriser",
    video_path: "/videos/intro.mp4",
    cover_image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
    duration: 1800, // 30 minutes
    file_size: 104857600, // 100MB
    is_published: true,
    category: { id: 1, name: "Débutant" },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    title: "Techniques Avancées et Pratiques",
    description: "Approfondissez vos connaissances avec des techniques avancées et des exercices pratiques",
    video_path: "/videos/advanced.mp4",
    cover_image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400",
    duration: 2700, // 45 minutes
    file_size: 157286400, // 150MB
    is_published: true,
    category: { id: 2, name: "Avancé" },
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-01-20T14:00:00Z"
  },
  {
    id: 3,
    title: "Études de Cas et Applications",
    description: "Découvrez comment appliquer vos connaissances à travers des études de cas réels",
    video_path: "/videos/case-studies.mp4",
    cover_image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400",
    duration: 3600, // 60 minutes
    file_size: 209715200, // 200MB
    is_published: true,
    category: { id: 3, name: "Pratique" },
    created_at: "2024-01-25T09:00:00Z",
    updated_at: "2024-01-25T09:00:00Z"
  }
];

const mockProgress = [];

const PreviewPortal: React.FC = () => {
  const [videos] = useState<Video[]>(mockVideos);
  const [loading] = useState(false);

  const getAccessDaysRemaining = () => {
    if (!mockUser?.access_end) return 0;
    const now = new Date();
    const accessEnd = new Date(mockUser.access_end);
    const diffTime = accessEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCoverImageUrl = (video: Video) => {
    if (video.cover_cloudinary_url) {
      return video.cover_cloudinary_url;
    }

    if (video.cover_url) {
      return video.cover_url;
    }

    if (video.cover_image) {
      if (video.cover_image.startsWith('http')) {
        return video.cover_image;
      }
      return `http://127.0.0.1:8000/storage/${video.cover_image}`;
    }

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
    return new Date(dateString).toLocaleDateString('fr-FR', {
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

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aperçu du Portail Étudiant</h1>
          <p className="text-gray-600 mt-2">Voici ce que vos étudiants voient lorsqu'ils se connectent</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>Mode Aperçu Admin</span>
        </div>
      </div>

      {/* Student Dashboard Preview */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="text-left">
                <h1 className="text-3xl font-bold mb-2">
                  Bienvenue, {mockUser.username} ! 👋
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  Prêt à poursuivre votre parcours d'apprentissage ?
                </p>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-blue-200 text-sm">
                    Membre depuis {formatDate(mockUser.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vidéos disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiration de l'accès</p>
                  <p className="text-2xl font-bold text-gray-900">{getAccessDaysRemaining()}d</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Videos Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Votre contenu d'apprentissage</h2>
              <div className="text-sm text-gray-600">
                {videos.length} vidéo{videos.length !== 1 ? 's' : ''} disponibles
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                getCoverImageUrl={getCoverImageUrl}
                formatDate={formatDate}
                formatDuration={formatDuration}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Note pour l'administrateur</h4>
            <p className="text-sm text-blue-700">
              Ceci est un aperçu de l'expérience étudiant avec des données de démonstration. 
              Les vrais étudiants verront leurs propres progrès et les vidéos qui leur sont assignées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface VideoCardProps {
  video: Video;
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
          className="w-full h-48 object-cover cursor-pointer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="200" y="100" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center cursor-pointer">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transform hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-gray-700 ml-1" />
          </div>
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


      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base" title={video.title}>
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow" title={video.description}>
          {video.description || 'Aucune description fournie'}
        </p>

        {/* Video metadata */}
        <div className="space-y-2 text-xs text-gray-500 mb-4">
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
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
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
        <div className="mt-auto">
          <Button
            size="sm"
            variant={isCompleted ? 'secondary' : 'primary'}
            className="w-full text-sm"
            disabled
          >
            <Play className="h-4 w-4 mr-2" />
            {isCompleted ? 'Revoir la vidéo' : hasStarted ? 'Continuer l\'apprentissage' : 'Commencer l\'apprentissage'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PreviewPortal;