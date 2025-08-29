import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Video, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import axiosClient from '../../../services/axiosClient';

interface Category {
  id: number;
  name: string;
  videos: Array<{ id: number; title: string; description: string }>;
  users: Array<{ id: number; name: string; email: string }>;
  created_at: string;
  updated_at: string;
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
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
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

const EditCategory: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
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
    fetchCategory();
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

  const fetchCategory = async () => {
    try {
      const response = await axiosClient.get(`/admin/categories/${categoryId}`);
      
      if (response.data.success) {
        setCategory(response.data.data);
        setCategoryName(response.data.data.name);
      } else {
        showModal('Erreur', 'Impossible de charger les détails de la catégorie', 'error');
        setTimeout(() => navigate('/admin/categories'), 2000);
      }
    } catch (error) {
      showModal('Erreur', 'Impossible de charger les détails de la catégorie', 'error');
      setTimeout(() => navigate('/admin/categories'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryName.trim()) {
      showModal('Attention', 'Veuillez saisir un nom de catégorie valide', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosClient.put(`/admin/categories/${categoryId}`, {
        name: categoryName
      });
      
      if (response.data.success) {
        showModal('Succès', 'Catégorie mise à jour avec succès!', 'success');
        setTimeout(() => navigate('/admin/categories'), 1500);
      } else {
        showModal('Erreur', response.data.message || 'Échec de la mise à jour de la catégorie', 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Échec de la mise à jour de la catégorie';
      showModal('Erreur', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Chargement des détails de la catégorie...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Modifier la catégorie</h1>
          <p className="text-gray-600 mt-1">Mettre à jour les informations de la catégorie</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de la catégorie</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la catégorie
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Entrez le nom de la catégorie..."
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleUpdateCategory}
                disabled={!categoryName.trim() || isSubmitting || categoryName === category.name}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour la catégorie'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Category Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiques de la catégorie</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Utilisateurs assignés</span>
              <span className="font-semibold">{category.users.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Vidéos associées</span>
              <span className="font-semibold">{category.videos.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Date de création</span>
              <span className="font-semibold">
                {new Date(category.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Dernière modification</span>
              <span className="font-semibold">
                {new Date(category.updated_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Assigned Users */}
      {category.users.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs assignés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.users.map((user) => (
              <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Associated Videos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vidéos associées</h2>
        {category.videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.videos.map((video) => (
              <div key={video.id} className="p-3 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{video.title}</h3>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Video className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune vidéo disponible dans cette catégorie</p>
            <p className="text-sm mt-1">Les vidéos apparaîtront ici lorsqu'elles seront assignées à cette catégorie</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EditCategory;