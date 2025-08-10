import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Edit, Trash2, Users, Video, Plus, Search } from 'lucide-react';
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

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchStatistics();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/admin/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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
      console.error('Failed to fetch statistics:', error);
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
      } else {
        alert(response.data.message || 'Failed to create category');
      }
    } catch (error: any) {
      console.error('Failed to create category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axiosClient.delete(`/admin/categories/${categoryId}`);
      
      if (response.data.success) {
        await fetchCategories();
        await fetchStatistics();
      } else {
        alert(response.data.message || 'Failed to delete category');
      }
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      alert(errorMessage);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-2">Manage video categories and user assignments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
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
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
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
                <p className="text-sm font-medium text-gray-600">With Users</p>
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
                <p className="text-sm font-medium text-gray-600">With Videos</p>
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
                <p className="text-sm font-medium text-gray-600">Most Popular</p>
                <p className="text-lg font-bold text-gray-900">
                  {statistics.most_popular_category?.name || 'None'}
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
            placeholder="Search categories..."
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
            {searchTerm ? 'No categories found matching your search.' : 'No categories created yet.'}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name..."
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
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
              Created {new Date(category.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{category.users_count}</p>
            <p className="text-xs text-gray-500">Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{category.videos_count}</p>
            <p className="text-xs text-gray-500">Videos</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Link to={`/admin/categories/edit/${category.id}`} className="flex-1">
          <Button size="sm" variant="secondary" className="w-full">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </Link>
        <Link to={`/admin/categories/assign/${category.id}`} className="flex-1">
          <Button size="sm" className="w-full">
            <Users className="h-3 w-3 mr-1" />
            Assign
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