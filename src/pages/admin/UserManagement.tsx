import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Calendar, AlertCircle, Search, ChevronDown, Tags } from 'lucide-react';
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
  is_active: boolean;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Assigner des catégories à {user.username}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher des catégories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto mb-6">
          {filteredCategories.length > 0 ? (
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune catégorie trouvée
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedCategoryIds.length} catégories sélectionnées
          </p>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les catégories'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
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

  // Dropdown states for categories in form
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
    loadStatistics();
    loadCategories();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axiosClient.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
      console.error('Error loading users:', err);
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
  } catch (err: any) {
    console.error('Error loading categories:', err);
    // Optional: set a more specific error message
    setError('Failed to load categories. Please check if the admin API is running.');
  }
};

  const loadStatistics = async () => {
    try {
      const response = await axiosClient.get('/admin/users/statistics');
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
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
          delete submitData.password; // Don't send empty password
        }
        
        await axiosClient.put(`/admin/users/${editingUser.id}`, submitData);
      } else {
        // Create new user
        await axiosClient.post('/admin/users', submitData);
      }

      await loadUsers();
      await loadStatistics();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user');
      console.error('Error saving user:', err);
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
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axiosClient.delete(`/admin/users/${userId}`);
      await loadUsers();
      await loadStatistics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
      console.error('Error deleting user:', err);
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user status');
      console.error('Error toggling user status:', err);
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extend access');
      console.error('Error extending access:', err);
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign categories');
      console.error('Error assigning categories:', err);
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
      active: { status: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
      inactive: { status: 'Inactive', color: 'text-gray-500', bg: 'bg-gray-100' },
      expired: { status: 'Expired', color: 'text-red-600', bg: 'bg-red-100' },
      expiring_soon: { 
        status: user.days_remaining !== null ? `${user.days_remaining}d left` : 'Expiring Soon', 
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
                placeholder="Entrez le nom complet (optionnel)"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Entrez l'email (optionnel)"
              />

              <Input
                label={editingUser ? "Nouveau mot de passe (laisser vide pour conserver l'actuel)" : "Mot de passe"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Entrez le mot de passe"
                required={!editingUser}
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigner des catégories
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex items-center justify-between min-h-[40px]"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={formData.category_ids.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                    {formData.category_ids.length > 0
                      ? `${formData.category_ids.length} catégories sélectionnées`
                      : 'Sélectionner des catégories'
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rechercher des catégories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCategoriesForForm.length > 0 ? (
                        filteredCategoriesForForm.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategoryInForm(category.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.category_ids.includes(category.id)}
                              onChange={() => toggleCategoryInForm(category.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                            />
                            <span className="text-sm">{category.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          Aucune catégorie trouvée
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formData.category_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.category_ids.map(categoryId => {
                    const category = categories.find(cat => cat.id === categoryId);
                    return category ? (
                      <span
                        key={categoryId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {category.name}
                        <button
                          type="button"
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                          onClick={() => toggleCategoryInForm(categoryId)}
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
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
                Account is active
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
                              <span className="text-xs text-gray-500">+{user.categories.length - 2} more</span>
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
                    <div>Début : {new Date(user.access_start).toLocaleDateString()}</div>
                    <div>Fin : {new Date(user.access_end).toLocaleDateString()}</div>
                    <div>Créé : {new Date(user.created_at).toLocaleDateString()}</div>
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
                        {user.email || 'No email'}
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
                                  +{user.categories.length - 2} more
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
                          <div>Début : {new Date(user.access_start).toLocaleDateString()}</div>
                          <div>Fin : {new Date(user.access_end).toLocaleDateString()}</div>
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