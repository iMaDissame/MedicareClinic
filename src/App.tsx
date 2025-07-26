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
import AdminDashboard from './pages/AdminDashboard';
import VideoManagement from './pages/admin/VideoManagement';
import AddVideo from './pages/admin/AddVideo';
import EditVideo from './pages/admin/EditVideo';
import UserManagement from './pages/admin/UserManagement';
import UserProgress from './pages/admin/UserProgress';
import PreviewPortal from './pages/admin/PreviewPortal';
import AccessExpired from './pages/AccessExpired';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/access-expired" element={<AccessExpired />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* User Routes - Fix the nested routes */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="course/:courseId"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
          </Route>
          
          {/* Add direct route for dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Add direct route for course viewing */}
          <Route 
            path="/course/:courseId" 
            element={
              <ProtectedRoute>
                <CoursePlayer />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="videos" element={<VideoManagement />} />
            <Route path="videos/new" element={<AddVideo />} />
            <Route path="videos/edit/:courseId" element={<EditVideo />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="progress" element={<UserProgress />} />
            <Route path="preview" element={<PreviewPortal />} />
          </Route>
          
          {/* Add a catch-all route for debugging */}
          <Route path="*" element={
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
              <p className="mb-4">The path "{window.location.pathname}" doesn't exist or you don't have access.</p>
              <p><a href="/login" className="text-blue-600 hover:underline">Return to login</a></p>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;