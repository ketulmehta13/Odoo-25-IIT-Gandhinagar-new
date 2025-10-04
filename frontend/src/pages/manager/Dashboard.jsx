import { useState, useEffect } from "react";
import { Layout } from "../../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { expenseApi } from "../../services/expenseApi";
import { useAuth } from "../../contexts/AuthContext";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // In your Manager Dashboard component
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log(' Manager Dashboard: Starting to load data...');
      console.log(' Current user:', user);
      
      // Load pending approvals
      console.log(' Fetching pending approvals...');
      const pendingResult = await expenseApi.getPendingApprovals();
      console.log(' Pending approvals response:', pendingResult);
      
      if (pendingResult.success) {
        console.log(' Pending expenses data:', pendingResult.data);
        setPendingExpenses(pendingResult.data || []);
      } else {
        console.error(' Failed to get pending approvals:', pendingResult.error);
      }
  
      // Load all team expenses
      console.log(' Fetching team expenses...');
      const teamResult = await expenseApi.getAllExpenses();
      console.log(' Team expenses response:', teamResult);
      
      if (teamResult.success) {
        const expenses = teamResult.data || [];
        console.log('Team expenses data:', expenses);
        console.log(' Number of expenses:', expenses.length);
        
        // Log first expense structure for debugging
        if (expenses.length > 0) {
          console.log(' First expense structure:', expenses[0]);
          console.log(' Amount fields:', {
            amount: expenses[0].amount,
            converted_amount: expenses[0].converted_amount,
            currency: expenses[0].currency,
            status: expenses[0].status
          });
        }
        
        setTeamExpenses(expenses);
        
        // Calculate stats with debugging
        const approved = expenses.filter(exp => exp.status === 'approved');
        const pending = expenses.filter(exp => exp.status === 'pending_approval' || exp.status === 'pending');
        const rejected = expenses.filter(exp => exp.status === 'rejected');
        
        console.log(' Filtered expenses:', {
          approved: approved.length,
          pending: pending.length,
          rejected: rejected.length
        });
        
        // Safe calculation with detailed logging
        const safeCalculateTotal = (expenseList, type) => {
          console.log(` Calculating ${type} total for ${expenseList.length} expenses`);
          let total = 0;
          
          expenseList.forEach((exp, index) => {
            let amount = 0;
            
            if (exp.converted_amount !== null && exp.converted_amount !== undefined) {
              amount = parseFloat(exp.converted_amount);
              console.log(`${type}[${index}]: Using converted_amount = ${amount}`);
            } else if (exp.amount !== null && exp.amount !== undefined) {
              amount = parseFloat(exp.amount);
              console.log(`${type}[${index}]: Using amount = ${amount}`);
            } else {
              console.log(`${type}[${index}]: No valid amount found`, exp);
            }
            
            if (!isNaN(amount) && isFinite(amount)) {
              total += amount;
            } else {
              console.warn(`${type}[${index}]: Invalid amount (${amount}) for expense:`, exp.id);
            }
          });
          
          console.log(` ${type} total calculated: ${total}`);
          return total;
        };
        
        const newStats = {
          approved: safeCalculateTotal(approved, 'APPROVED'),
          pending: safeCalculateTotal(pending, 'PENDING'),
          rejected: safeCalculateTotal(rejected, 'REJECTED')
        };
        
        console.log(' Final calculated stats:', newStats);
        setStats(newStats);
        
      } else {
        console.error(' Failed to get team expenses:', teamResult.error);
        setStats({ approved: 0, pending: 0, rejected: 0 });
      }
      
    } catch (error) {
      console.error(' Error in loadDashboardData:', error);
      setStats({ approved: 0, pending: 0, rejected: 0 });
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      console.log(' Dashboard data loading complete');
    }
  };
  
  
  

  const handleDecision = async (expenseId, action) => {
    setProcessing(true);

    try {
      console.log("Processing decision:", { expenseId, action, comment });

      const result = await expenseApi.updateExpenseStatus(expenseId, {
        action: action,
        comment: comment,
      });

      console.log("Decision result:", result);

      if (result.success) {
        toast.success(`Expense ${action}d successfully`);
        setComment("");
        setSelectedExpense(null);

        // Reload dashboard data
        await loadDashboardData();
      } else {
        toast.error(result.error || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error processing decision:", error);
      toast.error("Failed to update expense");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{ marginLeft: "256px", padding: "24px", minHeight: "100vh" }}
        >
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
      <div
        style={{
          marginLeft: "256px",
          padding: "24px",
          minHeight: "100vh",
          backgroundColor: "var(--background)",
        }}
      >
        <div className="max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of team expenses and approvals
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold text-success">
  ${stats.approved.toFixed(2)}
</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold text-warning">
  ${stats.pending.toFixed(2)}
</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold text-destructive">
  ${stats.rejected.toFixed(2)}
</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Pending Approvals ({pendingExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingExpenses.map((expense) => (
                    <Card
                      key={expense.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold">
                                {expense.employee_name ||
                                  expense.employeeName ||
                                  "Unknown Employee"}
                              </h3>
                              <Badge variant="outline">
                                {expense.category_details?.name ||
                                  expense.category ||
                                  "No Category"}
                              </Badge>
                            </div>

                            <p className="text-muted-foreground mb-4">
                              {expense.description}
                            </p>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-success" />
                                <span className="font-semibold">
                                  {expense.amount} {expense.currency}
                                </span>
                                {expense.currency !==
                                  (expense.company_currency || "USD") && (
                                  <span className="text-muted-foreground">
                                    ≈ {expense.converted_amount}{" "}
                                    {expense.company_currency || "USD"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>
                                  {new Date(
                                    expense.expense_date || expense.date
                                  ).toLocaleDateString()}
                                </span>
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
                                    Please provide a reason for rejecting this
                                    expense
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="comment">
                                      Comment (Optional)
                                    </Label>
                                    <Textarea
                                      id="comment"
                                      placeholder="Reason for rejection..."
                                      value={comment}
                                      onChange={(e) =>
                                        setComment(e.target.value)
                                      }
                                      className="mt-2"
                                    />
                                  </div>
                                  <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() =>
                                      handleDecision(expense.id, "reject")
                                    }
                                    disabled={processing}
                                  >
                                    {processing
                                      ? "Processing..."
                                      : "Confirm Rejection"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="bg-success hover:bg-success/90 text-white"
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
                                    <Label htmlFor="approveComment">
                                      Comment (Optional)
                                    </Label>
                                    <Textarea
                                      id="approveComment"
                                      placeholder="Add a note..."
                                      value={comment}
                                      onChange={(e) =>
                                        setComment(e.target.value)
                                      }
                                      className="mt-2"
                                    />
                                  </div>
                                  <Button
                                    className="w-full bg-success hover:bg-success/90 text-white"
                                    onClick={() =>
                                      handleDecision(expense.id, "approve")
                                    }
                                    disabled={processing}
                                  >
                                    {processing
                                      ? "Processing..."
                                      : "Confirm Approval"}
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
            </CardContent>
          </Card>

          {/* Team Expenses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Expenses ({teamExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No team expenses found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamExpenses.slice(0, 10).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {expense.employee_name ||
                              expense.employeeName ||
                              "Unknown Employee"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {expense.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {expense.amount} {expense.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              expense.expense_date || expense.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            expense.status === "approved"
                              ? "success"
                              : expense.status === "rejected"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {expense.status?.toUpperCase()}
                        </Badge>
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

export default ManagerDashboard;
