import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, Search, X, Video, Image, CheckCircle, Clock, HardDrive } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

interface Category {
  id: number;
  name: string;
}

interface VideoData {
  id: number;
  title: string;
  description: string | null;
  category_id: number;
  is_published: boolean;
  video_url: string;
  cover_url: string;
  cloudinary_public_id: string;
  cover_cloudinary_id: string;
  duration: number | null;
  file_size: number | null;
  category: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
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

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, videoTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Updated Successfully!</h3>
          <p className="text-gray-600 mb-6">"{videoTitle}" has been updated successfully.</p>
          <div className="flex space-x-3">
            <Button onClick={onClose} className="flex-1">
              View Videos
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Continue Editing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;

  const copyErrorDetails = () => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      message: error.message,
      status: error.status,
      details: error.details,
      validationErrors: error.validationErrors,
      requestData: error.requestData
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    alert('Error details copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Update Failed</h3>
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
              <h4 className="font-medium text-red-800 mb-2">Error Message:</h4>
              <p className="text-red-700 text-sm">{error.message}</p>
            </div>

            {error.status && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">HTTP Status:</h4>
                <p className="text-gray-700 text-sm">{error.status}</p>
              </div>
            )}

            {error.validationErrors && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Validation Errors:</h4>
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
                <h4 className="font-medium text-blue-800 mb-2">Response Details:</h4>
                <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <Button onClick={copyErrorDetails} variant="secondary" className="flex-1">
              Copy Error Details
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditVideo: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
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
    category_id: '',
    is_published: false
  });

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchCategories();
    }
  }, [id]);

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

  const fetchVideo = async () => {
    try {
      const response = await axiosClient.get(`/admin/videos/${id}/edit`);
      if (response.data.success) {
        const videoData = response.data.data;
        setVideo(videoData);
        setFormData({
          title: videoData.title,
          description: videoData.description || '',
          category_id: videoData.category_id.toString(),
          is_published: videoData.is_published
        });
        
        // Set selected category
        if (videoData.category) {
          setSelectedCategory({
            id: videoData.category.id,
            name: videoData.category.name
          });
        }
      } else {
        alert('Failed to fetch video details');
        navigate('/admin/videos');
      }
    } catch (error: any) {
      console.error('Failed to fetch video:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch video details';
      alert(errorMessage);
      navigate('/admin/videos');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/admin/categories/select-options');
      if (response.data.success) {
        setCategories(response.data.data);
        setFilteredCategories(response.data.data);
      } else {
        alert('Failed to fetch categories');
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch categories';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description || '',
        category_id: selectedCategory.id,
        is_published: formData.is_published
      };

      console.log('Updating video:', {
        video_id: id,
        update_data: updateData
      });

      const response = await axiosClient.put(`/admin/videos/${id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        console.log('Video updated successfully:', response.data.data);
        setShowSuccessModal(true);
      } else {
        setErrorDetails({
          message: response.data.message || 'Failed to update video',
          status: response.status,
          details: response.data,
          requestData: updateData
        });
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('Failed to update video:', error);

      const errorInfo = {
        message: error.response?.data?.message || error.message || 'Unknown error occurred during video update',
        status: error.response?.status,
        details: error.response?.data,
        validationErrors: error.response?.data?.errors,
        requestData: {
          title: formData.title,
          description: formData.description,
          category_id: selectedCategory.id,
          is_published: formData.is_published
        }
      };

      setErrorDetails(errorInfo);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading video details...</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Video not found</div>
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
          Back to Videos
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Video</h1>
          <p className="text-gray-600 mt-2">Update video details</p>
        </div>
      </div>

      {/* Current Video Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Current Video Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-blue-800">Duration:</span>
              <span className="text-blue-700 ml-2">{formatDuration(video.duration)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">File Size:</span>
              <span className="text-blue-700 ml-2">{formatFileSize(video.file_size)}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                video.is_published 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {video.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-blue-800">Video URL:</span>
              <div className="text-blue-700 text-xs break-all">{video.video_url}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Cover URL:</span>
              <div className="text-blue-700 text-xs break-all">{video.cover_url}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Video Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              required
            />

            {/* Searchable Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategory ? selectedCategory.name : 'Select a category'}
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
                          placeholder="Search categories..."
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
                          No categories found
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
              placeholder="Enter video description"
            />
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
              Published
            </label>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/videos')}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {categories.length === 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">No Categories Available</h3>
          <p className="text-yellow-800 text-sm mb-3">
            You need to create categories before editing videos.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/categories')}
            className="text-sm"
          >
            Go to Categories
          </Button>
        </Card>
      )}

      {/* Video Files Information */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">Video Files</h3>
            <div className="text-green-800 text-sm space-y-1">
              <p>• Video and cover image are stored on Cloudinary</p>
              <p>• To replace video files, you'll need to upload a new video</p>
              <p>• This form only updates metadata (title, description, category, publish status)</p>
              <p>• All media files remain accessible via their Cloudinary URLs</p>
            </div>
          </div>
        </div>
      </Card>

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
    </div>
  );
};

export default EditVideo;