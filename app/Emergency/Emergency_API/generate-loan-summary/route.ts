import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY // Use server-side environment variable
});

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    const {
      applicantDetails,
      hospitalDetails,
      patientDetails,
      medicalCertificate
    } = requestData;

    // Create the prompt for AI summary
    const prompt = `Create a detailed summary for a bank employee to review an emergency medical loan application. The summary should include:

1. APPLICANT DETAILS:
   - Name: ${applicantDetails.name}
   - Date of Birth: ${applicantDetails.dob}
   - Gender: ${applicantDetails.gender}
   - Aadhaar Number: ${applicantDetails.aadhaarNumber}
   - Verification Status: ${applicantDetails.verificationStatus}

2. HOSPITAL DETAILS:
   - Name: ${hospitalDetails.name}
   - Location: ${hospitalDetails.location}
   - Verification Status: ${hospitalDetails.verificationStatus}
   ${hospitalDetails.confidence ? `- Confidence: ${Math.round(hospitalDetails.confidence * 100)}%` : ''}

3. PATIENT DETAILS:
   - Patient Name: ${patientDetails.name}
   - Emergency Type: ${patientDetails.emergencyType}
   - Emergency Description: ${patientDetails.emergencyDescription}
   - Contact Number: ${patientDetails.contactNumber}
   - Relationship to Applicant: ${patientDetails.relationship}

4. MEDICAL CERTIFICATE:
   ${medicalCertificate ? `
   - Status: ${medicalCertificate.hasText ? 'Text extracted' : 'Failed to extract text'}
   - Confidence: ${medicalCertificate.confidence ? Math.round(medicalCertificate.confidence * 100) : 0}%
   - Text Length: ${medicalCertificate.textLength || 0} characters
   ` : 'No medical certificate provided'}

Format the summary professionally with clear sections and highlight any potential concerns or verification issues. Include a recommendation section for the bank employee.`;

    // Call Groq API
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      max_tokens: 2000,
      temperature: 0.7
    });

    const summary = response.choices[0]?.message?.content || '';

    return NextResponse.json({ 
      success: true, 
      summary 
    });

  } catch (error: any) {
    console.error('Error generating loan summary:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate loan summary' 
    }, { status: 500 });
  }
}