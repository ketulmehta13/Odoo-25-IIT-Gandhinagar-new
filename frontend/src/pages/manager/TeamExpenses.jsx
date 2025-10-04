import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { expenseApi } from '../../services/expenseApi';
import { Calendar, DollarSign, FileText, TrendingUp, Users } from 'lucide-react';

export const TeamExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  const loadExpenses = async () => {
    try {
      console.log('Loading team expenses...');
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const result = await expenseApi.getAllExpenses(filters);
      
      console.log('Team expenses result:', result);
      
      if (result.success) {
        const expenseData = Array.isArray(result.data) ? result.data : [];
        setExpenses(expenseData);
        
        // Calculate stats safely
        calculateStats(expenseData);
      } else {
        console.error('API Error:', result.error);
        setExpenses([]);
        setStats({ approved: 0, pending: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Load expenses error:', error);
      setExpenses([]);
      setStats({ approved: 0, pending: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenses) => {
    const approved = expenses.filter(exp => exp.status === 'approved');
    const pending = expenses.filter(exp => exp.status === 'pending_approval' || exp.status === 'pending');
    const rejected = expenses.filter(exp => exp.status === 'rejected');

    const safeTotal = (expenseList) => {
      return expenseList.reduce((sum, exp) => {
        let amount = 0;
        
        if (exp.converted_amount !== null && exp.converted_amount !== undefined) {
          amount = parseFloat(exp.converted_amount);
        } else if (exp.amount !== null && exp.amount !== undefined) {
          amount = parseFloat(exp.amount);
        }
        
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    };

    setStats({
      approved: safeTotal(approved),
      pending: safeTotal(pending),
      rejected: safeTotal(rejected)
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending_approval: 'warning',
      pending: 'warning', 
      approved: 'success',
      rejected: 'destructive',
      submitted: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ marginLeft: '256px', padding: '24px', minHeight: '100vh' }}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading team expenses...</p>
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
              <h1 className="text-3xl font-bold mb-2">Team Expenses</h1>
              <p className="text-muted-foreground">Overview of all team member expenses</p>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <TrendingUp className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  ${(stats.approved || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Users className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  ${(stats.pending || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <FileText className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  ${(stats.rejected || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No team expenses found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {expense.employee_name || expense.employeeName || 'Unknown Employee'}
                          </h3>
                          {getStatusBadge(expense.status)}
                          <Badge variant="outline">
                            {expense.category_details?.name || expense.category || 'No Category'}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{expense.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-success" />
                            <span>{expense.amount} {expense.currency}</span>
                            {expense.currency !== (expense.company_currency || 'USD') && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ≈ {expense.converted_amount || expense.convertedAmount} {expense.company_currency || 'USD'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(expense.expense_date || expense.date)}</span>
                          </div>
                        </div>

                        {/* Show approval status if available */}
                        {expense.approvals && expense.approvals.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Approval Status</p>
                            <div className="space-y-1">
                              {expense.approvals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    approval.status === 'approved' ? 'bg-green-500' : 
                                    approval.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} />
                                  <span>{approval.approver_details?.full_name || 'Unknown Approver'}</span>
                                  <Badge variant="outline" className="text-xs">{approval.status}</Badge>
                                  {approval.comments && (
                                    <span className="text-xs italic text-muted-foreground">
                                      "{approval.comments}"
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeamExpenses;
