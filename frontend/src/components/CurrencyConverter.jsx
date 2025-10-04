import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useCurrencyService } from '../hooks/useCurrencyService';

export const CurrencyConverter = () => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [converting, setConverting] = useState(false);
  
  const { commonCurrencies, convertCurrency } = useCurrencyService();

  const handleConvert = async () => {
    if (!amount || !fromCurrency || !toCurrency) return;
    
    setConverting(true);
    const conversionResult = await convertCurrency(
      parseFloat(amount), 
      fromCurrency, 
      toCurrency
    );
    setResult(conversionResult);
    setConverting(false);
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Currency Converter
        </CardTitle>
        <CardDescription>
          Convert between different currencies using live exchange rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonCurrencies.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonCurrencies.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="px-3"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={handleConvert} 
          className="w-full"
          disabled={converting || !amount}
        >
          {converting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </Button>

        {result && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  {result.convertedAmount} {result.toCurrency}
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.amount} {result.fromCurrency} = {result.convertedAmount} {result.toCurrency}
                </div>
                <div className="text-xs text-muted-foreground">
                  Exchange rate: 1 {result.fromCurrency} = {result.rate} {result.toCurrency}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
