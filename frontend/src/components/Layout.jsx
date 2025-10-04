import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Receipt, CheckSquare } from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [];
    
    if (user?.role === 'admin') {
      baseItems.push(
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Settings, label: 'Approval Rules', path: '/admin/rules' },
        { icon: Receipt, label: 'All Expenses', path: '/admin/expenses' }
      );
    } else if (user?.role === 'manager') {
      baseItems.push(
        { icon: CheckSquare, label: 'Approvals', path: '/manager' },
        { icon: Receipt, label: 'Team Expenses', path: '/manager/team' }
      );
    } else {
      baseItems.push(
        { icon: Receipt, label: 'New Expense', path: '/employee' },
        { icon: LayoutDashboard, label: 'My Expenses', path: '/employee/history' }
      );
    }

    return baseItems;
  };

  // Improved active link detection
  const isActiveLink = (path) => {
    // Exact match for dashboard routes
    if (path === '/admin' || path === '/manager' || path === '/employee') {
      return location.pathname === path;
    }
    
    // For sub-routes, check if current path starts with the nav path
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">ExpenseFlow</h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1">{user?.role?.toUpperCase()}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};
