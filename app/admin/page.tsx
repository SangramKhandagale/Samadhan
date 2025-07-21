'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Users, AlertCircle, ChevronRight, Eye, EyeOff, Lock, User } from 'lucide-react';

// Admin Credentials (for reference):
// Username: bank_admin
// Password: 12345

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Static credentials
  const ADMIN_USERNAME = 'bank_admin';
  const ADMIN_PASSWORD = '12345';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    },
    hover: {
      scale: 1.03,
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(50, 205, 50, 0.25)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A]">
        <motion.div
          className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md mx-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#7FFF00] to-[#32CD32] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#1a2332]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Access the admin dashboard</p>
          </motion.div>

          <motion.form
            onSubmit={handleLogin}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {loginError && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <AlertCircle className="w-5 h-5" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#32CD32] focus:border-transparent transition-colors text-black"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#32CD32] focus:border-transparent transition-colors text-black"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] font-bold py-3 rounded-xl hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Login to Admin Panel
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-8 p-4 bg-gray-50 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-gray-500 text-center">
              Demo Credentials: bank_admin / 12345
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column - Admin Info */}
      <motion.div 
        className="w-full md:w-1/2 bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] p-8 md:p-12 lg:p-16 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[#1a2332] hover:text-white transition-colors self-end mb-8"
          whileHover={{ scale: 1.05 }}
        >
          <span className="font-medium">Logout</span>
        </motion.button>

        <motion.div 
          className="flex-1 flex flex-col justify-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a2332] mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Admin Dashboard
          </motion.h1>
          
          <motion.p 
            className="text-lg text-[#1a2332]/90 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Welcome to the administrative panel. Manage customer support requests and emergency loan applications efficiently.
          </motion.p>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Users className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Customer Support</h3>
                <p className="text-[#1a2332]/80">Handle and respond to customer inquiries.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Emergency Loans</h3>
                <p className="text-[#1a2332]/80">Review and process emergency loan applications.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Shield className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Secure Access</h3>
                <p className="text-[#1a2332]/80">Protected administrative environment.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Column - Admin Options */}
      <motion.div 
        className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          className="max-w-md mx-auto w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="text-2xl font-bold text-gray-900 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Administrative Functions
          </motion.h2>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Support Requests Option */}
            <motion.div
              className="bg-gradient-to-br from-[#9AFF9A] via-[#7FFF00] to-[#32CD32] p-6 rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border border-white/50"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onClick={() => handleOptionClick('/admin/support')}
              onMouseEnter={() => setHoveredOption('support')}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1a2332] rounded-xl flex items-center justify-center shadow-md">
                    <Users className="w-6 h-6 text-[#7FFF00]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a2332]">Support Requests</h3>
                </div>
                
                <p className="text-[#1a2332]/80 mb-6 leading-relaxed">
                  View and manage customer support requests, respond to inquiries, and track resolution status.
                </p>
                
                <motion.button 
                  className="mt-auto bg-[#1a2332] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 group self-start"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Manage Support</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* Emergency Loan Applications Option */}
            <motion.div
              className="bg-gradient-to-br from-[#7FFF00] via-[#ADFF2F] to-[#9AFF9A] p-6 rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border border-white/50"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onClick={() => handleOptionClick('/admin/emergency')}
              onMouseEnter={() => setHoveredOption('emergency')}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1a2332] rounded-xl flex items-center justify-center shadow-md">
                    <AlertCircle className="w-6 h-6 text-[#7FFF00]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a2332]">Emergency Loans</h3>
                </div>
                
                <p className="text-[#1a2332]/80 mb-6 leading-relaxed">
                  Review emergency loan applications, approve or decline requests, and manage loan processing.
                </p>
                
                <motion.button 
                  className="mt-auto bg-[#1a2332] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 group self-start"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Process Loans</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="mt-10 pt-6 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div 
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
                whileHover={{ y: -3 }}
              >
                <Shield className="w-5 h-5 text-[#32CD32]" />
                <span className="font-medium text-gray-700">Secure Admin</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
                whileHover={{ y: -3 }}
              >
                <Users className="w-5 h-5 text-[#32CD32]" />
                <span className="font-medium text-gray-700">Customer Management</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}