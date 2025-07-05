'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, MessageCircle, ChevronRight, Sparkles, Headphones, Clock, Shield, ArrowLeft } from 'lucide-react';

export default function SupportChoicePage() {
  const router = useRouter();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  const handleBackToDashboard = () => {
    router.push('/UserDashboard');
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column - Contact Theme */}
      <motion.div 
        className="w-full md:w-1/2 bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] p-8 md:p-12 lg:p-16 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-[#1a2332] hover:text-white transition-colors self-start mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
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
            We're Here to Help
          </motion.h1>
          
          <motion.p 
            className="text-lg text-[#1a2332]/90 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Our dedicated support team is available 24/7 to assist you with any questions or issues you may have.
          </motion.p>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Headphones className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">24/7 Availability</h3>
                <p className="text-[#1a2332]/80">We're always here to help, day or night.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Clock className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Fast Response</h3>
                <p className="text-[#1a2332]/80">Average response time under 2 minutes.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-[#1a2332]/10 p-3 rounded-full">
                <Shield className="w-6 h-6 text-[#1a2332]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2332]">Secure Support</h3>
                <p className="text-[#1a2332]/80">All communications are encrypted for your safety.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Right Column - Support Options */}
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
            How would you like to contact support?
          </motion.h2>

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Audio Support Option */}
            <motion.div
              className="bg-gradient-to-br from-[#9AFF9A] via-[#7FFF00] to-[#32CD32] p-6 rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border border-white/50"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onClick={() => handleOptionClick('/support/audio')}
              onMouseEnter={() => setHoveredOption('audio')}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1a2332] rounded-xl flex items-center justify-center shadow-md">
                    <Mic className="w-6 h-6 text-[#7FFF00]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a2332]">Audio Support</h3>
                </div>
                
                <p className="text-[#1a2332]/80 mb-6 leading-relaxed">
                  Speak with our support team directly through a voice call for immediate assistance.
                </p>
                
                <motion.button 
                  className="mt-auto bg-[#1a2332] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 group self-start"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Start Audio Call</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* Text Support Option */}
            <motion.div
              className="bg-gradient-to-br from-[#7FFF00] via-[#ADFF2F] to-[#9AFF9A] p-6 rounded-2xl shadow-lg cursor-pointer relative overflow-hidden border border-white/50"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              onClick={() => handleOptionClick('/support/text')}
              onMouseEnter={() => setHoveredOption('text')}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#1a2332] rounded-xl flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-[#7FFF00]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a2332]">Text Support</h3>
                </div>
                
                <p className="text-[#1a2332]/80 mb-6 leading-relaxed">
                  Chat with our AI assistant or live agent through text messaging for detailed support.
                </p>
                
                <motion.button 
                  className="mt-auto bg-[#1a2332] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 group self-start"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Start Chat</span>
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
                <Sparkles className="w-5 h-5 text-[#32CD32]" />
                <span className="font-medium text-gray-700">AI-Powered</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
                whileHover={{ y: -3 }}
              >
                <Clock className="w-5 h-5 text-[#32CD32]" />
                <span className="font-medium text-gray-700">Instant Connection</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}