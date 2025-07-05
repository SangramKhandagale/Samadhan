"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Bell, User, Settings, Plus, Minus, PiggyBank, Shield, Star, Trophy, Gift, Zap, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);
  const [streakCount, setStreakCount] = useState(12);
  const [animatingGoal, setAnimatingGoal] = useState<number | null>(null);
  
  type Priority = "high" | "medium" | "low";

  interface Milestone {
    amount: number;
    reached: boolean;
    reward: string;
  }

  interface Goal {
    id: number;
    title: string;
    target: number;
    monthly: number;
    complete: number;
    currentAmount: number;
    category: Category;
    priority: Priority;
    deadline: string;
    streak: number;
    image: string;
    isAutoContribute: boolean;
    lastContribution: string | null;
    milestones: Milestone[];
  }

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: "Dream Home",
      target: 40000000,
      monthly: 200000,
      complete: 30,
      currentAmount: 12000000,
      category: "housing",
      priority: "high",
      deadline: "2027-12-31",
      streak: 8,
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&crop=entropy&auto=format",
      isAutoContribute: true,
      lastContribution: "2024-12-15",
      milestones: [
        { amount: 10000000, reached: true, reward: "🎉 Down Payment Ready!" },
        { amount: 25000000, reached: false, reward: "🏠 Halfway There!" },
        { amount: 35000000, reached: false, reward: "🔑 Almost Home!" }
      ]
    },
    {
      id: 2,
      title: "Retirement Paradise",
      target: 150000000,
      monthly: 400000,
      complete: 40,
      currentAmount: 60000000,
      category: "retirement",
      priority: "high",
      deadline: "2045-01-01",
      streak: 15,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=entropy&auto=format",
      isAutoContribute: true,
      lastContribution: "2024-12-15",
      milestones: [
        { amount: 50000000, reached: true, reward: "🌟 First Milestone!" },
        { amount: 100000000, reached: false, reward: "🚀 Halfway to Paradise!" },
        { amount: 130000000, reached: false, reward: "🏖️ Paradise Awaits!" }
      ]
    },
    {
      id: 3,
      title: "Emergency Shield",
      target: 3000000,
      monthly: 75000,
      complete: 70,
      currentAmount: 2100000,
      category: "emergency",
      priority: "medium",
      deadline: "2025-06-30",
      streak: 6,
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=entropy&auto=format",
      isAutoContribute: false,
      lastContribution: "2024-12-10",
      milestones: [
        { amount: 1000000, reached: true, reward: "🛡️ Safety Net Active!" },
        { amount: 2000000, reached: true, reward: "⚡ Power Shield!" },
        { amount: 3000000, reached: false, reward: "🏆 Ultimate Protection!" }
      ]
    },
    {
      id: 4,
      title: "World Explorer",
      target: 5000000,
      monthly: 150000,
      complete: 15,
      currentAmount: 750000,
      category: "travel",
      priority: "low",
      deadline: "2026-12-31",
      streak: 3,
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=entropy&auto=format",
      isAutoContribute: true,
      lastContribution: "2024-12-12",
      milestones: [
        { amount: 1000000, reached: false, reward: "✈️ First Adventure!" }
      ]
    },
    // ... (rest of your goals)
  ]);

  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    monthly: '',
    category: 'savings',
    priority: 'medium',
    deadline: ''
  });

  type Category = "housing" | "retirement" | "emergency" | "travel" | "education" | "business" | "savings";

  const categoryIcons: Record<Category, string> = {
    housing: "🏠",
    retirement: "🌴",
    emergency: "🛡️",
    travel: "✈️",
    education: "📚",
    business: "💼",
    savings: "💰"
  };

  const priorityColors = {
    high: "border-red-500 bg-red-500/10",
    medium: "border-yellow-500 bg-yellow-500/10",
    low: "border-green-500 bg-green-500/10"
  };

  const handleContribute = (goalId: number, goalTitle: React.SetStateAction<string>) => {
    setSelectedGoal(goalTitle);
    setSelectedGoalId(goalId);
    setShowContributeModal(true);
  };

  const handleSubmitContribution = () => {
    if (selectedGoalId && contributionAmount) {
      const amount = parseFloat(contributionAmount);
      if (!isNaN(amount) && amount > 0) {
        setAnimatingGoal(selectedGoalId);
        
        setGoals(goals.map(goal => {
          if (goal.id === selectedGoalId) {
            const newCurrentAmount = goal.currentAmount + amount;
            const newComplete = Math.min(Math.round((newCurrentAmount / goal.target) * 100), 100);
            
            // Check for milestone achievement
            const unlockedMilestone = goal.milestones.find(
              milestone => !milestone.reached && newCurrentAmount >= milestone.amount
            );
            
            if (unlockedMilestone) {
              setAchievementUnlocked(true);
              setTimeout(() => setAchievementUnlocked(false), 3000);
            }
            
            return {
              ...goal,
              currentAmount: newCurrentAmount,
              complete: newComplete,
              lastContribution: new Date().toISOString().split('T')[0],
              streak: goal.streak + 1,
              milestones: goal.milestones.map(milestone => ({
                ...milestone,
                reached: milestone.reached || newCurrentAmount >= milestone.amount
              }))
            };
          }
          return goal;
        }));
        
        setStreakCount(prev => prev + 1);
        setTimeout(() => setAnimatingGoal(null), 1000);
      }
    }
    setShowContributeModal(false);
    setContributionAmount("");
    setSelectedGoalId(null);
  };

  const handleCreateGoal = () => {
    if (newGoal.title && newGoal.target && newGoal.monthly) {
      const goal: Goal = {
        id: Date.now(),
        title: newGoal.title,
        target: parseFloat(newGoal.target),
        monthly: parseFloat(newGoal.monthly),
        complete: 0,
        currentAmount: 0,
        category: newGoal.category as Category,
        priority: newGoal.priority as Priority,
        deadline: newGoal.deadline,
        streak: 0,
        image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop&crop=entropy&auto=format",
        isAutoContribute: false,
        lastContribution: null,
        milestones: [
          { amount: Math.round(parseFloat(newGoal.target) * 0.25), reached: false, reward: "🎯 Quarter Way!" },
          { amount: Math.round(parseFloat(newGoal.target) * 0.5), reached: false, reward: "🚀 Halfway There!" },
          { amount: Math.round(parseFloat(newGoal.target) * 0.75), reached: false, reward: "⭐ Almost There!" }
        ]
      };
      
      setGoals([...goals, goal]);
      setNewGoal({ title: '', target: '', monthly: '', category: 'savings', priority: 'medium', deadline: '' });
      setShowNewGoalModal(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return goal.complete < 100;
    if (activeTab === "completed") return goal.complete === 100;
    return true;
  });

  const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTargets = goals.reduce((sum, goal) => sum + goal.target, 0);
  const overallProgress = Math.round((totalSavings / totalTargets) * 100);

  const quickStats = [
    { 
      title: "Total Portfolio", 
      value: `₹${totalSavings.toLocaleString()}`, 
      change: "+12.5%", 
      icon: Wallet, 
      color: "text-blue-500",
      trend: "up"
    },
    { 
      title: "Monthly Income", 
      value: "₹180,000", 
      change: "Next in 12 days", 
      icon: TrendingUp, 
      color: "text-green-500",
      trend: "up"
    },
    { 
      title: "Monthly Expenses", 
      value: "₹85,000", 
      change: "-5.2%", 
      icon: CreditCard, 
      color: "text-red-500",
      trend: "down"
    },
    { 
      title: "Investment Returns", 
      value: "₹45,000", 
      change: "+8.3%", 
      icon: TrendingUp, 
      color: "text-purple-500",
      trend: "up"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 text-green-900">
      {/* Achievement Notification */}
      <AnimatePresence>
        {achievementUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Achievement Unlocked!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full px-4 lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <header className="py-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-8 w-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center"
              >
                <PiggyBank className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Samadhan
              </span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button className="text-green-800 hover:text-green-600 transition-colors">Overview</button>
              <button className="text-green-800 hover:text-green-600 transition-colors">Goals</button>
              <button className="text-green-800 hover:text-green-600 transition-colors">Analytics</button>
              <button className="text-green-800 hover:text-green-600 transition-colors">Insights</button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg border border-green-200"
            >
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-green-800">{streakCount} Day Streak</span>
            </motion.div>
            <button className="relative p-2 text-green-800 hover:text-green-600 transition-colors">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white"
                >
                  {notifications}
                </motion.span>
              )}
            </button>
            <button className="p-2 text-green-800 hover:text-green-600 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
           
          </div>
        </header>

    

        {/* Goals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-green-900">Financial Goals</h2>
              <p className="text-green-700">Track your progress towards financial freedom</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewGoalModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:shadow-lg text-white"
            >
              <Plus className="h-5 w-5" />
              <span>New Goal</span>
            </motion.button>
          </div>

          {/* Progress Overview */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-green-200 shadow-sm mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">Overall Progress</h3>
              <span className="text-2xl font-bold text-green-600">{overallProgress}%</span>
            </div>
            <div className="w-full bg-green-100 rounded-full h-3 mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              ></motion.div>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>₹{totalSavings.toLocaleString()} saved</span>
              <span>₹{totalTargets.toLocaleString()} target</span>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-green-100 p-1 rounded-lg inline-flex">
            {['all', 'active', 'completed'].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                    : 'text-green-800 hover:text-green-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Goals
              </motion.button>
            ))}
          </div>

          {/* Goals Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-xl overflow-hidden border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 ${
                  animatingGoal === goal.id ? 'animate-pulse' : ''
                } ${priorityColors[goal.priority]}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={goal.image}
                    alt={goal.title}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <span className="text-2xl">{categoryIcons[goal.category]}</span>
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-green-800">
                      {goal.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 text-green-800">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{goal.streak}</span>
                    </div>
                  </div>
                  {goal.isAutoContribute && (
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-green-500/90 backdrop-blur-sm border border-green-600 px-2 py-1 rounded-md text-xs font-medium text-white">
                        Auto-Contribute
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-green-900">{goal.title}</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleContribute(goal.id, goal.title)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 py-2 text-sm rounded-lg text-white transition-all duration-200 hover:shadow-md"
                    >
                      Contribute
                    </motion.button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-green-700">
                        <span>Progress</span>
                        <span className="font-semibold">{goal.complete}%</span>
                      </div>
                      <div className="w-full bg-green-100 rounded-full h-2 mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.complete}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                        ></motion.div>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>₹{goal.currentAmount.toLocaleString()}</span>
                        <span>₹{goal.target.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-green-700">
                        <Calendar className="h-4 w-4" />
                        <span>₹{goal.monthly.toLocaleString()}/month</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {goal.complete === 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-xs text-green-600">
                          {goal.complete === 100 ? 'Complete' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Milestones */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 text-green-700">Milestones</h4>
                      <div className="space-y-1">
                        {goal.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              {milestone.reached ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-green-300"></div>
                              )}
                              <span className={milestone.reached ? 'text-green-600 font-medium' : 'text-green-500'}>
                                ₹{milestone.amount.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-green-500">
                              {milestone.reward}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Contribute Modal */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 w-full max-w-md border border-green-200 shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-green-900">Contribute to {selectedGoal}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">₹</span>
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full bg-green-50 rounded-lg py-3 pl-8 pr-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 25000].map((amount) => (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setContributionAmount(amount.toString())}
                      className="bg-green-100 hover:bg-green-200 py-2 rounded-lg text-sm text-green-800 transition-colors"
                    >
                      ₹{amount.toLocaleString()}
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitContribution}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 rounded-lg font-medium text-white transition-all duration-200"
                  >
                    Contribute
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowContributeModal(false)}
                    className="flex-1 bg-green-100 hover:bg-green-200 py-3 rounded-lg font-medium text-green-800 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Goal Modal */}
      <AnimatePresence>
        {showNewGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl p-6 w-full max-w-md border border-green-200 shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-green-900">Create New Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    className="w-full bg-green-50 rounded-lg py-3 px-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                    placeholder="e.g., New Car"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Target Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">₹</span>
                    <input
                      type="number"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                      className="w-full bg-green-50 rounded-lg py-3 pl-8 pr-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                      placeholder="1000000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Monthly Contribution</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">₹</span>
                    <input
                      type="number"
                      value={newGoal.monthly}
                      onChange={(e) => setNewGoal({...newGoal, monthly: e.target.value})}
                      className="w-full bg-green-50 rounded-lg py-3 pl-8 pr-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                      placeholder="50000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Category</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                      className="w-full bg-green-50 rounded-lg py-3 px-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                    >
                      <option value="savings">Savings</option>
                      <option value="housing">Housing</option>
                      <option value="retirement">Retirement</option>
                      <option value="emergency">Emergency</option>
                      <option value="travel">Travel</option>
                      <option value="education">Education</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Priority</label>
                    <select
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                      className="w-full bg-green-50 rounded-lg py-3 px-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="w-full bg-green-50 rounded-lg py-3 px-4 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 border border-green-200"
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateGoal}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 rounded-lg font-medium text-white transition-all duration-200"
                  >
                    Create Goal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewGoalModal(false)}
                    className="flex-1 bg-green-100 hover:bg-green-200 py-3 rounded-lg font-medium text-green-800 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowNewGoalModal(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 p-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl md:hidden z-40"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>

      {/* Bottom Navigation for Mobile */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-200 p-4 md:hidden z-30"
      >
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-green-600">
            <Target className="h-5 w-5" />
            <span className="text-xs">Goals</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-green-800">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Savings</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-green-800">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Analytics</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-green-800">
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </motion.div>

      {/* Insights Panel */}
      <div className="px-4 lg:max-w-7xl lg:mx-auto pb-20 md:pb-8">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-6 border border-green-200 shadow-sm mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center text-green-900">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            Smart Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-blue-50 border border-blue-100 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Savings Velocity</span>
              </div>
              <p className="text-sm text-green-800">
                You're saving 15% faster than last month! Keep up the momentum to reach your Dream Home goal 3 months early.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-purple-50 border border-purple-100 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-600">Goal Optimization</span>
              </div>
              <p className="text-sm text-green-800">
                Consider increasing your Emergency Fund priority. Your current 6-month runway could use boosting.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-green-50 border border-green-100 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Reward Available</span>
              </div>
              <p className="text-sm text-green-800">
                You've maintained a 12-day streak! Unlock premium analytics by reaching 30 days.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-orange-50 border border-orange-100 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600">Spending Alert</span>
              </div>
              <p className="text-sm text-green-800">
                Entertainment spending is 20% over budget this month. Consider adjusting to stay on track.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-6 border border-green-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-4 text-green-900">Recent Activity</h3>
          
          <div className="space-y-4">
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowRight className="h-4 w-4 text-green-600 rotate-[-45deg]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Contribution to Dream Home</p>
                <p className="text-xs text-green-600">2 hours ago</p>
              </div>
              <span className="text-sm font-medium text-green-600">+₹25,000</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Milestone Reached</p>
                <p className="text-xs text-green-600">Emergency Fund - 70% Complete</p>
              </div>
              <span className="text-xs text-yellow-500">🎉</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Investment Return</p>
                <p className="text-xs text-green-600">Retirement Fund Portfolio</p>
              </div>
              <span className="text-sm font-medium text-purple-600">+₹8,500</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Streak Bonus</p>
                <p className="text-xs text-green-600">12 days of consistent saving</p>
              </div>
              <span className="text-xs text-yellow-500">🔥</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default App;
