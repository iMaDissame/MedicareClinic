import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoursePlayer from './pages/CoursePlayer';
import VideoWatchPage from './pages/VideoWatchPage'; // Import the VideoWatchPage
import AdminDashboard from './pages/AdminDashboard';
import VideoManagement from './pages/admin/VideoManagement';
import AddVideo from './pages/admin/AddVideo';
import EditVideo from './pages/admin/EditVideo';
import CategoryManagement from './pages/admin/Category/CategoryManagement';
import EditCategory from './pages/admin/Category/EditCategory';
import AssignUsers from './pages/admin/AssignUsers';
import UserManagement from './pages/admin/UserManagement';
import UserProgress from './pages/admin/UserProgress';
import PreviewPortal from './pages/admin/PreviewPortal';
import AccessExpired from './pages/AccessExpired';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router basename="/MedicareClinic">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/access-expired" element={<AccessExpired />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student/Client Routes - All under /app prefix */}
          <Route
            path="/app"
            element={
              <ProtectedRoute requiredAuthType="user">
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect to dashboard when accessing /app */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* Dashboard route */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Course player route */}
            <Route path="course/:courseId" element={<CoursePlayer />} />

            {/* Video watch page route */}
            <Route path="watch/:id" element={<VideoWatchPage />} />
          </Route>

          {/* Admin Routes - All under /admin prefix */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredAuthType="admin"> 
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect to dashboard when accessing /admin */}
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Video Management Routes */}
            <Route path="videos" element={<VideoManagement />} />
            <Route path="videos/new" element={<AddVideo />} />
            <Route path="videos/edit/:courseId" element={<EditVideo />} />

            {/* Video watch page route for admin preview */}
            <Route path="videos/watch/:id" element={<VideoWatchPage />} />

            {/* Category Management Routes */}
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="categories/edit/:categoryId" element={<EditCategory />} />
            <Route path="categories/assign/:categoryId" element={<AssignUsers />} />

            {/* User Management Routes */}
            <Route path="users" element={<UserManagement />} />
            <Route path="progress" element={<UserProgress />} />
            <Route path="preview" element={<PreviewPortal />} />
          </Route>

          {/* Fallback Routes - Clean up any legacy routes */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/course/:courseId" element={<Navigate to="/app/course/:courseId" replace />} />

          {/* Catch-all route for debugging */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Page Not Found</h2>
                <p className="mb-4 text-gray-600">
                  The path "{window.location.pathname}" doesn't exist or you don't have access.
                </p>
                <div className="space-y-2">
                  <a
                    href="/MedicareClinic/login"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Go to Login
                  </a>
                  <br />
                  <a
                    href="/MedicareClinic/"
                    className="inline-block text-gray-600 hover:text-gray-800 transition"
                  >
                    Return to Home
                  </a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;