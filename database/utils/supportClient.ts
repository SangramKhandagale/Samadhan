// File: src/utils/supportClient.ts (or wherever you want to place this)

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

export interface SupportResponse {
  success: boolean;
  ticketId: string;
  callId?: string;
  analysis?: GroqAnalysisResponse;
  requestData: SupportRequest;
  error?: string;
}

// Client-side function to submit support request
export async function submitSupportRequest(request: SupportRequest): Promise<SupportResponse> {
  try {
    const response = await fetch('/support/support_API/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SupportResponse = await response.json();
    return result;
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