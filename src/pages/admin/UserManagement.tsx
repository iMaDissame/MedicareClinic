import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Calendar, AlertCircle, Search, Tags } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

// Updated User interface to match backend
interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  access_start: string;
  access_end: string;
  is_active: boolean;
  access_status: 'active' | 'inactive' | 'expired' | 'expiring_soon';
  days_remaining: number | null;
  has_valid_access: boolean;
  categories?: Category[];
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface Statistics {
  total_students: number;
  active_students: number;
  inactive_students: number;
  expired_students: number;
  expiring_soon: number;
}

interface FormData {
  username: string;
  name: string;
  email: string;
  password: string;
  access_start: string;
  access_end: string;
  is_active: true;
  category_ids: number[];
}

interface CategoryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  categories: Category[];
  onSave: (userId: string, categoryIds: number[]) => void;
  loading: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className={`text-lg font-semibold ${getIconColor()}`}>{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end p-4 border-t">
          <Button onClick={onClose}>
            D'accord
          </Button>
        </div>
      </div>
    </div>
  );
};

const CategoryAssignmentModal: React.FC<CategoryAssignmentModalProps> = ({
  isOpen,
  onClose,
  user,
  categories,
  onSave,
  loading
}) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && user.categories) {
      setSelectedCategoryIds(user.categories.map(cat => cat.id));
    }
  }, [user]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = () => {
    if (user) {
      onSave(user.id, selectedCategoryIds);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Assigner des catégories à {user.username}
            </h3>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {user.name && `${user.name} • `}{user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Rechercher des catégories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Categories Grid */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 sm:p-4 flex-1 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <div
                      key={category.id}
                      className={`
                        relative flex items-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-center w-full min-w-0">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            id={`modal-category-${category.id}`}
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <label
                            htmlFor={`modal-category-${category.id}`}
                            className={`text-sm font-medium cursor-pointer select-none block truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}
                          >
                            {category.name}
                          </label>
                        </div>
                        {isSelected && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                  <Tags className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {searchTerm ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                </h3>
                <p className="text-xs text-gray-500">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : 'Veuillez d\'abord créer des catégories'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {filteredCategories.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 gap-3 sm:gap-0">
              <div className="text-sm text-gray-600">
                {selectedCategoryIds.length} sur {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategoryIds.length !== categories.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryIds(categories.map(cat => cat.id))}
                    className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                  >
                    Tout sélectionner
                  </button>
                )}
                {selectedCategoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryIds([])}
                    className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selected categories display */}
          {selectedCategoryIds.length > 0 && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-3">
                Catégories sélectionnées ({selectedCategoryIds.length}) :
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategoryIds.map(categoryId => {
                  const category = categories.find(cat => cat.id === categoryId);
                  return category ? (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white text-blue-800 border border-blue-300 shadow-sm"
                    >
                      <span className="mr-2">{category.name}</span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-4 h-4 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                        onClick={() => handleCategoryToggle(categoryId)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-gray-200 gap-3 sm:gap-0">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {selectedCategoryIds.length === 0 
              ? 'Aucune catégorie sélectionnée'
              : `${selectedCategoryIds.length} catégorie${selectedCategoryIds.length > 1 ? 's' : ''} sélectionnée${selectedCategoryIds.length > 1 ? 's' : ''}`
            }
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 order-1 sm:order-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </div>
              ) : (
                'Enregistrer les catégories'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedUserForCategories, setSelectedUserForCategories] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    name: '',
    email: '',
    password: '',
    access_start: '',
    access_end: '',
    is_active: true,
    category_ids: []
  });

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Dropdown states for categories in form
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    loadUsers();
    loadStatistics();
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axiosClient.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data || response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Échec du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axiosClient.get('/admin/categories/select-options');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: unknown) {
      setError('Échec du chargement des catégories. Veuillez vérifier si l\'API admin est en cours d\'exécution.');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axiosClient.get('/admin/users/statistics');
      setStatistics(response.data);
    } catch (err: unknown) {
      // Silently fail for statistics as it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const submitData = { ...formData };

      if (editingUser) {
        // Update existing user
        if (!submitData.password) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...dataWithoutPassword } = submitData;
          await axiosClient.put(`/admin/users/${editingUser.id}`, dataWithoutPassword);
        } else {
          await axiosClient.put(`/admin/users/${editingUser.id}`, submitData);
        }
      } else {
        // Create new user
        await axiosClient.post('/admin/users', submitData);
      }

      await loadUsers();
      await loadStatistics();
      resetForm();
      showModal('Succès', editingUser ? 'Utilisateur mis à jour avec succès!' : 'Utilisateur créé avec succès!', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; details?: Record<string, string[]> } } };
      setError(error.response?.data?.error || 'Échec de la sauvegarde de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      access_start: '',
      access_end: '',
      is_active: true,
      category_ids: []
    });
    setShowAddForm(false);
    setEditingUser(null);
    setError(null);
    setCategorySearch('');
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't populate password for security
      access_start: user.access_start,
      access_end: user.access_end,
      is_active: user.is_active,
      category_ids: user.categories ? user.categories.map(cat => cat.id) : []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action ne peut pas être annulée.')) {
      return;
    }

    try {
      setLoading(true);
      await axiosClient.delete(`/admin/users/${userId}`);
      await loadUsers();
      await loadStatistics();
      showModal('Succès', 'Utilisateur supprimé avec succès!', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Échec de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      setLoading(true);
      await axiosClient.patch(`/admin/users/${userId}/toggle-status`);
      await loadUsers();
      await loadStatistics();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Échec de la mise à jour du statut de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const extendAccess = async (userId: string, days: number) => {
    try {
      setLoading(true);
      await axiosClient.patch(`/admin/users/${userId}/extend-access`, {
        extend_days: days
      });
      await loadUsers();
      await loadStatistics();
      showModal('Succès', `Accès prolongé de ${days} jours avec succès!`, 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Échec de la prolongation de l\'accès');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryAssignment = (user: User) => {
    setSelectedUserForCategories(user);
    setShowCategoryModal(true);
  };

  const handleSaveCategoryAssignment = async (userId: string, categoryIds: number[]) => {
    try {
      setCategoryLoading(true);
      await axiosClient.post(`/admin/users/${userId}/assign-categories`, {
        category_ids: categoryIds
      });
      await loadUsers();
      setShowCategoryModal(false);
      setSelectedUserForCategories(null);
      showModal('Succès', 'Catégories assignées avec succès!', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Échec de l\'assignation des catégories');
    } finally {
      setCategoryLoading(false);
    }
  };

  const toggleCategoryInForm = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const getAccessStatusDisplay = (user: User) => {
    const statusMap = {
      active: { status: 'Actif', color: 'text-green-600', bg: 'bg-green-100' },
      inactive: { status: 'Inactif', color: 'text-gray-500', bg: 'bg-gray-100' },
      expired: { status: 'Expiré', color: 'text-red-600', bg: 'bg-red-100' },
      expiring_soon: { 
        status: user.days_remaining !== null ? `${user.days_remaining}j restant` : 'Expire bientôt', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100' 
      }
    };
    
    return statusMap[user.access_status] || statusMap.inactive;
  };

  const filteredCategoriesForForm = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Modal Component */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-2">Gérez les comptes étudiants et les autorisations d'accès</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={loading} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un nouvel étudiant
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {statistics?.total_students || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Actifs</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {statistics?.active_students || 0}
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Expirant bientôt</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {statistics?.expiring_soon || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-red-100 rounded-lg">
              <UserX className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Expirés</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {statistics?.expired_students || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-gray-100 rounded-lg">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Inactifs</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {statistics?.inactive_students || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom d'utilisateur, nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="expired">Expiré</option>
              <option value="expiring_soon">Expire bientôt</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Add/Edit User Form */}
      {showAddForm && (
        <Card className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {editingUser ? 'Modifier l\'étudiant' : 'Ajouter un nouvel étudiant'}
            </h2>
            <Button variant="ghost" onClick={resetForm}>
              Annuler
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Nom d'utilisateur"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Entrez le nom d'utilisateur"
                required
              />

              <Input
                label="Nom complet"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Entrez le nom complet"
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Entrez l'email"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? "Nouveau mot de passe (laisser vide pour conserver l'actuel)" : "Mot de passe"}
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Entrez le mot de passe"
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Date de début d'accès"
                name="access_start"
                type="date"
                value={formData.access_start}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Date de fin d'accès"
                name="access_end"
                type="date"
                value={formData.access_end}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Categories Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assigner des catégories
                <span className="text-xs text-gray-500 ml-2">
                  ({formData.category_ids.length} sélectionnée{formData.category_ids.length !== 1 ? 's' : ''})
                </span>
              </label>
              
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Rechercher des catégories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Categories Grid */}
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-64 overflow-y-auto">
                {filteredCategoriesForForm.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCategoriesForForm.map((category) => {
                      const isSelected = formData.category_ids.includes(category.id);
                      return (
                        <div
                          key={category.id}
                          className={`
                            relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                          onClick={() => toggleCategoryInForm(category.id)}
                        >
                          <div className="flex items-center w-full">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCategoryInForm(category.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <span className={`text-sm font-medium select-none ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                {category.name}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="ml-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                      <Tags className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {categorySearch ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {categorySearch 
                        ? `Aucun résultat pour "${categorySearch}"`
                        : 'Veuillez d\'abord créer des catégories'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {filteredCategoriesForForm.length > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    {formData.category_ids.length} sur {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex space-x-2">
                    {formData.category_ids.length < filteredCategoriesForForm.length && (
                      <button
                        type="button"
                        onClick={() => {
                          const allFilteredIds = filteredCategoriesForForm.map(cat => cat.id);
                          setFormData(prev => ({ 
                            ...prev, 
                            category_ids: [...new Set([...prev.category_ids, ...allFilteredIds])]
                          }));
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                      >
                        Tout sélectionner
                      </button>
                    )}
                    {formData.category_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category_ids: [] }))}
                        className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
                      >
                        Tout désélectionner
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected categories tags display */}
              {formData.category_ids.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-900 mb-2">Catégories sélectionnées :</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.category_ids.map(categoryId => {
                      const category = categories.find(cat => cat.id === categoryId);
                      return category ? (
                        <span
                          key={categoryId}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white text-blue-800 border border-blue-300 shadow-sm"
                        >
                          <span className="mr-2">{category.name}</span>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-4 h-4 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                            onClick={() => toggleCategoryInForm(categoryId)}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Compte actif
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Enregistrement...' : editingUser ? 'Mettre à jour l\'étudiant' : 'Créer l\'étudiant'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comptes étudiants</h2>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun étudiant trouvé</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Essayez de modifier vos critères de recherche ou de filtre.' : 'Créez votre premier compte étudiant pour commencer.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier étudiant
              </Button>
            )}
          </div>
        )}
        
        {/* Mobile Card View */}
        {!loading && users.length > 0 && (
          <div className="lg:hidden">
            {users.map((user) => {
              const accessStatus = getAccessStatusDisplay(user);
              return (
                <div key={user.id} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        {user.categories && user.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.categories.slice(0, 2).map((category) => (
                              <span
                                key={category.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category.name}
                              </span>
                            ))}
                            {user.categories.length > 2 && (
                              <span className="text-xs text-gray-500">+{user.categories.length - 2} de plus</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accessStatus.bg} ${accessStatus.color}`}>
                      {accessStatus.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-3">
                    <div>Début : {new Date(user.access_start).toLocaleDateString('fr-FR')}</div>
                    <div>Fin : {new Date(user.access_end).toLocaleDateString('fr-FR')}</div>
                    <div>Créé : {new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(user)}
                      disabled={loading}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCategoryAssignment(user)}
                      disabled={loading}
                    >
                      <Tags className="h-3 w-3 mr-1" />
                      Catégories
                    </Button>
                    <Button
                      size="sm"
                      variant={user.is_active ? 'secondary' : 'primary'}
                      onClick={() => toggleUserStatus(user.id)}
                      disabled={loading}
                    >
                      {user.is_active ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                      {user.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    {user.access_status === 'expiring_soon' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => extendAccess(user.id, 30)}
                        disabled={loading}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        +30j
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(user.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && users.length > 0 && (
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période d'accès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const accessStatus = getAccessStatusDisplay(user);
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email || 'Aucun email'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.categories && user.categories.length > 0 ? (
                            <>
                              {user.categories.slice(0, 2).map((category) => (
                                <span
                                  key={category.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {category.name}
                                </span>
                              ))}
                              {user.categories.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{user.categories.length - 2} de plus
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Aucune catégorie assignée</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Début : {new Date(user.access_start).toLocaleDateString('fr-FR')}</div>
                          <div>Fin : {new Date(user.access_end).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accessStatus.bg} ${accessStatus.color}`}>
                          {accessStatus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(user)}
                            disabled={loading}
                            title="Modifier l'utilisateur"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCategoryAssignment(user)}
                            disabled={loading}
                            title="Gérer les catégories"
                          >
                            <Tags className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? 'secondary' : 'primary'}
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={loading}
                            title={user.is_active ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
                          >
                            {user.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>
                          {user.access_status === 'expiring_soon' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => extendAccess(user.id, 30)}
                              disabled={loading}
                              title="Prolonger l'accès de 30 jours"
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(user.id)}
                            disabled={loading}
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Category Assignment Modal */}
      <CategoryAssignmentModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedUserForCategories(null);
        }}
        user={selectedUserForCategories}
        categories={categories}
        onSave={handleSaveCategoryAssignment}
        loading={categoryLoading}
      />
    </div>
  );
};

export default UserManagement;