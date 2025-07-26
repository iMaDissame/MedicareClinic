import React, { useState, useEffect } from 'react';
import { User, UserProgress, Course } from '../../types';
import { getCourses } from '../../data/courses';
import { BarChart3, Clock, User as UserIcon, TrendingUp, Award } from 'lucide-react';
import Card from '../../components/ui/Card';

const UserProgressPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<UserProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Load users
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }

    // Load courses
    setCourses(getCourses());

    // Load all user progress
    const savedUsers2 = savedUsers ? JSON.parse(savedUsers) : [];
    const allUserProgress: UserProgress[] = [];
    
    savedUsers2.forEach((user: User) => {
      const userProgress = localStorage.getItem(`progress_${user.id}`);
      if (userProgress) {
        allUserProgress.push(...JSON.parse(userProgress));
      }
    });
    
    setAllProgress(allUserProgress);
  }, []);

  const getUserProgress = (userId: string) => {
    return allProgress.filter(p => p.userId === userId);
  };

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const getOverallStats = () => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const activeUsers = allProgress.reduce((acc, curr) => {
      if (!acc.includes(curr.userId)) acc.push(curr.userId);
      return acc;
    }, [] as string[]).length;
    
    const completedCourses = allProgress.filter(p => p.completed).length;
    const avgProgress = allProgress.length > 0 
      ? Math.round(allProgress.reduce((acc, curr) => acc + curr.progress, 0) / allProgress.length)
      : 0;

    return { totalUsers, activeUsers, completedCourses, avgProgress };
  };

  const stats = getOverallStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Progress Tracking</h1>
        <p className="text-gray-600 mt-2">Monitor student learning progress and engagement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-gray-600">Active Learners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User Progress Details */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Individual Progress</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses Enrolled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(u => u.role === 'user').map((user) => {
                const userProgress = getUserProgress(user.id);
                const completedCount = userProgress.filter(p => p.completed).length;
                const avgProgress = userProgress.length > 0
                  ? Math.round(userProgress.reduce((acc, curr) => acc + curr.progress, 0) / userProgress.length)
                  : 0;
                const lastActivity = userProgress.length > 0
                  ? new Date(Math.max(...userProgress.map(p => new Date(p.lastWatched).getTime())))
                  : null;

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userProgress.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {completedCount} completed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${avgProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lastActivity ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {lastActivity.toLocaleDateString()}
                        </div>
                      ) : (
                        'No activity'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course Progress Breakdown */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Course Progress Breakdown</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {courses.filter(c => c.isPublished).map((course) => {
              const courseProgress = allProgress.filter(p => p.courseId === course.id);
              const avgCourseProgress = courseProgress.length > 0
                ? Math.round(courseProgress.reduce((acc, curr) => acc + curr.progress, 0) / courseProgress.length)
                : 0;
              const completedCount = courseProgress.filter(p => p.completed).length;

              return (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <span className="text-sm text-gray-500">
                      {courseProgress.length} enrolled • {completedCount} completed
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                        style={{ width: `${avgCourseProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{avgCourseProgress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProgressPage;