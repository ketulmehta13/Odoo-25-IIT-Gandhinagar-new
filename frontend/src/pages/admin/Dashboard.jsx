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
  AlertCircle 
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
      console.log('Loading admin dashboard data...');
      
      // Load admin statistics
      const statsResult = await expenseApi.getAdminStats();
      console.log('Admin stats result:', statsResult);
      
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.error('Failed to load stats:', statsResult.error);
        // Set default stats to prevent display issues
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

      // Load pending approvals for admin
      const pendingResult = await expenseApi.getPendingApprovals();
      console.log('Pending approvals result:', pendingResult);
      
      if (pendingResult.success) {
        setPendingExpenses(pendingResult.data || []);
      } else {
        console.error('Failed to load pending approvals:', pendingResult.error);
        setPendingExpenses([]);
      }

      // Load recent expenses
      const expensesResult = await expenseApi.getAllExpenses();
      console.log('All expenses result:', expensesResult);
      
      if (expensesResult.success) {
        const expenses = expensesResult.data || [];
        setRecentExpenses(expenses.slice(0, 10));
      } else {
        console.error('Failed to load expenses:', expensesResult.error);
        setRecentExpenses([]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      const result = await expenseApi.updateExpenseStatus(expenseId, {
        action: action,
        comment: `Quick ${action} by admin`
      });

      if (result.success) {
        toast.success(`Expense ${action}d successfully`);
        loadDashboardData(); // Refresh data
      } else {
        toast.error(result.error || 'Failed to update expense');
      }
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'destructive',
      submitted: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ marginLeft: '256px', padding: '24px', minHeight: '100vh' }}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
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
        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Complete expense management overview</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_expenses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${((stats.approved_amount || 0) + (stats.pending_amount || 0) + (stats.rejected_amount || 0)).toFixed(2)} total value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.pending_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${(stats.pending_amount || 0).toFixed(2)} awaiting review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.approved_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${(stats.approved_amount || 0).toFixed(2)} approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.rejected_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ${(stats.rejected_amount || 0).toFixed(2)} rejected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Approvals Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Admin Approvals Required ({pendingExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                  <p className="text-muted-foreground">No pending admin approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingExpenses.map((expense) => (
                    <div key={expense.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {expense.employee_name || expense.employee_details?.full_name || 'Unknown Employee'}
                            </h4>
                            <Badge variant="outline">
                              Step {expense.current_step || 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>${expense.amount} {expense.currency}</span>
                            <span>{new Date(expense.expense_date || expense.created_at).toLocaleDateString()}</span>
                            <Badge variant="outline">
                              {expense.category_details?.name || expense.category || 'No Category'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success hover:bg-success hover:text-white"
                            onClick={() => handleQuickApproval(expense.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                            onClick={() => handleQuickApproval(expense.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Expenses ({recentExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No recent expenses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {expense.employee_name || expense.employee_details?.full_name || 'Unknown'}
                          </span>
                          {getStatusBadge(expense.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {expense.description?.substring(0, 50)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
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
