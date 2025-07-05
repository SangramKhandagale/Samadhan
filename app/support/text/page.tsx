'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { submitSupportRequest } from '@/database/utils/supportClient';
import { ChevronRight, ArrowLeft, Mail, Phone, User, MessageSquare, CheckCircle, Headphones, MessageCircle, Clock, AlertCircle } from 'lucide-react';

// Define interfaces for type safety
interface SupportRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  detectedLanguage?: 'en' | 'hi' | 'ur' | 'ar' | string;
}

interface GroqAnalysisResponse {
  category: string;
  priority: string;
  department: string;
  language: string;
  solveable: string;
  solution: string;
}

interface SupportResponse {
  success: boolean;
  ticketId: string;
  callId?: string;
  analysis?: GroqAnalysisResponse;
  requestData: SupportRequest;
  error?: string;
}

export default function SupportFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupportRequest>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<SupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form data
      if (!formData.name.trim() || !formData.email.trim() || !formData.description.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Phone validation (optional but if provided, should be valid)
      if (formData.phone && formData.phone.length < 10) {
        throw new Error('Please enter a valid phone number (at least 10 digits)');
      }

      const result = await submitSupportRequest(formData);

      if (result.success) {
        setResponse(result);
        // Reset form data
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          description: ''
        });
      } else {
        throw new Error(result.error || 'Failed to submit support request');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/support');
  };

  const handleNewRequest = () => {
    setResponse(null);
    setError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      description: ''
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column - Contact Theme */}
      <motion.div 
        className="w-full md:w-1/2 bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] p-8 md:p-12 lg:p-16 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-[#1a2332] hover:text-white transition-colors self-start mb-8 md:mb-12"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>

        <motion.div 
          className="flex-1 flex flex-col justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a2332] mb-6"
            variants={itemVariants}
          >
            Contact Our Support Team
          </motion.h1>
          
          <motion.p 
            className="text-lg text-[#1a2332]/90 mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Our dedicated support team is available 24/7 to assist you with any questions or issues you may have.
          </motion.p>

          <motion.div className="space-y-6" variants={containerVariants}>
            <motion.div className="flex items-start gap-4" variants={itemVariants}>
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Headphones className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">24/7 Availability</h3>
                <p className="text-[#1a2332]/80">We're always here to help, day or night.</p>
              </div>
            </motion.div>

            <motion.div className="flex items-start gap-4" variants={itemVariants}>
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <MessageCircle className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Multiple Channels</h3>
                <p className="text-[#1a2332]/80">Contact us via text, email, or phone.</p>
              </div>
            </motion.div>

            <motion.div className="flex items-start gap-4" variants={itemVariants}>
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Clock className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Fast Response</h3>
                <p className="text-[#1a2332]/80">Average response time under 30 minutes.</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Column - Form */}
      <motion.div 
        className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {response ? (
          <motion.div
            className="max-w-md mx-auto w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <motion.div
                className="w-20 h-20 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully</h2>
              <p className="text-gray-600">Your ticket ID: <span className="font-medium text-[#32CD32]">{response.ticketId}</span></p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#32CD32]" />
                Your Request Details
              </h3>
              <div className="space-y-3 text-gray-700">
                <p><span className="font-medium">Name:</span> {response.requestData.name}</p>
                <p><span className="font-medium">Email:</span> {response.requestData.email}</p>
                {response.requestData.phone && <p><span className="font-medium">Phone:</span> {response.requestData.phone}</p>}
                {response.requestData.subject && <p><span className="font-medium">Subject:</span> {response.requestData.subject}</p>}
                <p><span className="font-medium">Description:</span></p>
                <p className="mt-1 pl-4 border-l-2 border-[#32CD32]/30">{response.requestData.description}</p>
              </div>
            </div>

            {response.analysis && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Analysis & Next Steps
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p><span className="font-medium">Category:</span> {response.analysis.category}</p>
                  <p><span className="font-medium">Priority:</span> <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    response.analysis.priority === 'High' ? 'bg-red-100 text-red-800' :
                    response.analysis.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>{response.analysis.priority}</span></p>
                  <p><span className="font-medium">Department:</span> {response.analysis.department}</p>
                  <p><span className="font-medium">Solution:</span></p>
                  <p className="mt-1 pl-4 border-l-2 border-blue-300">{response.analysis.solution}</p>
                </div>
              </div>
            )}

            {response.callId && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Call Initiated
                </h3>
                <p className="text-gray-700">
                  We're calling you at {response.requestData.phone} to discuss your request.
                </p>
                <p className="text-sm text-green-600 mt-2">Call ID: {response.callId}</p>
              </div>
            )}

            <div className="flex gap-3">
              <motion.button
                onClick={handleNewRequest}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Another Request
              </motion.button>
              
              <motion.button
                onClick={handleBackToHome}
                className="flex-1 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-gray-900 px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Back to Support</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="text-2xl font-bold text-gray-900 mb-8"
              variants={itemVariants}
            >
              Submit a Support Request
            </motion.h2>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3"
                variants={itemVariants}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.div className="space-y-5" variants={containerVariants}>
              <motion.div className="space-y-1" variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#32CD32]/50 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>

              <motion.div className="space-y-1" variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#32CD32]/50 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>

              <motion.div className="space-y-1" variants={itemVariants}>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#32CD32]" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., 9881679994"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#32CD32]/50 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Providing your phone number allows us to call you for immediate assistance
                </p>
              </motion.div>

              <motion.div className="space-y-1" variants={itemVariants}>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Brief description of your issue"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#32CD32]/50 focus:border-transparent transition-all"
                />
              </motion.div>

              <motion.div className="space-y-1" variants={itemVariants}>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Please describe your issue in detail..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#32CD32]/50 focus:border-transparent transition-all resize-none"
                />
              </motion.div>

              <motion.div className="flex justify-between pt-4" variants={itemVariants}>
                <motion.button
                  type="button"
                  onClick={handleBackToHome}
                  className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-gray-900 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'
                  }`}
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}