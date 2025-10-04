import { Layout } from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Settings, CheckCircle } from 'lucide-react';

export const ApprovalRules = () => {
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
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Approval Rules</h1>
          <p className="text-muted-foreground mb-6">Configure expense approval workflows</p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Current Configuration
                </CardTitle>
                <CardDescription>
                  Active approval workflow for expense submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Sequential Approval</h3>
                    <Badge>Active</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Level 1:</strong> Manager Approval (Required)</p>
                    <p className="text-muted-foreground">
                      All expenses must be approved by the employee's direct manager
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Available Rule Types
                </CardTitle>
                <CardDescription>
                  Different approval workflows you can configure (Django integration required)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Sequential Flow</h3>
                  <p className="text-sm text-muted-foreground">
                    Expenses move through approval levels one by one. Each approver must approve before
                    moving to the next level.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Percentage Rule</h3>
                  <p className="text-sm text-muted-foreground">
                    Requires a certain percentage of approvers to approve (e.g., 60% approval required)
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Specific Approver Rule</h3>
                  <p className="text-sm text-muted-foreground">
                    Certain approvers (e.g., CFO) can auto-approve expenses regardless of other approvals
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Hybrid Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine multiple conditions (e.g., 60% approval OR CFO approval)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardContent className="p-6">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">Advanced Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect to your Django backend to enable custom approval rule configuration
                    and dynamic workflow management.
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
