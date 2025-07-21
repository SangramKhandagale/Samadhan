"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, User, AlertCircle, Phone, FileText, Upload, 
  Loader, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle,
  Sparkles, Shield, ArrowLeft, ChevronRight, DollarSign, CreditCard
} from 'lucide-react';
import { ocrService, OCRResult } from '@/app/Emergency/Emergency_API/ocr';
import { prepareLoanDataForDatabase, submitEmergencyLoanApplication } from '@/database/utils/emergencyLoanUtils';

interface EmergencyFormData {
  patientName: string;
  emergencyType: string;
  emergencyDescription: string;
  medicalCertificate?: File;
  contactNumber: string;
  relationshipToPatient: string;
  loanAmountRequired: string; // Added loan amount field
}

interface FormProps {
  emergencyFormData: EmergencyFormData;
  setEmergencyFormData: React.Dispatch<React.SetStateAction<EmergencyFormData>>;
  setCurrentStep: (step: 'aadhaar' | 'hospital' | 'emergency' | 'summary') => void;
  hospitalVerificationResult?: any;
  hospitalName?: string;
  hospitalLocation?: string;
  setOcrResult?: React.Dispatch<React.SetStateAction<{
    success: boolean;
    text?: string;
    confidence?: number;
    error?: string;
  } | null>>;
  aadhaarInfo?: any;
  certificateAnalysis?: any;
}

const emergencyTypes = [
  'Cardiac Emergency',
  'Respiratory Emergency',
  'Neurological Emergency',
  'Trauma/Injury',
  'Stroke',
  'Unconsciousness',
  'Severe Pain',
  'Drug Overdose',
  'Allergic Reaction',
  'Psychiatric Emergency',
  'Other'
];

const Form: React.FC<FormProps> = ({
  emergencyFormData,
  setEmergencyFormData,
  setCurrentStep,
  hospitalVerificationResult,
  hospitalName = "Default Hospital",
  hospitalLocation = "Default Location",
  setOcrResult,
  aadhaarInfo,
  certificateAnalysis
}) => {
  const [isProcessingCertificate, setIsProcessingCertificate] = useState(false);
  const [ocrResult, setocrResult] = useState<OCRResult | null>(null);
  const [showCertificateDetails, setShowCertificateDetails] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmergencyFormChange = (field: keyof EmergencyFormData, value: string) => {
    setEmergencyFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ocrService.validateImageFile(file);
    if (!validation.isValid) {
      setCertificateError(validation.error || 'Invalid file');
      return;
    }

    setCertificateError(null);
    setIsProcessingCertificate(true);
    setocrResult(null);

    try {
      const result = await ocrService.extractTextFromImage(file);
      setocrResult(result);
      if (setOcrResult) setOcrResult(result);
      
      setEmergencyFormData(prev => ({
        ...prev,
        medicalCertificate: file
      }));

      if (!result.success) {
        setCertificateError(result.error || 'Failed to extract text from image');
      }
    } catch (error: any) {
      setCertificateError(`Processing failed: ${error.message}`);
      setocrResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsProcessingCertificate(false);
    }
  };

  const handleEmergencySubmit = async () => {
    // Basic validation for required fields including loan amount
    if (!emergencyFormData.patientName.trim() || 
        !emergencyFormData.emergencyType || 
        !emergencyFormData.emergencyDescription.trim() || 
        !emergencyFormData.contactNumber.trim() ||
        !emergencyFormData.loanAmountRequired.trim()) {
      // Don't show error, just silently return or handle gracefully
      return;
    }

    setIsSubmitting(true);

    try {
      // Create comprehensive aadhaar info with all required fields
      const processedAadhaarInfo = {
        name: aadhaarInfo?.name || emergencyFormData.patientName || "Emergency Patient",
        dateOfBirth: aadhaarInfo?.dateOfBirth || aadhaarInfo?.dob || "1990-01-01",
        gender: aadhaarInfo?.gender || "Not Specified",
        aadhaarNumber: aadhaarInfo?.aadhaarNumber || "XXXX-XXXX-XXXX",
        isVerified: aadhaarInfo?.isVerified || false
      };

      // Create comprehensive hospital verification result
      const processedHospitalVerification = {
        exists: hospitalVerificationResult?.exists || true,
        confidence: hospitalVerificationResult?.confidence || 0.8,
        suggestions: hospitalVerificationResult?.suggestions || [hospitalName]
      };

      // Create comprehensive certificate analysis with OCR text
      const processedCertificateAnalysis = {
        analysis: {
          isValid: certificateAnalysis?.analysis?.isValid || (ocrResult?.success || false),
          confidence: certificateAnalysis?.analysis?.confidence || (ocrResult?.confidence || 0),
          patientName: certificateAnalysis?.analysis?.patientName || '',
          doctorName: certificateAnalysis?.analysis?.doctorName || '',
          diagnosis: certificateAnalysis?.analysis?.diagnosis || '',
          summary: certificateAnalysis?.analysis?.summary || '',
          // Include the extracted text from OCR
          extractedText: ocrResult?.text || certificateAnalysis?.analysis?.extractedText || ''
        }
      };

      // Enhanced emergency form data with loan amount
      const enhancedEmergencyFormData = {
        ...emergencyFormData,
        loanAmountRequired: parseFloat(emergencyFormData.loanAmountRequired) || 0
      };

      // Use the prepareLoanDataForDatabase utility function
      const loanData = prepareLoanDataForDatabase(
        processedAadhaarInfo,
        hospitalName,
        hospitalLocation,
        processedHospitalVerification,
        enhancedEmergencyFormData,
        processedCertificateAnalysis
      );

      // Ensure the medicalCertificateText is included in the loan data
      if (ocrResult?.text) {
        loanData.medicalCertificateText = ocrResult.text;
      }

      console.log('Prepared loan data:', loanData); // Debug log

      // Submit to database
      const submissionResult = await submitEmergencyLoanApplication(loanData);

      if (submissionResult.success) {
        console.log('Application submitted successfully:', submissionResult);
      } else {
        console.error('Submission failed:', submissionResult.error);
      }

      // Move to summary step regardless of submission result to avoid blocking user
      setCurrentStep('summary');
    } catch (error: any) {
      console.error('Submission error:', error);
      // Still proceed to summary to not block the user
      setCurrentStep('summary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2
  }));

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
              <Activity className="w-8 h-8 text-[#1a2332]" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-[#1a2332]">Emergency Information</h1>
              <p className="text-[#1a2332]/70 text-lg">
                Emergency details for {hospitalVerificationResult?.suggestions?.[0] || hospitalName}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7FFF00]/30 overflow-hidden"
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
                <AlertTriangle className="w-6 h-6 text-[#7FFF00]" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a2332]">Emergency Loan Application</h2>
                <p className="text-[#1a2332]/80">Please provide detailed emergency information</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Patient Name */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                Patient Name *
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focused"
              >
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                <input
                  type="text"
                  value={emergencyFormData.patientName}
                  onChange={(e) => handleEmergencyFormChange('patientName', e.target.value)}
                  placeholder="Enter patient's full name"
                  className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300"
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

            {/* Emergency Type and Loan Amount Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                  Type of Emergency *
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focused"
                >
                  <AlertCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <select
                    value={emergencyFormData.emergencyType}
                    onChange={(e) => handleEmergencyFormChange('emergencyType', e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg transition-all duration-300"
                  >
                    <option value="">Select emergency type</option>
                    {emergencyTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <motion.div
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 bg-[#32CD32] rounded-full" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Loan Amount Required */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                  Loan Amount Required (₹) *
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focused"
                >
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <input
                    type="number"
                    value={emergencyFormData.loanAmountRequired}
                    onChange={(e) => handleEmergencyFormChange('loanAmountRequired', e.target.value)}
                    placeholder="Enter loan amount in ₹"
                    min="1000"
                    max="500000"
                    className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300"
                  />
                  <motion.div
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <DollarSign className="w-5 h-5 text-[#32CD32]/50" />
                  </motion.div>
                </motion.div>
                <p className="text-sm text-[#1a2332]/60 mt-2">
                  Amount between ₹1,000 - ₹5,00,000
                </p>
              </motion.div>
            </div>

            {/* Emergency Description */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                Emergency Description *
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focused"
              >
                <textarea
                  value={emergencyFormData.emergencyDescription}
                  onChange={(e) => handleEmergencyFormChange('emergencyDescription', e.target.value)}
                  placeholder="Describe the emergency situation in detail..."
                  rows={4}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300 resize-none"
                />
              </motion.div>
            </motion.div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                  Contact Number *
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focused"
                >
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <input
                    type="tel"
                    value={emergencyFormData.contactNumber}
                    onChange={(e) => handleEmergencyFormChange('contactNumber', e.target.value)}
                    placeholder="Enter contact number"
                    className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg placeholder-[#1a2332]/50 transition-all duration-300"
                  />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                  Relationship to Patient
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focused"
                >
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <select
                    value={emergencyFormData.relationshipToPatient}
                    onChange={(e) => handleEmergencyFormChange('relationshipToPatient', e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-2xl focus:outline-none focus:border-[#32CD32] text-[#1a2332] text-lg transition-all duration-300"
                  >
                    <option value="">Select relationship</option>
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </motion.div>
              </motion.div>
            </div>

            {/* Medical Certificate Upload */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <label className="block text-lg font-semibold text-[#1a2332] mb-3">
                Medical Certificate (Optional)
              </label>
              <motion.div
                className="border-2 border-dashed border-[#7FFF00]/50 rounded-2xl p-8 text-center bg-gradient-to-r from-[#7FFF00]/5 to-[#32CD32]/5"
                whileHover={{ borderColor: 'rgba(127, 255, 0, 0.8)' }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Upload className="w-12 h-12 mx-auto text-[#32CD32] mb-4" />
                </motion.div>
                <p className="text-[#1a2332] mb-4 text-lg">
                  Upload a medical certificate or prescription (JPEG, PNG, WebP)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="certificate-upload"
                />
                <motion.label
                  htmlFor="certificate-upload"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white rounded-2xl hover:from-[#2a3441] hover:to-[#1a2332] cursor-pointer font-bold text-lg shadow-lg"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Upload className="w-5 h-5 mr-3" />
                  Choose File
                </motion.label>
              </motion.div>

              {/* File Upload Results */}
              <AnimatePresence>
                {emergencyFormData.medicalCertificate && (
                  <motion.div
                    className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        <span className="font-medium text-green-800">
                          {emergencyFormData.medicalCertificate.name} uploaded
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {ocrResult?.success && ocrResult.text && (
                          <motion.button
                            onClick={() => setShowCertificateDetails(!showCertificateDetails)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showCertificateDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => {
                            setEmergencyFormData(prev => ({
                              ...prev,
                              medicalCertificate: undefined
                            }));
                            setocrResult(null);
                            setShowCertificateDetails(false);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <XCircle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* OCR Results Display */}
                    <AnimatePresence>
                      {showCertificateDetails && ocrResult?.success && ocrResult.text && (
                        <motion.div
                          className="mt-4 p-4 bg-white rounded-xl border border-green-200"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <h4 className="font-semibold text-green-800 mb-2">Extracted Text:</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                            {ocrResult.text}
                          </p>
                          {ocrResult.confidence && (
                            <p className="text-xs text-green-600 mt-2">
                              Confidence: {Math.round((ocrResult.confidence || 0) * 100)}%
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {isProcessingCertificate && (
                  <motion.div
                    className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex items-center">
                      <Loader className="w-5 h-5 text-yellow-600 animate-spin mr-3" />
                      <span className="text-yellow-800 font-medium">
                        Processing certificate...
                      </span>
                    </div>
                  </motion.div>
                )}

                {certificateError && (
                  <motion.div
                    className="mt-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                      <span className="text-red-800 font-medium">{certificateError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <motion.button
                onClick={handleEmergencySubmit}
                disabled={isSubmitting}
                className={`flex-1 bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                variants={buttonVariants}
                whileHover={!isSubmitting ? "hover" : {}}
                whileTap={!isSubmitting ? "tap" : {}}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>Submit Emergency Application</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              
              <motion.button
                onClick={() => setCurrentStep('hospital')}
                disabled={isSubmitting}
                className={`bg-gradient-to-r from-[#7FFF00]/20 to-[#32CD32]/20 text-[#1a2332] px-8 py-4 rounded-2xl font-bold text-lg border-2 border-[#7FFF00]/30 hover:bg-gradient-to-r hover:from-[#7FFF00]/30 hover:to-[#32CD32]/30 transition-all duration-300 flex items-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                variants={buttonVariants}
                whileHover={!isSubmitting ? "hover" : {}}
                whileTap={!isSubmitting ? "tap" : {}}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Form;