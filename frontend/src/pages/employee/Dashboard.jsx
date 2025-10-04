import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Upload, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { expenseApi } from '../../services/expenseApi';
import { currencyService } from '../../services/currencyService';
import { useAuth } from '../../contexts/AuthContext';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    currency: user?.currency || 'USD',
    category: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0], // Changed to expense_date
    receipt_image: null // Changed to receipt_image
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await expenseApi.getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback categories
      setCategories([
        { id: 1, name: 'Travel' },
        { id: 2, name: 'Meals' },
        { id: 3, name: 'Office Supplies' },
        { id: 4, name: 'Transportation' },
        { id: 5, name: 'Entertainment' }
      ]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({ ...formData, receipt_image: file });
    setProcessingOCR(true);
    toast.info('Processing receipt with OCR...');

    try {
      const result = await expenseApi.processReceipt(file);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          amount: result.data.amount.toString(),
          expense_date: result.data.date,
          category: result.data.category,
          description: `Purchase from ${result.data.merchant}`
        }));
        toast.success('Receipt data extracted successfully!');
      }
    } catch (error) {
      toast.error('Failed to process receipt');
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting expense with data:', formData);
      console.log('Current user:', user);

      // Prepare expense data to match Django API expectations
      const expenseData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: parseInt(formData.category), // Should be category ID
        description: formData.description,
        expense_date: formData.expense_date,
      };

      // Add receipt image if present
      if (formData.receipt_image) {
        expenseData.receipt_image = formData.receipt_image;
      }

      console.log('Sending expense data to API:', expenseData);

      const result = await expenseApi.submitExpense(expenseData);
      
      console.log('Submit expense result:', result);

      if (result.success) {
        toast.success('Expense submitted successfully!');
        // Reset form
        setFormData({
          amount: '',
          currency: user?.currency || 'USD',
          category: '',
          description: '',
          expense_date: new Date().toISOString().split('T')[0],
          receipt_image: null
        });
        
        // Reset file input
        const fileInput = document.getElementById('receipt');
        if (fileInput) fileInput.value = '';
        
      } else {
        toast.error(result.error || 'Failed to submit expense');
      }
    } catch (error) {
      console.error('Submit expense error:', error);
      toast.error('Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ 
        marginLeft: '256px', 
        padding: '24px', 
        minHeight: '100vh',
        backgroundColor: 'var(--background)' 
      }}>
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Submit New Expense</h1>
          <p className="text-muted-foreground mb-6">Upload receipts and track reimbursements</p>

          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>Fill in the details or upload a receipt for auto-fill</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>Receipt (OCR Enabled)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="receipt"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={processingOCR}
                    />
                    <label htmlFor="receipt" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {processingOCR ? 'Processing OCR...' : 'Click to upload receipt'}
                      </p>
                      {formData.receipt_image && (
                        <p className="text-sm text-primary mt-2">{formData.receipt_image.name}</p>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyService.commonCurrencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Date *</Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter expense description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || processingOCR}>
                  {loading ? 'Submitting...' : 'Submit Expense'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;
