import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getCourses } from '../data/courses';
import { Users, Video, BarChart3, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState(getCourses());

  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const getStats = () => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const activeUsers = users.filter(u => u.isActive && u.role === 'user').length;
    const publishedCourses = courses.filter(c => c.isPublished).length;
    const totalCourses = courses.length;

    return { totalUsers, activeUsers, publishedCourses, totalCourses };
  };

  const stats = getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your learning platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Videos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${course.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-sm text-gray-500">
                      {course.isPublished ? 'Published' : 'Draft'} • {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/videos/new"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <Video className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Add Video</span>
              </a>
              <a
                href="/admin/users"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Manage Users</span>
              </a>
              <a
                href="/admin/progress"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">View Progress</span>
              </a>
              <a
                href="/admin/videos"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <Video className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900">Manage Videos</span>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;