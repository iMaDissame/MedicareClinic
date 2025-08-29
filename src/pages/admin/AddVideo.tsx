import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, ChevronDown, Search, Upload, X, CheckCircle, Image, Clock, HardDrive, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

interface Category {
  id: number;
  name: string;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    message: string;
    status?: number;
    details?: any;
    validationErrors?: any;
    requestData?: any;
  } | null;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <X className="h-12 w-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      default:
        return <CheckCircle className="h-12 w-12 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            {getIcon()}
          </div>
          <h3 className={`text-lg font-semibold ${getColors()} mb-2`}>
            {title}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <Button onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, videoTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vidéo téléchargée avec succès !</h3>
          <p className="text-gray-600 mb-6">"{videoTitle}" a été ajoutée à votre bibliothèque de vidéos.</p>
          <div className="flex space-x-3">
            <Button onClick={onClose} className="flex-1">
              Voir les vidéos
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Ajouter une autre
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;

  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const copyErrorDetails = async () => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      message: error.message,
      status: error.status,
      details: error.details,
      validationErrors: error.validationErrors,
      requestData: error.requestData
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(errorDetails, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Échec du téléchargement</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Message d'erreur :</h4>
              <p className="text-red-700 text-sm">{error.message}</p>
            </div>

            {error.status && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Statut HTTP :</h4>
                <p className="text-gray-700 text-sm">{error.status}</p>
              </div>
            )}

            {error.validationErrors && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Erreurs de validation :</h4>
                <div className="space-y-1">
                  {Object.entries(error.validationErrors).map(([field, messages]) => (
                    <div key={field} className="text-sm">
                      <span className="font-medium text-yellow-700">{field}:</span>
                      <ul className="list-disc list-inside ml-4 text-yellow-600">
                        {Array.isArray(messages) ? messages.map((msg, index) => (
                          <li key={index}>{msg}</li>
                        )) : (
                          <li>{messages}</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error.details && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Détails de la réponse :</h4>
                <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </div>
            )}

            {error.requestData && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Données de la requête envoyées :</h4>
                <div className="text-xs text-purple-700 space-y-1">
                  <p><strong>Title:</strong> {error.requestData.title || 'N/A'}</p>
                  <p><strong>Description:</strong> {error.requestData.description || 'N/A'}</p>
                  <p><strong>Category ID:</strong> {error.requestData.category_id || 'N/A'}</p>
                  <p><strong>Is Published:</strong> {error.requestData.is_published ? 'Yes' : 'No'}</p>
                  <p><strong>Video File:</strong> {error.requestData.video_file ? `${error.requestData.video_file.name} (${(error.requestData.video_file.size / (1024 * 1024)).toFixed(2)} MB)` : 'N/A'}</p>
                  <p><strong>Cover Image:</strong> {error.requestData.cover_image ? `${error.requestData.cover_image.name} (${(error.requestData.cover_image.size / (1024 * 1024)).toFixed(2)} MB)` : 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={copyErrorDetails} 
              variant="secondary" 
              className="flex-1 relative"
              disabled={showCopySuccess}
            >
              {showCopySuccess ? 'Copié !' : 'Copier les détails de l\'erreur'}
            </Button>
            <Button onClick={onClose} className="flex-1">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddVideo: React.FC = () => {
  const navigate = useNavigate();
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'preparing' | 'uploading' | 'processing' | 'finalizing'>('preparing');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'warning' | 'info'
  });
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    status?: number;
    details?: any;
    validationErrors?: any;
    requestData?: any;
  } | null>(null);

  // Dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_file: null as File | null,
    cover_image: null as File | null,
    category_id: '',
    is_published: false
  });

  const showAlert = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'info') => {
    setAlertConfig({ title, message, type });
    setShowAlertModal(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories, categorySearch]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/admin/categories/select-options');
      if (response.data.success) {
        setCategories(response.data.data);
        setFilteredCategories(response.data.data);
      } else {
        showAlert('Erreur', 'Échec du chargement des catégories', 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec du chargement des catégories';
      showAlert('Erreur', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getUploadPhaseMessage = () => {
    switch (uploadPhase) {
      case 'preparing':
        return 'Préparation du téléchargement...';
      case 'uploading':
        return `Téléchargement... ${uploadProgress}%`;
      case 'processing':
        return 'Traitement de la vidéo...';
      case 'finalizing':
        return 'Finalisation...';
      default:
        return 'Téléchargement...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      showAlert('Attention', 'Veuillez sélectionner une catégorie', 'warning');
      return;
    }

    if (!formData.video_file) {
      showAlert('Attention', 'Veuillez sélectionner un fichier vidéo', 'warning');
      return;
    }

    if (!formData.cover_image) {
      showAlert('Attention', 'Veuillez sélectionner une image de couverture', 'warning');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadPhase('preparing');

    try {
      // Create FormData for file upload to Cloudinary via your backend
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description || '');
      uploadData.append('video_file', formData.video_file);
      uploadData.append('cover_image', formData.cover_image);
      uploadData.append('category_id', selectedCategory.id.toString());
      uploadData.append('is_published', formData.is_published ? '1' : '0');

      setUploadPhase('uploading');

      const response = await axiosClient.post('/admin/videos', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            
            // Update phase based on progress
            if (percentCompleted < 80) {
              setUploadPhase('uploading');
            } else if (percentCompleted < 95) {
              setUploadPhase('processing');
            } else {
              setUploadPhase('finalizing');
            }
          }
        },
      });

      if (response.data.success) {
        setUploadProgress(100);
        setUploadPhase('finalizing');
        
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 500);
      } else {
        setErrorDetails({
          message: response.data.message || 'Échec du téléchargement de la vidéo',
          status: response.status,
          details: response.data,
          requestData: {
            title: formData.title,
            description: formData.description,
            category_id: selectedCategory.id,
            is_published: formData.is_published,
            video_file: formData.video_file,
            cover_image: formData.cover_image
          }
        });
        setShowErrorModal(true);
      }
    } catch (error: any) {
      const errorInfo = {
        message: error.code === 'ECONNABORTED'
          ? 'Délai de téléchargement dépassé - le téléchargement a pris trop de temps. Veuillez essayer avec un fichier plus petit ou vérifier votre connexion.'
          : error.response?.data?.message || error.message || 'Une erreur inconnue s\'est produite pendant le téléchargement',
        status: error.response?.status,
        details: error.response?.data,
        validationErrors: error.response?.data?.errors,
        requestData: {
          title: formData.title,
          description: formData.description,
          category_id: selectedCategory.id,
          is_published: formData.is_published,
          video_file: formData.video_file,
          cover_image: formData.cover_image
        }
      };

      setErrorDetails(errorInfo);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadPhase('preparing');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // More permissive file type validation for mobile compatibility
      const allowedTypes = [
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
        'video/flv', 'video/mkv', 'video/m4v', 'video/3gp', 'video/3gpp',
        'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'
      ];
      
      // Check file extension as fallback for mobile devices
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm', 'flv', 'mkv', 'm4v', '3gp', '3gpp'];
      
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || '');
      
      // More lenient validation for mobile - sometimes file.type is empty or incorrect on mobile
      if (file.type && !isValidType && file.type !== '') {
        showAlert('Format invalide', 'Veuillez sélectionner un fichier vidéo valide (MP4, AVI, MOV, WMV, WebM, FLV, MKV, M4V, 3GP)', 'warning');
        return;
      }
      
      // If no MIME type detected but extension is valid, proceed (common on mobile)
      if (!file.type && !allowedExtensions.includes(fileExtension || '')) {
        showAlert('Format invalide', 'Veuillez sélectionner un fichier vidéo valide (MP4, AVI, MOV, WMV, WebM, FLV, MKV, M4V, 3GP)', 'warning');
        return;
      }

      // More reasonable file size limit for mobile uploads
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB for better mobile compatibility
      if (file.size > maxSize) {
        showAlert('Fichier trop volumineux', 'La taille du fichier doit être inférieure à 2GB pour une meilleure compatibilité mobile', 'warning');
        return;
      }

      // Additional check for very small files (likely corrupted)
      if (file.size < 1024) { // Less than 1KB
        showAlert('Fichier invalide', 'Le fichier sélectionné semble être invalide ou corrompu', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, video_file: file }));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // More permissive image type validation for mobile compatibility
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
      
      // Check file extension as fallback for mobile devices
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
      
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || '');
      
      // More lenient validation for mobile - sometimes file.type is empty or incorrect on mobile
      if (file.type && !isValidType && file.type !== '') {
        showAlert('Format invalide', 'Veuillez sélectionner un fichier image valide (JPEG, JPG, PNG, WebP, GIF, HEIC)', 'warning');
        return;
      }
      
      // If no MIME type detected but extension is valid, proceed (common on mobile)
      if (!file.type && !allowedExtensions.includes(fileExtension || '')) {
        showAlert('Format invalide', 'Veuillez sélectionner un fichier image valide (JPEG, JPG, PNG, WebP, GIF, HEIC)', 'warning');
        return;
      }

      // Reasonable file size for images (mobile cameras can produce large files)
      const maxSize = 50 * 1024 * 1024; // 50MB for high-res mobile photos
      if (file.size > maxSize) {
        showAlert('Fichier trop volumineux', 'La taille de l\'image doit être inférieure à 50MB', 'warning');
        return;
      }

      // Additional check for very small files (likely corrupted)
      if (file.size < 100) { // Less than 100 bytes
        showAlert('Fichier invalide', 'Le fichier image sélectionné semble être invalide ou corrompu', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, cover_image: file }));
    }
  };

  const selectCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category_id: category.id.toString() }));
    setCategorySearch('');
    setIsDropdownOpen(false);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/admin/videos');
  };

  const removeVideoFile = () => {
    setFormData(prev => ({ ...prev, video_file: null }));
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image: null }));
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Chargement des catégories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/videos')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux vidéos
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajouter une nouvelle vidéo</h1>
          <p className="text-gray-600 mt-2">Téléchargez une vidéo sur Cloudinary et créez un nouveau contenu de cours</p>
        </div>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Titre de la vidéo"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Entrez le titre de la vidéo"
              required
            />

            {/* Searchable Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategory ? selectedCategory.name : 'Sélectionnez une catégorie'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rechercher une catégorie..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectCategory(category)}
                          >
                            {category.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          Aucune catégorie trouvée
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez la description de la vidéo"
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image de couverture *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="cover-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Télécharger une image de couverture</span>
                    <input
                      id="cover-upload"
                      name="cover-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,image/jpeg,image/png,image/heic,image/heif"
                      onChange={handleCoverImageChange}
                      ref={coverFileInputRef}
                    />
                  </label>
                  <p className="pl-1">ou glissez-déposez</p>
                </div>
                <p className="text-xs text-gray-500">JPEG, PNG, WebP, GIF, HEIC jusqu'à 50MB</p>
                {formData.cover_image && (
                  <div className="mt-2 relative bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Image className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm text-green-700 font-medium break-all">
                          {formData.cover_image.name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-green-600 mt-1">
                          <span className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1 flex-shrink-0" />
                            {formatFileSize(formData.cover_image.size)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier vidéo *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="video-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Télécharger une vidéo</span>
                    <input
                      id="video-upload"
                      name="video-upload"
                      type="file"
                      className="sr-only"
                      accept="video/*,video/mp4,video/quicktime,video/x-msvideo,video/3gpp"
                      onChange={handleVideoFileChange}
                      ref={videoFileInputRef}
                    />
                  </label>
                  <p className="pl-1">ou glissez-déposez</p>
                </div>
                <p className="text-xs text-gray-500">MP4, AVI, MOV, WMV, WebM et plus jusqu'à 2GB</p>
                {formData.video_file && (
                  <div className="mt-2 relative bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Video className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm text-green-700 font-medium break-all">
                          {formData.video_file.name}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-green-600 mt-1">
                          <span className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1 flex-shrink-0" />
                            {formatFileSize(formData.video_file.size)}
                          </span>
                          <span className="text-blue-600">Prêt pour le téléchargement</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeVideoFile}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={formData.is_published}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Publier immédiatement après le téléchargement
            </label>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              <Video className="h-4 w-4 mr-2" />
              {isSubmitting ? getUploadPhaseMessage() : 'Télécharger sur Cloudinary'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/videos')}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>

          {/* Enhanced Upload Progress Bar */}
          {isSubmitting && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{getUploadPhaseMessage()}</span>
                <span className="text-blue-600 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="w-full h-full bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-4">
                  <span className={`flex items-center ${uploadPhase === 'preparing' ? 'text-blue-600 font-medium' : uploadProgress > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    <Clock className="h-3 w-3 mr-1" />
                    Préparation
                  </span>
                  <span className={`flex items-center ${uploadPhase === 'uploading' ? 'text-blue-600 font-medium' : uploadProgress >= 80 ? 'text-green-600' : 'text-gray-400'}`}>
                    <Upload className="h-3 w-3 mr-1" />
                    Téléchargement
                  </span>
                  <span className={`flex items-center ${uploadPhase === 'processing' ? 'text-blue-600 font-medium' : uploadProgress >= 95 ? 'text-green-600' : 'text-gray-400'}`}>
                    <Video className="h-3 w-3 mr-1" />
                    Traitement
                  </span>
               
                </div>
                <p className="text-center text-gray-500">
                  {uploadPhase === 'uploading' && 'Téléchargement des fichiers sur Cloudinary...'}
                  {uploadPhase === 'processing' && 'Cloudinary traite votre vidéo...'}
                  {uploadPhase === 'finalizing' && 'Enregistrement des informations de la vidéo dans la base de données...'}
                </p>
              </div>
            </div>
          )}
        </form>
      </Card>

      {categories.length === 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">Aucune catégorie disponible</h3>
          <p className="text-yellow-800 text-sm mb-3">
            Vous devez créer des catégories avant d'ajouter des vidéos.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/categories')}
            className="text-sm"
          >
            Aller aux catégories
          </Button>
        </Card>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        videoTitle={formData.title}
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        error={errorDetails}
      />

      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default AddVideo;