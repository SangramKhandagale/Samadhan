// File: src/app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { connectToDatabase } from '@/database/lib/mongodb';
import SupportTicket from '@/database/models/SupportTicket';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Pulls the actual error detail out of an Axios response so we log what the API said, not just "400". */
function extractAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.error?.message
      ?? error.response?.data?.error
      ?? error.response?.data?.message
      ?? JSON.stringify(error.response?.data);
    return `[${error.response?.status}] ${detail}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/** Safely parses the first JSON object out of a string (handles LLM preamble/markdown wrapping). */
function extractJSON<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in response');
  return JSON.parse(match[0]) as T;
}

// ─────────────────────────────────────────────
// Groq – analyse support request
// ─────────────────────────────────────────────

async function analyzeWithGroq(request: SupportRequest): Promise<GroqAnalysisResponse> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('GROQ_API_KEY is not defined');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${groqApiKey}`,
  };

  const data = {
    // ✅ llama-3.1-70b-versatile was decommissioned Jan 24 2025; use 3.3
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a professional bank customer support agent. Analyze the customer support request and provide appropriate categorization and solution.
For solveable, answer ONLY with "Yes" or "No".
For priority, answer ONLY with "High", "Medium", or "Low".
For department, answer ONLY with "Loans", "Scam", "Inquiry", or "Services".
Always respond in the same language as the customer's query.

Respond ONLY with a valid JSON object — no markdown, no preamble:
{
  "category": "Account|Technical|Billing|Product|Other",
  "priority": "High|Medium|Low",
  "department": "Loans|Scam|Inquiry|Services",
  "language": "English|Hindi|Urdu|Arabic|etc",
  "solveable": "Yes|No",
  "solution": "Clear and concise solution or next steps. Make it detailed and easily understandable."
}`,
      },
      {
        role: 'user',
        content: `Customer: ${request.name}\nPhone: ${request.phone}\nSubject: ${request.subject}\nDescription: ${request.description}`,
      },
    ],
    temperature: 0.2,
    // ✅ FIX 2 – kept well within model context limits
    max_tokens: 1024,
  };

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      data,
      { headers }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    return extractJSON<GroqAnalysisResponse>(content);
  } catch (error) {
    // ✅ FIX 3 – log the actual Groq error body so you can see WHY it failed
    console.error('❌ Groq analyzeWithGroq error:', extractAxiosError(error));
    throw error;
  }
}

// ─────────────────────────────────────────────
// Groq – summarise call transcript
// ─────────────────────────────────────────────

async function summarizeConversation(
  transcript: string,
  originalRequest: SupportRequest
): Promise<CallSummary> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('GROQ_API_KEY is not defined');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${groqApiKey}`,
  };

  const data = {
    // ✅ same corrected model
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert call analyst. Analyze the customer support conversation transcript and provide a comprehensive summary.

Respond ONLY with a valid JSON object — no markdown, no preamble:
{
  "conversationSummary": "A detailed summary of the entire conversation",
  "keyPoints": ["Key point 1", "Key point 2"],
  "customerSatisfaction": "High|Medium|Low",
  "issueResolved": "Yes|No|Partially",
  "followUpRequired": "Yes|No"
}`,
      },
      {
        role: 'user',
        content: `Original Support Request:\nCustomer: ${originalRequest.name}\nSubject: ${originalRequest.subject}\nDescription: ${originalRequest.description}\n\nCall Transcript:\n${transcript}\n\nPlease analyze this conversation and provide a comprehensive summary.`,
      },
    ],
    temperature: 0.3,
    // ✅ FIX 4 – was 3000, which can exceed context on some models; 1500 is plenty for a summary
    max_tokens: 1500,
  };

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      data,
      { headers }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    return extractJSON<CallSummary>(content);
  } catch (error) {
    console.error('❌ Groq summarizeConversation error:', extractAxiosError(error));
    throw error;
  }
}

// ─────────────────────────────────────────────
// Bland.ai – fetch call transcript
// ─────────────────────────────────────────────

async function getCallTranscript(callId: string): Promise<string> {
  const blandApiKey = process.env.BLAND_AI_API_KEY;
  if (!blandApiKey) throw new Error('BLAND_AI_API_KEY is not defined');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${blandApiKey}`,
  };

  try {
    const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
    const callData = response.data;

    if (callData?.transcript) {
      return callData.transcript;
    }

    if (Array.isArray(callData?.transcripts)) {
      return callData.transcripts
        .map((t: { speaker: string; text: string }) => `${t.speaker}: ${t.text}`)
        .join('\n');
    }

    throw new Error('No transcript found in call data');
  } catch (error) {
    console.error('❌ getCallTranscript error:', extractAxiosError(error));
    throw error;
  }
}

// ─────────────────────────────────────────────
// MongoDB – save ticket
// ─────────────────────────────────────────────

async function saveToMongoDB(
  request: SupportRequest,
  analysis: GroqAnalysisResponse,
  ticketId: string,
  callId?: string
): Promise<boolean> {
  try {
    console.log('🔄 Connecting to MongoDB…');

    await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout (15 s)')), 15000)),
    ]);

    console.log('✅ MongoDB connected');

    const ticket = new SupportTicket({
      name: request.name,
      email: request.email,
      phone: request.phone,
      subject: request.subject,
      description: request.description,
      ticketId,
      callId,
      analysis: {
        category: analysis.category,
        priority: analysis.priority,
        department: analysis.department,
        language: analysis.language,
        solveable: analysis.solveable,
        solution: analysis.solution,
      },
      callSummary: undefined,
    });

    await Promise.race([
      ticket.save(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB save timeout (10 s)')), 10000)),
    ]);

    console.log(`💾 Ticket saved – ID: ${ticketId}`);
    return true;
  } catch (error) {
    console.error('❌ saveToMongoDB error:', error instanceof Error ? error.message : error);
    return false;
  }
}

// ─────────────────────────────────────────────
// MongoDB – update call summary
// ─────────────────────────────────────────────

async function updateCallSummaryInMongoDB(ticketId: string, callSummary: CallSummary): Promise<boolean> {
  try {
    await connectToDatabase();

    const result = await SupportTicket.findOneAndUpdate(
      { ticketId },
      { callSummary, updatedAt: new Date() },
      { new: true }
    );

    if (result) {
      console.log(`📝 Call summary updated – Ticket: ${ticketId}`);
      return true;
    }

    console.error(`❌ Ticket not found: ${ticketId}`);
    return false;
  } catch (error) {
    console.error('❌ updateCallSummaryInMongoDB error:', error instanceof Error ? error.message : error);
    return false;
  }
}

// ─────────────────────────────────────────────
// Bland.ai – monitor call & summarise when done
// ─────────────────────────────────────────────

async function monitorCallAndSummarize(
  callId: string,
  originalRequest: SupportRequest,
  ticketId: string
): Promise<void> {
  const blandApiKey = process.env.BLAND_AI_API_KEY;
  if (!blandApiKey) throw new Error('BLAND_AI_API_KEY is not defined');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${blandApiKey}`,
  };

  console.log(`🔄 Monitoring call – ID: ${callId}`);

  const TERMINAL_STATES = new Set(['completed', 'ended', 'failed']);

  const monitorInterval = setInterval(async () => {
    try {
      const response = await axios.get(`https://api.bland.ai/v1/calls/${callId}`, { headers });
      const status: string = response.data?.status ?? 'unknown';
      console.log(`📞 Call status: ${status}`);

      if (!TERMINAL_STATES.has(status)) return; // still in progress – do nothing

      // Call is done – stop polling
      clearInterval(monitorInterval);
      console.log(`📞 Call ended – status: ${status}`);

      // Give Bland a moment to finalise the transcript
      setTimeout(async () => {
        try {
          const transcript = await getCallTranscript(callId);

          if (!transcript || transcript.length < 50) {
            console.log('⚠️ Transcript too short or missing – skipping summary');
            return;
          }

          console.log('📝 TRANSCRIPT:\n══════════════════\n' + transcript + '\n══════════════════');

          const summary = await summarizeConversation(transcript, originalRequest);

          console.log('📊 SUMMARY:');
          console.log('  📋 Overview      :', summary.conversationSummary);
          console.log('  🔑 Key Points    :', summary.keyPoints);
          console.log('  😊 Satisfaction  :', summary.customerSatisfaction);
          console.log('  ✅ Resolved      :', summary.issueResolved);
          console.log('  📞 Follow-up     :', summary.followUpRequired);

          await updateCallSummaryInMongoDB(ticketId, summary);
        } catch (err) {
          console.error('❌ Error processing transcript:', err instanceof Error ? err.message : err);
        }
      }, 5000);
    } catch (err) {
      console.error('❌ Error polling call status:', extractAxiosError(err));
    }
  }, 10_000); // poll every 10 s

  // Hard cap – stop monitoring after 20 min regardless
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('⏰ Call monitoring timed out (20 min)');
  }, 20 * 60 * 1000);
}

// ─────────────────────────────────────────────
// Bland.ai – initiate phone call
// ─────────────────────────────────────────────

async function makePhoneCall(
  request: SupportRequest,
  analysis: GroqAnalysisResponse
): Promise<{ success: boolean; callId?: string }> {
  const blandApiKey = process.env.BLAND_AI_API_KEY;
  if (!blandApiKey) throw new Error('BLAND_AI_API_KEY is not defined');

  // ✅ FIX 5 – phone formatting: strip non-digits, then decide country code
  const digits = request.phone.replace(/\D/g, '');

  if (digits.length < 10) {
    console.error('❌ Phone number too short:', digits);
    return { success: false };
  }

  let e164: string;
  if (digits.startsWith('91') && digits.length === 12) {
    // Already has Indian country code
    e164 = `+${digits}`;
  } else if (digits.length === 10) {
    // Bare 10-digit Indian number
    e164 = `+91${digits}`;
  } else if (digits.startsWith('1') && digits.length === 11) {
    // US number
    e164 = `+${digits}`;
  } else {
    // Assume Indian if we don't recognise the pattern
    e164 = `+91${digits.slice(-10)}`;
  }

  console.log(`📞 Dialling: ${e164}`);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${blandApiKey}`,
  };

  const languageCode = analysis.language.toLowerCase() === 'hindi' ? 'hi' : 'en';

  const data = {
    phone_number: e164,
    task: `You're a bank support representative. The customer ${request.name} has submitted a support request about: ${request.subject}. Their issue is: ${request.description}. Based on our analysis, the recommended solution is: ${analysis.solution}. Call them to follow up and provide this solution. Speak to them in ${analysis.language}. Be natural. Listen to their concerns and provide helpful assistance.`,
    voice: 'June',
    wait_for_greeting: false,
    record: true,
    amd: false,
    answered_by_enabled: false,
    noise_cancellation: false,
    interruption_threshold: 100,
    block_interruptions: false,
    max_duration: 12,
    model: 'base',
    language: languageCode,
    background_track: 'none',
    voicemail_action: 'hangup',
    transcription: true,
  };

  try {
    const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });

    if (response.data?.call_id) {
      console.log(`📞 Call initiated – ID: ${response.data.call_id}`);
      return { success: true, callId: response.data.call_id };
    }

    console.error('❌ Bland.ai did not return a call_id:', JSON.stringify(response.data));
    return { success: false };
  } catch (error) {
    console.error('❌ makePhoneCall error:', extractAxiosError(error));
    return { success: false };
  }
}

// ─────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────

async function submitSupportRequest(request: SupportRequest): Promise<SupportResponse> {
  const ticketId = `BANK-${Date.now().toString().slice(-6)}`;
  console.log(`🎫 Processing – Ticket ID: ${ticketId}`);

  try {
    // 1. Analyse with Groq
    const analysis = await analyzeWithGroq(request);
    console.log('🤖 Groq analysis complete');

    // 2. Initiate call (non-fatal if it fails)
    let callResult: { success: boolean; callId?: string } = { success: false };
    try {
      callResult = await makePhoneCall(request, analysis);
    } catch (err) {
      console.error('⚠️ Phone call failed (continuing):', err instanceof Error ? err.message : err);
    }

    // 3. Persist to MongoDB
    const saved = await saveToMongoDB(request, analysis, ticketId, callResult.callId);
    console.log(`💾 MongoDB: ${saved ? 'saved' : 'FAILED'}`);

    // 4. Background: monitor call and summarise later
    if (callResult.success && callResult.callId) {
      monitorCallAndSummarize(callResult.callId, request, ticketId);
    }

    return {
      success: saved,
      ticketId,
      callId: callResult.callId,
      analysis,
      requestData: request,
    };
  } catch (error) {
    console.error('❌ submitSupportRequest failed:', error instanceof Error ? error.message : error);
    return {
      success: false,
      ticketId,
      requestData: request,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supportRequest = body as SupportRequest;

    // Validate
    const missing = (['name', 'email', 'phone', 'subject', 'description'] as const).filter(
      (key) => !supportRequest[key]
    );

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await submitSupportRequest(supportRequest);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ POST handler error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}