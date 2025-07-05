// File: src/app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {connectToDatabase} from '@/database/lib/mongodb';
import SupportTicket from '@/database/models/SupportTicket';

export interface SupportRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  detectedLanguage?: 'en' | 'hi' | 'ur' | 'ar' | string;
}

export interface GroqAnalysisResponse {
  category: string;
  priority: string;
  department: string;
  language: string;
  solveable: string;
  solution: string;
}

export interface CallSummary {
  conversationSummary: string;
  keyPoints: string[];
  customerSatisfaction: string;
  issueResolved: string;
  followUpRequired: string;
}

export interface SupportResponse {
  success: boolean;
  ticketId: string;
  callId?: string;
  analysis?: GroqAnalysisResponse;
  requestData: SupportRequest;
  error?: string;
}

// Function to analyze support request using Groq
async function analyzeWithGroq(request: SupportRequest): Promise<GroqAnalysisResponse> {
  try {
    // Use server-side environment variable (without NEXT_PUBLIC_)
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };
    
    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `You are a professional bank customer support agent. Analyze the customer support request and provide appropriate categorization and solution. 
          For solveable, answer ONLY with "Yes" or "No".
          For priority, answer ONLY with "High", "Medium", or "Low".
          For department, answer ONLY with "Loans", "Scam", "Inquiry", or "Services".
          Always respond in the same language as the customer's query.
          
          Respond ONLY with a JSON object in the following format:
          {
            "category": "Account|Technical|Billing|Product|Other",
            "priority": "High|Medium|Low",
            "department": "Loans|Scam|Inquiry|Services",
            "language": "English|Spanish|French|etc",
            "solveable": "Yes|No",
            "solution": "Clear and concise solution or next steps. make it detailed and easily understandable."
          }`
        },
        {
          role: "user",
          content: `Customer: ${request.name}
          Phone: ${request.phone}
          Subject: ${request.subject}
          Description: ${request.description}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    // Parse the JSON response from Groq
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing with Groq:', error);
    throw error;
  }
}

// Function to get call transcript from Bland.ai
async function getCallTranscript(callId: string): Promise<string> {
  try {
    // Use server-side environment variable (without NEXT_PUBLIC_)
    const blandApiKey = process.env.BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    // Get call details including transcript
    const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
    
    const callData = response.data;
    
    // Extract transcript from the call data
    if (callData && callData.transcript) {
      return callData.transcript;
    } else if (callData && callData.transcripts && Array.isArray(callData.transcripts)) {
      // Sometimes transcript is an array of transcript objects
      return callData.transcripts.map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
    }
    
    throw new Error('No transcript found in call data');
  } catch (error) {
    console.error('Error getting call transcript:', error);
    throw error;
  }
}

// Function to summarize conversation using Groq
async function summarizeConversation(transcript: string, originalRequest: SupportRequest): Promise<CallSummary> {
  try {
    // Use server-side environment variable (without NEXT_PUBLIC_)
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    };
    
    const data = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: `You are an expert call analyst. Analyze the customer support conversation transcript and provide a comprehensive summary. 
          
          Respond ONLY with a JSON object in the following format:
          {
            "conversationSummary": "A detailed summary of the entire conversation including what the customer said and how the support agent responded",
            "keyPoints": ["List of key points discussed", "Important issues raised", "Solutions provided"],
            "customerSatisfaction": "High|Medium|Low based on customer's tone and responses",
            "issueResolved": "Yes|No|Partially - based on whether the customer's issue was resolved",
            "followUpRequired": "Yes|No - whether additional follow-up is needed"
          }`
        },
        {
          role: "user",
          content: `Original Support Request:
          Customer: ${originalRequest.name}
          Subject: ${originalRequest.subject}
          Description: ${originalRequest.description}
          
          Call Transcript:
          ${transcript}
          
          Please analyze this conversation and provide a comprehensive summary.`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    };
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', data, { headers });
    
    // Parse the JSON response from Groq
    const contentString = response.data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    throw error;
  }
}

// Function to save data to MongoDB with better error handling
async function saveToMongoDB(
  request: SupportRequest, 
  analysis: GroqAnalysisResponse, 
  ticketId: string, 
  callId?: string
): Promise<boolean> {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Connect to MongoDB with timeout
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 15000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ MongoDB connection successful');
    
    // Create new support ticket document
    const supportTicket = new SupportTicket({
      // Form data
      name: request.name,
      email: request.email,
      phone: request.phone,
      subject: request.subject,
      description: request.description,
      
      // Ticket info
      ticketId: ticketId,
      callId: callId,
      
      // Groq analysis
      analysis: {
        category: analysis.category,
        priority: analysis.priority,
        department: analysis.department,
        language: analysis.language,
        solveable: analysis.solveable,
        solution: analysis.solution
      },
      
      // Call summary will be updated later when call ends
      callSummary: undefined
    });
    
    console.log('🔄 Saving support ticket to MongoDB...');
    
    // Save to database with timeout
    const savePromise = supportTicket.save();
    const saveTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB save timeout')), 10000);
    });
    
    await Promise.race([savePromise, saveTimeoutPromise]);
    
    console.log(`💾 Support ticket saved to MongoDB with ID: ${ticketId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving to MongoDB:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return false;
  }
}

// Function to update call summary in MongoDB
async function updateCallSummaryInMongoDB(ticketId: string, callSummary: CallSummary): Promise<boolean> {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Update the support ticket with call summary
    const result = await SupportTicket.findOneAndUpdate(
      { ticketId: ticketId },
      { 
        callSummary: callSummary,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (result) {
      console.log(`📝 Call summary updated in MongoDB for ticket: ${ticketId}`);
      return true;
    } else {
      console.error(`❌ Failed to find ticket with ID: ${ticketId}`);
      return false;
    }
    
  } catch (error) {
    console.error('Error updating call summary in MongoDB:', error);
    return false;
  }
}

// Function to monitor call status and get transcript when call ends
async function monitorCallAndSummarize(callId: string, originalRequest: SupportRequest, ticketId: string): Promise<void> {
  try {
    // Use server-side environment variable (without NEXT_PUBLIC_)
    const blandApiKey = process.env.BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    console.log(`🔄 Starting call monitoring for Call ID: ${callId}`);
    
    // Monitor call status every 10 seconds
    const monitorInterval = setInterval(async () => {
      try {
        const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
        const callData = response.data;
        
        console.log(`📞 Call Status: ${callData.status || 'Unknown'}`);
        
        // Check if call has ended
        if (callData.status === 'completed' || callData.status === 'ended' || callData.status === 'failed') {
          clearInterval(monitorInterval);
          
          console.log(`📞 Call ended with status: ${callData.status}`);
          
          // Wait a bit for transcript to be fully processed
          setTimeout(async () => {
            try {
              // Get the transcript
              const transcript = await getCallTranscript(callId);
              
              if (transcript && transcript.length > 50) { // Only summarize if there's substantial content
                console.log('📝 CALL TRANSCRIPT:');
                console.log('==========================================');
                console.log(transcript);
                console.log('==========================================');
                
                // Summarize the conversation
                const summary = await summarizeConversation(transcript, originalRequest);
                
                console.log('📊 CONVERSATION SUMMARY:');
                console.log('==========================================');
                console.log('📋 Overall Summary:', summary.conversationSummary);
                console.log('🔑 Key Points:', summary.keyPoints);
                console.log('😊 Customer Satisfaction:', summary.customerSatisfaction);
                console.log('✅ Issue Resolved:', summary.issueResolved);
                console.log('📞 Follow-up Required:', summary.followUpRequired);
                console.log('==========================================');
                
                // Update MongoDB with call summary
                await updateCallSummaryInMongoDB(ticketId, summary);
                
              } else {
                console.log('⚠️ No substantial transcript found or call was too short for analysis');
              }
            } catch (error) {
              console.error('❌ Error processing call transcript:', error);
            }
          }, 5000); // Wait 5 seconds after call ends to ensure transcript is ready
        }
      } catch (error) {
        console.error('Error monitoring call:', error);
      }
    }, 10000); // Check every 10 seconds
    
    // Set a maximum monitoring time of 20 minutes
    setTimeout(() => {
      clearInterval(monitorInterval);
      console.log('⏰ Call monitoring timeout reached');
    }, 20 * 60 * 1000);
    
  } catch (error) {
    console.error('Error setting up call monitoring:', error);
  }
}

// Function to make a phone call using Bland.ai - ALWAYS call the customer
async function makePhoneCall(request: SupportRequest, analysis: GroqAnalysisResponse): Promise<{ success: boolean; callId?: string }> {
  try {
    // Use server-side environment variable (without NEXT_PUBLIC_)
    const blandApiKey = process.env.BLAND_AI_API_KEY;
    
    if (!blandApiKey) {
      throw new Error('Bland.ai API key is not defined');
    }
    
    // Format the phone number to E.164 format
    const formattedPhone = request.phone.replace(/\D/g, '');
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error('Invalid phone number');
    }
    
    const phoneWithCountryCode = formattedPhone.startsWith('1') ? 
      `+${formattedPhone}` : `+91${formattedPhone}`;
    
    // Headers for Bland.ai API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${blandApiKey}`
    };
    
    // Enhanced Bland.ai API call configuration with recording enabled
    const data = {
      phone_number: phoneWithCountryCode,
      task: `You're a bank support representative. The customer ${request.name} has submitted a support request about: ${request.subject}. Their issue is: ${request.description}. Based on our analysis, the recommended solution is: ${analysis.solution}. Call them to follow up and provide this solution. Speak to them in ${analysis.language}. Make it Natural. Listen to their concerns and provide helpful assistance.`,
      voice: "June",
      wait_for_greeting: false,
      record: true, // Enable recording
      amd: false,
      answered_by_enabled: false,
      noise_cancellation: false,
      interruption_threshold: 100,
      block_interruptions: false,
      max_duration: 12,
      model: "base",
      language: analysis.language.toLowerCase() === 'hindi' ? "hi" : "en",
      background_track: "none",
      endpoint: "https://api.bland.ai",
      voicemail_action: "hangup",
      // Enhanced settings for better transcript quality
      transcription: true,
      webhook: null // You can add a webhook URL here if you want real-time updates
    };
    
    const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
    
    if (response.data.call_id) {
      console.log(`📞 Call initiated successfully. Call ID: ${response.data.call_id}`);
      return { success: true, callId: response.data.call_id };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error making phone call with Bland.ai:', error);
    return { success: false };
  }
}

// Main function to handle support requests
async function submitSupportRequest(request: SupportRequest): Promise<SupportResponse> {
  try {
    // Generate ticket ID
    const ticketId = `BANK-${Date.now().toString().slice(-6)}`;
    
    console.log(`🎫 Processing support request - Ticket ID: ${ticketId}`);
    
    // Step 1: Analyze the request with Groq
    const analysis = await analyzeWithGroq(request);
    console.log('🤖 Request analyzed with Groq AI');
    
    // Step 2: Make phone call using Bland.ai with recording
    let callResult: { success: boolean; callId?: string } = { success: false };
    try {
      callResult = await makePhoneCall(request, analysis);
      if (callResult.success) {
        console.log(`📞 Phone call initiated successfully. Call ID: ${callResult.callId}`);
      } else {
        console.log('❌ Phone call initiation failed');
      }
    } catch (callError) {
      console.error('Phone call failed, but continuing with process:', callError);
    }
    
    // Step 3: Save data to MongoDB
    const mongoResult = await saveToMongoDB(request, analysis, ticketId, callResult.callId);
    console.log(`💾 MongoDB save result: ${mongoResult ? 'Success' : 'Failed'}`);
    
    // Step 4: Start monitoring call for transcript and summary (if call was successful)
    if (callResult.success && callResult.callId) {
      monitorCallAndSummarize(callResult.callId, request, ticketId);
    }
    
    // Return success response with ticket ID, call ID, analysis, and the original request data
    return {
      success: mongoResult,
      ticketId,
      callId: callResult.callId,
      analysis,
      requestData: request
    };
  } catch (error) {
    console.error('Error submitting support request:', error);
    return {
      success: false,
      ticketId: '',
      requestData: request,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// POST handler for the API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supportRequest: SupportRequest = body;
    
    // Validate required fields
    if (!supportRequest.name || !supportRequest.email || !supportRequest.phone || 
        !supportRequest.subject || !supportRequest.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Process the support request
    const result = await submitSupportRequest(supportRequest);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}