"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Mic, 
  MessageCircle, 
  CreditCard,
  X,
  Send,
  ChevronRight,
  Sparkles,
  Shield,
  Activity
} from 'lucide-react';

const Home = () => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'ai', message: 'Hello! How can I assist you with your banking needs today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleOptionClick = (path: string) => {
    router.push(path);
  };

  // Generate particles for background animation
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3
  }));

  const features = [
    {
      id: 'facial',
      title: 'Facial Authentication',
      icon: Scan,
      bullets: ['Secure face login', 'Device compatibility', 'Passwordless access'],
      gradient: 'from-[#9AFF9A] via-[#7FFF00] to-[#32CD32]'
    },
    {
      id: 'voice',
      title: 'Voice Banking',
      icon: Mic,
      bullets: ['Hands-free banking', 'Natural language', 'Voice commands'],
      gradient: 'from-[#7FFF00] via-[#ADFF2F] to-[#9AFF9A]'
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      icon: MessageCircle,
      bullets: ['24/7 support', 'Smart insights', 'Personal advisor'],
      gradient: 'from-[#32CD32] via-[#7FFF00] to-[#ADFF2F]'
    },
    {
      id: 'smart',
      title: 'Smart Cards',
      icon: CreditCard,
      bullets: ['Digital wallet', 'Instant payments', 'Fraud protection'],
      gradient: 'from-[#ADFF2F] via-[#9AFF9A] to-[#32CD32]'
    }
  ];

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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        { id: Date.now(), type: 'user', message: newMessage },
        { id: Date.now() + 1, type: 'ai', message: 'I understand your request. Let me help you with that.' }
      ]);
      setNewMessage('');
    }
  };

  // Header Component - FIXED
const Header = () => (
  <motion.div 
    className="relative h-[600px] w-full bg-gradient-to-br from-[#7FFF00] via-[#32CD32] to-[#9AFF9A] overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
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

    {/* Full-width container without padding constraints */}
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
        
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Security', 'Support', 'About'].map((item, index) => (
            <motion.button 
              key={item} 
              className="text-[#1a2332] hover:text-white font-semibold transition-all duration-300 relative group"
              whileHover={{ y: -2, scale: 1.05 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {item}
              <motion.div 
                className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"
                whileHover={{ width: "100%" }}
              />
            </motion.button>
          ))}
          <motion.button
            onClick={() => handleOptionClick('/FaceAuth')}
            className="bg-[#1a2332] text-white px-6 py-2.5 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 20px 25px -5px rgba(26, 35, 50, 0.3)",
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            Sign In
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Content */}
      <div className="flex-1 flex items-center">
        <div className="max-w-4xl">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-[#1a2332]"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.span
              animate={{ 
                textShadow: ["0 0 0px rgba(26, 35, 50, 0.3)", "0 5px 10px rgba(26, 35, 50, 0.3)", "0 0 0px rgba(26, 35, 50, 0.3)"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Banking Reimagined
            </motion.span>
            <motion.span 
              className="block text-white"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              for the Digital Age
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-[#1a2332]/80 mb-10 max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Experience the future of finance with AI-powered insights, seamless transactions, and unparalleled security.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <motion.button
              onClick={() => handleOptionClick('/FaceAuth')}
              className="bg-[#1a2332] text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-2xl flex items-center gap-3 group"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 35px -5px rgba(26, 35, 50, 0.4)",
                y: -3
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Get Started
              </motion.span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </motion.button>
            
            <motion.button 
              className="border-3 border-[#1a2332] text-[#1a2332] px-8 py-3.5 rounded-2xl font-bold text-lg hover:bg-[#1a2332] hover:text-white transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 20px -5px rgba(26, 35, 50, 0.2)",
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>

    {/* Enhanced gradient overlay */}
    <motion.div 
      className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/30 via-transparent to-[#1a2332]/20 z-0"
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
  </motion.div>
);

  // Footer Component
  const Footer = () => (
    <motion.footer 
      className="bg-gradient-to-t from-[#1a2332] to-[#2a3441] mt-24 py-20"
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-xl flex items-center justify-center">
                <div className="relative">
                  <div className="text-lg font-bold text-[#1a2332]">S</div>
                  <div className="absolute -right-0.5 top-0.5 w-1.5 h-1.5 bg-[#1a2332] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">SAMADHAN</div>
                <div className="text-[#7FFF00] text-sm">AI Banking Platform</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Revolutionizing banking for the digital age with cutting-edge AI technology and unmatched security.
            </p>
          </motion.div>
          
          {[
            { title: 'Products', items: ['AI Assistant', 'Face Auth', 'Voice Banking', 'Smart Cards'] },
            { title: 'Company', items: ['About Us', 'Leadership', 'Careers', 'News'] },
            { title: 'Support', items: ['Help Center', 'Contact', 'Security', 'Status'] }
          ].map((section, index) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-xl mb-6 text-[#7FFF00]">{section.title}</h3>
              <ul className="space-y-4">
                {section.items.map((item) => (
                  <li key={item}>
                    <motion.a 
                      href="#" 
                      className="text-gray-300 hover:text-[#32CD32] transition-colors duration-300 flex items-center gap-2 group"
                      whileHover={{ x: 5 }}
                    >
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="border-t border-gray-600 mt-16 pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-400">
            © 2024 Samadhan AI Banking Platform. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );

  const FacialAuthModal = () => (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-white to-[#7FFF00]/10 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl border border-[#7FFF00]/20"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="text-center">
          <motion.div
            className="w-32 h-32 mx-auto mb-8 relative"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-[#7FFF00]/30 to-transparent rounded-full"></div>
            <div className="absolute inset-4 bg-gradient-radial from-[#32CD32]/50 to-transparent rounded-full"></div>
            <Scan className="w-16 h-16 text-[#1a2332] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <motion.div
              className="absolute inset-0 border-4 border-[#7FFF00] rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <h3 className="text-3xl font-bold text-[#1a2332] mb-4">Face Authentication</h3>
          <p className="text-[#1a2332]/70 mb-8 text-lg">Position your face within the scanning area</p>
          <motion.button
            onClick={() => setActiveModal(null)}
            className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] px-8 py-3 rounded-2xl font-bold shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel Scan
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  const VoiceModal = () => (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-white to-[#32CD32]/10 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl border border-[#32CD32]/20"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="text-center">
          <motion.div
            className="w-32 h-32 mx-auto mb-8 relative flex items-center justify-center"
          >
            <Mic className="w-16 h-16 text-[#1a2332] z-10" />
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 border-2 border-[#32CD32] rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 0, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.div>
          <h3 className="text-3xl font-bold text-[#1a2332] mb-4">Voice Banking</h3>
          <p className="text-[#1a2332]/70 mb-4 text-lg">Listening for your command...</p>
          <motion.div
            className="flex justify-center gap-2 mb-8"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 bg-[#32CD32] rounded-full"
                animate={{ height: [15, 30, 15] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
          <motion.button
            onClick={() => setActiveModal(null)}
            className="bg-gradient-to-r from-[#32CD32] to-[#7FFF00] text-[#1a2332] px-8 py-3 rounded-2xl font-bold shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Stop Listening
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  const AIModal = () => (
    <motion.div
      className="fixed bottom-8 right-8 bg-gradient-to-br from-white to-[#9AFF9A]/10 rounded-3xl p-6 w-96 shadow-2xl z-50 border border-[#9AFF9A]/30"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#1a2332]" />
          </div>
          <h3 className="text-xl font-bold text-[#1a2332]">AI Assistant</h3>
        </div>
        <motion.button
          onClick={() => setActiveModal(null)}
          className="text-[#1a2332]/50 hover:text-[#1a2332]"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
      
      <div className="h-80 overflow-y-auto mb-4 bg-gradient-to-b from-[#7FFF00]/5 to-[#32CD32]/5 rounded-2xl p-4">
        <AnimatePresence>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex gap-3 mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.type === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#1a2332]" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-[#1a2332] text-white' 
                  : 'bg-white text-[#1a2332] shadow-md border border-[#7FFF00]/20'
              }`}>
                {msg.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-gradient-to-r from-[#7FFF00]/10 to-[#32CD32]/10 border-2 border-[#7FFF00]/30 rounded-xl px-4 py-2 focus:outline-none focus:border-[#32CD32] text-[#1a2332]"
        />
        <motion.button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-[#7FFF00] to-[#32CD32] text-[#1a2332] p-2 rounded-xl shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fff8] to-[#f0fff0] relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-8 py-24">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-6xl font-bold text-[#1a2332] mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Next-Generation Banking
          </motion.h2>
          <motion.p 
            className="text-2xl text-[#1a2332]/70 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Experience banking that's smarter, faster, and more secure with our AI-powered features
          </motion.p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.id}
                className={`bg-gradient-to-br ${feature.gradient} p-8 rounded-3xl shadow-2xl cursor-pointer relative overflow-hidden border border-white/50`}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                onClick={() => setActiveModal(feature.id)}
              >
                <motion.div
                  className="relative z-10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <motion.div
                    className="w-16 h-16 bg-[#1a2332] rounded-2xl flex items-center justify-center mb-6 shadow-xl"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent className="w-8 h-8 text-[#7FFF00]" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-[#1a2332] mb-6">
                    {feature.title}
                  </h3>
                  
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet, bulletIndex) => (
                      <motion.li
                        key={bulletIndex}
                        className="flex items-center gap-3 text-[#1a2332]/80 font-medium"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + bulletIndex * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-[#1a2332] rounded-full" />
                        {bullet}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                {/* Hover Effect Overlay */}
                <motion.div
                  className="absolute inset-0 bg-white/10 opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Security Section */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-5xl font-bold text-[#1a2332] mb-6">
              Military-Grade Security
            </div>
            <p className="text-xl text-[#1a2332]/80 mb-8 leading-relaxed">
              Your financial data is protected with bank-level encryption and 
              biometric authentication. Our AI continuously monitors for 
              suspicious activity to keep your assets safe.
            </p>
            <div className="flex flex-wrap gap-4">
              {['256-bit Encryption', 'Biometric Auth', 'AI Monitoring', 'Fraud Detection'].map((item, i) => (
                <motion.div
                  key={item}
                  className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-[#7FFF00]/30 shadow-sm"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#32CD32]" />
                    <span className="font-medium text-[#1a2332]">{item}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            className="relative h-[500px] rounded-[40px] overflow-hidden border-4 border-white shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332] to-[#2a3441]"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="relative w-64 h-64 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7FFF00] to-[#32CD32] rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute inset-8 border-4 border-[#7FFF00]/30 rounded-full"></div>
                <Activity className="w-32 h-32 text-[#7FFF00] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a2332] px-4 py-2 rounded-full border border-[#7FFF00]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#7FFF00] rounded-full"></div>
                    <span className="text-[#7FFF00] text-sm font-medium">Active</span>
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Real-time Protection</h3>
              <p className="text-gray-300 text-center max-w-md">
                Our AI security system monitors your account 24/7 to detect and prevent unauthorized access
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'facial' && <FacialAuthModal />}
        {activeModal === 'voice' && <VoiceModal />}
        {activeModal === 'ai' && <AIModal />}
      </AnimatePresence>
    </div>
  );
};

export default Home;