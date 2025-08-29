import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Edit, Trash2, Users, Video, Plus, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import axiosClient from '../../../services/axiosClient';

interface Category {
  id: number;
  name: string;
  videos_count: number;
  users_count: number;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  total_categories: number;
  categories_with_users: number;
  categories_with_videos: number;
  most_popular_category: Category | null;
}

interface NotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 border rounded-lg shadow-lg ${getColors()}`}>
        {getIcon()}
        <span className="ml-3 text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <h2 className="text-xl font-semibold ml-3">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3">
          <Button
            onClick={onConfirm}
            variant={type === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchCategories();
    fetchStatistics();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/admin/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      // Silent error handling for production
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axiosClient.get('/admin/categories/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      // Silent error handling for production
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/admin/categories', {
        name: newCategoryName
      });
      
      if (response.data.success) {
        await fetchCategories();
        await fetchStatistics();
        setNewCategoryName('');
        setShowAddModal(false);
        showNotification('success', 'Catégorie créée avec succès');
      } else {
        showNotification('error', response.data.message || 'Échec de la création de la catégorie');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec de la création de la catégorie';
      showNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (categoryId: number, categoryName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la catégorie',
      message: `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action ne peut pas être annulée.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await axiosClient.delete(`/admin/categories/${categoryId}`);
          
          if (response.data.success) {
            await fetchCategories();
            await fetchStatistics();
            showNotification('success', 'Catégorie supprimée avec succès');
          } else {
            showNotification('error', response.data.message || 'Échec de la suppression de la catégorie');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Échec de la suppression de la catégorie';
          showNotification('error', errorMessage);
        }
      }
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Chargement des catégories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des catégories</h1>
          <p className="text-gray-600 mt-2">Gérez les catégories de vidéos et l'attribution des utilisateurs</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Catégories totales</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_categories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avec utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.categories_with_users}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avec vidéos</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.categories_with_videos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Tag className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">La plus populaire</p>
                <p className="text-lg font-bold text-gray-900">
                  {statistics.most_popular_category?.name || 'Aucune'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onDelete={handleDeleteCategory}
          />
        ))}
        {filteredCategories.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            {searchTerm ? 'Aucune catégorie trouvée correspondant à votre recherche.' : 'Aucune catégorie créée pour le moment.'}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Ajouter une catégorie</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le nom de la catégorie..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Création...' : 'Créer la catégorie'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
  onDelete: (categoryId: number, categoryName: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onDelete }) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tag className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">
              Créée le {new Date(category.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{category.users_count}</p>
            <p className="text-xs text-gray-500">Utilisateurs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{category.videos_count}</p>
            <p className="text-xs text-gray-500">Vidéos</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Link to={`/admin/categories/edit/${category.id}`} className="flex-1">
          <Button size="sm" variant="secondary" className="w-full">
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </Button>
        </Link>

        <Button
          size="sm"
          variant="danger"
          onClick={() => onDelete(category.id, category.name)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};

export default CategoryManagement;