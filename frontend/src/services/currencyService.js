// Real API integrations for currency data

export const currencyService = {
  // Fetch all countries with their currencies
  getCountriesWithCurrencies: async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
      const data = await response.json();
      
      // Format data for easier use
      const countriesMap = data.map(country => ({
        name: country.name.common,
        currencies: country.currencies ? Object.keys(country.currencies) : []
      }));
      
      return countriesMap;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  },

  // Get exchange rate from base currency to target currency
  getExchangeRate: async (baseCurrency, targetCurrency) => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      const data = await response.json();
      
      return {
        base: baseCurrency,
        target: targetCurrency,
        rate: data.rates[targetCurrency],
        date: data.date
      };
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return null;
    }
  },

  // Convert amount from one currency to another
  convertCurrency: async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return { amount, convertedAmount: amount, rate: 1 };
    }

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      const rate = data.rates[toCurrency];
      const convertedAmount = (amount * rate).toFixed(2);
      
      return {
        amount,
        fromCurrency,
        toCurrency,
        rate,
        convertedAmount: parseFloat(convertedAmount)
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      return null;
    }
  },

  // Common currencies for quick access
  commonCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR']
};
