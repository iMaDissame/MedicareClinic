import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPublishedCourses } from '../data/courses';
import { Play, Clock, BookOpen, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import { UserProgress } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [courses] = useState(getPublishedCourses());

  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress_${user?.id}`);
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [user?.id]);

  const getCourseProgress = (courseId: string) => {
    return progress.find(p => p.courseId === courseId)?.progress || 0;
  };

  const getAccessDaysRemaining = () => {
    if (!user) return 0;
    const now = new Date();
    const accessEnd = new Date(user.accessEnd);
    const diffTime = accessEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.username}!
        </h1>
        <p className="text-gray-600">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Available Courses</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <Play className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {progress.filter(p => p.completed).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Access Expires</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {getAccessDaysRemaining()}d
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">Your Courses</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {courses.map((course) => {
          const courseProgress = getCourseProgress(course.id);
          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="relative">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 sm:h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  {/* // Change this Link inside the map function */}
<Link
  to={`/app/course/${course.id}`}  // Add /app prefix to match your route
  className="bg-white text-black px-4 lg:px-6 py-2 rounded-full font-medium flex items-center space-x-2 hover:bg-gray-100 transition-colors text-sm lg:text-base"
>
  <Play className="h-4 w-4" />
  <span>Watch Now</span>
</Link>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                    {course.title}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                    {course.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                  <div>{courseProgress}% Complete</div>
                </div>
                {courseProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${courseProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Available</h3>
          <p className="text-gray-600">Check back later for new course content.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;