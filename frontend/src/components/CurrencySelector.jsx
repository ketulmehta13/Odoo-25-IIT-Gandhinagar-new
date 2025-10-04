import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useCurrencyService } from '../hooks/useCurrencyService';

export const CurrencySelector = ({ 
  value, 
  onValueChange, 
  label = "Currency",
  placeholder = "Select currency",
  disabled = false 
}) => {
  const { commonCurrencies, countries, getCountriesWithCurrencies } = useCurrencyService();

  useEffect(() => {
    getCountriesWithCurrencies();
  }, []);

  // Get unique currencies from countries data
  const allCurrencies = React.useMemo(() => {
    const currencySet = new Set([...commonCurrencies]);
    
    countries.forEach(country => {
      country.currencies.forEach(currency => {
        currencySet.add(currency);
      });
    });
    
    return Array.from(currencySet).sort();
  }, [countries, commonCurrencies]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Common Currencies
          </div>
          {commonCurrencies.map(currency => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
          {allCurrencies.length > commonCurrencies.length && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                All Currencies
              </div>
              {allCurrencies
                .filter(currency => !commonCurrencies.includes(currency))
                .map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
