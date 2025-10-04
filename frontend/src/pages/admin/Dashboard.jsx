import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { expenseApi } from '../../services/mockApi';
import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingCount: 0,
    approvedAmount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const result = await expenseApi.getAllExpenses();
    if (result.success) {
      const expenses = result.data;
      setStats({
        totalExpenses: expenses.length,
        pendingCount: expenses.filter(e => e.status === 'pending').length,
        approvedAmount: expenses
          .filter(e => e.status === 'approved')
          .reduce((sum, e) => sum + e.convertedAmount, 0),
        rejectedCount: expenses.filter(e => e.status === 'rejected').length
      });
    }
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: DollarSign,
      color: 'text-primary'
    },
    {
      title: 'Pending Approval',
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Approved Amount',
      value: `$${stats.approvedAmount.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-success'
    },
    {
      title: 'Rejected',
      value: stats.rejectedCount,
      icon: Users,
      color: 'text-destructive'
    }
  ];

  if (loading) {
    return (
      <Layout>
        {/* Force the content to not be hidden by sidebar */}
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
      {/* Main content wrapper with sidebar offset */}
      <div 
        style={{ 
          marginLeft: '256px', 
          padding: '24px', 
          minHeight: '100vh',
          backgroundColor: 'var(--background)' 
        }}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide expense management overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-200 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => window.location.href = '/admin/users'}
                  className="p-6 border border-border/50 rounded-lg hover:bg-accent transition-all duration-200 text-left group hover:shadow-md"
                >
                  <Users className="w-6 h-6 mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground mb-1">Manage Users</p>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove users</p>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/rules'}
                  className="p-6 border border-border/50 rounded-lg hover:bg-accent transition-all duration-200 text-left group hover:shadow-md"
                >
                  <TrendingUp className="w-6 h-6 mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground mb-1">Approval Rules</p>
                  <p className="text-sm text-muted-foreground">Configure approval workflows</p>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/expenses'}
                  className="p-6 border border-border/50 rounded-lg hover:bg-accent transition-all duration-200 text-left group hover:shadow-md"
                >
                  <DollarSign className="w-6 h-6 mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground mb-1">All Expenses</p>
                  <p className="text-sm text-muted-foreground">View and manage all expenses</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
