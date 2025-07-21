
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  User, 
  MapPin, 
  Activity, 
  FileText, 
  Loader, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Heart,
  Shield,
  Star,
  Phone,
  Calendar,
  CreditCard,
  Building,
  Stethoscope,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LoanApplicationSummary {
  applicantDetails: {
    name: string;
    dob: string;
    gender: string;
    aadhaarNumber: string;
    verificationStatus: string;
  };
  hospitalDetails: {
    name: string;
    location: string;
    verificationStatus: string;
    confidence?: number;
  };
  patientDetails: {
    name: string;
    emergencyType: string;
    emergencyDescription: string;
    contactNumber: string;
    relationship: string;
  };
  medicalCertificate?: {
    fileName: string;
    hasText: boolean;
    extractedText?: string;
    confidence?: number;
    textLength?: number;
  };
  timestamp: string;
  loanStatus: 'Pending' | 'Approved' | 'Rejected';
}

interface SummaryProps {
  loanSummary: LoanApplicationSummary | null;
  isGeneratingSummary: boolean;
  summaryError: string | null;
  generateLoanSummary: () => void;
  setCurrentStep: (step: 'aadhaar' | 'hospital' | 'emergency' | 'summary') => void;
  approveLoan: () => void;
  rejectLoan: () => void;
  medicalCertificateFile?: File;
  ocrResult?: {
    success: boolean;
    text?: string;
    confidence?: number;
    error?: string;
  };
}

const Summary: React.FC<SummaryProps> = ({
  loanSummary,
  isGeneratingSummary,
  summaryError,
  generateLoanSummary,
  setCurrentStep,
  approveLoan,
  rejectLoan,
  medicalCertificateFile,
  ocrResult
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [showExtractedText, setShowExtractedText] = useState(false);

  useEffect(() => {
    if (loanSummary) {
      const applicationTime = new Date(loanSummary.timestamp);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - applicationTime.getTime()) / 1000 / 60);
      setTimeElapsed(elapsed);

      const emergencyType = loanSummary.patientDetails.emergencyType.toLowerCase();
      if (emergencyType.includes('cardiac') || emergencyType.includes('accident') || emergencyType.includes('stroke')) {
        setUrgencyLevel('high');
      } else if (emergencyType.includes('surgery') || emergencyType.includes('critical')) {
        setUrgencyLevel('medium');
      } else {
        setUrgencyLevel('low');
      }
    }
  }, [loanSummary]);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'from-red-500 to-pink-600';
      case 'medium': return 'from-orange-500 to-yellow-600';
      case 'low': return 'from-green-500 to-emerald-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getVerificationIcon = (status: string) => {
    return status === 'Verified' ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const colorClass = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const hasMedicalCertificate = medicalCertificateFile && ocrResult?.success;

  // Generate particles for background animation
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

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 20px 25px -5px rgba(26, 35, 50, 0.3)",
      y: -2,
      transition: { type: "spring", stiffness: 300 }
    },
    tap: { scale: 0.95 }
  };

  if (isGeneratingSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
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
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7FFF00]/30 p-8 text-center"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full flex items-center justify-center mb-6"
            >
              <Loader className="w-8 h-8 text-[#1a2332] animate-spin" />
            </motion.div>
            <h3 className="text-2xl font-bold text-[#1a2332] mb-2">Processing Emergency Application</h3>
            <p className="text-[#1a2332]/70 mb-6">Creating professional summary for bank review...</p>
            <div className="flex justify-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-[#7FFF00] rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="w-3 h-3 bg-[#32CD32] rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-3 h-3 bg-[#1a2332] rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
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
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            className="max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#7FFF00]/30 p-8"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[#1a2332] mb-2">Summary Generation Failed</h3>
              <p className="text-[#1a2332]/70 mb-6">{summaryError}</p>
              <motion.button
                onClick={generateLoanSummary}
                className="bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span>Retry Generation</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!loanSummary) {
    return null;
  }

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
              <h1 className="text-4xl font-bold text-[#1a2332]">Loan Application Summary</h1>
              <p className="text-[#1a2332]/70 text-lg">Emergency medical loan request</p>
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
                <ClipboardList className="w-6 h-6 text-[#7FFF00]" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-[#1a2332]">Emergency Loan Summary</h2>
                <p className="text-[#1a2332]/80">Review all details before submission</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Emergency Status */}
            <motion.div
              className={`bg-gradient-to-r ${getUrgencyColor(urgencyLevel)} text-white rounded-2xl p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Heart className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">EMERGENCY STATUS</h3>
                    <p className="opacity-90">{urgencyLevel.toUpperCase()} PRIORITY</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    {timeElapsed < 60 ? `${timeElapsed}m ago` : `${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m ago`}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Verification Status */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-[#1a2332] mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#7FFF00]" />
                Verification Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 rounded-xl">
                  {getVerificationIcon(loanSummary.applicantDetails.verificationStatus)}
                  <div>
                    <div className="font-semibold text-[#1a2332]">Identity Verified</div>
                    <div className="text-sm text-[#1a2332]/70">Aadhaar Authentication</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 rounded-xl">
                  {getVerificationIcon(loanSummary.hospitalDetails.verificationStatus)}
                  <div>
                    <div className="font-semibold text-[#1a2332]">Hospital Verified</div>
                    <div className="text-sm text-[#1a2332]/70">Location Confirmed</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 rounded-xl">
                  {hasMedicalCertificate ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <div className="font-semibold text-[#1a2332]">Medical Certificate</div>
                    <div className="text-sm text-[#1a2332]/70">
                      {hasMedicalCertificate ? 'Text Extracted' : 'Not Provided'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Applicant Details */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-gradient-to-r from-[#1a2332] to-[#2a3441] text-white p-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Applicant Details</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Full Name</p>
                    <p className="text-lg font-semibold text-[#1a2332]">{loanSummary.applicantDetails.name}</p>
                  </div>
                  {getVerificationIcon(loanSummary.applicantDetails.verificationStatus)}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Date of Birth</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1a2332]/50" />
                      <span className="font-medium text-[#1a2332]">{loanSummary.applicantDetails.dob}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Gender</p>
                    <span className="font-medium text-[#1a2332]">{loanSummary.applicantDetails.gender}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-[#1a2332]/70">Aadhaar Number</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#1a2332]/50" />
                    <span className="font-mono text-lg text-[#1a2332]">{loanSummary.applicantDetails.aadhaarNumber}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hospital Details */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] p-4">
                <div className="flex items-center gap-3">
                  <Building className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Hospital Details</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Hospital Name</p>
                    <p className="text-lg font-semibold text-[#1a2332]">{loanSummary.hospitalDetails.name}</p>
                  </div>
                  {getVerificationIcon(loanSummary.hospitalDetails.verificationStatus)}
                </div>
                
                <div>
                  <p className="text-sm text-[#1a2332]/70">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1a2332]/50" />
                    <span className="font-medium text-[#1a2332]">{loanSummary.hospitalDetails.location}</span>
                  </div>
                </div>
                
               
              </div>
            </motion.div>

            {/* Patient Details */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Patient Details</h3>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Patient Name</p>
                    <p className="text-xl font-semibold text-[#1a2332]">{loanSummary.patientDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Emergency Type</p>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">{loanSummary.patientDetails.emergencyType}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Contact Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#1a2332]/50" />
                      <span className="font-medium text-[#1a2332]">{loanSummary.patientDetails.contactNumber}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#1a2332]/70">Relationship to Applicant</p>
                    <span className="font-medium text-[#1a2332]">{loanSummary.patientDetails.relationship}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-[#1a2332]/70 mb-2">Emergency Description</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-[#1a2332] whitespace-pre-wrap leading-relaxed">{loanSummary.patientDetails.emergencyDescription}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical Certificate */}
            {hasMedicalCertificate && (
              <motion.div
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Medical Certificate</h3>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-sm text-[#1a2332]/70">Document Status</p>
                        <p className="text-lg font-semibold text-[#1a2332]">Certificate Uploaded</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-[#1a2332]/70 mb-2">OCR Confidence Score</p>
                      {getConfidenceBar(ocrResult?.confidence || 0)}
                      <p className="text-right text-sm text-[#1a2332]/70 mt-1">
                        {Math.round((ocrResult?.confidence || 0) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#1a2332]/70">File Name</p>
                      <p className="font-medium text-[#1a2332]">{medicalCertificateFile?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#1a2332]/70">Text Length</p>
                      <p className="font-medium text-[#1a2332]">{ocrResult?.text?.length || 0} characters</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-[#1a2332]/70">Extracted Text Content</p>
                      <button
                        onClick={() => setShowExtractedText(!showExtractedText)}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        {showExtractedText ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="text-sm">Hide Text</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Show Text</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {showExtractedText && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="max-h-60 overflow-y-auto">
                          <p className="text-[#1a2332] whitespace-pre-wrap text-sm leading-relaxed">
                            {ocrResult?.text || 'No text extracted from the medical certificate.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
            

             
              <motion.button
                onClick={() => setCurrentStep('emergency')}
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
      </div>
    </div>
  );
};

export default Summary;