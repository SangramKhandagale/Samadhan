"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Eye, EyeOff, Send, TrendingUp, Target, PieChart,
  Bell, Settings, ArrowUpRight, ChevronRight, Zap,
  MessageCircle, HelpCircle, Wallet, ShoppingBag,
  Smartphone, Briefcase, Coffee, Car
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import "@/app/styles/Userboard.css";

// Dynamically import the ChatbotWidget to reduce initial bundle size
const ChatbotWidget = dynamic(() => import('@/app/UserDashboard/Chatbot/Chatbot'), {
  ssr: false,
  loading: () => <div className="w-full sm:w-96 h-[500px] bg-gray-100 rounded-3xl"></div>
});

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animateCards, setAnimateCards] = useState(false);
  const router = useRouter();
  
  // Respect user's motion preferences
  const shouldReduceMotion = useReducedMotion();

  // Optimized particle data - reduced count and complexity
  const particles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2
    })), []);

  // Memoized transactions data
  const transactions = useMemo(() => [
    {
      id: 1,
      merchant: 'Amazon Prime',
      amount: -24788.34,
      category: 'Shopping',
      date: '2025-06-20 14:30',
      icon: ShoppingBag,
      status: 'completed',
      color: 'from-orange-400 to-orange-600'
    },
    {
      id: 2,
      merchant: 'Netflix Subscription',
      amount: -1320.67,
      category: 'Entertainment',
      date: '2025-06-19 09:45',
      icon: Smartphone,
      status: 'completed',
      color: 'from-red-400 to-red-600'
    },
    {
      id: 3,
      merchant: 'Salary Deposit - TechCorp',
      amount: 413125.00,
      category: 'Income',
      date: '2025-06-18 00:00',
      icon: Briefcase,
      status: 'completed',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 4,
      merchant: 'Starbucks Coffee',
      amount: -557.69,
      category: 'Food & Drinks',
      date: '2025-06-17 08:15',
      icon: Coffee,
      status: 'completed',
      color: 'from-amber-400 to-amber-600'
    },
    {
      id: 5,
      merchant: 'Uber Ride',
      amount: -1250.30,
      category: 'Transport',
      date: '2025-06-16 16:20',
      icon: Car,
      status: 'completed',
      color: 'from-blue-400 to-blue-600'
    }
  ], []);

  // Optimized quick actions with redirect handlers
  const quickActions = useMemo(() => [
    { 
      id: 1, 
      title: 'Money Transfer', 
      icon: Send, 
      color: 'from-[#7FFF00] to-[#32CD32]',
      description: 'Send money instantly',
      onClick: () => router.push('/transfer')
    },
    { 
      id: 2, 
      title: 'Investment', 
      icon: TrendingUp, 
      color: 'from-[#32CD32] to-[#9AFF9A]',
      description: 'Grow your wealth',
      onClick: () => router.push('/InvestmentAdvisor')
    },
    { 
      id: 3, 
      title: 'Loans', 
      icon: Send, 
      color: 'from-[#9AFF9A] to-[#7FFF00]',
      description: 'Get instant loans',
      onClick: () => router.push('/Emergency')
    },
    { 
      id: 4, 
      title: 'Financial Goals', 
      icon: Target, 
      color: 'from-[#ADFF2F] to-[#32CD32]',
      description: 'Track your progress',
      onClick: () => router.push('/FinancialGoals')
    }
  ], [router]);

  // Simplified, performance-optimized animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: shouldReduceMotion ? {} : {
      y: -4,
      transition: { 
        type: "tween", 
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // Subtle animations that respect motion preferences
  const subtleFloat = shouldReduceMotion ? {} : {
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const gentlePulse = shouldReduceMotion ? {} : {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Optimized time update with reduced frequency
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10 seconds instead of every second
    const cardTimer = setTimeout(() => setAnimateCards(true), 300);
    return () => {
      clearInterval(timer);
      clearTimeout(cardTimer);
    };
  }, []);

  // Memoized handlers
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleBalance = useCallback(() => {
    setShowBalance(prev => !prev);
  }, []);

  const handleSupportClick = useCallback(() => {
    router.push('/support');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] via-[#f0fff0] to-[#e8ffe8] relative overflow-hidden">
      {/* Simplified Background Elements - Only show if motion is not reduced */}
      {!shouldReduceMotion && (
        <>
          {/* Reduced particle count and simpler animations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full bg-[#32CD32]/6"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: particle.size,
                  height: particle.size
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 8 + particle.id,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: particle.delay
                }}
              />
            ))}
          </div>

          {/* Simplified background orbs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-r from-[#7FFF00]/3 to-[#32CD32]/2 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-gradient-to-r from-[#32CD32]/2 to-[#9AFF9A]/1 rounded-full blur-3xl"
              animate={{
                scale: [1, 0.9, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </>
      )}

      {/* Header - Simplified animations */}
      <motion.header 
        className="bg-white/85 backdrop-blur-xl border-b border-[#32CD32]/20 shadow-xl relative z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2 sm:gap-4"
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              {...subtleFloat}
            >
              <motion.div 
                className="relative w-10 h-10 sm:w-14 sm:h-14 bg-[#1a2332] rounded-2xl flex items-center justify-center shadow-xl overflow-hidden"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20"></div>
                <div className="relative text-lg sm:text-xl font-bold text-white z-10">S</div>
              </motion.div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-[#1a2332]">
                  SAMADHAN
                </div>
                <div className="text-[#1a2332]/70 text-xs sm:text-sm font-medium">
                  {currentTime.toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>

            {/* User Profile - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-4 sm:gap-6">
              <motion.button
                className="relative p-3 sm:p-4 rounded-2xl bg-white/70 hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" />
              </motion.button>
              
              <motion.div 
                className="flex items-center gap-2 sm:gap-4 bg-white/70 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 shadow-lg backdrop-blur-sm border border-[#32CD32]/20"
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                transition={{ duration: 0.15 }}
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  alt="Profile"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#32CD32] shadow-md"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  transition={{ duration: 0.15 }}
                />
                <div className="hidden sm:block">
                  <div className="font-bold text-[#1a2332] text-sm sm:text-base">Rohit Sharma</div>
                  <div className="text-[#32CD32] text-xs sm:text-sm font-medium">
                    Premium Member
                  </div>
                </div>
              </motion.div>

              <motion.button
                className="p-3 sm:p-4 rounded-2xl bg-white/70 hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a2332] mb-2 sm:mb-3">
            Welcome back, Rohit! 
          </h1>
          <p className="text-[#1a2332]/70 text-base sm:text-xl">
            Here's what's happening with your finances today
          </p>
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mb-12 sm:mb-16">
          {/* Main Balance Card */}
          <motion.div
            className="md:col-span-2 relative"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
                <div>
                  <h3 className="text-[#1a2332]/80 text-lg sm:text-xl font-medium mb-2 sm:mb-3">
                    Total Balance
                  </h3>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <motion.div 
                      className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1a2332]"
                      {...(showBalance && !shouldReduceMotion ? gentlePulse : {})}
                    >
                      {showBalance ? '₹3,78,116.19' : '••••••••'}
                    </motion.div>
                    <motion.button
                      onClick={toggleBalance}
                      className="p-2 sm:p-3 rounded-2xl bg-[#1a2332]/20 hover:bg-[#1a2332]/30 transition-colors backdrop-blur-sm"
                      whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showBalance ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" />}
                    </motion.button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#1a2332]/80 text-xs sm:text-sm mb-1 sm:mb-2">This Month</div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[#1a2332] font-bold text-sm sm:text-lg">
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    +12.5%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <motion.div 
                  className="bg-white/25 rounded-3xl p-4 sm:p-6 backdrop-blur-sm border border-white/20 shadow-lg"
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" />
                    <span className="text-[#1a2332]/80 font-medium text-sm sm:text-base">Savings</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1a2332]">
                    ₹2,45,330
                  </div>
                </motion.div>
                <motion.div 
                  className="bg-white/25 rounded-3xl p-4 sm:p-6 backdrop-blur-sm border border-white/20 shadow-lg"
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a2332]" />
                    <span className="text-[#1a2332]/80 font-medium text-sm sm:text-base">Investments</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1a2332]">
                    ₹1,32,786
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Monthly Overview */}
          <motion.div
            className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-[#32CD32]/30"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1a2332]">
                Monthly Overview
              </h3>
              <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20 backdrop-blur-sm">
                <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-[#32CD32]" />
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {[
                { label: 'Income', value: '₹85,420', color: 'bg-[#32CD32]', percentage: 85 },
                { label: 'Expenses', value: '₹32,890', color: 'bg-[#FF6B6B]', percentage: 35 },
                { label: 'Savings', value: '₹52,530', color: 'bg-[#7FFF00]', percentage: 65 }
              ].map((item, index) => (
                <motion.div 
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${item.color} shadow-sm`} />
                      <span className="text-[#1a2332]/80 font-medium text-sm sm:text-base">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#1a2332] text-base sm:text-lg">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a2332] mb-6 sm:mb-8">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                className="group relative bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-[#32CD32]/30 hover:border-[#32CD32]/60 transition-all duration-300"
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate={animateCards ? "visible" : "hidden"}
                whileHover="hover"
                onClick={action.onClick}
              >
                <div className="text-center">
                  <motion.div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-3xl bg-gradient-to-r ${action.color} flex items-center justify-center shadow-lg`}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <action.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1a2332] mb-2 sm:mb-3">
                    {action.title}
                  </h3>
                  
                  <p className="text-[#1a2332]/70 text-sm sm:text-lg mb-4 sm:mb-6">
                    {action.description}
                  </p>
                  
                  <motion.div 
                    className="inline-flex items-center gap-1 sm:gap-2 text-[#32CD32] font-bold text-sm sm:text-base"
                    whileHover={shouldReduceMotion ? {} : { x: 3 }}
                    transition={{ duration: 0.15 }}
                  >
                    Explore Now <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-[#32CD32]/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1a2332]">
              Recent Transactions
            </h3>
            
            <motion.button
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
              whileHover={shouldReduceMotion ? {} : { y: -1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              Filter
            </motion.button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-white/50 rounded-3xl border border-[#32CD32]/20 hover:border-[#32CD32]/40 transition-colors hover:shadow-lg backdrop-blur-sm gap-4 sm:gap-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.05, duration: 0.4 }}
                whileHover={shouldReduceMotion ? {} : { x: 2 }}
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r ${transaction.color} flex items-center justify-center shadow-lg`}>
                    <transaction.icon className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-[#1a2332] text-base sm:text-lg md:text-xl mb-1">
                      {transaction.merchant}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-4 text-[#1a2332]/70 text-xs sm:text-sm">
                      <span className="font-medium">{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`font-bold text-lg sm:text-xl md:text-2xl ${transaction.amount > 0 ? 'text-[#32CD32]' : 'text-[#FF4444]'}`}>
                  {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-4 sm:gap-6 z-50">
        {/* Chatbot Widget Button */}
        <motion.button 
          onClick={toggleChat}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#00A8FF] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-[#80F8FF]/30 backdrop-blur-lg"
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          {...(!shouldReduceMotion ? subtleFloat : {})}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </motion.button>

        {/* Support Widget Button */}
        <motion.button 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#B026FF] to-[#D041FF] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-[#E366FF]/30 backdrop-blur-lg"
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={handleSupportClick}
        >
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </motion.button>
      </div>

      {/* Chatbot Widget */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-24 sm:bottom-32 right-4 sm:right-8 z-40 w-[calc(100%-2rem)] sm:w-96"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <ChatbotWidget onClose={closeChat} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;