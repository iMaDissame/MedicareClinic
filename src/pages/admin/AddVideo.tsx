import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, saveCourses } from '../../data/courses';
import { Course } from '../../types';
import { ArrowLeft, Upload, Video } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const AddVideo: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    duration: '',
    category: '',
    isPublished: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCourse: Course = {
      id: Date.now().toString(),
      ...formData,
      publishedAt: formData.isPublished ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    const courses = getCourses();
    courses.push(newCourse);
    saveCourses(courses);

    navigate('/admin/videos');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

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
          <p className="text-gray-600 mt-2">Create a new course video</p>
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

            <Input
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Frontend, Backend, Design"
              required
            />
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
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Thumbnail URL"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleInputChange}
              placeholder="https://example.com/thumbnail.jpg"
              required
            />

            <Input
              label="Duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., 45:30"
              required
            />
          </div>

          <Input
            label="Video URL"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/video.mp4"
            required
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button type="submit" className="flex-1">
              <Video className="h-4 w-4 mr-2" />
              Create Video
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/videos')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Sample Video URLs for Testing</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Big Buck Bunny:</strong> https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4</p>
          <p><strong>Elephant Dream:</strong> https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4</p>
          <p><strong>For Bigger Blazes:</strong> https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4</p>
        </div>
      </Card>
    </div>
  );
};

export default AddVideo;