import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { expenseApi } from '../../services/mockApi';
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
    const result = await expenseApi.getEmployeeExpenses(user.id);
    if (result.success) {
      setExpenses(result.data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'destructive'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div 
          style={{ 
            marginLeft: '256px', 
            padding: '24px', 
            minHeight: '100vh' 
          }}
        >
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
      <div 
        style={{ 
          marginLeft: '256px', 
          padding: '24px', 
          minHeight: '100vh',
          backgroundColor: 'var(--background)' 
        }}
      >
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
                            <span>
                              {expense.amount} {expense.currency}
                              {expense.currency !== expense.companyCurrency && (
                                <span className="ml-2 text-xs">
                                  (≈ {expense.convertedAmount} {expense.companyCurrency})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>

                        {/* Approval Status */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Approval Status:</p>
                          <div className="space-y-2">
                            {expense.approvers.map((approver, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  approver.status === 'approved' ? 'bg-success' :
                                  approver.status === 'rejected' ? 'bg-destructive' :
                                  'bg-warning'
                                }`} />
                                <span>{approver.name}</span>
                                <span className="text-muted-foreground">({approver.status})</span>
                                {approver.comment && (
                                  <span className="text-xs italic text-muted-foreground">
                                    - {approver.comment}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
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
