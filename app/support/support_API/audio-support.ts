// File: src/app/api/audio-support.ts
import axios from 'axios';

export interface AudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  language: string;
  transcription?: string;
}

export interface ConversationContext {
  sessionId: string;
  messages: AudioMessage[];
  userLanguage: string;
  detectedIntent?: string;
  customerProfile?: {
    accountType?: string;
    preferredLanguage?: string;
    previousIssues?: string[];
  };
}

export interface AudioAnalysisResponse {
  intent: string;
  category: string;
  priority: string;
  department: string;
  language: string;
  needsHumanAgent: boolean;
  response: string;
  suggestedActions?: string[];
  confidence: number;
}

export interface VoiceResponse {
  success: boolean;
  sessionId: string;
  response: AudioAnalysisResponse;
  audioUrl?: string;
  conversationContext: ConversationContext;
  error?: string;
}

// Only English and Hindi supported
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi'
};

// In-memory context storage (in production, use Redis or database)
const conversationContexts = new Map<string, ConversationContext>();

// Function to convert Urdu text to Hindi (simple transliteration approach)
function convertUrduToHindi(text: string): string {
  // Basic Urdu to Hindi character mapping for common characters
  const urduToHindiMap: { [key: string]: string } = {
    // Common Urdu characters that should be converted to Hindi equivalents
    'ا': 'अ', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
    'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख', 'د': 'द', 'ڈ': 'ड',
    'ذ': 'ज़', 'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'ज़', 'س': 'स',
    'ش': 'श', 'ص': 'स', 'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': 'अ',
    'غ': 'ग़', 'ف': 'फ', 'ق': 'क़', 'ک': 'क', 'گ': 'ग', 'ل': 'ल',
    'م': 'म', 'ن': 'न', 'ں': 'ं', 'و': 'व', 'ہ': 'ह', 'ھ': 'ह',
    'ء': 'ء', 'ی': 'य', 'ے': 'ए'
  };

  let convertedText = text;
  
  // Replace Urdu characters with Hindi equivalents
  Object.entries(urduToHindiMap).forEach(([urdu, hindi]) => {
    convertedText = convertedText.replace(new RegExp(urdu, 'g'), hindi);
  });

  return convertedText;
}

// Function to transcribe audio using Groq's Whisper
async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; detectedLanguage: string }> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_CGROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');

    const headers = {
      'Authorization': `Bearer ${groqApiKey}`
    };

    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, { headers });
    
    let transcription = response.data.text || '';
    let detectedLanguage = response.data.language || 'en';
    
    // Convert Urdu to Hindi and update language
    if (detectedLanguage === 'ur' || detectedLanguage === 'urdu') {
      transcription = convertUrduToHindi(transcription);
      detectedLanguage = 'hi';
    }
    
    // Force only English or Hindi
    if (detectedLanguage !== 'en' && detectedLanguage !== 'hi') {
      detectedLanguage = 'en'; // Default to English for unsupported languages
    }
    
    console.log('Whisper detected language:', detectedLanguage);
    console.log('Transcription:', transcription);
    
    return {
      text: transcription,
      detectedLanguage: detectedLanguage
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Language detection function - only English and Hindi
function detectLanguageFromText(text: string): string {
  // If text is predominantly English characters, it's English
  const englishPattern = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  if (englishPattern.test(text.trim())) {
    return 'en';
  }
  
  // Check for Hindi/Devanagari script
  const hindiCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  
  // Check for Urdu script and convert
  const urduCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  
  if (urduCount > 0) {
    return 'hi'; // Convert Urdu to Hindi
  }
  
  if (hindiCount > 0) {
    return 'hi';
  }
  
  // Default to English if no clear script detected
  return 'en';
}

// Function to sanitize language input - only allows English and Hindi
function sanitizeLanguage(language: string): string {
  const lang = language.toLowerCase();
  
  // Convert Urdu to Hindi
  if (lang === 'ur' || lang === 'urdu' || lang.includes('urdu')) {
    return 'hi';
  }
  
  // Only allow English and Hindi
  if (lang === 'hi' || lang === 'hindi' || lang.includes('hindi')) {
    return 'hi';
  }
  
  // Default to English for everything else
  return 'en';
}

// Function to analyze audio query using Groq with context
async function analyzeAudioQuery(
  transcription: string, 
  language: string, 
  context: ConversationContext
): Promise<AudioAnalysisResponse> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_CGROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    // Sanitize language to only English or Hindi
    const sanitizedLanguage = sanitizeLanguage(language);
    
    // Convert Urdu text in transcription to Hindi if detected
    let processedTranscription = transcription;
    if (language === 'ur' || detectLanguageFromText(transcription) === 'hi') {
      processedTranscription = convertUrduToHindi(transcription);
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };

    // Build conversation history for context
    const conversationHistory = context.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const languageName = SUPPORTED_LANGUAGES[sanitizedLanguage as keyof typeof SUPPORTED_LANGUAGES];

    const systemPrompt = `You are an advanced AI banking assistant that supports ONLY English and Hindi languages. You help customers with banking services while maintaining strict privacy and security protocols.

BANKING SERVICES YOU CAN HELP WITH:
- General account information (balance inquiries without asking for account numbers)
- Card services (block/unblock guidance, PIN reset process)
- Loan information (types, eligibility criteria, general process)
- Investment guidance (FDs, mutual funds, insurance basics)
- Payment services (UPI, NEFT, RTGS information)
- General banking procedures and policies
- Branch locations and contact information

CONVERSATION CONTEXT:
${conversationHistory}

CRITICAL PRIVACY & SECURITY RULES:
- NEVER ask for or request personal details like:
  * Account numbers, card numbers, CVV, PIN
  * Aadhaar number, PAN number, passport details
  * Phone numbers, addresses, email addresses
  * Date of birth, mother's maiden name
  * Transaction details, OTP codes
- If a customer provides sensitive information, politely redirect them
- Always guide customers to visit branch or call official customer care for account-specific queries
- Focus on providing general information and guidance only

LANGUAGE INSTRUCTIONS:
- Customer language: ${languageName} (${sanitizedLanguage})
- You MUST respond ONLY in ${languageName}
- NEVER use Urdu language in any response
- If you detect any Urdu content, treat it as Hindi
- Maintain consistent language throughout the conversation

RESPONSE GUIDELINES:
- Be helpful, professional, and empathetic
- Provide general banking information without requesting personal details
- For account-specific queries, direct customers to official channels
- Always prioritize customer privacy and security
- Use natural, conversational language in ${languageName}

RESPONSE FORMAT: Respond ONLY with a JSON object:
{
  "intent": "balance_inquiry|card_services|loan_info|investment|payments|complaints|account_services|general_inquiry",
  "category": "Account|Card|Loan|Investment|Payment|Complaint|Service|General",
  "priority": "High|Medium|Low",
  "department": "Retail_Banking|Cards|Loans|Investments|Customer_Service",
  "language": "${sanitizedLanguage}",
  "needsHumanAgent": true/false,
  "response": "Helpful response in ${languageName} WITHOUT asking for personal details",
  "suggestedActions": ["action1", "action2"],
  "confidence": 0.95
}`;

    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Customer Query in ${languageName}: ${processedTranscription}
          
          IMPORTANT: 
          - Respond ONLY in ${languageName} (${sanitizedLanguage})
          - Do NOT ask for any personal or sensitive information
          - Provide general banking guidance only`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Ensure language consistency
    parsedResponse.language = sanitizedLanguage;
    
    return parsedResponse;
  } catch (error) {
    console.error('Error analyzing audio query:', error);
    throw error;
  }
}

// Function to convert text to speech using a TTS service
async function generateSpeech(text: string, language: string): Promise<string> {
  try {
    const ttsApiKey = process.env.NEXT_PUBLIC_TTS_API_KEY;
    
    if (!ttsApiKey) {
      console.warn('TTS API key not found, returning text response');
      return '';
    }

    // Only English and Hindi voices
    const sanitizedLanguage = sanitizeLanguage(language);

    const voiceMap: { [key: string]: string } = {
      'en': 'en-US-Standard-J',
      'hi': 'hi-IN-Standard-A'
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ttsApiKey}`
    };

    const data = {
      input: { text },
      voice: {
        languageCode: sanitizedLanguage,
        name: voiceMap[sanitizedLanguage] || voiceMap['en']
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      }
    };

    const response = await axios.post('https://texttospeech.googleapis.com/v1/text:synthesize', data, { headers });
    
    return response.data.audioContent || '';
  } catch (error) {
    console.error('Error generating speech:', error);
    return '';
  }
}

// Function to save conversation to Google Sheets
async function saveConversationToSheets(context: ConversationContext, analysis: AudioAnalysisResponse): Promise<boolean> {
  try {
    const baseUrl = 'https://script.google.com/macros/s/AKfycbwFS3VSjgWSQv3yIH3nLhHs4s256TpBoFtNPzZu34j-_vs_03d_daTcrJZhKFaiygfjHg/exec';
    
    const sanitizedLanguage = sanitizeLanguage(analysis.language);
    
    const params = new URLSearchParams();
    params.append('action', 'put');
    params.append('SessionID', context.sessionId);
    params.append('CustomerID', `VOICE-${context.sessionId}`);
    params.append('Name', 'Voice Customer');
    params.append('Channel', 'Voice');
    params.append('Subject', analysis.intent);
    params.append('Query', context.messages[context.messages.length - 1]?.content || '');
    params.append('Solution', analysis.response);
    params.append('Solveable', analysis.needsHumanAgent ? 'No' : 'Yes');
    params.append('Priority', analysis.priority);
    params.append('Department', analysis.department);
    params.append('Language', sanitizedLanguage);
    params.append('Phone', 'Voice Channel');
    params.append('Confidence', analysis.confidence.toString());
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const response = await axios.get(fullUrl);
    
    const responseText = response.data;
    return typeof responseText === 'string' && (
      responseText.includes("success") || 
      responseText.includes("Success") || 
      responseText.includes("Data added") || 
      responseText.includes("Updated")
    );
  } catch (error) {
    console.error('Error saving conversation to sheets:', error);
    return false;
  }
}

// Function to get or create conversation context
function getOrCreateContext(sessionId?: string, language?: string): ConversationContext {
  const id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const sanitizedLanguage = sanitizeLanguage(language || 'en');
  
  if (conversationContexts.has(id)) {
    const context = conversationContexts.get(id)!;
    if (language) {
      context.userLanguage = sanitizedLanguage;
    }
    return context;
  }
  
  const newContext: ConversationContext = {
    sessionId: id,
    messages: [],
    userLanguage: sanitizedLanguage,
    customerProfile: {}
  };
  
  conversationContexts.set(id, newContext);
  return newContext;
}

// Main function to process audio queries
export async function processAudioQuery(
  audioBlob: Blob,
  sessionId?: string
): Promise<VoiceResponse> {
  try {
    // Step 1: Transcribe audio
    const { text: transcription, detectedLanguage: audioLang } = await transcribeAudio(audioBlob);
    
    if (!transcription.trim()) {
      throw new Error('No speech detected in audio');
    }

    console.log('Original transcription:', transcription);
    console.log('Audio detected language:', audioLang);

    // Step 2: Process language detection and conversion
    let finalLanguage = audioLang;
    let processedTranscription = transcription;
    
    // If Whisper didn't detect properly, use text analysis
    if (!finalLanguage || finalLanguage === 'en') {
      const textDetectedLang = detectLanguageFromText(transcription);
      if (textDetectedLang !== 'en') {
        finalLanguage = textDetectedLang;
      }
    }
    
    // Sanitize language and convert Urdu content
    finalLanguage = sanitizeLanguage(finalLanguage);
    
    // Convert Urdu text to Hindi if detected
    if (audioLang === 'ur' || finalLanguage === 'hi') {
      processedTranscription = convertUrduToHindi(transcription);
    }
    
    console.log('Final detected language:', finalLanguage);
    console.log('Processed transcription:', processedTranscription);
    
    // Step 3: Get or create conversation context
    const context = getOrCreateContext(sessionId, finalLanguage);
    
    // Step 4: Add user message to context (with processed transcription)
    const userMessage: AudioMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: processedTranscription, // Use converted text
      timestamp: new Date(),
      language: finalLanguage,
      transcription: processedTranscription
    };
    context.messages.push(userMessage);
    
    // Step 5: Analyze the query with context
    const analysis = await analyzeAudioQuery(processedTranscription, finalLanguage, context);
    
    // Step 6: Add assistant response to context
    const assistantMessage: AudioMessage = {
      id: `msg-${Date.now()}-resp`,
      role: 'assistant',
      content: analysis.response,
      timestamp: new Date(),
      language: sanitizeLanguage(analysis.language)
    };
    context.messages.push(assistantMessage);
    
    // Step 7: Generate speech response (optional)
    let audioUrl = '';
    try {
      audioUrl = await generateSpeech(analysis.response, sanitizeLanguage(analysis.language));
    } catch (speechError) {
      console.warn('Speech generation failed:', speechError);
    }
    
    // Step 8: Save conversation to sheets
    await saveConversationToSheets(context, analysis);
    
    // Step 9: Update context in memory
    conversationContexts.set(context.sessionId, context);
    
    return {
      success: true,
      sessionId: context.sessionId,
      response: {
        ...analysis,
        language: sanitizeLanguage(analysis.language)
      },
      audioUrl,
      conversationContext: context
    };
  } catch (error) {
    console.error('Error processing audio query:', error);
    return {
      success: false,
      sessionId: sessionId || '',
      response: {
        intent: 'error',
        category: 'Error',
        priority: 'High',
        department: 'Customer_Service',
        language: 'en',
        needsHumanAgent: true,
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact our customer service.',
        confidence: 0.0
      },
      conversationContext: getOrCreateContext(sessionId),
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Function to clear conversation context (for privacy)
export function clearConversationContext(sessionId: string): boolean {
  return conversationContexts.delete(sessionId);
}

// Function to get conversation history
export function getConversationHistory(sessionId: string): AudioMessage[] {
  const context = conversationContexts.get(sessionId);
  return context?.messages || [];
}

// Function to update user language preference - only English or Hindi
export function updateUserLanguage(sessionId: string, language: string): boolean {
  const context = conversationContexts.get(sessionId);
  if (context) {
    context.userLanguage = sanitizeLanguage(language);
    conversationContexts.set(sessionId, context);
    return true;
  }
  return false;
}