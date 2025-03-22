import { SupportRequest, GroqAnalysisResponse, SupportResponse } from './text-support';

// New interface for the audio request
export interface AudioSupportRequest {
  name: string;
  email: string;
  phone: string;
  audioFile: File | Blob; // Audio file from user
}

// Enhanced response interface with localized fields
export interface LocalizedSupportResponse extends SupportResponse {
  localizedInfo: {
    ticketMessage: string;
    nextSteps: string;
    statusMessage: string;
  };
  detectedLanguage: string;
  transcriptionConfidence ?:string
}

// Function to transcribe audio using Groq's Whisper implementation
async function transcribeAudioWithGroq(audioData: Blob): Promise<{
  subject: string;
  description: string;
  detectedLanguage: string;
}> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('file', audioData, 'user_audio.webm');
    formData.append('model', 'whisper-large-v3');
    
    // Call Groq's Whisper API
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq Whisper API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract the transcription
    const transcription = data.text || '';
    
    // Detect language from transcription
    const languageResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `Identify the language of the following text. Respond with ONLY the language name in English (e.g., "English", "Hindi", "Spanish", etc.).`
          },
          {
            role: "user",
            content: transcription
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      })
    });

    const languageData = await languageResponse.json();
    const detectedLanguage = languageData.choices?.[0]?.message?.content.trim() || 'English';
    
    // Further process the transcription to extract subject and description
    // Using Groq to structure the transcription into subject and description
    const structureResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are an assistant that extracts the main subject and detailed description from customer support audio transcripts. 
            Extract a short subject line (max 10 words) and a more detailed description from the transcription.
            If the text is not in English, provide the subject and description in the ORIGINAL LANGUAGE.
            
            Respond ONLY with a JSON object in the following format:
            {
              "subject": "Brief subject of the issue",
              "description": "Detailed description of the customer's issue"
            }`
          },
          {
            role: "user",
            content: transcription
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    const structureData = await structureResponse.json();
    
    // Parse the JSON response
    const contentString = structureData.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    const parsedResult = JSON.parse(jsonMatch[0]);
    return {
      ...parsedResult,
      detectedLanguage
    };
  } catch (error) {
    console.error('Error transcribing audio with Groq:', error);
    throw error;
  }
}

// Analyze with Groq (modified to ensure response is in the same language)
async function analyzeWithGroq(request: SupportRequest, detectedLanguage: string): Promise<GroqAnalysisResponse> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a professional bank customer support agent. Analyze the customer support request and provide appropriate categorization and solution. 
            For solveable, answer ONLY with "Yes" or "No".
            For priority, answer ONLY with "High", "Medium", or "Low".
            For department, answer ONLY with "Loans", "Scam", "Inquiry", or "Services".
            
            The customer is using ${detectedLanguage}. You MUST respond with the solution in ${detectedLanguage} only.
            
            Respond ONLY with a JSON object in the following format:
            {
              "category": "Account|Technical|Billing|Product|Other",
              "priority": "High|Medium|Low",
              "department": "Loans|Scam|Inquiry|Services",
              "language": "${detectedLanguage}",
              "solveable": "Yes|No",
              "solution": "Clear and concise solution or next steps in ${detectedLanguage} language. Make it detailed and easily understandable."
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
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Groq API error: ${data.error.message}`);
    }
    
    // Parse the JSON response from Groq
    const contentString = data.choices?.[0]?.message?.content || '';
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

// Function to generate localized response messages
async function generateLocalizedMessages(ticketId: string, analysis: GroqAnalysisResponse, detectedLanguage: string): Promise<{
  ticketMessage: string;
  nextSteps: string;
  statusMessage: string;
}> {
  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key is not defined');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a professional bank customer support system. You need to generate customer-facing messages in ${detectedLanguage}.
            
            Create three messages:
            1. A message confirming ticket creation with the ticket ID
            2. Next steps information explaining what will happen next
            3. A status message indicating the request was successful
            
            All messages should be in ${detectedLanguage} ONLY.
            
            Respond ONLY with a JSON object in the following format:
            {
              "ticketMessage": "Message about ticket creation in ${detectedLanguage}",
              "nextSteps": "Information about next steps in ${detectedLanguage}",
              "statusMessage": "Status confirmation message in ${detectedLanguage}"
            }`
          },
          {
            role: "user",
            content: `Ticket ID: ${ticketId}
            Priority: ${analysis.priority}
            Department: ${analysis.department}
            Solveable: ${analysis.solveable}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Groq API error: ${data.error.message}`);
    }
    
    // Parse the JSON response from Groq
    const contentString = data.choices?.[0]?.message?.content || '';
    const jsonMatch = contentString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response from Groq');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating localized messages:', error);
    // Provide fallback messages in the detected language
    return {
      ticketMessage: `Ticket ID: ${ticketId}`,
      nextSteps: "We will process your request.",
      statusMessage: "Success"
    };
  }
}

// Reuse other functions from text-support.ts
async function saveToGoogleSheets(request: SupportRequest, analysis: GroqAnalysisResponse, ticketId: string): Promise<boolean> {
  try {
    const customerId = ticketId;

    // Fix: Use direct URL with all parameters
    const baseUrl = 'https://script.google.com/macros/s/AKfycbw-CzEZI_vkZnCb84QyoHJEW5_-rKYBwlMIloCBcHDcpjcq2SvycreyJcYGrzjJixhR/exec';
    
    // URL encode all parameters
    const params = new URLSearchParams();
    params.append('action', 'put');
    params.append('CustomerID', customerId);
    params.append('Name', request.name);
    params.append('Channel', 'Audio');  // Changed from 'Form' to 'Audio'
    params.append('Subject', request.subject);
    params.append('Query', request.description);
    params.append('Solution', analysis.solution);
    params.append('Solveable', analysis.solveable);
    params.append('Priority', analysis.priority);
    params.append('Department', analysis.department);
    params.append('Language', analysis.language);
    params.append('Phone', request.phone);
    
    // Create direct URL string with all parameters
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    // Use simple GET request
    const response = await fetch(fullUrl);
    
    // Handle plain text response instead of expecting JSON
    const responseText = await response.text();
    
    // Check if the response contains success indicators
    return responseText.includes("success") || 
           responseText.includes("Success") || 
           responseText.includes("Data added") || 
           responseText.includes("Updated");
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
}

// Main function to handle audio support requests
export async function submitAudioSupportRequest(
  request: AudioSupportRequest,
  previousConversations?: string
): Promise<LocalizedSupportResponse> {
  try {
    // Generate ticket ID
    const ticketId = `BANK-${Date.now().toString().slice(-6)}`;

    // Step 1: Transcribe the audio using Groq's Whisper and detect language
    const transcriptionResult = await transcribeAudioWithGroq(request.audioFile);
    console.log(transcriptionResult.description);

    // Convert detected language from Arabic to Hindi if applicable
    let detectedLanguage = transcriptionResult.detectedLanguage;
    if (detectedLanguage === 'ar' || detectedLanguage === 'ur') {
      detectedLanguage = 'hi';
    }

    // Step 2: Create description based on whether previousConversations exists
    const description: string = previousConversations
      ? `${previousConversations}\n\nNew request: ${transcriptionResult.description}`
      : transcriptionResult.description;

    console.log(description);

    // Step 3: Create a support request object using the appropriate description
    const supportRequest: SupportRequest = {
      name: request.name,
      email: request.email,
      phone: request.phone,
      subject: transcriptionResult.subject,
      description,
    };

    // Step 4: Analyze the request with Groq, ensuring response is in the detected language
    const analysis = await analyzeWithGroq(supportRequest, detectedLanguage);

    // Step 5: Generate localized messages
    const localizedMessages = await generateLocalizedMessages(ticketId, analysis, detectedLanguage);

    // Step 6: Save data to Google Sheets
    const sheetResult = await saveToGoogleSheets(supportRequest, analysis, ticketId);

    // Return success response with ticket ID, analysis, and the original request data
    return {
      success: sheetResult,
      ticketId,
      analysis,
      requestData: supportRequest,
      detectedLanguage,
      localizedInfo: {
        ticketMessage: localizedMessages.ticketMessage,
        nextSteps: localizedMessages.nextSteps,
        statusMessage: localizedMessages.statusMessage,
      },
    };
  } catch (error) {
    console.error('Error submitting audio support request:', error);
    return {
      success: false,
      ticketId: '',
      requestData: {
        name: request.name,
        email: request.email,
        phone: request.phone,
        subject: '',
        description: '',
      },
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      detectedLanguage: 'Unknown',
      localizedInfo: {
        ticketMessage: 'Unable to process your request at this time.',
        nextSteps: 'Please try again later.',
        statusMessage: 'Failed',
      },
    };
  }
}