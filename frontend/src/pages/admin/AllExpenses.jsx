import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { expenseApi } from '../../services/expenseApi'; // Updated import
import { Calendar, DollarSign, FileText } from 'lucide-react';

export const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  const loadExpenses = async () => {
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const result = await expenseApi.getAllExpenses(filters);
      
      console.log('API Result:', result); // Debug log
      
      if (result.success) {
        // Ensure we have an array
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
      <div style={{ marginLeft: '256px', padding: '24px', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
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
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
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
                            <span>{new Date(expense.expense_date || expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Approval Trail - with safe checking */}
                        {expense.approvals && expense.approvals.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Approval Trail</p>
                            <div className="space-y-1">
                              {expense.approvals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    approval.status === 'approved' ? 'bg-success' : 
                                    approval.status === 'rejected' ? 'bg-destructive' : 'bg-warning'
                                  }`} />
                                  <span>{approval.approver_details?.full_name || approval.name || 'Unknown'}</span>
                                  <span className="text-muted-foreground">
                                    {approval.approver_details?.role || approval.role || ''}
                                  </span>
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

                        {/* Show current approver if pending */}
                        {expense.status === 'pending_approval' && expense.current_approver_details && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Pending Approval</p>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 rounded-full bg-warning" />
                              <span>{expense.current_approver_details.full_name}</span>
                              <span className="text-muted-foreground">({expense.current_approver_details.role})</span>
                              <Badge variant="outline" className="text-xs">Pending</Badge>
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

export default AllExpenses;
