import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { expenseApi } from '../../services/mockApi';
import { Calendar, DollarSign, FileText } from 'lucide-react';

export const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  const loadExpenses = async () => {
    const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
    const result = await expenseApi.getAllExpenses(filters);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Expenses</h1>
              <p className="text-muted-foreground">System-wide expense overview</p>
            </div>
            
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No expenses found</p>
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
                          <h3 className="text-lg font-semibold">{expense.employeeName}</h3>
                          {getStatusBadge(expense.status)}
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{expense.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-success" />
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
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Approval Trail */}
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Approval Trail:</p>
                          <div className="space-y-1">
                            {expense.approvers.map((approver, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${
                                  approver.status === 'approved' ? 'bg-success' :
                                  approver.status === 'rejected' ? 'bg-destructive' :
                                  'bg-warning'
                                }`} />
                                <span>{approver.name}</span>
                                <span className="text-muted-foreground">({approver.role})</span>
                                <Badge variant="outline" className="text-xs">
                                  {approver.status}
                                </Badge>
                                {approver.comment && (
                                  <span className="text-xs italic text-muted-foreground">
                                    {approver.comment}
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

export default AllExpenses;
