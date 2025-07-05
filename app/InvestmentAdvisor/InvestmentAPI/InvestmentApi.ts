'use client';

// Define types for our form inputs
export interface InvestmentFormData {
  savingsAmount: number;
  timeHorizon: number; // in years
  riskTolerance: string; // 'low', 'medium', 'high'
  investmentGoal: string; // 'retirement', 'education', 'house', 'wealth'
  currency: string; // 'inr', 'usd', 'eur', 'gbp', 'jpy', 'cad'
}

// Define types for our recommendations
export interface Recommendation {
  assetClass: string;
  allocation: number; // percentage
  description: string;
  expectedReturn: string;
}

// Define exchange rates for different currencies (against USD)
// These would ideally come from an API in a production environment
interface CurrencyRates {
  [key: string]: number;
}

interface CurrencySymbols {
  [key: string]: string;
}

const exchangeRates = {
  inr: 83.24,
  usd: 1,
  eur: 0.92,
  gbp: 0.79,
  jpy: 151.77,
  cad: 1.36
} as CurrencyRates;

const currencySymbols = {
  inr: '₹',
  usd: '$',
  eur: '€',
  gbp: '£',
  jpy: '¥',
  cad: 'C$'
} as CurrencySymbols;
// API keys would typically be stored in environment variables
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

// Fetch market data from Alpha Vantage
export const fetchMarketData = async () => {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${ALPHA_VANTAGE_API_KEY}`
  );
  return await response.json();
};

// Fetch bond yields from Financial Modeling Prep
export const fetchBondYields = async () => {
  const response = await fetch(
    `https://financialmodelingprep.com/api/v4/treasury?apikey=${FMP_API_KEY}`
  );
  return await response.json();
};

// Fetch exchange rates (in a production environment, use a real API)
export const fetchExchangeRates = async () => {
  // This would normally be an API call to get real-time exchange rates
  // For this example, we'll use the static rates defined above
  return exchangeRates;
};

// Generate recommendations based on user profile without API data
export const generateRecommendationsByProfile = (profile: InvestmentFormData): Recommendation[] => {
  const { riskTolerance, timeHorizon, investmentGoal } = profile;
  let recommendations: Recommendation[] = [];
  
  // Adjust recommendations based on currency
  // For INR, we might want to adjust some of the recommendations to include more India-specific options
  const isIndianCurrency = profile.currency === 'inr';
  
  // Adjust allocations based on risk tolerance and time horizon
  if (riskTolerance === 'low') {
    if (timeHorizon < 3) {
      // Short-term, low risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 50,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Government Bonds' : 'Short-term Government Bonds',
          allocation: 30,
          description: isIndianCurrency ? 'Highly secure Indian government-backed securities' : 'Highly secure government-backed securities',
          expectedReturn: isIndianCurrency ? '6-7% annually' : '3-5% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 10,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Dividend Stocks (Nifty 50)' : 'Blue-chip Dividend Stocks',
          allocation: 10,
          description: isIndianCurrency ? 'Stable Indian companies with consistent dividend payouts' : 'Stable companies with consistent dividend payouts',
          expectedReturn: isIndianCurrency ? '7-10% annually' : '5-8% annually'
        }
      ];
    } else if (timeHorizon < 7) {
      // Medium-term, low risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 30,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Government Bonds' : 'Government Bonds',
          allocation: 40,
          description: isIndianCurrency ? 'Highly secure Indian government-backed securities' : 'Highly secure government-backed securities',
          expectedReturn: isIndianCurrency ? '6-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Dividend Stocks (Nifty 50)' : 'Blue-chip Dividend Stocks',
          allocation: 20,
          description: isIndianCurrency ? 'Stable Indian companies with consistent dividend payouts' : 'Stable companies with consistent dividend payouts',
          expectedReturn: isIndianCurrency ? '7-10% annually' : '5-8% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 10,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    } else {
      // Long-term, low risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 20,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Government Bonds' : 'Government Bonds',
          allocation: 35,
          description: isIndianCurrency ? 'Highly secure Indian government-backed securities' : 'Highly secure government-backed securities',
          expectedReturn: isIndianCurrency ? '6-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Dividend Stocks (Nifty 50)' : 'Blue-chip Dividend Stocks',
          allocation: 30,
          description: isIndianCurrency ? 'Stable Indian companies with consistent dividend payouts' : 'Stable companies with consistent dividend payouts',
          expectedReturn: isIndianCurrency ? '7-10% annually' : '5-8% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Index Funds (Nifty/Sensex)' : 'Index Funds',
          allocation: 10,
          description: isIndianCurrency ? 'Passive investment tracking Indian market indices' : 'Passive investment tracking a market index',
          expectedReturn: isIndianCurrency ? '9-12% annually' : '7-10% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 5,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    }
  } else if (riskTolerance === 'medium') {
    if (timeHorizon < 3) {
      // Short-term, medium risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 30,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Corporate Bonds' : 'Corporate Bonds',
          allocation: 30,
          description: isIndianCurrency ? 'Higher yields from Indian companies with moderate risk' : 'Higher yields with moderate risk',
          expectedReturn: isIndianCurrency ? '7-9% annually' : '5-7% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 25,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 15,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    } else if (timeHorizon < 7) {
      // Medium-term, medium risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 15,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Corporate Bonds' : 'Corporate Bonds',
          allocation: 25,
          description: isIndianCurrency ? 'Higher yields from Indian companies with moderate risk' : 'Higher yields with moderate risk',
          expectedReturn: isIndianCurrency ? '7-9% annually' : '5-7% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Index Funds/ETFs (Nifty/Sensex)' : 'Index Funds/ETFs',
          allocation: 30,
          description: isIndianCurrency ? 'Passive investment tracking Indian market indices' : 'Passive investment tracking a market index',
          expectedReturn: isIndianCurrency ? '9-12% annually' : '7-10% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 20,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 10,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    } else {
      // Long-term, medium risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 10,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Corporate Bonds' : 'Corporate Bonds',
          allocation: 15,
          description: isIndianCurrency ? 'Higher yields from Indian companies with moderate risk' : 'Higher yields with moderate risk',
          expectedReturn: isIndianCurrency ? '7-9% annually' : '5-7% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Index Funds/ETFs (Nifty/Sensex)' : 'Index Funds/ETFs',
          allocation: 35,
          description: isIndianCurrency ? 'Passive investment tracking Indian market indices' : 'Passive investment tracking a market index',
          expectedReturn: isIndianCurrency ? '9-12% annually' : '7-10% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 25,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Mid-cap Stocks' : 'Mid-cap Stocks',
          allocation: 10,
          description: isIndianCurrency ? 'Growing Indian companies with higher potential returns' : 'Growing companies with higher potential returns',
          expectedReturn: isIndianCurrency ? '12-18% annually' : '10-15% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 5,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    }
  } else if (riskTolerance === 'high') {
    if (timeHorizon < 3) {
      // Short-term, high risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 15,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'High-yield Corporate Bonds' : 'High-yield Corporate Bonds',
          allocation: 20,
          description: isIndianCurrency ? 'Higher yields from Indian companies with higher risk' : 'Higher yields with higher risk',
          expectedReturn: isIndianCurrency ? '8-11% annually' : '6-9% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 30,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Mid-cap Stocks' : 'Mid-cap Stocks',
          allocation: 25,
          description: isIndianCurrency ? 'Growing Indian companies with higher potential returns' : 'Growing companies with higher potential returns',
          expectedReturn: isIndianCurrency ? '12-18% annually' : '10-15% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Gold' : 'Gold',
          allocation: 10,
          description: 'Hedge against inflation and market volatility',
          expectedReturn: isIndianCurrency ? '8-10% annually' : '2-8% annually'
        }
      ];
    } else if (timeHorizon < 7) {
      // Medium-term, high risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 10,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'High-yield Corporate Bonds' : 'High-yield Corporate Bonds',
          allocation: 15,
          description: isIndianCurrency ? 'Higher yields from Indian companies with higher risk' : 'Higher yields with higher risk',
          expectedReturn: isIndianCurrency ? '8-11% annually' : '6-9% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Index Funds/ETFs (Nifty/Sensex)' : 'Index Funds/ETFs',
          allocation: 25,
          description: isIndianCurrency ? 'Passive investment tracking Indian market indices' : 'Passive investment tracking a market index',
          expectedReturn: isIndianCurrency ? '9-12% annually' : '7-10% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 20,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Mid-cap Stocks' : 'Mid-cap Stocks',
          allocation: 20,
          description: isIndianCurrency ? 'Growing Indian companies with higher potential returns' : 'Growing companies with higher potential returns',
          expectedReturn: isIndianCurrency ? '12-18% annually' : '10-15% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Small-cap Stocks' : 'Small-cap Stocks',
          allocation: 10,
          description: isIndianCurrency ? 'Smaller Indian companies with high growth potential' : 'Smaller companies with high growth potential',
          expectedReturn: isIndianCurrency ? '14-20% annually' : '12-18% annually'
        }
      ];
    } else {
      // Long-term, high risk
      recommendations = [
        {
          assetClass: isIndianCurrency ? 'Fixed Deposits' : 'Fixed Deposits',
          allocation: 5,
          description: isIndianCurrency ? 'Safe investments with guaranteed returns from Indian banks' : 'Safe investments with guaranteed returns',
          expectedReturn: isIndianCurrency ? '5-7% annually' : '4-6% annually'
        },
        {
          assetClass: isIndianCurrency ? 'High-yield Corporate Bonds' : 'High-yield Corporate Bonds',
          allocation: 10,
          description: isIndianCurrency ? 'Higher yields from Indian companies with higher risk' : 'Higher yields with higher risk',
          expectedReturn: isIndianCurrency ? '8-11% annually' : '6-9% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Index Funds/ETFs (Nifty/Sensex)' : 'Index Funds/ETFs',
          allocation: 20,
          description: isIndianCurrency ? 'Passive investment tracking Indian market indices' : 'Passive investment tracking a market index',
          expectedReturn: isIndianCurrency ? '9-12% annually' : '7-10% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Blue-chip Stocks (Nifty 50)' : 'Blue-chip Stocks',
          allocation: 25,
          description: isIndianCurrency ? 'Established Indian companies with stable growth' : 'Established companies with stable growth',
          expectedReturn: isIndianCurrency ? '10-14% annually' : '8-12% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Mid-cap Stocks' : 'Mid-cap Stocks',
          allocation: 20,
          description: isIndianCurrency ? 'Growing Indian companies with higher potential returns' : 'Growing companies with higher potential returns',
          expectedReturn: isIndianCurrency ? '12-18% annually' : '10-15% annually'
        },
        {
          assetClass: isIndianCurrency ? 'Small-cap Stocks' : 'Small-cap Stocks',
          allocation: 15,
          description: isIndianCurrency ? 'Smaller Indian companies with high growth potential' : 'Smaller companies with high growth potential',
          expectedReturn: isIndianCurrency ? '14-20% annually' : '12-18% annually'
        },
        {
          assetClass: isIndianCurrency ? 'International/US Stocks' : 'International Stocks',
          allocation: 5,
          description: isIndianCurrency ? 'Geographical diversification outside India with growth potential' : 'Geographical diversification with growth potential',
          expectedReturn: isIndianCurrency ? '10-16% annually' : '8-14% annually'
        }
      ];
    }
  }
  
  // Adjust based on investment goal
  if (investmentGoal === 'retirement') {
    // Favor long-term growth and income
    // No adjustments needed - base allocations are already well-suited
  } else if (investmentGoal === 'education') {
    // More conservative as the goal date approaches
    if (timeHorizon < 5) {
      recommendations = recommendations.map(rec => {
        if (rec.assetClass.includes('Fixed') || rec.assetClass.includes('Bond')) {
          return { ...rec, allocation: rec.allocation * 1.2 };
        } else if (rec.assetClass.includes('Small-cap') || rec.assetClass.includes('Mid-cap')) {
          return { ...rec, allocation: rec.allocation * 0.8 };
        }
        return rec;
      });
    }
  } else if (investmentGoal === 'house') {
    // More conservative as the purchase date approaches
    if (timeHorizon < 3) {
      recommendations = recommendations.map(rec => {
        if (rec.assetClass.includes('Fixed') || rec.assetClass.includes('Bond')) {
          return { ...rec, allocation: rec.allocation * 1.3 };
        } else if (rec.assetClass.includes('Stock') || rec.assetClass.includes('Fund')) {
          return { ...rec, allocation: rec.allocation * 0.7 };
        }
        return rec;
      });
    }
  } else if (investmentGoal === 'wealth') {
    // More aggressive for wealth accumulation
    recommendations = recommendations.map(rec => {
      if (rec.assetClass.includes('Stock') || rec.assetClass.includes('Fund')) {
        return { ...rec, allocation: rec.allocation * 1.1 };
      } else if (rec.assetClass.includes('Fixed') || rec.assetClass.includes('Bond')) {
        return { ...rec, allocation: rec.allocation * 0.9 };
      }
      return rec;
    });
  }
  
  // Normalize allocations to ensure they sum to 100%
  const totalAllocation = recommendations.reduce((sum, rec) => sum + rec.allocation, 0);
  return recommendations.map(rec => ({
    ...rec,
    allocation: Math.round((rec.allocation / totalAllocation) * 100)
  }));
};

// Get currency symbol for display
// Define the currency symbols object with a proper type


export const getCurrencySymbol = (currencyCode: string): string => {
  const code = currencyCode.toLowerCase() as keyof typeof currencySymbols;
  return currencySymbols[code] || '$';
};

// Format currency amount based on selected currency
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const code = currencyCode.toLowerCase();
  
  // Format based on currency conventions
  if (code === 'inr') {
    // Indian formatting: ₹ XX,XX,XXX.XX
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } else {
    // Standard international formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase(),
      maximumFractionDigits: 0
    }).format(amount);
  }
};

// Convert amount to display currency
// Define the exchange rates object with a proper type


export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const from = fromCurrency.toLowerCase();
  const to = toCurrency.toLowerCase();
  
  if (from === to) return amount;
  
  // Type assertion to tell TypeScript that these keys exist
  const fromRate = exchangeRates[from as keyof typeof exchangeRates];
  const toRate = exchangeRates[to as keyof typeof exchangeRates];
  
  if (fromRate === undefined || toRate === undefined) {
    throw new Error(`Currency not supported: ${fromRate === undefined ? fromCurrency : toCurrency}`);
  }
  
  // Convert to USD first (as base), then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};


// Main function to generate investment recommendations
export const generateInvestmentRecommendations = async (formData: InvestmentFormData) => {
  try {
    // Fetch market data from APIs
    const marketData = await fetchMarketData();
    const bondYields = await fetchBondYields();
    
    // Generate recommendations using the fetched data
    const recommendations = generateRecommendationsByProfile(formData);
    
    // If currency is INR, add specific Indian market data if available
    const indianMarketData = formData.currency.toLowerCase() === 'inr' ? {
      nifty50: 22500, // Example value - in a real app, this would come from an API
      sensex: 74000,   // Example value - in a real app, this would come from an API
      dailyChange: 1.2 // Example value - in a real app, this would come from an API
    } : null;
    
    return {
      success: true,
      recommendations,
      marketData,
      bondYields,
      indianMarketData,
      currencySymbol: getCurrencySymbol(formData.currency)
    };
  } catch (err) {
    console.error('Error generating recommendations:', err);
    
    // Fall back to static recommendations if API calls fail
    const staticRecommendations = generateRecommendationsByProfile(formData);
    
    return {
      success: false,
      recommendations: staticRecommendations,
      currencySymbol: getCurrencySymbol(formData.currency),
      error: 'Failed to fetch market data. Using static recommendations instead.'
    };
  }
};