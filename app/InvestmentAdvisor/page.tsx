'use client';

import React, { useState } from 'react';
import { motion} from 'framer-motion';
import {
  Scan,
  Mic,
  MessageCircle,
  Sparkles,
 } from 'lucide-react';
import {
  InvestmentFormData,
  Recommendation,
  generateInvestmentRecommendations,
  getCurrencySymbol,
  formatCurrency
} from '@/app/InvestmentAdvisor/InvestmentAPI/InvestmentApi';
import "@/app/styles/Investment.css"

const InvestmentAdvisor: React.FC = () => {
  const [formData, setFormData] = useState<InvestmentFormData>({
    savingsAmount: 10000,
    timeHorizon: 5,
    riskTolerance: 'medium',
    investmentGoal: 'wealth',
    currency: 'inr'
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});
  const [marketData, setMarketData] = useState<any>(null);
  const [bondYields, setBondYields] = useState<any>(null);
  const [indianMarketData, setIndianMarketData] = useState<any>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'savingsAmount' ? parseFloat(value) : value
    });
  };

  const handleRiskToleranceChange = (risk: string) => {
    setFormData({
      ...formData,
      riskTolerance: risk
    });
  };

  const handleGoalChange = (goal: string) => {
    setFormData({
      ...formData,
      investmentGoal: goal
    });
  };

  const handleTimeHorizonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      timeHorizon: parseInt(e.target.value)
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      currency: e.target.value
    });
    setCurrencySymbol(getCurrencySymbol(e.target.value));
  };

  const handleAllocationChange = (assetClass: string, value: number) => {
    setCustomAllocations({
      ...customAllocations,
      [assetClass]: value
    });
  };

  const applyCustomAllocations = () => {
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
        setIndianMarketData(result.indianMarketData);
        setCurrencySymbol(result.currencySymbol);
      } else {
        setRecommendations(result.recommendations);
        setCurrencySymbol(result.currencySymbol);
        setError(result.error || null);
      }
      
      setHasResults(true);
      
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
    setCurrencySymbol('₹');
    setError(null);
  };

  const calculateAmount = (allocation: number) => {
    return (formData.savingsAmount * allocation) / 100;
  };

  const displayCurrency = (amount: number) => {
    return formatCurrency(amount, formData.currency);
  };

  const getTrendIndicator = (assetClass: string): { trend: string, label: string } => {
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

  // Generate particles for background animation
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3
  }));

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }),
    hover: {
      scale: 1.03,
      y: -10,
      boxShadow: "0 25px 35px -5px rgba(50, 205, 50, 0.25)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
      {/* Header */}
      <motion.div 
        className="relative h-[500px] w-full bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute bg-white/20 rounded-full backdrop-blur-sm"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 6 + particle.id * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col px-8 py-8">
          {/* Navigation */}
          <motion.nav 
            className="flex items-center justify-between w-full"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="w-14 h-14 bg-[#1a2332] rounded-2xl flex items-center justify-center shadow-2xl"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative">
                  <motion.div 
                    className="text-xl font-bold text-white"
                    animate={{ textShadow: ["0 0 0px #7FFF00", "0 0 10px #7FFF00", "0 0 0px #7FFF00"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    S
                  </motion.div>
                  <motion.div 
                    className="absolute -right-1 top-1 w-2 h-2 bg-[#7FFF00] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div 
                    className="absolute -right-1 top-3 w-2 h-2 bg-[#32CD32] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                  <motion.div 
                    className="absolute -right-1 top-5 w-2 h-2 bg-[#9AFF9A] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                  />
                </div>
              </motion.div>
              <div>
                <motion.div 
                  className="text-2xl font-bold text-[#1a2332]"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  SAMADHAN
                </motion.div>
                <motion.div 
                  className="text-[#1a2332]/80 font-medium text-sm"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Investment Advisor
                </motion.div>
              </div>
            </motion.div>
          </motion.nav>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1a2332]"
                animate={{ 
                  textShadow: ["0 0 0px rgba(26, 35, 50, 0.3)", "0 5px 10px rgba(26, 35, 50, 0.3)", "0 0 0px rgba(26, 35, 50, 0.3)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Smart Investment Advisor
              </motion.h1>
              <motion.p 
                className="text-xl text-[#1a2332]/80 mb-8 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Personalized investment recommendations based on your financial goals and risk tolerance
              </motion.p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {!hasResults ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-[#7FFF00]/20"
            >
              <p className="text-[#1a2332]/70 mb-8 text-center text-lg">
                Welcome to the Smart Investment Advisor. Answer a few questions about your financial goals,
                risk tolerance, and investment horizon to receive personalized investment recommendations.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1a2332] mb-4">What is your investment goal?</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.investmentGoal === 'retirement' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                        onClick={() => handleGoalChange('retirement')}
                      >
                        <div className="text-2xl mb-2">🏖️</div>
                        <h4 className="font-medium text-[#1a2332]">Retirement</h4>
                        <p className="text-sm text-[#1a2332]/70">Plan for your future retirement needs</p>
                      </div>
                      <div 
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.investmentGoal === 'education' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                        onClick={() => handleGoalChange('education')}
                      >
                        <div className="text-2xl mb-2">🎓</div>
                        <h4 className="font-medium text-[#1a2332]">Education</h4>
                        <p className="text-sm text-[#1a2332]/70">Save for education expenses</p>
                      </div>
                      <div 
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.investmentGoal === 'house' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                        onClick={() => handleGoalChange('house')}
                      >
                        <div className="text-2xl mb-2">🏠</div>
                        <h4 className="font-medium text-[#1a2332]">House Purchase</h4>
                        <p className="text-sm text-[#1a2332]/70">Save for a down payment on a house</p>
                      </div>
                      <div 
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.investmentGoal === 'wealth' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                        onClick={() => handleGoalChange('wealth')}
                      >
                        <div className="text-2xl mb-2">💰</div>
                        <h4 className="font-medium text-[#1a2332]">Wealth Building</h4>
                        <p className="text-sm text-[#1a2332]/70">Grow your wealth over time</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-6">
                      <label className="block text-lg font-medium text-[#1a2332] mb-2">What is your time horizon?</label>
                      <select 
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] bg-white"
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

                    <div>
                      <label className="block text-lg font-medium text-[#1a2332] mb-2">What is your risk tolerance?</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div 
                          className={`p-3 rounded-xl border-2 cursor-pointer text-center ${formData.riskTolerance === 'low' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                          onClick={() => handleRiskToleranceChange('low')}
                        >
                          <h4 className="font-medium text-[#1a2332]">Low</h4>
                          <p className="text-xs text-[#1a2332]/70">Protect capital</p>
                        </div>
                        <div 
                          className={`p-3 rounded-xl border-2 cursor-pointer text-center ${formData.riskTolerance === 'medium' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                          onClick={() => handleRiskToleranceChange('medium')}
                        >
                          <h4 className="font-medium text-[#1a2332]">Medium</h4>
                          <p className="text-xs text-[#1a2332]/70">Balanced approach</p>
                        </div>
                        <div 
                          className={`p-3 rounded-xl border-2 cursor-pointer text-center ${formData.riskTolerance === 'high' ? 'border-[#32CD32] bg-[#32CD32]/10' : 'border-gray-200 hover:border-[#32CD32]/50'}`}
                          onClick={() => handleRiskToleranceChange('high')}
                        >
                          <h4 className="font-medium text-[#1a2332]">High</h4>
                          <p className="text-xs text-[#1a2332]/70">Growth focus</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-lg font-medium text-[#1a2332] mb-2">How much are you planning to invest?</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-[#1a2332]/70">{currencySymbol}</span>
                      <input 
                        type="number" 
                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] bg-white"
                        name="savingsAmount" 
                        value={formData.savingsAmount}
                        onChange={handleInputChange}
                        min="1000"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-lg font-medium text-[#1a2332] mb-2">Currency</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] bg-white"
                      name="currency"
                      value={formData.currency}
                      onChange={handleCurrencyChange}
                    >
                      <option value="gbp">GBP</option>
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="jpy">JPY</option>
                      <option value="cad">CAD</option>
                      <option value="inr">INR</option>
                    </select>
                  </div>
                </div>

                <div className="text-center">
                  <motion.button 
                    type="submit" 
                    disabled={loading}
                    className={`px-8 py-3 rounded-full text-white font-medium ${loading ? 'bg-[#32CD32]/80' : 'bg-[#32CD32] hover:bg-[#2DB82D]'} transition-colors shadow-lg`}
                    whileHover={!loading ? { scale: 1.05 } : {}}
                    whileTap={!loading ? { scale: 0.95 } : {}}
                  >
                    {loading ? 'Generating Recommendations...' : 'Get Recommendations'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#7FFF00]/20"
            >
              <div className="p-6 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] flex justify-between items-center">
                <h2 className="text-2xl font-bold">Your Investment Recommendations</h2>
                <div className="flex space-x-3">
                  <motion.button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-white text-[#1a2332] rounded-xl font-medium hover:bg-[#1a2332]/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ← Start Over
                  </motion.button>
                  <motion.button 
                    className="px-4 py-2 bg-[#1a2332] text-white rounded-xl font-medium hover:bg-[#1a2332]/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Save PDF
                  </motion.button>
                </div>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#7FFF00]/10 to-[#32CD32]/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#1a2332] mb-4">Investment Summary</h3>
                  <div className="space-y-3">
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Investment Amount:</span> {currencySymbol}{formData.savingsAmount.toLocaleString()}
                    </p>
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Investment Goal:</span>{' '}
                      <span className="capitalize">{formData.investmentGoal}</span>
                    </p>
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Time Horizon:</span>{' '}
                      <span>{formData.timeHorizon} years</span>
                    </p>
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Risk Tolerance:</span>{' '}
                      <span className="capitalize">{formData.riskTolerance}</span>
                    </p>
                    {isCustomizing && (
                      <span className="inline-block px-2 py-1 bg-[#32CD32]/20 text-[#1a2332] text-xs font-medium rounded">
                        Custom Allocation
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-[#1a2332]/70">
                    Recommendations are based on your inputs and current market conditions.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#7FFF00]/10 to-[#32CD32]/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-[#1a2332] mb-4">Projected Returns</h3>
                  <div className="space-y-3">
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Estimated Annual Return:</span>{' '}
                      <span className="text-[#32CD32]">7.5% - 10.2%</span>
                    </p>
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Projected Balance in {formData.timeHorizon} years:</span>{' '}
                      <span className="text-[#32CD32]">
                        {currencySymbol}{Math.round(formData.savingsAmount * Math.pow(1.085, formData.timeHorizon)).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-[#1a2332]">
                      <span className="font-medium">Projected Growth:</span>{' '}
                      <span className="text-[#32CD32]">
                        {currencySymbol}{Math.round(formData.savingsAmount * Math.pow(1.085, formData.timeHorizon) - formData.savingsAmount).toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-[#1a2332] mb-4">Market Information</h3>
                    {marketData ? (
                      <div className="space-y-2">
                        <p className="text-[#1a2332]">
                          <span className="font-medium">S&P 500 Price:</span>{' '}
                          <span>{currencySymbol}{parseFloat(marketData['Global Quote']?.['05. price'] || '0').toFixed(2)}</span>
                        </p>
                        <p className="text-[#1a2332]">
                          <span className="font-medium">Daily Change:</span>{' '}
                          <span className={`${parseFloat(marketData['Global Quote']?.['09. change'] || '0') >= 0 ? 'text-[#32CD32]' : 'text-red-600'}`}>
                            {parseFloat(marketData['Global Quote']?.['10. change percent'] || '0').toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#1a2332]/70">Market data unavailable</p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mx-6 mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              <div className="px-6 pb-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-[#1a2332]">Asset Allocation</h3>
                  {!isCustomizing ? (
                    <motion.button 
                      onClick={() => setIsCustomizing(true)}
                      className="px-4 py-2 bg-[#32CD32] text-white rounded-xl hover:bg-[#2DB82D] transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Customize Allocation
                    </motion.button>
                  ) : (
                    <div className="flex space-x-3">
                      <motion.button 
                        onClick={applyCustomAllocations}
                        className="px-4 py-2 bg-[#32CD32] text-white rounded-xl hover:bg-[#2DB82D] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Apply Changes
                      </motion.button>
                      <motion.button 
                        onClick={() => setIsCustomizing(false)}
                        className="px-4 py-2 bg-gray-200 text-[#1a2332] rounded-xl hover:bg-gray-300 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((recommendation, index) => (
                    <motion.div 
                      key={index}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      className="border border-[#7FFF00]/30 rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-[#1a2332]">{recommendation.assetClass}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          getTrendIndicator(recommendation.assetClass).trend === 'up' ? 'bg-[#32CD32]/20 text-[#32CD32]' :
                          getTrendIndicator(recommendation.assetClass).trend === 'down' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getTrendIndicator(recommendation.assetClass).label}
                        </span>
                      </div>

                      {isCustomizing ? (
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-[#1a2332]/70">Allocation</span>
                            <span className="text-sm font-medium text-[#32CD32]">
                              {customAllocations[recommendation.assetClass] || recommendation.allocation}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={customAllocations[recommendation.assetClass] || recommendation.allocation}
                            onChange={(e) => handleAllocationChange(recommendation.assetClass, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-[#1a2332]/70">Allocation</span>
                            <span className="text-sm font-medium text-[#32CD32]">{recommendation.allocation}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-[#32CD32] h-2.5 rounded-full" 
                              style={{ width: `${recommendation.allocation}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-sm text-[#1a2332]/70">
                          <span className="font-medium">Amount:</span> {currencySymbol}{calculateAmount(recommendation.allocation).toLocaleString()}
                        </p>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-[#1a2332]/70">
                          <span className="font-medium">Expected Return:</span> {recommendation.expectedReturn}
                        </p>
                      </div>

                      <p className="text-sm text-[#1a2332]/50">{recommendation.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                <h3 className="text-xl font-semibold text-[#1a2332] mb-6">Investment Insights</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-[#7FFF00]/10 p-5 rounded-xl">
                    <h4 className="font-medium text-[#1a2332] mb-2">Risk Assessment</h4>
                    <p className="text-sm text-[#1a2332]/70">
                      Your {formData.riskTolerance} risk portfolio is designed to balance potential returns with market volatility. 
                      {formData.riskTolerance === 'low' && ' This conservative approach prioritizes capital preservation over aggressive growth.'}
                      {formData.riskTolerance === 'medium' && ' This balanced approach aims for steady growth while managing downside risk.'}
                      {formData.riskTolerance === 'high' && ' This growth-oriented approach accepts higher volatility for potentially greater returns.'}
                    </p>
                  </div>
                  <div className="bg-[#32CD32]/10 p-5 rounded-xl">
                    <h4 className="font-medium text-[#1a2332] mb-2">Goal Timeline</h4>
                    <p className="text-sm text-[#1a2332]/70">
                      Your {formData.timeHorizon}-year investment horizon for {formData.investmentGoal === 'wealth' ? 'wealth building' : formData.investmentGoal} 
                      allows for {formData.timeHorizon < 5 ? 'shorter-term strategies focused on stability' : 'longer-term strategies that can weather market cycles'}. 
                      We've aligned asset allocations with this timeframe.
                    </p>
                  </div>
                  <div className="bg-[#9AFF9A]/10 p-5 rounded-xl">
                    <h4 className="font-medium text-[#1a2332] mb-2">Diversification Benefits</h4>
                    <p className="text-sm text-[#1a2332]/70">
                      Your portfolio spreads investments across {recommendations.length} different asset classes, 
                      reducing risk through diversification. This structure helps protect against sector-specific downturns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <h3 className="text-xl font-semibold text-[#1a2332] mb-6">Next Steps</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start">
                    <div className="bg-[#32CD32]/20 text-[#1a2332] rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      1
                    </div>
                    <div>
                                           <h4 className="font-medium text-[#1a2332] mb-1">Review Your Plan</h4>
                      <p className="text-sm text-[#1a2332]/70">
                        Take time to understand each recommended asset class and how they work together in your portfolio.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#32CD32]/20 text-[#1a2332] rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-[#1a2332] mb-1">Implement Strategy</h4>
                      <p className="text-sm text-[#1a2332]/70">
                        Open investment accounts with reputable brokers or platforms to begin building your portfolio.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#32CD32]/20 text-[#1a2332] rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-[#1a2332] mb-1">Monitor & Rebalance</h4>
                      <p className="text-sm text-[#1a2332]/70">
                        Review your portfolio quarterly and rebalance annually to maintain your target allocations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="bg-[#1a2332]/5 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-[#1a2332] mb-4">Need Help?</h3>
                  <p className="text-[#1a2332]/70 mb-4">
                    Our team of financial advisors is available to help you implement this plan or answer any questions.
                  </p>
                  <motion.button 
                    className="px-6 py-3 bg-[#32CD32] text-white rounded-xl font-medium hover:bg-[#2DB82D] transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Schedule a Consultation
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a2332] text-white py-12">
        <div className="container mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <motion.div 
                  className="w-10 h-10 bg-[#32CD32] rounded-xl flex items-center justify-center mr-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={20} />
                </motion.div>
                SAMADHAN
              </h3>
              <p className="text-[#ffffff]/70 text-sm">
                Smart investment solutions tailored to your financial goals and risk tolerance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Investment Guides</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Market Research</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Financial Calculators</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">About Us</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Careers</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-[#ffffff]/70 hover:text-[#32CD32] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Connect</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="w-10 h-10 bg-[#ffffff]/10 rounded-full flex items-center justify-center hover:bg-[#32CD32] transition-colors">
                  <MessageCircle size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-[#ffffff]/10 rounded-full flex items-center justify-center hover:bg-[#32CD32] transition-colors">
                  <Mic size={18} />
                </a>
                <a href="#" className="w-10 h-10 bg-[#ffffff]/10 rounded-full flex items-center justify-center hover:bg-[#32CD32] transition-colors">
                  <Scan size={18} />
                </a>
              </div>
              <p className="text-[#ffffff]/70 text-sm">
                support@samadhaninvest.com<br />
            
            </p>
            </div>
          </div>
          <div className="border-t border-[#ffffff]/10 mt-8 pt-8 text-center text-[#ffffff]/50 text-sm">
            © {new Date().getFullYear()} Samadhan Investment Advisor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InvestmentAdvisor;