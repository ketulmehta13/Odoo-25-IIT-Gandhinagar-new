import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { expenseApi } from '../../services/mockApi';
import { Calendar, DollarSign, Users } from 'lucide-react';

export const TeamExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const result = await expenseApi.getAllExpenses();
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

  const getTotalsByStatus = () => {
    return expenses.reduce((acc, exp) => {
      acc[exp.status] = (acc[exp.status] || 0) + exp.convertedAmount;
      return acc;
    }, {});
  };

  const totals = getTotalsByStatus();

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
            <p className="mt-4 text-muted-foreground">Loading team expenses...</p>
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
          <h1 className="text-3xl font-bold mb-2">Team Expenses</h1>
          <p className="text-muted-foreground mb-6">Overview of all team member expenses</p>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-success">
                      ${totals.approved?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-warning">
                      ${totals.pending?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold text-destructive">
                      ${totals.rejected?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense List */}
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{expense.employeeName}</h3>
                        {getStatusBadge(expense.status)}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{expense.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {expense.amount} {expense.currency}
                            {expense.currency !== expense.companyCurrency && (
                              <span className="ml-2 text-xs text-muted-foreground">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeamExpenses;
