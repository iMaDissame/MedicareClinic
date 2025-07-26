import React from 'react';
import { Link } from 'react-router-dom';
import { getPublishedCourses } from '../../data/courses';
import { Play, Clock, BookOpen, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PreviewPortal: React.FC = () => {
  const publishedCourses = getPublishedCourses();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Portal Preview</h1>
          <p className="text-gray-600 mt-2">Preview what students see when they log in</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Eye className="h-4 w-4" />
          <span>Preview Mode</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Courses</p>
              <p className="text-2xl font-bold text-gray-900">{publishedCourses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Videos</p>
              <p className="text-2xl font-bold text-gray-900">{publishedCourses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {publishedCourses.reduce((total, course) => {
                  const [minutes, seconds] = course.duration.split(':').map(Number);
                  return total + minutes + (seconds / 60);
                }, 0).toFixed(0)}m
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Course Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  {/* // Inside the course mapping */}
<Link
  to={`/app/course/${course.id}`}  // Add /app prefix
  className="bg-white text-black px-6 py-2 rounded-full font-medium flex items-center space-x-2 hover:bg-gray-100 transition-colors"
>
  <Play className="h-4 w-4" />
  <span>Watch Now</span>
</Link>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                    {course.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="text-green-600 font-medium">Published</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {publishedCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Courses</h3>
            <p className="text-gray-600 mb-4">Students won't see any courses until you publish them.</p>
            <Link to="/admin/videos">
              <Button>
                Manage Videos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPortal;