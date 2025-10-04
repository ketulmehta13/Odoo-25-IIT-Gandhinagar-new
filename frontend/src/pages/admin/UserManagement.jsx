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
import { UserPlus, Edit, Trash2, Users, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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
      console.log('Loading users...');
      const result = await userApi.getAllUsers();
      console.log('Users result:', result);
      
      if (result.success) {
        setUsers(result.data || []);
      } else {
        console.error('Failed to load users:', result.error);
        setUsers([]);
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
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
    const colors = {
      admin: 'default',
      manager: 'secondary',
      employee: 'outline'
    };
    return <Badge variant={colors[role]}>{role?.toUpperCase()}</Badge>;
  };

  const getManagers = () => users.filter(user => user.role === 'manager');
  const getEmployees = () => users.filter(user => user.role === 'employee');
  const getAdmins = () => users.filter(user => user.role === 'admin');

  if (loading) {
    return (
      <Layout>
        <div style={{ marginLeft: '256px', padding: '24px', minHeight: '100vh' }}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ 
        marginLeft: '256px', 
        padding: '24px', 
        minHeight: '100vh',
        backgroundColor: 'var(--background)' 
      }}>
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage users, roles, and manager relationships</p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Assign Manager
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Manager to Employee</DialogTitle>
                    <DialogDescription>
                      Create manager-employee relationship for approval workflow
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAssignManager} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Employee</Label>
                      <Select
                        value={assignData.employee_id}
                        onValueChange={(value) => setAssignData({ ...assignData, employee_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
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

                    <div className="space-y-2">
                      <Label htmlFor="manager">Manager</Label>
                      <Select
                        value={assignData.manager_id}
                        onValueChange={(value) => setAssignData({ ...assignData, manager_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
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

                    <Button type="submit" className="w-full">
                      Assign Manager
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full">
                      Create User
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Admins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Admins ({getAdmins().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getAdmins().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No admins found</p>
                ) : (
                  getAdmins().map((user) => (
                    <div key={user.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {user.full_name || `${user.first_name} ${user.last_name}` || user.email}
                        </h4>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Managers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  Managers ({getManagers().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getManagers().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No managers found</p>
                ) : (
                  getManagers().map((user) => (
                    <div key={user.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {user.full_name || `${user.first_name} ${user.last_name}` || user.email}
                        </h4>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      {user.manager_relationships && user.manager_relationships.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Managing: {user.manager_relationships.length} employee(s)
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Employees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  Employees ({getEmployees().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getEmployees().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No employees found</p>
                ) : (
                  getEmployees().map((user) => (
                    <div key={user.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {user.full_name || `${user.first_name} ${user.last_name}` || user.email}
                        </h4>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      {user.manager_relationships && user.manager_relationships.length > 0 ? (
                        <div className="text-xs text-success">
                          Manager: {user.manager_relationships[0].manager_name}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No manager assigned
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserManagement;
