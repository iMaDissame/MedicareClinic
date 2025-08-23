import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  User,
  Settings,
  Play,
  Menu,
  Bell,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Check,
  Trash2,
  Filter,
  ChevronDown,
  UserCircle
} from 'lucide-react';
import Button from './ui/Button';
import axiosClient from '../services/axiosClient';

interface NavbarProps {
  onMenuClick?: () => void;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  priority: string;
  created_at: string;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFullPage, setShowFullPage] = useState(false);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // User dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Use axiosClient instead of undefined api
  const api = axiosClient;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = '/notifications?per_page=50';
      if (filter === 'unread') url += '&unread_only=true';
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;

      const response = await api.get(url);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      video_added: 'Nouvelle vidéo',
      comment_approved: 'Commentaire approuvé',
      comment_rejected: 'Commentaire rejeté',
      new_comment: 'Nouveau commentaire',
      access_expiring: 'Accès expirant',
      category_assigned: 'Catégorie assignée',
      welcome: 'Bienvenue'
    };
    return typeMap[type] || type;
  };

  // Get action URL
  const getActionUrl = (notification: Notification) => {
    switch (notification.type) {
      case 'video_added':
        return `/app/watch/${notification.data?.video_id ?? ''}`;
      case 'comment_approved':
      case 'comment_rejected':
        return `/app/watch/${notification.data?.video_id ?? ''}`;
      case 'category_assigned':
        return '/app/dashboard';
      case 'access_expiring':
        return '/app/profile';
      default:
        return '#';
    }
  };

  // Toggle notifications dropdown
  const toggleNotifications = async () => {
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications(!showNotifications);
    setShowFullPage(false);
    setShowUserDropdown(false);
  };

  // Show full notifications page
  const showFullNotifications = async () => {
    await fetchNotifications();
    setShowFullPage(true);
    setShowNotifications(false);
  };

  // Close full notifications page
  const closeFullNotifications = () => {
    setShowFullPage(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
    setShowNotifications(false);
  };

  // Poll for new notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  // Full notifications page overlay
  if (showFullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus uniquement</option>
                <option value="read">Lus uniquement</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Tous les types</option>
                <option value="video_added">Nouvelles vidéos</option>
                <option value="comment_approved">Commentaires approuvés</option>
                <option value="comment_rejected">Commentaires rejetés</option>
                <option value="access_expiring">Accès expirant</option>
                <option value="category_assigned">Mises à jour de catégorie</option>
              </select>

              <Button onClick={handleMarkAllAsRead} variant="outline">
                Tout marquer comme lu
              </Button>

              <Button onClick={closeFullNotifications} variant="outline">
                Fermer
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement des notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>Aucune notification trouvée</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.is_read
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-2">{notification.message}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                          <span className="capitalize">{notification.priority}</span>
                        </div>

                        <Link
                          to={getActionUrl(notification)}
                          className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          View details →
                        </Link>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Marquer comme lu"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Supprimer la notification"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button for admin */}
            {user?.role === 'admin' && onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            )}

            <Link
              to={user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center mt-6">
              <img
                src="https://imadissame.github.io/MedicareClinic/aa.png"
                alt="Logo Medicare Clinic"
                className="h-24 md:h-28 lg:h-32 w-auto object-contain my-2"
              />
              </div>
              {/* <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent hidden sm:block">
              MediCare
              </span> */}
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notification Bell */}
            <div className="relative flex items-center" ref={notificationDropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleNotifications}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Chat Icon Button */}
              <Link
                to={user?.role === 'admin' ? '/admin/chat' : '/app/chat'}
                className="ml-2"
                title="Chat"
              >
                <Button variant="ghost" size="sm" className="relative">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="fixed left-1/2 transform -translate-x-1/2 lg:left-auto lg:transform-none lg:right-48 xl:right-8 top-16 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Notifications</h3>
                    {notifications.some(n => !n.is_read) && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 sm:max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-3 sm:p-4 text-center text-gray-500 text-sm">Chargement...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-3 sm:p-4 text-center text-gray-500 text-sm">
                        Aucune notification
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getPriorityIcon(notification.priority)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <Link
                                to={getActionUrl(notification)}
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="block hover:no-underline"
                              >
                                <h4 className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">
                                  {notification.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </Link>
                            </div>

                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                                title="Marquer comme lu"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 sm:p-3 border-t border-gray-200 text-center">
                    <button
                      onClick={showFullNotifications}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={toggleUserDropdown}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserCircle className="h-6 w-6" />
                <span className="hidden md:inline">{user?.username}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <UserCircle className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{user?.name || user?.username}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    {user?.role === 'admin' ? (
                      <>
                        <Link
                          to="/admin/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Profile Settings
                        </Link>
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/chat"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <MessageCircle className="h-4 w-4 mr-3" />
                          Admin Chat
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/app/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/app/chat"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <MessageCircle className="h-4 w-4 mr-3" />
                          Chat Support
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;