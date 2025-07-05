import axios from 'axios';

interface CallRequest {
  name: string;
  phone: string;
  subject: string;
  description: string;
}

interface CallAnalysis {
  solution: string;
  language: string;
}

/**
 * Service to handle integration with the Bland API for phone calls
 */
export class BlandAPIService {
  private apiKey: string | undefined;
  private static instance: BlandAPIService;
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
  }
  
  /**
   * Get the singleton instance of BlandAPIService
   */
  static getInstance(): BlandAPIService {
    if (!BlandAPIService.instance) {
      BlandAPIService.instance = new BlandAPIService();
    }
    return BlandAPIService.instance;
  }
  
  /**
   * Make a phone call using Bland.ai API
   * @param request Call request details
   * @param analysis Call analysis for handling the situation
   * @returns Promise resolving to boolean indicating call success
   */
  async makePhoneCall(request: CallRequest, analysis: CallAnalysis): Promise<boolean> {
    return this.makeSecurityCall(request, analysis);
  }
  
  /**
   * Make a security notification call to the user
   * @param request Call request details
   * @param analysis Call analysis for handling the situation
   * @returns Promise resolving to boolean indicating call success
   */
  async makeSecurityCall(request: CallRequest, analysis: CallAnalysis): Promise<boolean> {
    try {
      if (!this.apiKey) {
        throw new Error('Bland.ai API key is not defined');
      }
      
      // Format the phone number to E.164 format
      const formattedPhone = request.phone.replace(/\D/g, '');
      if (!formattedPhone || formattedPhone.length < 10) {
        throw new Error('Invalid phone number');
      }
      
      // Add appropriate country code based on formatting
      const phoneWithCountryCode = formattedPhone.startsWith('1') ? 
        `+${formattedPhone}` : `+91${formattedPhone}`;
      
      // Headers for Bland.ai API
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };
      
      // Set language to Hindi by default for security calls
      const language = "hi";
      
      // Hindi script for the security call
      const hindiScript = `आप एक बैंक सुरक्षा प्रणाली हैं। ग्राहक ${request.name} के खाते में संदिग्ध लॉगिन गतिविधि हुई है: ${request.description}। उन्हें सूचित करें कि: ${analysis.solution}। यह एक स्वचालित सुरक्षा कॉल है। भाषा हिंदी में बात करें। प्राकृतिक लेकिन तत्काल होना चाहिए।`;
      
      // Enhanced Bland.ai API call configuration
      const data = {
        phone_number: phoneWithCountryCode,
        task: hindiScript,
        voice: "June",
        wait_for_greeting: false,
        record: true,
        amd: false,
        answered_by_enabled: false,
        noise_cancellation: false,
        interruption_threshold: 100,
        block_interruptions: false,
        max_duration: 12,
        model: "base",
        language: language, // Always Hindi
        background_track: "none",
        endpoint: "https://api.bland.ai",
        voicemail_action: "hangup"
      };
      
      // Log out the call data for debugging
      console.log('Making Bland.ai API call with data:', data);
      
      const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
      
      console.log('Bland.ai API response:', response.data);
      
      return !!response.data.call_id;
    } catch (error) {
      console.error('Error making phone call with Bland.ai:', error);
      return false;
    }
  }

  /**
   * Make a security notification for suspicious login attempts
   * @param userData User data including name and phone
   * @param failedAttempts Number of failed login attempts
   * @returns Promise resolving to boolean indicating call success
   */
  async notifyUserOfSuspiciousActivity(
    userData: { username: string; phone: string }, 
    failedAttempts: number
  ): Promise<boolean> {
    if (!userData.phone) {
      throw new Error('No phone number registered for notifications');
    }
      
    // Create support request object
    const request: CallRequest = {
      name: userData.username,
      phone: userData.phone,
      subject: "सुरक्षा अलर्ट: अनधिकृत लॉगिन प्रयास",
      description: `पिछले 30 मिनटों में आपके खाते में ${failedAttempts} असफल लॉगिन प्रयास हुए हैं। यह सुरक्षा उल्लंघन का प्रयास हो सकता है।`
    };
      
    // Create analysis response object with Hindi solution
    const analysis: CallAnalysis = {
      solution: "हमने आपके खाते में संदिग्ध लॉगिन गतिविधि का पता लगाया है। सुरक्षा उपाय के रूप में, हम यह सत्यापित करने के लिए कॉल कर रहे हैं कि क्या यह आप हैं जो लॉगिन करने की कोशिश कर रहे हैं। यदि नहीं, तो हम आपको तुरंत अपना पासवर्ड बदलने की सलाह देते हैं।",
      language: "hi" // Set to Hindi
    };
      
    return await this.makeSecurityCall(request, analysis);
  }

  /**
   * Check if the API key is configured
   * @returns boolean indicating if the API key is set
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export a singleton instance
export const blandApiService = BlandAPIService.getInstance();