import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, ChevronDown, Search, Upload, X, CheckCircle, Image } from 'lucide-react';
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

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, videoTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Created Successfully!</h3>
          <p className="text-gray-600 mb-6">"{videoTitle}" has been added to your video library.</p>
          <div className="flex space-x-3">
            <Button onClick={onClose} className="flex-1">
              View Videos
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Add Another
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
              <h3 className="text-lg font-semibold text-gray-900">Failed to Create Video</h3>
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

            {error.requestData && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Request Data Sent:</h4>
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
    video_file: null as File | null,
    cover_image: null as File | null,
    category_id: '',
    is_published: false
  });

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

    if (!formData.video_file) {
      alert('Please select a video file');
      return;
    }

    if (!formData.cover_image) {
      alert('Please select a cover image');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description || '');
      uploadData.append('video_file', formData.video_file);
      uploadData.append('cover_image', formData.cover_image);
      uploadData.append('category_id', selectedCategory.id.toString());
      
      // Fix: Send boolean as '1' or '0' for Laravel
      uploadData.append('is_published', formData.is_published ? '1' : '0');

      console.log('Submitting form data:', {
        title: formData.title,
        description: formData.description,
        category_id: selectedCategory.id,
        is_published: formData.is_published ? '1' : '0', // Log the actual value being sent
        video_file: formData.video_file ? `${formData.video_file.name} (${formData.video_file.size} bytes)` : null,
        cover_image: formData.cover_image ? `${formData.cover_image.name} (${formData.cover_image.size} bytes)` : null,
      });

      const response = await axiosClient.post('/admin/videos', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large file uploads
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });

      if (response.data.success) {
        setUploadProgress(100);
        setShowSuccessModal(true);
      } else {
        setErrorDetails({
          message: response.data.message || 'Failed to create video',
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
      console.error('Failed to create video:', error);
      
      const errorInfo = {
        message: error.code === 'ECONNABORTED' 
          ? 'Upload timeout - file too large or connection too slow' 
          : error.response?.data?.message || error.message || 'Unknown error occurred',
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
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, AVI, MOV, WMV, WebM)');
        return;
      }

      // Validate file size (e.g., max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 500MB');
        return;
      }

      setFormData(prev => ({ ...prev, video_file: file }));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, JPG, PNG, WebP)');
        return;
      }

      // Validate file size (e.g., max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('Image size must be less than 10MB');
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading categories...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Video</h1>
          <p className="text-gray-600 mt-2">Upload and create a new course video</p>
        </div>
      </div>

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

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="cover-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload cover image</span>
                    <input
                      id="cover-upload"
                      name="cover-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      ref={coverFileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">JPEG, PNG, WebP up to 10MB</p>
                {formData.cover_image && (
                  <div className="mt-2 relative">
                    <p className="text-sm text-green-600 font-medium">
                      Selected: {formData.cover_image.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {(formData.cover_image.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video File *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="video-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a video</span>
                    <input
                      id="video-upload"
                      name="video-upload"
                      type="file"
                      className="sr-only"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      ref={videoFileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">MP4, AVI, MOV, WMV, WebM up to 500MB</p>
                {formData.video_file && (
                  <div className="mt-2 relative">
                    <p className="text-sm text-green-600 font-medium">
                      Selected: {formData.video_file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {(formData.video_file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={removeVideoFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              <Video className="h-4 w-4 mr-2" />
              {isSubmitting ? (
                uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Starting upload...'
              ) : 'Create Video'}
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

          {/* Upload Progress Bar */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </form>
      </Card>

      {categories.length === 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">No Categories Available</h3>
          <p className="text-yellow-800 text-sm mb-3">
            You need to create categories before adding videos. 
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

export default AddVideo;