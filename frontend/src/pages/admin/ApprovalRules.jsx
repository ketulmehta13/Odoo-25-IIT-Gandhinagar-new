import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Settings, CheckCircle, Users, Percent, User, Zap } from 'lucide-react';

export const ApprovalRules = () => {
  const [loading, setLoading] = useState(false);

  // Mock data since backend endpoint doesn't exist yet
  const currentRules = [
    {
      id: 1,
      name: 'Default Sequential Flow',
      rule_type: 'sequential',
      is_active: true,
      is_manager_approver: true,
      description: 'Manager → Admin approval sequence'
    }
  ];

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
              <h1 className="text-3xl font-bold mb-2">Approval Rules</h1>
              <p className="text-muted-foreground">Configure multi-level expense approval workflows</p>
            </div>
          </div>

          {/* Current Rules */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Active Approval Rules ({currentRules.filter(r => r.is_active).length})
                </CardTitle>
                <CardDescription>
                  Currently configured approval workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-accent/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Level 1:</strong> Manager Approval (Required)</p>
                      <p><strong>Level 2:</strong> Admin Approval (Required)</p>
                      <p className="text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Approval Flow Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Approval Flow Examples
                </CardTitle>
                <CardDescription>
                  Common approval workflow patterns you can implement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Multi-Level Sequential
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Step 1 → Manager</p>
                      <p>Step 2 → Admin</p>
                      <p>Step 3 → Finance</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Percentage Based
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>60% of assigned approvers</p>
                      <p>must approve for completion</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      CFO Override
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>CFO approval instantly</p>
                      <p>approves any expense</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Hybrid Rules
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>60% approval OR</p>
                      <p>CFO approval</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardContent className="p-6">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Advanced Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Backend integration in progress. Advanced approval rule configuration
                    will be available soon with custom workflow management.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApprovalRules;
