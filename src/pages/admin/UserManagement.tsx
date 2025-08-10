import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Calendar, AlertCircle } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
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
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
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
    is_active: true
  });

  useEffect(() => {
    loadUsers();
    loadStatistics();
  }, [searchTerm, statusFilter]);

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

      if (editingUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        
        await axiosClient.put(`/admin/users/${editingUser.id}`, updateData);
      } else {
        // Create new user
        await axiosClient.post('/admin/users', formData);
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
      is_active: true
    });
    setShowAddForm(false);
    setEditingUser(null);
    setError(null);
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
      is_active: user.is_active
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

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage student accounts and access permissions</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={loading} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Active</p>
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Expiring</p>
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Expired</p>
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Inactive</p>
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
              placeholder="Search by username, name, or email..."
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
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="expiring_soon">Expiring Soon</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Add/Edit User Form */}
      {showAddForm && (
        <Card className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {editingUser ? 'Edit Student' : 'Add New Student'}
            </h2>
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                required
              />

              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name (optional)"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email (optional)"
              />

              <Input
                label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required={!editingUser}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Access Start Date"
                name="access_start"
                type="date"
                value={formData.access_start}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Access End Date"
                name="access_end"
                type="date"
                value={formData.access_end}
                onChange={handleInputChange}
                required
              />
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
                {loading ? 'Saving...' : editingUser ? 'Update Student' : 'Create Student'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Student Accounts</h2>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Try adjusting your search or filter criteria.' : 'Create your first student account to get started.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Student
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
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accessStatus.bg} ${accessStatus.color}`}>
                      {accessStatus.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-3">
                    <div>Start: {new Date(user.access_start).toLocaleDateString()}</div>
                    <div>End: {new Date(user.access_end).toLocaleDateString()}</div>
                    <div>Created: {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(user)}
                      disabled={loading}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={user.is_active ? 'secondary' : 'primary'}
                      onClick={() => toggleUserStatus(user.id)}
                      disabled={loading}
                    >
                      {user.is_active ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                      {user.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    {user.access_status === 'expiring_soon' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => extendAccess(user.id, 30)}
                        disabled={loading}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        +30d
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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Start: {new Date(user.access_start).toLocaleDateString()}</div>
                          <div>End: {new Date(user.access_end).toLocaleDateString()}</div>
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
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? 'secondary' : 'primary'}
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={loading}
                          >
                            {user.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>
                          {user.access_status === 'expiring_soon' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => extendAccess(user.id, 30)}
                              disabled={loading}
                              title="Extend access by 30 days"
                            >
                              <Calendar className="h-3 w-3" />
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagement;