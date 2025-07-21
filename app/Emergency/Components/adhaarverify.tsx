import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, XCircle, User, Calendar, Users, CreditCard, AlertCircle, Sparkles, Shield, Activity, RefreshCw } from 'lucide-react';
import { detectAadhaarCard, extractAadhaarInfo, verifyAadhaarCard, AadhaarCardInfo } from '@/app/Emergency/Emergency_API/adhaarcard';
import { VerificationResult } from '@/app/Emergency/Emergency_API/types';

interface AadhaarVerifyProps {
  setCurrentStep: (step: 'aadhaar' | 'hospital' | 'emergency' | 'summary') => void;
  setAadhaarInfo: (info: AadhaarCardInfo | null) => void;
  setVerificationResult: (result: VerificationResult | null) => void;
  aadhaarInfo: AadhaarCardInfo | null; // Add this prop to receive existing data
  verificationResult: VerificationResult | null; // Add this prop to receive existing data
}

const AadhaarVerify: React.FC<AadhaarVerifyProps> = ({ 
  setCurrentStep, 
  setAadhaarInfo, 
  setVerificationResult, 
  aadhaarInfo: existingAadhaarInfo, 
  verificationResult: existingVerificationResult 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [isAadhaarDetected, setIsAadhaarDetected] = useState<boolean | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initialize state from existing data when component mounts
  useEffect(() => {
    if (existingAadhaarInfo) {
      setIsAadhaarDetected(true);
    }
    if (existingVerificationResult) {
      setIsAadhaarDetected(existingVerificationResult.isAuthentic);
    }
  }, [existingAadhaarInfo, existingVerificationResult]);

  // Generate particles for background animation
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2
  }));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      // Reset previous results but don't clear parent state yet
      setIsAadhaarDetected(null);
    }
  };

  const processAadhaarCard = async () => {
    if (!file) return;

    setAadhaarLoading(true);

    try {
      // Step 1: Detect Aadhaar card
      const detected = await detectAadhaarCard(file);
      setIsAadhaarDetected(detected);

      if (!detected) {
        setAadhaarLoading(false);
        return;
      }

      // Step 2: Extract information
      const info = await extractAadhaarInfo(file);
      setAadhaarInfo(info); // Update parent state

      // Step 3: Verify authenticity
      const verification = await verifyAadhaarCard(file);
      setVerificationResult(verification); // Update parent state

      // Move to next step if successful
      if (detected && verification.isAuthentic) {
        setTimeout(() => setCurrentStep('hospital'), 1000);
      }
    } catch (error) {
      console.error('Error processing Aadhaar card:', error);
    } finally {
      setAadhaarLoading(false);
    }
  };

  const resetAadhaarForm = () => {
    setFile(null);
    setImagePreview(null);
    setIsAadhaarDetected(null);
    // Clear parent state
    setAadhaarInfo(null);
    setVerificationResult(null);
  };

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
      scale: 1.02,
      y: -5,
      boxShadow: "0 25px 35px -5px rgba(50, 205, 50, 0.25)",
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const progressVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
      {/* Background Elements */}
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

      {/* Header Section */}
      <motion.div 
        className="relative z-10 pt-16 pb-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center">
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-3xl flex items-center justify-center shadow-2xl"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Shield className="w-10 h-10 text-[#1a2332]" />
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-[#1a2332] mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.span
                animate={{ 
                  textShadow: ["0 0 0px rgba(26, 35, 50, 0.3)", "0 5px 10px rgba(26, 35, 50, 0.3)", "0 0 0px rgba(26, 35, 50, 0.3)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Aadhaar Verification
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-[#1a2332]/70 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Secure identity verification powered by AI technology
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <motion.div 
            className="space-y-6"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-gradient-to-br from-white/90 to-[#7FFF00]/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-[#7FFF00]/20"
              whileHover="hover"
              variants={cardVariants}
            >
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload" 
                  className="cursor-pointer block border-2 border-dashed border-[#7FFF00]/40 rounded-2xl p-8 text-center hover:border-[#32CD32] transition-all duration-300 hover:bg-[#7FFF00]/5"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Upload size={64} className="mx-auto text-[#32CD32] mb-4" />
                  </motion.div>
                  <p className="text-[#1a2332] font-semibold text-lg mb-2">
                    Click to upload Aadhaar card
                  </p>
                  <p className="text-[#1a2332]/60">
                    Supports JPG, PNG, and other image formats
                  </p>
                </label>
              </div>
            </motion.div>

            {/* Image Preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  className="bg-gradient-to-br from-white/90 to-[#7FFF00]/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-[#7FFF00]/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Aadhaar card preview" 
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/30 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#7FFF00] rounded-full animate-pulse"></div>
                        <span className="text-white font-medium">Preview Ready</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <AnimatePresence>
              {file && (
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.button
                    onClick={processAadhaarCard}
                    disabled={aadhaarLoading}
                    className="flex-1 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {aadhaarLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="w-5 h-5" />
                        </motion.div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Verify Aadhaar Card
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    onClick={resetAadhaarForm}
                    className="px-8 py-4 border-2 border-[#7FFF00]/40 text-[#1a2332] rounded-2xl font-bold hover:bg-[#7FFF00]/10 transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Section */}
          <motion.div 
            className="space-y-6"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Detection Result */}
            <AnimatePresence>
              {(isAadhaarDetected !== null || existingAadhaarInfo) && (
                <motion.div
                  className={`bg-gradient-to-br ${
                    (isAadhaarDetected || existingAadhaarInfo) 
                      ? 'from-[#32CD32]/20 to-[#7FFF00]/10 border-[#32CD32]/30' 
                      : 'from-red-500/20 to-red-300/10 border-red-400/30'
                  } backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        (isAadhaarDetected || existingAadhaarInfo) ? 'bg-[#32CD32]' : 'bg-red-500'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {(isAadhaarDetected || existingAadhaarInfo) ? (
                        <CheckCircle className="text-white w-6 h-6" />
                      ) : (
                        <XCircle className="text-white w-6 h-6" />
                      )}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#1a2332]">Detection Result</h3>
                  </div>
                  <p className={`text-lg font-medium ${
                    (isAadhaarDetected || existingAadhaarInfo) ? 'text-[#32CD32]' : 'text-red-600'
                  }`}>
                    {(isAadhaarDetected || existingAadhaarInfo) 
                      ? 'Aadhaar card detected successfully' 
                      : 'No Aadhaar card detected in the image'
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Extracted Information */}
            <AnimatePresence>
              {existingAadhaarInfo && (
                <motion.div
                  className="bg-gradient-to-br from-white/90 to-[#32CD32]/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-[#32CD32]/20"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-2xl flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <User className="w-6 h-6 text-[#1a2332]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#1a2332]">Extracted Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: User, label: 'Name', value: existingAadhaarInfo.name },
                      { icon: Calendar, label: 'Date of Birth', value: existingAadhaarInfo.dateOfBirth },
                      { icon: Users, label: 'Gender', value: existingAadhaarInfo.gender },
                      { icon: CreditCard, label: 'Aadhaar Number', value: existingAadhaarInfo.aadhaarNumber ? 
                        `${existingAadhaarInfo.aadhaarNumber.slice(0, 4)} ${existingAadhaarInfo.aadhaarNumber.slice(4, 8)} ${existingAadhaarInfo.aadhaarNumber.slice(8, 12)}` : null },
                      { icon: AlertCircle, label: 'Validity', value: existingAadhaarInfo.isValid ? 'Valid' : 'Invalid' },
                      
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-[#7FFF00]/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-[#32CD32]" />
                          <div>
                            <p className="text-sm text-[#1a2332]/60 font-medium">{item.label}</p>
                            <p className={`font-bold ${
                              item.label === 'Validity' 
                                ? (existingAadhaarInfo.isValid ? 'text-[#32CD32]' : 'text-red-600')
                                : 'text-[#1a2332]'
                            }`}>
                              {item.value || 'Not found'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Result */}
            <AnimatePresence>
              {existingVerificationResult && (
                <motion.div
                  className={`bg-gradient-to-br ${
                    existingVerificationResult.isAuthentic 
                      ? 'from-[#32CD32]/20 to-[#7FFF00]/10 border-[#32CD32]/30' 
                      : 'from-red-500/20 to-red-300/10 border-red-400/30'
                  } backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        existingVerificationResult.isAuthentic ? 'bg-[#32CD32]' : 'bg-red-500'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {existingVerificationResult.isAuthentic ? (
                        <CheckCircle className="text-white w-6 h-6" />
                      ) : (
                        <XCircle className="text-white w-6 h-6" />
                      )}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#1a2332]">
                      {existingVerificationResult.isAuthentic ? 'Authentic Aadhaar Card' : 'Verification Failed'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {existingVerificationResult.checks.map((check, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-[#32CD32] rounded-full"></div>
                        <p className="text-[#1a2332] font-medium">{check}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button */}
            <AnimatePresence>
              {existingAadhaarInfo && existingVerificationResult?.isAuthentic && (
                <motion.button
                  onClick={() => setCurrentStep('hospital')}
                  className="w-full bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Sparkles className="w-5 h-5" />
                  Continue to Hospital Verification
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {aadhaarLoading && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-white to-[#7FFF00]/10 rounded-3xl p-12 shadow-2xl border border-[#7FFF00]/20 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-6 relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full opacity-20"></div>
                <div className="absolute inset-2 border-4 border-[#7FFF00] border-t-transparent rounded-full"></div>
                <Shield className="w-8 h-8 text-[#32CD32] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-[#1a2332] mb-4">
                Verifying Aadhaar Card
              </h3>
              
              <p className="text-[#1a2332]/70 mb-6">
                Please wait while we securely process your document...
              </p>
              
              <div className="flex justify-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-[#32CD32] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AadhaarVerify;