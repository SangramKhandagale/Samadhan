"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User } from 'lucide-react';

// Define message type
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface ChatbotWidgetProps {
  onClose: () => void;
}

// Main component
const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_CGROQ_API_KEY;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Initial greeting messages in different languages for banking assistant
  const greetings: { [key: string]: string } = {
    'en': "Hello! I'm your AI Banking Assistant. I can help you with account information, transactions, loans, cards, and other banking services. What can I assist you with today?",
    'hi': "नमस्ते! मैं आपका AI बैंकिंग सहायक हूँ। मैं खाता जानकारी, लेन-देन, ऋण, कार्ड और अन्य बैंकिंग सेवाओं में आपकी मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?",
    'mr': "नमस्कार! मी तुमचा AI बँकिंग सहाय्यक आहे. मी खाते माहिती, व्यवहार, कर्ज, कार्ड आणि इतर बँकिंग सेवांमध्ये तुम्हाला मदत करू शकतो. आज मी तुम्हाला कशात मदत करू शकतो?",
    'ta': "வணக்கம்! நான் உங்கள் AI வங்கி உதவியாளர். கணக்கு தகவல்கள், பரிவர்த்தனைகள், கடன்கள், அட்டைகள் மற்றும் பிற வங்கி சேவைகளில் உங்களுக்கு உதவ முடியும். இன்று நான் எதில் உங்களுக்கு உதவ முடியும்?",
    'te': "నమస్కారం! నేను మీ AI బ్యాంకింగ్ అసిస్టెంట్. ఖాతా సమాచారం, లావాదేవీలు, రుణాలు, కార్డులు మరియు ఇతర బ్యాంకింగ్ సేవలలో మీకు సహాయం చేయగలను. ఈరోజు నేను మీకు ఏవిధంగా సహాయం చేయగలను?",
    'kn': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಬ್ಯಾಂಕಿಂಗ್ ಸಹಾಯಕ. ಖಾತೆ ಮಾಹಿತಿ, ವಹಿವಾಟು, ಸಾಲಗಳು, ಕಾರ್ಡ್‌ಗಳು ಮತ್ತು ಇತರ ಬ್ಯಾಂಕಿಂಗ್ ಸೇವೆಗಳಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    'gu': "નમસ્તે! હું તમારો AI બેંકિંગ સહાયક છું. હું ખાતાની માહિતી, વ્યવહારો, લોન, કાર્ડ અને અન્ય બેંકિંગ સેવાઓમાં તમારી મદદ કરી શકું છું. આજે હું તમને કેવી રીતે મદદ કરી શકું છું?",
    'pa': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਬੈਂਕਿੰਗ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਖਾਤਾ ਜਾਣਕਾਰੀ, ਲੈਣ-ਦੇਣ, ਕਰਜ਼ੇ, ਕਾਰਡ ਅਤੇ ਹੋਰ ਬੈਂਕਿੰਗ ਸੇਵਾਵਾਂ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਸਹਾਇਤਾ ਕਰ ਸਕਦਾ ਹਾਂ?"
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set initial greeting based on browser language
  useEffect(() => {
    const userLanguage = navigator.language.split('-')[0];
    const greeting = greetings[userLanguage] || greetings['en'];
    
    setMessages([
      { 
        role: 'assistant', 
        content: greeting, 
        timestamp: Date.now() 
      }
    ]);
  }, []);

  // Close chat when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Enhanced language detection for Indian languages
  const detectLanguage = (text: string): string => {
    // Remove common punctuation and normalize
    const cleanText = text.toLowerCase().replace(/[.,!?;:]/g, '');
    
    // Devanagari script detection with specific language patterns
    if (/[\u0900-\u097F]/.test(text)) {
      // Common Marathi words and patterns
      if (/\b(आहे|होते|आहेत|मी|तुम्ही|आम्ही|आपण|म्हणून|काय|कसे|कुठे|केव्हा|कोण|यांचे|त्यांचे|माझे|तुमचे|बँक|खाते|पैसे|रुपये)\b/.test(cleanText)) {
        return 'mr';
      }
      // Default to Hindi for Devanagari
      return 'hi';
    }
    
    // Tamil script
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    
    // Telugu script
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    
    // Kannada script
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    
    // Gujarati script
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
    
    // Punjabi (Gurmukhi script)
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
    
    // English banking terms detection
    if (/\b(bank|account|loan|credit|debit|card|money|transfer|balance|statement|atm|upi|payment|transaction)\b/i.test(cleanText)) {
      return 'en';
    }
    
    return 'en'; // Default to English
  };

  const getErrorMessage = (language: string, errorType: string = 'general') => {
    const errorMessages: { [key: string]: { [key: string]: string } } = {
      'en': {
        general: 'Sorry, there was an error processing your banking request. Please try again or contact customer support.',
        auth: 'Authentication failed. Please check your banking credentials.',
        network: 'Network error. Please check your connection and try again.'
      },
      'hi': {
        general: 'क्षमा करें, आपके बैंकिंग अनुरोध को प्रोसेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें या ग्राहक सेवा से संपर्क करें।',
        auth: 'प्रमाणीकरण असफल। कृपया अपने बैंकिंग क्रेडेंशियल जांचें।',
        network: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।'
      },
      'mr': {
        general: 'क्षमस्व, तुमच्या बँकिंग विनंतीवर प्रक्रिया करताना त्रुटी झाली. कृपया पुन्हा प्रयत्न करा किंवा ग्राहक सेवेशी संपर्क साधा.',
        auth: 'प्रमाणीकरण अयशस्वी. कृपया तुमचे बँकिंग क्रेडेन्शियल तपासा.',
        network: 'नेटवर्क त्रुटी. कृपया तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.'
      },
      'ta': {
        general: 'மன்னிக்கவும், உங்கள் வங்கி கோரிக்கையை செயலாக்குவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும் அல்லது வாடிக்கையாளர் சேவையைத் தொடர்பு கொள்ளவும்.',
        auth: 'அங்கீகாரம் தோல்வியுற்றது. உங்கள் வங்கி அடையாளத்தைச் சரிபார்க்கவும்.',
        network: 'நெட்வொர்க் பிழை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
      },
      'te': {
        general: 'క్షమించండి, మీ బ్యాంకింగ్ అభ్యర్థనను ప్రాసెస్ చేయడంలో లోపం జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా కస్టమర్ సపోర్ట్‌ను సంప్రదించండి.',
        auth: 'ప్రమాణీకరణ విఫలమైంది. దయచేసి మీ బ్యాంకింగ్ క్రెడెన్షియల్స్‌ను తనిఖీ చేయండి.',
        network: 'నెట్‌వర్క్ లోపం. దయచేసి మీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.'
      },
      'kn': {
        general: 'ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಗ್ರಾಹಕ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        auth: 'ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಕ್ರೆಡೆನ್ಷಿಯಲ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
        network: 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
      },
      'gu': {
        general: 'માફ કરશો, તમારી બેંકિંગ વિનંતી પ્રોસેસ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરીથી પ્રયાસ કરો અથવા કસ્ટમર સપોર્ટનો સંપર્ક કરો.',
        auth: 'પ્રમાણીકરણ નિષ્ફળ. કૃપા કરીને તમારા બેંકિંગ ક્રેડેન્શિયલ્સ તપાસો.',
        network: 'નેટવર્ક ભૂલ. કૃપા કરીને તમારું કનેક્શન તપાસો અને ફરીથી પ્રયાસ કરો.'
      },
      'pa': {
        general: 'ਮਾਫ਼ ਕਰਨਾ, ਤੁਹਾਡੀ ਬੈਂਕਿੰਗ ਬੇਨਤੀ ਦੀ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਗਲਤੀ ਹੋਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਗਾਹਕ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
        auth: 'ਪ੍ਰਮਾਣਿਕਤਾ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਬੈਂਕਿੰਗ ਕ੍ਰੇਡੈਂਸ਼ੀਅਲ ਦੀ ਜਾਂਚ ਕਰੋ।',
        network: 'ਨੈੱਟਵਰਕ ਗਲਤੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਕਨੈਕਸ਼ਨ ਚੈਕ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
      }
    };
    
    return errorMessages[language]?.[errorType] || errorMessages['en'][errorType];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Detect language of user input
      const detectedLanguage = detectLanguage(currentInput);
      
      // Prepare conversation history with banking context
      const conversationHistory = [
        {
          role: 'system',
          content: `You are a helpful AI Banking Assistant. You help users with banking services including:
          - Account information and balance inquiries
          - Transaction history and statements
          - Loan and credit card applications
          - Investment and savings products
          - UPI, NEFT, RTGS transfers
          - ATM and branch locations
          - Banking procedures and documentation
          - Interest rates and fees
          - Mobile banking and internet banking support
          
          IMPORTANT INSTRUCTIONS:
          - Always respond in the same language as the user's query
          - The detected language is: ${detectedLanguage}
          - Be professional, helpful, and secure
          - Never ask for sensitive information like passwords, PINs, or OTPs
          - Provide accurate banking information
          - If you cannot help with a specific banking issue, guide them to contact customer support
          - Keep responses concise but informative
          - Use appropriate banking terminology for each language
          
          Language-specific responses:
          - English: Use standard banking terms
          - Hindi: Use common Hindi banking terms like खाता (account), रुपये (rupees), लेन-देन (transaction)
          - Marathi: Use Marathi banking terms like खाते (account), पैसे (money), व्यवहार (transaction)
          - Tamil: Use Tamil banking terms like கணக்கு (account), பணம் (money), பரிவர்த்தனை (transaction)
          - Telugu: Use Telugu banking terms like ఖాతా (account), డబ్బు (money), లావాదేవీ (transaction)
          - Kannada: Use Kannada banking terms like ಖಾತೆ (account), ಹಣ (money), ವಹಿವಾಟು (transaction)
          - Gujarati: Use Gujarati banking terms like ખાતું (account), પૈસા (money), વ્યવહાર (transaction)
          - Punjabi: Use Punjabi banking terms like ਖਾਤਾ (account), ਪੈਸੇ (money), ਲੈਣ-ਦੇਣ (transaction)`
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: userMessage.role,
          content: userMessage.content,
        }
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: conversationHistory,
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        }),
      });

      if (!response.ok) {
        let errorType = 'general';
        if (response.status === 401) {
          errorType = 'auth';
        } else if (response.status >= 500) {
          errorType = 'network';
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error calling API:', error);
      
      const detectedLanguage = detectLanguage(currentInput);
      let errorType = 'general';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorType = 'auth';
        } else if (error.message.includes('fetch')) {
          errorType = 'network';
        }
      }
      
      const errorMessage = getErrorMessage(detectedLanguage, errorType);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: Date.now()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Glassmorphism Overlay */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: "fadeIn 0.3s ease-out forwards"
        }}
      >
        {/* Main Chat Container */}
        <div 
          ref={chatRef}
          className="w-full max-w-4xl h-[70vh] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden border border-opacity-20"
          style={{
            borderColor: '#32CD32',
            animation: "slideUp 0.4s ease-out forwards",
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(50, 205, 50, 0.1)'
          }}
        >
          {/* Header */}
          <div 
            className="p-6 border-b border-opacity-10 flex items-center justify-between"
            style={{ borderColor: '#32CD32' }}
          >
            <div className="flex items-center">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center mr-4"
                style={{
                  background: 'linear-gradient(135deg, #7FFF00 0%, #32CD32 100%)'
                }}
              >
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: '#1a2332' }}
                >
                  AI Banking Assistant
                </h1>
                <div className="flex items-center mt-1">
                  <div 
                    className="h-2 w-2 rounded-full mr-2 animate-pulse"
                    style={{ backgroundColor: '#32CD32' }}
                  ></div>
                  <span className="text-gray-500 text-sm">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50"
              aria-label="Close chat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 bg-opacity-30">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{
                  animation: "slideIn 0.3s ease-out forwards",
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {msg.role === 'assistant' && (
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center mr-3 self-end shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #32CD32 0%, #7FFF00 100%)'
                    }}
                  >
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`px-5 py-4 rounded-2xl max-w-[75%] text-base shadow-sm ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white rounded-bl-sm border border-opacity-10'
                  }`}
                  style={{
                    ...(msg.role === 'user' 
                      ? { 
                          background: 'linear-gradient(135deg, #32CD32 0%, #7FFF00 100%)',
                          boxShadow: '0 4px 12px rgba(50, 205, 50, 0.25)'
                        }
                      : { 
                          color: '#1a2332',
                          borderColor: '#32CD32'
                        }
                    )
                  }}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center ml-3 self-end shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #7FFF00 0%, #32CD32 100%)'
                    }}
                  >
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-6" style={{ animation: "fadeIn 0.3s ease-out forwards" }}>
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center mr-3 self-end shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #32CD32 0%, #7FFF00 100%)'
                  }}
                >
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div 
                  className="px-5 py-4 rounded-2xl max-w-[75%] bg-white rounded-bl-sm border border-opacity-10 shadow-sm"
                  style={{ borderColor: '#32CD32', color: '#1a2332' }}
                >
                  <div className="flex space-x-2">
                    <div 
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ backgroundColor: '#32CD32' }}
                    ></div>
                    <div 
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: '#32CD32',
                        animationDelay: '0.2s'
                      }}
                    ></div>
                    <div 
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: '#32CD32',
                        animationDelay: '0.4s'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div 
            className="p-6 border-t border-opacity-10 bg-white"
            style={{ borderColor: '#32CD32' }}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 text-base rounded-xl border border-opacity-20 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300"
                style={{
                  borderColor: '#32CD32',
                  color: '#1a2332'
                }}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              <button
                onClick={handleSubmit}
                className={`p-4 rounded-xl transition-all duration-300 shadow-sm ${
                  isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
                style={{
                  background: isLoading || !input.trim()
                    ? '#e5e7eb' 
                    : 'linear-gradient(135deg, #7FFF00 0%, #32CD32 100%)'
                }}
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;