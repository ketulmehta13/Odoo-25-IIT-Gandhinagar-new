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

  const getUserDisplayName = () => {
    if (!user) return 'Unknown User';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.username || user.email || 'User';
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
        { icon: LayoutDashboard, label: 'Dashboard', path: '/manager' },
        { icon: Receipt, label: 'Team Expenses', path: '/manager/team' }
      );
    } else if (user?.role === 'employee') {
      baseItems.push(
        { icon: Receipt, label: 'New Expense', path: '/employee' },
        { icon: LayoutDashboard, label: 'My Expenses', path: '/employee/history' }
      );
    }

    return baseItems;
  };

  const isActiveLink = (path) => {
    if (path === '/admin' || path === '/manager' || path === '/employee') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside 
        className="fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50"
        style={{ 
          width: '256px',
          minWidth: '256px',
          maxWidth: '256px'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">ExpenseFlow</h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1">{user?.role?.toUpperCase()}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`sidebar-nav-button ${isActive ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    transition: 'all 200ms ease-in-out',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    border: 'none',
                    fontWeight: isActive ? '600' : '500',
                    backgroundColor: isActive 
                      ? 'hsl(217, 33%, 25%)' // Darker background for active state
                      : 'transparent',
                    color: isActive 
                      ? 'hsl(210, 40%, 98%)' // Bright text for active state
                      : 'hsl(210, 40%, 98%)',
                    boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none'
                  }}
                >
                  <Icon 
                    className="sidebar-icon" 
                    style={{
                      flexShrink: 0,
                      width: '1.25rem',
                      height: '1.25rem',
                      opacity: 1
                    }}
                  />
                  <span 
                    className="sidebar-nav-text"
                    style={{
                      display: 'block',
                      overflow: 'visible',
                      textOverflow: 'clip',
                      whiteSpace: 'nowrap',
                      opacity: 1,
                      fontWeight: 'inherit'
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar">
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-sidebar-foreground">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {user?.email || 'No email'}
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                fontWeight: '500'
              }}
            >
              <LogOut 
                className="flex-shrink-0" 
                style={{
                  width: '1.25rem',
                  height: '1.25rem'
                }}
              />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '256px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
};
