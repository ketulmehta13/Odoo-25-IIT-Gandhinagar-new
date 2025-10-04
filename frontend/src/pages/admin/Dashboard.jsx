import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { expenseApi } from '../../services/expenseApi';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Settings,
  TrendingUp,
  AlertCircle,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_expenses: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    approved_amount: 0,
    pending_amount: 0,
    rejected_amount: 0
  });
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log(' Loading admin dashboard data...');
      
      // Load admin statistics
      const statsResult = await expenseApi.getAdminStats();
      console.log(' Admin stats result:', statsResult);
      
      if (statsResult.success) {
        setStats(statsResult.data);
        console.log(' Stats loaded:', statsResult.data);
      } else {
        console.error(' Failed to load stats:', statsResult.error);
        setStats({
          total_expenses: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          approved_amount: 0,
          pending_amount: 0,
          rejected_amount: 0
        });
      }

      // Load pending approvals for admin (all levels)
      const pendingResult = await expenseApi.getPendingApprovals();
      console.log(' Pending approvals result:', pendingResult);
      
      if (pendingResult.success) {
        setPendingExpenses(pendingResult.data || []);
        console.log(' Pending expenses loaded:', pendingResult.data?.length || 0);
      } else {
        console.error(' Failed to load pending approvals:', pendingResult.error);
        setPendingExpenses([]);
      }

      // Load recent expenses
      const expensesResult = await expenseApi.getAllExpenses();
      console.log(' All expenses result:', expensesResult);
      
      if (expensesResult.success) {
        const expenses = expensesResult.data || [];
        setRecentExpenses(expenses.slice(0, 10));
        console.log(' Recent expenses loaded:', expenses.length);
      } else {
        console.error(' Failed to load expenses:', expensesResult.error);
        setRecentExpenses([]);
      }
      
    } catch (error) {
      console.error(' Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Set default values to prevent UI breaks
      setStats({
        total_expenses: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        approved_amount: 0,
        pending_amount: 0,
        rejected_amount: 0
      });
      setPendingExpenses([]);
      setRecentExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApproval = async (expenseId, action) => {
    try {
      console.log(` ${action}ing expense:`, expenseId);
      
      const result = await expenseApi.updateExpenseStatus(expenseId, {
        action: action,
        comment: `Quick ${action} by admin`
      });

      if (result.success) {
        toast.success(` Expense ${action}d successfully`);
        console.log(` Expense ${action}d:`, expenseId);
        loadDashboardData(); // Refresh data
      } else {
        console.error(` Failed to ${action} expense:`, result.error);
        toast.error(result.error || `Failed to ${action} expense`);
      }
    } catch (error) {
      console.error(` Error ${action}ing expense:`, error);
      toast.error(`Failed to ${action} expense`);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending_approval: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { variant: 'destructive', className: '' },
      submitted: { variant: 'secondary', className: '' },
      draft: { variant: 'outline', className: '' }
    };
    
    const config = variants[status] || variants.submitted;
    
    return (
      <Badge 
        variant={config.variant} 
        className={config.className}
      >
        {status?.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getApprovalLevelBadge = (expense) => {
    const currentApprover = expense.current_approver_details;
    
    if (!currentApprover) {
      return (
        <Badge variant="outline" className="text-xs">
          <User className="w-3 h-3 mr-1" />
          No Approver
        </Badge>
      );
    }

    if (currentApprover.role === 'manager') {
      return (
        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          <User className="w-3 h-3 mr-1" />
          Manager Review
        </Badge>
      );
    } else if (currentApprover.role === 'admin') {
      return (
        <Badge variant="default" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Admin Review
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        <User className="w-3 h-3 mr-1" />
        {currentApprover.role} Review
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Complete expense management overview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Welcome, {user?.full_name || user?.email}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total_expenses || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${((stats.approved_amount || 0) + (stats.pending_amount || 0) + (stats.rejected_amount || 0)).toFixed(2)} total value
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                <Clock className="w-5 h-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending_count || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(stats.pending_amount || 0).toFixed(2)} awaiting review
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.approved_count || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(stats.approved_amount || 0).toFixed(2)} approved
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                <XCircle className="w-5 h-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.rejected_count || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(stats.rejected_amount || 0).toFixed(2)} rejected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals Section - All Levels */}
          <Card className="mb-8 shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <CardTitle className="text-xl">
                      Pending Approvals - All Levels ({pendingExpenses.length})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      All expenses requiring approval at manager or admin level
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDashboardData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No pending approvals at any level</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-base">
                              {expense.employee_name || expense.employee_details?.full_name || 'Unknown Employee'}
                            </h4>
                            {getApprovalLevelBadge(expense)}
                            <Badge variant="outline" className="text-xs">
                              Step {expense.current_step || 1}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {expense.description}
                          </p>
                          
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                ${expense.amount} {expense.currency}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(expense.expense_date || expense.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <Badge variant="secondary" className="text-xs">
                              {expense.category_details?.name || expense.category || 'No Category'}
                            </Badge>
                            
                            {expense.current_approver_details && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>
                                  Assigned to: {expense.current_approver_details.full_name || expense.current_approver_details.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3 ml-6">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleQuickApproval(expense.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                            onClick={() => handleQuickApproval(expense.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Recent Expenses ({recentExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">No recent expenses to display</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-sm">
                            {expense.employee_name || expense.employee_details?.full_name || 'Unknown Employee'}
                          </span>
                          {getStatusBadge(expense.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {expense.description?.substring(0, 80)}
                          {expense.description?.length > 80 ? '...' : ''}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-sm">
                          ${expense.amount} {expense.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.expense_date || expense.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
