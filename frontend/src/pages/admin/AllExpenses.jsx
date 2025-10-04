import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { expenseApi } from '../../services/expenseApi';
import { Calendar, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';

export const AllExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  const loadExpenses = async () => {
    try {
      console.log('Loading expenses with filter:', statusFilter);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const result = await expenseApi.getAllExpenses(filters);
      
      console.log('API Result:', result);
      
      if (result.success) {
        const expenseData = Array.isArray(result.data) ? result.data : [];
        setExpenses(expenseData);
        console.log('Loaded expenses:', expenseData.length);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
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
      <div style={{ marginLeft: '256px', padding: '24px', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">All Expenses</h1>
              <p className="text-muted-foreground">System-wide expense overview and management</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span>{expenses.filter(e => e.status === 'pending_approval').length} Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>{expenses.filter(e => e.status === 'approved').length} Approved</span>
                </div>
              </div>
              
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No expenses found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {statusFilter !== 'all' ? `No expenses with status: ${statusFilter}` : 'No expenses have been submitted yet'}
                </p>
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
                            {expense.employee_name || expense.employee_details?.full_name || 'Unknown Employee'}
                          </h3>
                          {getStatusBadge(expense.status)}
                          <Badge variant="outline">
                            {expense.category_details?.name || expense.category || 'No Category'}
                          </Badge>
                          {expense.current_step && (
                            <Badge variant="secondary" className="text-xs">
                              Step {expense.current_step}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{expense.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-success" />
                            <span>{expense.amount} {expense.currency}</span>
                            {expense.currency !== (expense.company_currency || 'USD') && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ≈ {expense.converted_amount} {expense.company_currency || 'USD'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(expense.expense_date || expense.date)}</span>
                          </div>
                        </div>

                        {/* Approval Trail */}
                        {expense.approvals && expense.approvals.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Approval Trail</p>
                            <div className="space-y-1">
                              {expense.approvals.map((approval, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${
                                    approval.status === 'approved' ? 'bg-green-500' : 
                                    approval.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`} />
                                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded">
                                    Step {approval.step_order}
                                  </span>
                                  <span>{approval.approver_details?.full_name || 'Unknown Approver'}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {approval.approver_details?.role?.toUpperCase() || approval.approver_type?.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">{approval.status?.toUpperCase()}</Badge>
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

                        {/* Current Pending Approver */}
                        {expense.status === 'pending_approval' && expense.current_approver_details && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Currently Awaiting Approval</p>
                            <div className="flex items-center gap-3 text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">
                              <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                              <span className="font-medium">{expense.current_approver_details.full_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {expense.current_approver_details.role?.toUpperCase()}
                              </Badge>
                              <Badge variant="warning" className="text-xs">PENDING</Badge>
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
