'use client';

import React, { useState } from 'react';
import {
  InvestmentFormData,
  Recommendation,
  generateInvestmentRecommendations,
  getCurrencySymbol,
  formatCurrency
} from '@/app/api/InvestmentApi'; // Update this path to match your project structure
import "@/app/styles/Investment.css";

// Define proper types for market data
interface MarketData {
  'Global Quote'?: {
    '05. price'?: string;
    '09. change'?: string;
    '10. change percent'?: string;
  };
}

interface BondYields {
  // Define properties as needed
  rate?: number;
  date?: string;
}

interface IndianMarketData {
  nifty50: number;
  sensex: number;
  dailyChange: number;
}

const InvestmentAdvisor: React.FC = () => {
  const [formData, setFormData] = useState<InvestmentFormData>({
    savingsAmount: 10000,
    timeHorizon: 5,
    riskTolerance: 'medium',
    investmentGoal: 'wealth',
    currency: 'inr' // Add currency to the initial state
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [bondYields, setBondYields] = useState<BondYields | null>(null);
  const [indianMarketData, setIndianMarketData] = useState<IndianMarketData | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [error, setError] = useState<string | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'savingsAmount' ? parseFloat(value) : value
    });
  };

  // Handle risk tolerance selection
  const handleRiskToleranceChange = (risk: string) => {
    setFormData({
      ...formData,
      riskTolerance: risk
    });
  };

  // Handle investment goal selection
  const handleGoalChange = (goal: string) => {
    setFormData({
      ...formData,
      investmentGoal: goal
    });
  };

  // Handle time horizon selection
  const handleTimeHorizonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      timeHorizon: parseInt(e.target.value)
    });
  };

  // Handle currency selection
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      currency: e.target.value
    });
    setCurrencySymbol(getCurrencySymbol(e.target.value));
  };

  // Handle allocation slider changes
  const handleAllocationChange = (assetClass: string, value: number) => {
    setCustomAllocations({
      ...customAllocations,
      [assetClass]: value
    });
  };

  // Apply custom allocations
  const applyCustomAllocations = () => {
    // Here you would implement the logic to adjust allocations
    // Normalize allocations to ensure they sum to 100%
    const total = Object.values(customAllocations).reduce((sum, val) => sum + val, 0);
    
    if (total > 0) {
      const normalizedAllocations = recommendations.map(rec => {
        const newAlloc = customAllocations[rec.assetClass] || rec.allocation;
        return {
          ...rec,
          allocation: Math.round((newAlloc / total) * 100)
        };
      });
      
      setRecommendations(normalizedAllocations);
    }
    
    setIsCustomizing(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await generateInvestmentRecommendations(formData);
      
      if (result.success) {
        setRecommendations(result.recommendations);
        setMarketData(result.marketData);
        setBondYields(result.bondYields);
        // Fix the main error here with proper typing
        setIndianMarketData(result.indianMarketData as IndianMarketData);
        setCurrencySymbol(result.currencySymbol);
      } else {
        setRecommendations(result.recommendations);
        setCurrencySymbol(result.currencySymbol);
        // Convert undefined to null to match the expected type
        setError(result.error || null);
      }
      
      setHasResults(true);
      
      // Initialize custom allocations with current recommendations
      const initialCustomAllocations: Record<string, number> = {};
      result.recommendations.forEach(rec => {
        initialCustomAllocations[rec.assetClass] = rec.allocation;
      });
      setCustomAllocations(initialCustomAllocations);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error generating recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form and results
  const handleReset = () => {
    setFormData({
      savingsAmount: 10000,
      timeHorizon: 5,
      riskTolerance: 'medium',
      investmentGoal: 'wealth',
      currency: 'inr'
    });
    setRecommendations([]);
    setHasResults(false);
    setIndianMarketData(null);
    setCurrencySymbol('$');
    setError(null);
  };

  // Calculate investment amounts based on allocations
  const calculateAmount = (allocation: number) => {
    return (formData.savingsAmount * allocation) / 100;
  };

  // Format currency for display
  const formatDisplayCurrency = (amount: number) => {
    return formatCurrency(amount, formData.currency);
  };

  // Get trend indicator (just for UI demonstration)
  const getTrendIndicator = (assetClass: string): { trend: string, label: string } => {
    // This could be dynamic based on API data in a real implementation
    const trends: Record<string, { trend: string, label: string }> = {
      'Fixed Deposits': { trend: 'stable', label: 'STABLE' },
      'Government Bonds': { trend: 'down', label: 'DOWN' },
      'Corporate Bonds': { trend: 'stable', label: 'STABLE' },
      'High-yield Corporate Bonds': { trend: 'up', label: 'UP' },
      'Blue-chip Stocks': { trend: 'up', label: 'UP' },
      'Blue-chip Dividend Stocks': { trend: 'up', label: 'UP' },
      'Index Funds': { trend: 'up', label: 'UP' },
      'Index Funds/ETFs': { trend: 'up', label: 'UP' },
      'Mid-cap Stocks': { trend: 'up', label: 'UP' },
      'Small-cap Stocks': { trend: 'down', label: 'DOWN' },
      'International Stocks': { trend: 'up', label: 'UP' },
      'Gold': { trend: 'up', label: 'UP' },
      'Short-term Government Bonds': { trend: 'down', label: 'DOWN' },
    };

    return trends[assetClass] || { trend: 'stable', label: 'STABLE' };
  };

  return (
    <div className="investment-advisor-container">
      <h1 className="advisor-title">Smart Investment Advisor</h1>
      <p className="advisor-subtitle">Personalized investment recommendations based on your financial goals and risk tolerance</p>

      {!hasResults ? (
        <div className="intro-panel">
          <p className="intro-text">
            Welcome to the Smart Investment Advisor. Answer a few questions about your financial goals,
            risk tolerance, and investment horizon to receive personalized investment recommendations.
            Our algorithm analyzes current market conditions and historical data to provide you with
            optimal asset allocation strategies.
          </p>
        </div>
      ) : null}

      {!hasResults ? (
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="goal-column">
              <label className="form-label">What is your investment goal?</label>
              <div className="goal-options">
                <div 
                  className={`goal-option ${formData.investmentGoal === 'retirement' ? 'goal-option-selected' : ''}`}
                  onClick={() => handleGoalChange('retirement')}
                >
                  <div className="goal-icon">🏖️</div>
                  <div>
                    <h4 className="goal-name">Retirement</h4>
                    <p className="goal-description">Plan for your future retirement needs</p>
                  </div>
                </div>
                <div 
                  className={`goal-option ${formData.investmentGoal === 'education' ? 'goal-option-selected' : ''}`}
                  onClick={() => handleGoalChange('education')}
                >
                  <div className="goal-icon">🎓</div>
                  <div>
                    <h4 className="goal-name">Education</h4>
                    <p className="goal-description">Save for education expenses</p>
                  </div>
                </div>
                <div 
                  className={`goal-option ${formData.investmentGoal === 'house' ? 'goal-option-selected' : ''}`}
                  onClick={() => handleGoalChange('house')}
                >
                  <div className="goal-icon">🏠</div>
                  <div>
                    <h4 className="goal-name">House Purchase</h4>
                    <p className="goal-description">Save for a down payment on a house</p>
                  </div>
                </div>
                <div 
                  className={`goal-option ${formData.investmentGoal === 'wealth' ? 'goal-option-selected' : ''}`}
                  onClick={() => handleGoalChange('wealth')}
                >
                  <div className="goal-icon">💰</div>
                  <div>
                    <h4 className="goal-name">Wealth Building</h4>
                    <p className="goal-description">Grow your wealth over time</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="timeframe-column">
              <div className="time-horizon-container">
                <label className="form-label">What is your time horizon?</label>
                <select 
                  className="form-select" 
                  name="timeHorizon" 
                  value={formData.timeHorizon}
                  onChange={handleTimeHorizonChange}
                >
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="5">5 years</option>
                  <option value="7">7 years</option>
                  <option value="10">10 years</option>
                  <option value="15">15 years</option>
                  <option value="20">20+ years</option>
                </select>
              </div>

              <div className="risk-container">
                <label className="form-label">What is your risk tolerance?</label>
                <div className="risk-options">
                  <div 
                    className={`risk-option ${formData.riskTolerance === 'low' ? 'risk-low-selected' : ''}`}
                    onClick={() => handleRiskToleranceChange('low')}
                  >
                    <h4 className="risk-level-name">Low</h4>
                    <p className="risk-level-description">Protect capital, modest returns</p>
                  </div>
                  <div 
                    className={`risk-option ${formData.riskTolerance === 'medium' ? 'risk-medium-selected' : ''}`}
                    onClick={() => handleRiskToleranceChange('medium')}
                  >
                    <h4 className="risk-level-name">Medium</h4>
                    <p className="risk-level-description">Balanced approach, moderate risk</p>
                  </div>
                  <div 
                    className={`risk-option ${formData.riskTolerance === 'high' ? 'risk-high-selected' : ''}`}
                    onClick={() => handleRiskToleranceChange('high')}
                  >
                    <h4 className="risk-level-name">High</h4>
                    <p className="risk-level-description">Growth focus, higher volatility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="savings-grid">
            <div className="savings-amount-container">
              <label className="form-label">How much are you planning to invest?</label>
              <input 
                type="number" 
                className="form-input" 
                name="savingsAmount" 
                value={formData.savingsAmount}
                onChange={handleInputChange}
                min="1000"
                placeholder="Enter amount"
              />
            </div>
            <div className="currency-container">
              <label className="form-label">Currency</label>
              <select 
                className="form-select"
                name="currency"
                value={formData.currency}
                onChange={handleCurrencyChange}
              >
                <option value="usd">GBP</option>
                <option value="eur">USD</option>
                <option value="gbp">EUR</option>
                <option value="jpy">JPY</option>
                <option value="cad">CAD</option>
                <option value="inr">INR</option>
              </select>
            </div>
          </div>

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Generating Recommendations...' : 'Get Recommendations'}
          </button>
        </form>
      ): (
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">Your Investment Recommendations</h2>
            <div className="results-buttons">
              <button className="reset-button" onClick={handleReset}>
                <span>← Start Over</span>
              </button>
              <button className="print-button">
                <span>Save PDF</span>
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <h3 className="card-title">Investment Summary</h3>
              <p className="summary-text">
                <span className="bold-text">Investment Amount:</span> ₹{formData.savingsAmount.toLocaleString()}
              </p>
              <p className="summary-text">
                <span className="bold-text">Investment Goal:</span>{' '}
                <span className="medium-text capitalize">{formData.investmentGoal}</span>
              </p>
              <p className="summary-text">
                <span className="bold-text">Time Horizon:</span>{' '}
                <span className="medium-text">{formData.timeHorizon} years</span>
              </p>
              <p className="summary-text">
                <span className="bold-text">Risk Tolerance:</span>{' '}
                <span className="medium-text capitalize">{formData.riskTolerance}</span>
              </p>
              {isCustomizing && (
                <div className="custom-allocation-badge">Custom Allocation</div>
              )}
              <div className="disclaimer-text">
                Recommendations are based on your inputs and current market conditions.
              </div>
            </div>

            <div className="summary-card">
              <h3 className="card-title returns-title">Projected Returns</h3>
              <p className="summary-text">
                <span className="bold-text">Estimated Annual Return:</span>{' '}
                <span className="growth-text">7.5% - 10.2%</span>
              </p>
              <p className="summary-text">
                <span className="bold-text">Projected Balance in {formData.timeHorizon} years:</span>{' '}
                <span className="growth-text">
                ₹{Math.round(formData.savingsAmount * Math.pow(1.085, formData.timeHorizon)).toLocaleString()}
                </span>
              </p>
              <p className="summary-text">
                <span className="bold-text">Projected Growth:</span>{' '}
                <span className="growth-text">
                ₹{Math.round(formData.savingsAmount * Math.pow(1.085, formData.timeHorizon) - formData.savingsAmount).toLocaleString()}
                </span>
              </p><div className="market-info-container">
                <h3 className="card-title">Market Information</h3>
                {marketData ? (
                  <div className="market-info">
                    <p className="summary-text">
                      <span className="bold-text">S&P 500 Price:</span>{' '}
                      <span className="medium-text">₹{parseFloat(marketData['Global Quote']?.['05. price'] || '0').toFixed(2)}</span>
                    </p>
                    <p className="summary-text">
                      <span className="bold-text">Daily Change:</span>{' '}
                      <span className={`${parseFloat(marketData['Global Quote']?.['09. change'] || '0') >= 0 ? 'growth-text' : 'loss-text'}`}>
                        {parseFloat(marketData['Global Quote']?.['10. change percent'] || '0').toFixed(2)}%
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="summary-text muted-text">Market data unavailable</p>
                )}

                {bondYields ? (
                  <div className="bond-info">
                    <p className="summary-text">
                     

                    </p>
                  </div>
                ) : (
                  <p className="summary-text muted-text">Bond data unavailable</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-alert">
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="recommendations-container">
            <div className="recommendation-header">
              <h3 className="section-title">Asset Allocation</h3>
              {!isCustomizing ? (
                <button className="customize-button" onClick={() => setIsCustomizing(true)}>Customize Allocation</button>
              ) : (
                <div className="allocation-actions">
                  <button className="apply-button" onClick={applyCustomAllocations}>Apply Changes</button>
                  <button className="cancel-button" onClick={() => setIsCustomizing(false)}>Cancel</button>
                </div>
              )}
            </div>

            <div className="recommendations-grid">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-card">
                  <div className="recommendation-header">
                    <h4 className="asset-class">{recommendation.assetClass}</h4>
                    <div className={`trend-badge trend-${getTrendIndicator(recommendation.assetClass).trend}`}>
                      {getTrendIndicator(recommendation.assetClass).label}
                    </div>
                  </div>

                  <div className="allocation-container">
                    {isCustomizing ? (
                      <div className="allocation-slider-container">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={customAllocations[recommendation.assetClass] || recommendation.allocation}
                          onChange={(e) => handleAllocationChange(recommendation.assetClass, parseInt(e.target.value))}
                          className="allocation-slider"
                        />
                        <div className="allocation-value">
                          {customAllocations[recommendation.assetClass] || recommendation.allocation}%
                        </div>
                      </div>
                    ) : (
                      <div className="allocation-bar-container">
                        <div 
                          className="allocation-bar" 
                          style={{ width: `${recommendation.allocation}%` }}
                        ></div>
                        <div className="allocation-value">{recommendation.allocation}%</div>
                      </div>
                    )}
                  </div>

                  <div className="investment-amount">
                  ₹{calculateAmount(recommendation.allocation).toLocaleString()}
                  </div>

                  <div className="expected-return">
                    <span className="return-label">Expected Return:</span>
                    <span className="return-value">{recommendation.expectedReturn}</span>
                  </div>

                  <p className="recommendation-description">{recommendation.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="additional-info">
            <h3 className="section-title">Investment Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <h4 className="insight-title">Risk Assessment</h4>
                <p className="insight-text">
                  Your {formData.riskTolerance} risk portfolio is designed to balance potential returns with market volatility. 
                  {formData.riskTolerance === 'low' && 'This conservative approach prioritizes capital preservation over aggressive growth.'}
                  {formData.riskTolerance === 'medium' && 'This balanced approach aims for steady growth while managing downside risk.'}
                  {formData.riskTolerance === 'high' && 'This growth-oriented approach accepts higher volatility for potentially greater returns.'}
                </p>
              </div>
              <div className="insight-card">
                <h4 className="insight-title">Goal Timeline</h4>
                <p className="insight-text">
                  Your {formData.timeHorizon}-year investment horizon for {formData.investmentGoal === 'wealth' ? 'wealth building' : formData.investmentGoal} 
                  allows for {formData.timeHorizon < 5 ? 'shorter-term strategies focused on stability' : 'longer-term strategies that can weather market cycles'}. 
                  We&apos;ve aligned asset allocations with this timeframe.
                </p>
              </div>
              <div className="insight-card">
                <h4 className="insight-title">Diversification Benefits</h4>
                <p className="insight-text">
                  Your portfolio spreads investments across {recommendations.length} different asset classes, 
                  reducing risk through diversification. This structure helps protect against sector-specific downturns.
                </p>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h3 className="section-title">Next Steps</h3>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4 className="step-title">Review Your Plan</h4>
                  <p className="step-text">
                    Take time to review the recommended allocations and adjust if needed using the customize option.
                  </p>
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4 className="step-title">Open Investment Accounts</h4>
                  <p className="step-text">
                    Set up brokerage accounts if you don&apos;t already have them. Consider tax-advantaged accounts when applicable.
                  </p>
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4 className="step-title">Implement & Monitor</h4>
                  <p className="step-text">
                    Make investments according to your plan and schedule regular reviews to rebalance as needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="disclaimer-section">
            <p className="disclaimer-heading">Important Disclaimer</p>
            <p className="disclaimer-text">
              This tool provides general investment recommendations based on the information you provided and current market data. 
              These recommendations should not be considered financial advice. Past performance is not indicative of future results. 
              Consider consulting with a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentAdvisor;