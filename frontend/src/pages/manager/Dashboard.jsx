import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { expenseApi } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const result = await expenseApi.getPendingApprovals(user.id);
    if (result.success) {
      setExpenses(result.data);
    }
    setLoading(false);
  };

  const handleDecision = async (expenseId, status) => {
    setProcessing(true);
    
    const result = await expenseApi.updateExpenseStatus(expenseId, {
      approverId: user.id,
      status,
      comment
    });

    if (result.success) {
      toast.success(`Expense ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setComment('');
      setSelectedExpense(null);
      loadExpenses();
    } else {
      toast.error('Failed to update expense');
    }
    
    setProcessing(false);
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
            <p className="mt-4 text-muted-foreground">Loading approvals...</p>
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
              <h1 className="text-3xl font-bold mb-2">Approval Queue</h1>
              <p className="text-muted-foreground">Review and approve team expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <span className="text-2xl font-bold">{expenses.length}</span>
              <span className="text-muted-foreground">Pending</span>
            </div>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                <p className="text-lg font-medium mb-2">All caught up!</p>
                <p className="text-muted-foreground">No expenses pending approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{expense.employeeName}</h3>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{expense.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-success" />
                            <span className="font-semibold">
                              {expense.amount} {expense.currency}
                            </span>
                            {expense.currency !== expense.companyCurrency && (
                              <span className="text-muted-foreground">
                                ≈ {expense.convertedAmount} {expense.companyCurrency}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Expense</DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting this expense
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="comment">Comment (Optional)</Label>
                                <Textarea
                                  id="comment"
                                  placeholder="Reason for rejection..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => handleDecision(expense.id, 'rejected')}
                                disabled={processing}
                              >
                                {processing ? 'Processing...' : 'Confirm Rejection'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Expense</DialogTitle>
                              <DialogDescription>
                                Confirm approval of this expense
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="approveComment">Comment (Optional)</Label>
                                <Textarea
                                  id="approveComment"
                                  placeholder="Add a note..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <Button
                                className="w-full bg-success hover:bg-success/90"
                                onClick={() => handleDecision(expense.id, 'approved')}
                                disabled={processing}
                              >
                                {processing ? 'Processing...' : 'Confirm Approval'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
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

export default ManagerDashboard;
