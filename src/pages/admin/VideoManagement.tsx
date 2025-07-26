import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, saveCourses } from '../../data/courses';
import { Course } from '../../types';
import { Video, Edit, Trash2, Eye, EyeOff, Plus, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const VideoManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  const togglePublishStatus = (courseId: string) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const isPublishing = !course.isPublished;
        return {
          ...course,
          isPublished: isPublishing,
          publishedAt: isPublishing ? new Date().toISOString() : undefined
        };
      }
      return course;
    });
    setCourses(updatedCourses);
    saveCourses(updatedCourses);
  };

  const deleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      const updatedCourses = courses.filter(course => course.id !== courseId);
      setCourses(updatedCourses);
      saveCourses(updatedCourses);
    }
  };

  const publishedCourses = courses.filter(c => c.isPublished);
  const unpublishedCourses = courses.filter(c => !c.isPublished);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Management</h1>
          <p className="text-gray-600 mt-2">Manage your course videos and publishing status</p>
        </div>
        <Link to="/admin/videos/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Video
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
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{publishedCourses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <EyeOff className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">{unpublishedCourses.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Published Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Published Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedCourses.map((course) => (
            <VideoCard
              key={course.id}
              course={course}
              onTogglePublish={togglePublishStatus}
              onDelete={deleteCourse}
            />
          ))}
          {publishedCourses.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No published videos yet
            </div>
          )}
        </div>
      </div>

      {/* Draft Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Draft Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unpublishedCourses.map((course) => (
            <VideoCard
              key={course.id}
              course={course}
              onTogglePublish={togglePublishStatus}
              onDelete={deleteCourse}
            />
          ))}
          {unpublishedCourses.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No draft videos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface VideoCardProps {
  course: Course;
  onTogglePublish: (courseId: string) => void;
  onDelete: (courseId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ course, onTogglePublish, onDelete }) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            course.isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            {course.isPublished && course.publishedAt
              ? `Published ${new Date(course.publishedAt).toLocaleDateString()}`
              : `Created ${new Date(course.createdAt).toLocaleDateString()}`
            }
          </span>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={course.isPublished ? 'secondary' : 'primary'}
            onClick={() => onTogglePublish(course.id)}
            className="flex-1"
          >
            {course.isPublished ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Publish
              </>
            )}
          </Button>
          <Link to={`/admin/videos/edit/${course.id}`}>
            <Button size="sm" variant="ghost">
              <Edit className="h-3 w-3" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(course.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoManagement;