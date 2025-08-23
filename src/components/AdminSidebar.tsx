import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Users,
  BarChart3,
  Plus,
  Eye,
  X,
  Tag,
  MessageCircle
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
    { path: '/admin/videos', icon: Video, label: 'Gestion des vidéos' },
    { path: '/admin/videos/new', icon: Plus, label: 'Ajouter une vidéo' },
    { path: '/admin/categories', icon: Tag, label: 'Catégories' },
    { path: '/admin/users', icon: Users, label: 'Gestion des utilisateurs' },
    { path: '/admin/progress', icon: BarChart3, label: 'Progression des utilisateurs' },
    { path: '/admin/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/admin/preview', icon: Eye, label: 'Aperçu du portail' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white shadow-lg border-r border-gray-200 h-screen fixed left-0 top-16 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Panneau d'administration</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(item.path, item.exact)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;