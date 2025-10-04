import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useCurrencyService } from '../hooks/useCurrencyService';

export const ExchangeRateDisplay = ({ baseCurrency = 'USD', targetCurrencies = ['EUR', 'GBP', 'JPY'] }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const { getExchangeRate } = useCurrencyService();

  const fetchRates = async () => {
    setLoading(true);
    const ratePromises = targetCurrencies.map(currency => 
      getExchangeRate(baseCurrency, currency)
    );
    
    try {
      const results = await Promise.all(ratePromises);
      setRates(results.filter(Boolean));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [baseCurrency]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Exchange Rates ({baseCurrency})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRates}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rates.map(rate => (
          <div key={rate.target} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{rate.target}</Badge>
              <span className="text-sm">1 {rate.base}</span>
            </div>
            <span className="font-mono text-sm">
              {rate.rate?.toFixed(4)} {rate.target}
            </span>
          </div>
        ))}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
