import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, Users as UsersIcon, X, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import axiosClient from '../../services/axiosClient';

interface User {
  id: number;
  name: string;
  email: string;
  access_expires_at: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  users: User[];
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

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />;
      case 'error': return <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className={`text-lg font-semibold ${
            type === 'success' ? 'text-green-600' : 
            type === 'error' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {getIcon()}
          <p className="text-gray-700 text-center">{message}</p>
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

const AssignUsers: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    fetchCategoryAndUsers();
  }, [categoryId]);

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

  const fetchCategoryAndUsers = async () => {
    try {
      // Fetch category details and all users in parallel
      const [categoryResponse, usersResponse] = await Promise.all([
        axiosClient.get(`/admin/categories/${categoryId}`),
        axiosClient.get('/admin/users')
      ]);

      if (categoryResponse.data.success && usersResponse.data.success) {
        setCategory(categoryResponse.data.data);
        setAllUsers(usersResponse.data.data);
        // Set currently assigned users as selected
        setSelectedUserIds(categoryResponse.data.data.users.map((user: User) => user.id));
      } else {
        showModal('Erreur', 'Impossible de charger les données', 'error');
        setTimeout(() => navigate('/admin/categories'), 2000);
      }
    } catch (error: any) {
      // More specific error handling
      if (error.response?.status === 404) {
        showModal('Erreur', 'Endpoint non trouvé. Veuillez vérifier votre configuration API.', 'error');
      } else if (error.response?.status === 401) {
        showModal('Erreur', 'Authentification échouée. Veuillez vous reconnecter.', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showModal('Erreur', `Impossible de charger les données: ${error.response?.data?.message || error.message}`, 'error');
      }
      setTimeout(() => navigate('/admin/categories'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssignUsers = async () => {
    setIsSubmitting(true);
    try {
      const response = await axiosClient.post(`/admin/categories/${categoryId}/assign-users`, {
        user_ids: selectedUserIds
      });
      
      if (response.data.success) {
        showModal('Succès', 'Utilisateurs assignés avec succès!', 'success');
        setTimeout(() => navigate('/admin/categories'), 1500);
      } else {
        showModal('Erreur', response.data.message || 'Échec de l\'assignation des utilisateurs', 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec de l\'assignation des utilisateurs';
      showModal('Erreur', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Catégorie introuvable</h2>
          <Button onClick={() => navigate('/admin/categories')}>
            Retour aux catégories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modal Component */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/categories')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux catégories
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assigner des utilisateurs</h1>
          <p className="text-gray-600 mt-1">Catégorie : <span className="font-medium">{category.name}</span></p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Assignation des utilisateurs</h3>
              <p className="text-gray-600">
                {selectedUserIds.length} sur {allUsers.length} utilisateurs sélectionnés
              </p>
            </div>
          </div>
          <Button
            onClick={handleAssignUsers}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'assignation'}
          </Button>
        </div>
      </Card>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher des utilisateurs..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sélectionner les utilisateurs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUserIds.includes(user.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleUserToggle(user.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  {new Date(user.access_expires_at) < new Date() && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Expiré
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Aucun utilisateur trouvé correspondant à votre recherche.' : 'Aucun utilisateur disponible.'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AssignUsers;