import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { CurrencySelector } from './CurrencySelector';
import { useCurrencyService } from '../hooks/useCurrencyService';

export const ExpenseForm = () => {
  const [expense, setExpense] = useState({
    amount: '',
    currency: 'USD',
    description: '',
    category: ''
  });
  const [convertedAmount, setConvertedAmount] = useState(null);
  
  const { convertCurrency } = useCurrencyService();
  const userCurrency = 'USD'; // Get from user profile

  const handleAmountChange = async (value) => {
    setExpense(prev => ({ ...prev, amount: value }));
    
    if (value && expense.currency !== userCurrency) {
      const result = await convertCurrency(
        parseFloat(value),
        expense.currency,
        userCurrency
      );
      setConvertedAmount(result);
    } else {
      setConvertedAmount(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={expense.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            {convertedAmount && (
              <p className="text-sm text-muted-foreground">
                ≈ {convertedAmount.convertedAmount} {userCurrency}
              </p>
            )}
          </div>

          <CurrencySelector
            value={expense.currency}
            onValueChange={(currency) => setExpense(prev => ({ ...prev, currency }))}
            label="Currency"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="What was this expense for?"
            value={expense.description}
            onChange={(e) => setExpense(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <Button className="w-full">
          Add Expense
        </Button>
      </CardContent>
    </Card>
  );
};
