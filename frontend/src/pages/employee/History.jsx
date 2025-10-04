import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { expenseApi } from '../../services/expenseApi';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, DollarSign, FileText } from 'lucide-react';

export const ExpenseHistory = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      console.log('Loading employee expenses...');
      // Use getEmployeeExpenses instead of passing user.id
      const result = await expenseApi.getEmployeeExpenses();
      
      console.log('Employee expenses result:', result);
      
      if (result.success) {
        const expenseData = Array.isArray(result.data) ? result.data : [];
        setExpenses(expenseData);
      } else {
        console.error('API Error:', result.error);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Load expenses error:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
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
            <p className="mt-4 text-muted-foreground">Loading expenses...</p>
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
          <h1 className="text-3xl font-bold mb-2">Expense History</h1>
          <p className="text-muted-foreground mb-6">Track your submitted expenses and their status</p>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No expenses submitted yet</p>
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
                          <h3 className="text-lg font-semibold">{expense.description}</h3>
                          {getStatusBadge(expense.status)}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{expense.amount} {expense.currency}</span>
                            {expense.currency !== (expense.company_currency || 'USD') && (
                              <span className="ml-2 text-xs">
                                ≈ {expense.converted_amount} {expense.company_currency || 'USD'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(expense.expense_date || expense.date)}</span>
                          </div>
                          <Badge variant="outline">
                            {expense.category_details?.name || expense.category || 'No Category'}
                          </Badge>
                        </div>

                        {/* Approval Status - Fixed the map error */}
                        {expense.approvals && expense.approvals.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Approval Status</p>
                            <div className="space-y-2">
                              {expense.approvals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    approval.status === 'approved' ? 'bg-green-500' : 
                                    approval.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} />
                                  <span>{approval.approver_details?.full_name || 'Unknown Approver'}</span>
                                  <span className="text-muted-foreground">({approval.status})</span>
                                  {approval.comments && (
                                    <span className="text-xs italic text-muted-foreground">
                                      - "{approval.comments}"
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show current status if no approvals yet */}
                        {(!expense.approvals || expense.approvals.length === 0) && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Status</p>
                            <div className="flex items-center gap-3 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                expense.status === 'approved' ? 'bg-green-500' : 
                                expense.status === 'rejected' ? 'bg-red-500' : 
                                expense.status === 'submitted' ? 'bg-blue-500' : 'bg-yellow-500'
                              }`} />
                              <span>{expense.status === 'pending_approval' ? 'Pending Manager Approval' : expense.status?.replace('_', ' ').toUpperCase()}</span>
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

export default ExpenseHistory;
