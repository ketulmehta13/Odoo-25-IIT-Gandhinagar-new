import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { userApi } from '../../services/expenseApi';
import { UserPlus, Edit, Trash2, Link as LinkIcon, Mail, Building2, Shield, UserCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee'
  });

  const [editData, setEditData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'employee'
  });

  const [assignData, setAssignData] = useState({
    manager_id: '',
    employee_id: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await userApi.getAllUsers();
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setUsers([]);
        toast.error('Failed to load users');
      }
    } catch (error) {
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await userApi.createUser(formData);
      if (result.success) {
        toast.success('User created successfully');
        setDialogOpen(false);
        setFormData({ name: '', email: '', role: 'employee' });
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleEdit = (user) => {
    setEditData({
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      role: user.role
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await userApi.updateUser(editData.id, {
        first_name: editData.first_name,
        last_name: editData.last_name,
        role: editData.role
      });

      if (result.success) {
        toast.success('User updated successfully');
        setEditDialogOpen(false);
        setEditData({ id: '', first_name: '', last_name: '', email: '', role: 'employee' });
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    try {
      const result = await userApi.assignManagerEmployee(assignData);
      if (result.success) {
        toast.success('Manager assigned successfully');
        setAssignDialogOpen(false);
        setAssignData({ manager_id: '', employee_id: '' });
        loadUsers();
      } else {
        toast.error(result.error || 'Failed to assign manager');
      }
    } catch (error) {
      toast.error('Failed to assign manager');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const result = await userApi.deleteUser(userId);
      if (result.success) {
        toast.success('User deleted successfully');
        loadUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: { variant: 'destructive', icon: Shield },
      manager: { variant: 'default', icon: UserCog },
      employee: { variant: 'secondary', icon: UserCheck }
    };
    const config = styles[role] || styles.employee;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs font-medium px-3 py-1">
        <Icon className="w-3 h-3 mr-1" />
        {role?.toUpperCase()}
      </Badge>
    );
  };

  const getManagers = () => users.filter(user => user.role === 'manager');
  const getEmployees = () => users.filter(user => user.role === 'employee');
  const getAdmins = () => users.filter(user => user.role === 'admin');

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-lg text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Container with Perfect Spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header Section */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  User Management
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                  Manage users, roles, and organizational relationships across your team
                </p>
              </div>

              <div className="flex flex-col sm:flex-row  ">
                {/* Assign Manager Dialog */}
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="min-w-[160px]">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Assign Manager
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-xl">Assign Manager to Employee</DialogTitle>
                      <DialogDescription className="text-base">
                        Create manager-employee relationship for approval workflow
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignManager} className="space-y-6 pt-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Employee *</Label>
                        <Select
                          value={assignData.employee_id}
                          onValueChange={(value) => setAssignData({ ...assignData, employee_id: value })}
                          required
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select employee to assign manager" />
                          </SelectTrigger>
                          <SelectContent>
                            {getEmployees().map(employee => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.full_name || `${employee.first_name} ${employee.last_name}` || employee.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Manager *</Label>
                        <Select
                          value={assignData.manager_id}
                          onValueChange={(value) => setAssignData({ ...assignData, manager_id: value })}
                          required
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select manager to assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {getManagers().map(manager => (
                              <SelectItem key={manager.id} value={manager.id.toString()}>
                                {manager.full_name || `${manager.first_name} ${manager.last_name}` || manager.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setAssignDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-11">
                          Assign Manager
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Add User Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="min-w-[130px]">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-xl">Create New User</DialogTitle>
                      <DialogDescription className="text-base">
                        Add a new user to your organization
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Full Name *</Label>
                        <Input
                          className="h-11"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Email Address *</Label>
                        <Input
                          className="h-11"
                          type="email"
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Role *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-11">
                          Create User
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl">Edit User</DialogTitle>
                <DialogDescription className="text-base">
                  Update user information and role
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">First Name *</Label>
                  <Input
                    className="h-11"
                    placeholder="John"
                    value={editData.first_name}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Last Name *</Label>
                  <Input
                    className="h-11"
                    placeholder="Doe"
                    value={editData.last_name}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Email Address</Label>
                  <Input
                    className="h-11 bg-gray-100 dark:bg-gray-800"
                    type="email"
                    value={editData.email}
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Role *</Label>
                  <Select
                    value={editData.role}
                    onValueChange={(value) => setEditData({ ...editData, role: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11">
                    Update User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          

          {/* Users Sections */}
          <div className="space-y-16">
            {/* Admins Section */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Administrators
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getAdmins().length} admin{getAdmins().length !== 1 ? 's' : ''} with full system access
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getAdmins().length === 0 ? (
                  <div className="col-span-full">
                    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-16 text-center">
                        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Administrators</h3>
                        <p className="text-gray-600 dark:text-gray-400">No admin users found in the system</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  getAdmins().map((user) => (
                    <Card key={user.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                                {user.full_name || `${user.first_name} ${user.last_name}`.trim() || 'Unnamed User'}
                              </h4>
                              {getRoleBadge(user.role)}
                            </div>

                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">{user.email}</span>
                            </div>

                            {user.company_name && (
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate text-sm">{user.company_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Managers Section */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Managers
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getManagers().length} manager{getManagers().length !== 1 ? 's' : ''} overseeing team operations
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getManagers().length === 0 ? (
                  <div className="col-span-full">
                    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-16 text-center">
                        <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Managers</h3>
                        <p className="text-gray-600 dark:text-gray-400">No manager users found in the system</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  getManagers().map((user) => (
                    <Card key={user.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                                {user.full_name || `${user.first_name} ${user.last_name}`.trim() || 'Unnamed User'}
                              </h4>
                              {getRoleBadge(user.role)}
                            </div>

                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">{user.email}</span>
                            </div>

                            {user.manager_relationships && user.manager_relationships.length > 0 && (
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Managing {user.manager_relationships.length} employee{user.manager_relationships.length !== 1 ? 's' : ''}
                              </div>
                            )}

                            {user.company_name && (
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate text-sm">{user.company_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Employees Section */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Employees
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getEmployees().length} employee{getEmployees().length !== 1 ? 's' : ''} in the organization
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getEmployees().length === 0 ? (
                  <div className="col-span-full">
                    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <CardContent className="p-16 text-center">
                        <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Employees</h3>
                        <p className="text-gray-600 dark:text-gray-400">No employee users found in the system</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  getEmployees().map((user) => (
                    <Card key={user.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                                {user.full_name || `${user.first_name} ${user.last_name}`.trim() || 'Unnamed User'}
                              </h4>
                              {getRoleBadge(user.role)}
                            </div>

                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">{user.email}</span>
                            </div>

                            <div className="text-sm font-medium">
                              {user.manager_relationships && user.manager_relationships.length > 0 ? (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ Manager: {user.manager_relationships[0].manager_name}
                                </span>
                              ) : (
                                <span className="text-orange-600 dark:text-orange-400">
                                  ⚠ No manager assigned
                                </span>
                              )}
                            </div>

                            {user.company_name && (
                              <div className="flex items-center text-gray-600 dark:text-gray-300">
                                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate text-sm">{user.company_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserManagement;