"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Eye, EyeOff, Send, TrendingUp, Target, PieChart,
  Bell, Settings, ArrowUpRight, ChevronRight, Zap,
  MessageCircle, HelpCircle, Wallet, ShoppingBag,
  Smartphone, Briefcase, Coffee, Car, Scan, Mic, Sparkles, Shield, Activity
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
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
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
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
      {/* Animated Background Elements */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
      )}

      {/* Header */}
      <motion.header 
        className="relative h-[200px] w-full bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Enhanced gradient overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/30 via-transparent to-[#1a2332]/20 z-0"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

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
              {/* Samadhan Logo */}
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
                  AI Banking Platform
                </motion.div>
              </div>
            </motion.div>
            
            {/* User Profile */}
            <div className="flex items-center gap-4">
              <motion.button
                className="relative p-3 rounded-2xl bg-white/70 hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Bell className="w-5 h-5 text-[#1a2332]" />
              </motion.button>
              
              <motion.div 
                className="flex items-center gap-2 bg-white/70 rounded-2xl px-4 py-2 shadow-lg backdrop-blur-sm border border-[#32CD32]/20"
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                transition={{ duration: 0.15 }}
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-[#32CD32] shadow-md"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                  transition={{ duration: 0.15 }}
                />
                <div className="hidden sm:block">
                  <div className="font-bold text-[#1a2332] text-sm">Rohit Sharma</div>
                  <div className="text-[#32CD32] text-xs font-medium">
                    Premium Member
                  </div>
                </div>
              </motion.div>

              <motion.button
                className="p-3 rounded-2xl bg-white/70 hover:bg-white/90 transition-colors shadow-lg backdrop-blur-sm"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Settings className="w-5 h-5 text-[#1a2332]" />
              </motion.button>
            </div>
          </motion.nav>

          {/* Welcome Section */}
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-center text-[#1a2332]"
              animate={{ 
                textShadow: ["0 0 0px rgba(26, 35, 50, 0.3)", "0 5px 10px rgba(26, 35, 50, 0.3)", "0 0 0px rgba(26, 35, 50, 0.3)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Welcome to Your Dashboard
            </motion.h1>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-8 py-12 -mt-16">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Main Balance Card */}
          <motion.div
            className="md:col-span-2 relative"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] rounded-3xl p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                <div>
                  <h3 className="text-[#1a2332]/80 text-lg font-medium mb-3">
                    Total Balance
                  </h3>
                  <div className="flex items-center gap-6">
                    <motion.div 
                      className="text-5xl font-bold text-[#1a2332]"
                      {...(showBalance && !shouldReduceMotion ? gentlePulse : {})}
                    >
                      {showBalance ? '₹3,78,116.19' : '••••••••'}
                    </motion.div>
                    <motion.button
                      onClick={toggleBalance}
                      className="p-3 rounded-2xl bg-[#1a2332]/20 hover:bg-[#1a2332]/30 transition-colors backdrop-blur-sm"
                      whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showBalance ? <EyeOff className="w-6 h-6 text-[#1a2332]" /> : <Eye className="w-6 h-6 text-[#1a2332]" />}
                    </motion.button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#1a2332]/80 text-sm mb-2">This Month</div>
                  <div className="flex items-center gap-2 text-[#1a2332] font-bold text-lg">
                    <ArrowUpRight className="w-5 h-5" />
                    +12.5%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-white/25 rounded-3xl p-6 backdrop-blur-sm border border-white/20 shadow-lg"
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-6 h-6 text-[#1a2332]" />
                    <span className="text-[#1a2332]/80 font-medium text-base">Savings</span>
                  </div>
                  <div className="text-3xl font-bold text-[#1a2332]">
                    ₹2,45,330
                  </div>
                </motion.div>
                <motion.div 
                  className="bg-white/25 rounded-3xl p-6 backdrop-blur-sm border border-white/20 shadow-lg"
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-[#1a2332]" />
                    <span className="text-[#1a2332]/80 font-medium text-base">Investments</span>
                  </div>
                  <div className="text-3xl font-bold text-[#1a2332]">
                    ₹1,32,786
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Monthly Overview */}
          <motion.div
            className="bg-white/85 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[#32CD32]/30"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-[#1a2332]">
                Monthly Overview
              </h3>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20 backdrop-blur-sm">
                <PieChart className="w-6 h-6 text-[#32CD32]" />
              </div>
            </div>
            
            <div className="space-y-6">
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`} />
                      <span className="text-[#1a2332]/80 font-medium text-base">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#1a2332] text-lg">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2332] mb-8">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                className="group relative bg-white/85 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-[#32CD32]/30 hover:border-[#32CD32]/60 transition-all duration-300"
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate={animateCards ? "visible" : "hidden"}
                whileHover="hover"
                onClick={action.onClick}
              >
                <div className="text-center">
                  <motion.div 
                    className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${action.color} flex items-center justify-center shadow-lg`}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <action.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-[#1a2332] mb-3">
                    {action.title}
                  </h3>
                  
                  <p className="text-[#1a2332]/70 text-lg mb-6">
                    {action.description}
                  </p>
                  
                  <motion.div 
                    className="inline-flex items-center gap-2 text-[#32CD32] font-bold text-base"
                    whileHover={shouldReduceMotion ? {} : { x: 3 }}
                    transition={{ duration: 0.15 }}
                  >
                    Explore Now <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          className="bg-white/85 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-[#32CD32]/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-3xl font-bold text-[#1a2332]">
              Recent Transactions
            </h3>
            
            <motion.button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-base"
              whileHover={shouldReduceMotion ? {} : { y: -1 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Send className="w-5 h-5" />
              Filter
            </motion.button>
          </div>
          
          <div className="space-y-6">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white/50 rounded-3xl border border-[#32CD32]/20 hover:border-[#32CD32]/40 transition-colors hover:shadow-lg backdrop-blur-sm gap-4 sm:gap-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.05, duration: 0.4 }}
                whileHover={shouldReduceMotion ? {} : { x: 2 }}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${transaction.color} flex items-center justify-center shadow-lg`}>
                    <transaction.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-[#1a2332] text-lg md:text-xl mb-1">
                      {transaction.merchant}
                    </h4>
                    <div className="flex items-center gap-4 text-[#1a2332]/70 text-sm">
                      <span className="font-medium">{transaction.category}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`font-bold text-xl md:text-2xl ${transaction.amount > 0 ? 'text-[#32CD32]' : 'text-[#FF4444]'}`}>
                  {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col gap-6 z-50">
        {/* Chatbot Widget Button */}
        <motion.button 
          onClick={toggleChat}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#00A8FF] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-[#80F8FF]/30 backdrop-blur-lg"
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          {...(!shouldReduceMotion ? subtleFloat : {})}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </motion.button>

        {/* Support Widget Button */}
        <motion.button 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B026FF] to-[#D041FF] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-[#E366FF]/30 backdrop-blur-lg"
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={handleSupportClick}
        >
          <HelpCircle className="w-8 h-8 text-white" />
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