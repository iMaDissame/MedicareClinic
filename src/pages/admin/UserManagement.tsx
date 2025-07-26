import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    accessStart: '',
    accessEnd: '',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const defaultUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        accessStart: '2024-01-01',
        accessEnd: '2025-12-31',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];

    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(defaultUsers);
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...formData }
          : user
      );
      saveUsers(updatedUsers);
      setEditingUser(null);
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      saveUsers([...users, newUser]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      accessStart: '',
      accessEnd: '',
      isActive: true
    });
    setShowAddForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      accessStart: user.accessStart,
      accessEnd: user.accessEnd,
      isActive: user.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
    }
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    );
    saveUsers(updatedUsers);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getAccessStatus = (user: User) => {
    const now = new Date();
    const accessEnd = new Date(user.accessEnd);
    const daysRemaining = Math.ceil((accessEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!user.isActive) return { status: 'Inactive', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (daysRemaining < 0) return { status: 'Expired', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysRemaining <= 7) return { status: `${daysRemaining}d left`, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const studentUsers = users.filter(u => u.role === 'user');

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage student accounts and access permissions</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{studentUsers.length}</p>
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
                {studentUsers.filter(u => u.isActive && new Date(u.accessEnd) > new Date()).length}
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {studentUsers.filter(u => {
                  const daysLeft = Math.ceil((new Date(u.accessEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return u.isActive && daysLeft <= 7 && daysLeft > 0;
                }).length}
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
              <p className="text-xs lg:text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {studentUsers.filter(u => !u.isActive || new Date(u.accessEnd) < new Date()).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

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
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input
                label="Access Start Date"
                name="accessStart"
                type="date"
                value={formData.accessStart}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Access End Date"
                name="accessEnd"
                type="date"
                value={formData.accessEnd}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Account is active
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" className="flex-1">
                {editingUser ? 'Update Student' : 'Create Student'}
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
        
        {/* Mobile Card View */}
        <div className="lg:hidden">
          {studentUsers.map((user) => {
            const accessStatus = getAccessStatus(user);
            return (
              <div key={user.id} className="p-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accessStatus.bg} ${accessStatus.color}`}>
                    {accessStatus.status}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 mb-3">
                  <div>Start: {new Date(user.accessStart).toLocaleDateString()}</div>
                  <div>End: {new Date(user.accessEnd).toLocaleDateString()}</div>
                  <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(user)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={user.isActive ? 'secondary' : 'primary'}
                    onClick={() => toggleUserStatus(user.id)}
                    className="flex-1"
                  >
                    {user.isActive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                    {user.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentUsers.map((user) => {
                const accessStatus = getAccessStatus(user);
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
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Start: {new Date(user.accessStart).toLocaleDateString()}</div>
                        <div>End: {new Date(user.accessEnd).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${accessStatus.bg} ${accessStatus.color}`}>
                        {accessStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isActive ? 'secondary' : 'primary'}
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {studentUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
            <p className="text-gray-600 mb-4">Create your first student account to get started.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Student
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagement;