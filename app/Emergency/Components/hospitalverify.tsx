"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Loader, 
  XCircle, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Shield,
  Activity,
  ChevronRight
} from 'lucide-react';

interface HospitalVerificationResult {
  exists: boolean;
  suggestions: string[];
  message: string;
  confidence?: number;
}

interface HospitalVerifyProps {
  hospitalName: string;
  setHospitalName: (value: string) => void;
  hospitalLocation: string;
  setHospitalLocation: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  hospitalVerificationResult: HospitalVerificationResult | null;
  setHospitalVerificationResult: (result: HospitalVerificationResult | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  setCurrentStep: (step: 'aadhaar' | 'hospital' | 'emergency' | 'summary') => void;
  clearForm: () => void;
  verifyHospitalStrict: (name: string, location: string) => Promise<HospitalVerificationResult>;
}

const HospitalVerify: React.FC<HospitalVerifyProps> = ({
  hospitalName,
  setHospitalName,
  hospitalLocation,
  setHospitalLocation,
  isLoading,
  setIsLoading,
  hospitalVerificationResult,
  setHospitalVerificationResult,
  error,
  setError,
  setCurrentStep,
  clearForm,
  verifyHospitalStrict
}) => {
  // Generate particles for background animation
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2
  }));

  const getResultIcon = () => {
    if (!hospitalVerificationResult) return null;
    
    if (hospitalVerificationResult.exists) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    } else if (hospitalVerificationResult.suggestions.length > 0) {
      return <AlertCircle className="w-8 h-8 text-yellow-500" />;
    } else {
      return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getResultColor = () => {
    if (!hospitalVerificationResult) return '';
    
    if (hospitalVerificationResult.exists) {
      return 'from-green-50 to-green-100 border-green-300';
    } else if (hospitalVerificationResult.suggestions.length > 0) {
      return 'from-yellow-50 to-yellow-100 border-yellow-300';
    } else {
      return 'from-red-50 to-red-100 border-red-300';
    }
  };

  const handleVerification = async () => {
    if (!hospitalName || !hospitalName.trim() || !hospitalLocation || !hospitalLocation.trim()) {
      setError('Please enter both hospital name and location');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHospitalVerificationResult(null);

    try {
      const result = await verifyHospitalStrict(hospitalName.trim(), hospitalLocation.trim());
      setHospitalVerificationResult(result);
      
      if (result.exists) {
        setTimeout(() => {
          setCurrentStep('emergency');
        }, 1000);
      }
    } catch (err: any) {
      setError(`Verification failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const inputVariants = {
    focused: {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(127, 255, 0, 0.25)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 20px 25px -5px rgba(26, 35, 50, 0.3)",
      y: -2,
      transition: { type: "spring", stiffness: 300 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-[#7FFF00]/20 rounded-full backdrop-blur-sm"
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

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-2xl flex items-center justify-center shadow-2xl"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.6 }}
            >
              <Shield className="w-8 h-8 text-[#1a2332]" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-[#1a2332]">Hospital Verification</h1>
              <p className="text-[#1a2332]/70 text-lg">Secure healthcare authentication</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7FFF00]/30 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] p-8">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 bg-[#1a2332] rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Activity className="w-6 h-6 text-[#7FFF00]" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a2332]">Verify Hospital Details</h2>
                <p className="text-[#1a2332]/80">Enter hospital information for verification</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Hospital Name Input */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                Hospital Name *
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focused"
              >
                <input
                  type="text"
                  value={hospitalName || ''}
                  onChange={(e) => setHospitalName && setHospitalName(e.target.value)}
                  placeholder="Enter hospital name (e.g., Apollo Hospital)"
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300"
                  disabled={isLoading}
                />
                <motion.div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-[#32CD32]/50" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Hospital Location Input */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                Hospital Location *
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focused"
              >
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                <input
                  type="text"
                  value={hospitalLocation || ''}
                  onChange={(e) => setHospitalLocation && setHospitalLocation(e.target.value)}
                  placeholder="Enter city/area (e.g., Mumbai, Delhi)"
                  className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300"
                  disabled={isLoading}
                />
                <motion.div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-3 h-3 bg-[#32CD32] rounded-full" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <motion.button
                onClick={handleVerification}
                disabled={isLoading || !hospitalName?.trim() || !hospitalLocation?.trim()}
                className="flex-1 bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover={!isLoading ? "hover" : {}}
                whileTap={!isLoading ? "tap" : {}}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Verify Hospital</span>
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => clearForm && clearForm()}
                disabled={isLoading}
                className="bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20 text-[#1a2332] px-8 py-4 rounded-2xl font-bold text-lg border-2 border-[#7FFF00]/30 hover:bg-gradient-to-r hover:from-[#7FFF00]/30 hover:to-[#32CD32]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                variants={buttonVariants}
                whileHover={!isLoading ? "hover" : {}}
                whileTap={!isLoading ? "tap" : {}}
              >
                Clear
              </motion.button>

              <motion.button
                onClick={() => setCurrentStep && setCurrentStep('aadhaar')}
                className="bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20 text-[#1a2332] px-8 py-4 rounded-2xl font-bold text-lg border-2 border-[#7FFF00]/30 hover:bg-gradient-to-r hover:from-[#7FFF00]/30 hover:to-[#32CD32]/30 transition-all duration-300 flex items-center gap-3"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="max-w-2xl mx-auto mt-8 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <XCircle className="w-6 h-6 text-red-500" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg">Verification Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification Result */}
        <AnimatePresence>
          {hospitalVerificationResult && (
            <motion.div
              className={`max-w-2xl mx-auto mt-8 bg-gradient-to-r ${getResultColor()} border-2 rounded-2xl p-8 shadow-2xl`}
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-start gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  {getResultIcon()}
                </motion.div>
                <div className="flex-1">
                  <motion.h3
                    className="text-2xl font-bold text-gray-800 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Verification Result
                  </motion.h3>
                  <motion.p
                    className="text-gray-700 mb-4 text-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {hospitalVerificationResult.message}
                  </motion.p>
                  
                 

                 
                </div>
              </div>

              {hospitalVerificationResult.exists && (
                <motion.div
                  className="mt-8 pt-6 border-t border-gray-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.button
                    onClick={() => setCurrentStep && setCurrentStep('emergency')}
                    className="w-full bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-3"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <span>Continue to Emergency Details</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HospitalVerify;