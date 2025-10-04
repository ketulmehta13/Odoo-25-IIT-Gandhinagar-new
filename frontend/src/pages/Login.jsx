import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password, role);
    
    // Console log: Login result
    console.log('LOGIN RESULT:', result);
    
    if (result.success) {
      // Console log: Success details
      console.log('LOGIN SUCCESSFUL!');
      console.log('User Data:', result.user);
      console.log('Company:', result.user?.company_name);
      console.log('Currency:', result.user?.currency);
      console.log('Role:', result.user?.role);
      console.log('Tokens received:', !!result.tokens);

      // Check localStorage
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      console.log('Token stored in localStorage:', !!storedToken);
      console.log('User stored in localStorage:', !!storedUser);

      toast.success('Login successful!');
      
      // Navigate based on role using existing routes from App.jsx
      if (role === 'admin') {
        console.log('Redirecting to: /admin');
        navigate('/admin');
      } else if (role === 'manager') {
        console.log('Redirecting to: /manager');
        navigate('/manager');
      } else if (role === 'employee') {
        console.log('Redirecting to: /employee');
        navigate('/employee');
      } else {
        console.log('Redirecting to: / (fallback)');
        // Fallback - let RoleBasedRedirect handle it
        navigate('/');
      }

      
    } else {
      // Console log: Error details
      console.log('LOGIN FAILED!');
      console.log('Error:', result.error);
      console.log('Error Type:', typeof result.error);

      // Handle specific error types
      if (typeof result.error === 'object') {
        console.log('Parsing validation errors...');
        // Handle validation errors from Django
        Object.keys(result.error).forEach(field => {
          console.log(`Field Error - ${field}:`, result.error[field]);
          if (Array.isArray(result.error[field])) {
            result.error[field].forEach(message => {
              toast.error(`${field}: ${message}`);
            });
          } else {
            toast.error(`${field}: ${result.error[field]}`);
          }
        });
      } else {
        console.log('Simple error message:', result.error);
        toast.error(result.error || 'Login failed');
      }

      console.log('LOGIN PROCESS FAILED!');
    }
    
    setLoading(false);
    console.log('Login loading state set to false');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to manage your expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(selectedRole) => {
                  setRole(selectedRole);
                  console.log('Role selected:', selectedRole);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  console.log('Email changed:', e.target.value);
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  console.log('Password changed (length):', e.target.value.length);
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !role}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>


            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
