import axios from 'axios';

// Types for the API response
export interface HospitalVerificationResult {
  exists: boolean;
  suggestions: string[];
  message: string;
  confidence?: number;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface EmergencyFundingForm {
  hospitalName: string;
  hospitalLocation: string;
  patientName: string;
  emergencyType: string;
  medicalReports: File[];
  estimatedAmount: number;
  contactNumber: string;
  email: string;
}

class HospitalVerificationService {
  private readonly API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY ;
  private readonly BASE_URL = 'https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete';

  /**
   * Verifies if a hospital exists by searching through Google Maps API
   * @param hospitalName - Name of the hospital to verify
   * @param location - Location where the hospital is supposed to be
   * @param coordinates - Optional coordinates for better search results
   * @returns Promise with verification result
   */
  async verifyHospital(
    hospitalName: string,
    location: string,
    coordinates?: LocationCoordinates
  ): Promise<HospitalVerificationResult> {
    try {
      // Clean and format the search query
      const cleanHospitalName = hospitalName.trim();
      const cleanLocation = location.trim();
      
      // Try multiple search variations for better results
      const searchQueries = [
        `${cleanHospitalName} ${cleanLocation}`,
        `${cleanHospitalName} hospital ${cleanLocation}`,
        `${cleanHospitalName} medical center ${cleanLocation}`,
        `hospital ${cleanHospitalName} ${cleanLocation}`,
        `${cleanHospitalName} ${cleanLocation} hospital`,
        `${cleanLocation} ${cleanHospitalName}`
      ];

      console.log('Searching for hospital with queries:', searchQueries);

      let allSuggestions: string[] = [];

      for (const query of searchQueries) {
        console.log(`\n=== Searching with query: "${query}" ===`);
        const result = await this.searchWithQuery(query, coordinates);
        
        console.log(`Query "${query}" returned ${result.suggestions.length} suggestions:`, result.suggestions);
        
        if (result.suggestions.length > 0) {
          allSuggestions.push(...result.suggestions);
        }
      }

      // Remove duplicates
      const uniqueSuggestions = [...new Set(allSuggestions)];
      console.log('All unique suggestions:', uniqueSuggestions);

      if (uniqueSuggestions.length > 0) {
        const verification = this.verifyHospitalMatch(cleanHospitalName, uniqueSuggestions);
        
        return {
          exists: verification.exists,
          suggestions: uniqueSuggestions,
          message: verification.exists 
            ? `Hospital "${cleanHospitalName}" verified successfully in ${cleanLocation}!`
            : `Hospital "${cleanHospitalName}" not found exactly, but found ${uniqueSuggestions.length} similar hospitals in ${cleanLocation}:`,
          confidence: verification.confidence
        };
      }

      return {
        exists: false,
        suggestions: [],
        message: `No hospitals found matching "${cleanHospitalName}" in ${cleanLocation}. Please check the spelling and location.`
      };

    } catch (error: any) {
      console.error('Error verifying hospital:', error);
      return this.handleError(error);
    }
  }

  /**
   * Searches with a specific query
   * @param query - Search query
   * @param coordinates - Optional coordinates
   * @returns Promise with search results
   */
  private async searchWithQuery(
    query: string,
    coordinates?: LocationCoordinates
  ): Promise<{ suggestions: string[] }> {
    const options = {
      method: 'POST',
      url: this.BASE_URL,
      headers: {
        'x-rapidapi-key': this.API_KEY,
        'x-rapidapi-host': 'google-map-places-new-v2.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        input: query,
        locationBias: coordinates ? {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            },
            radius: 50000
          }
        } : undefined,
        includedPrimaryTypes: ['hospital', 'health'],
        languageCode: 'en',
        regionCode: 'IN',
        inputOffset: 0,
        includeQueryPredictions: true,
        sessionToken: this.generateSessionToken()
      }
    };

    try {
      const response = await axios.request(options);
      console.log(`\n--- API Response for "${query}" ---`);
      console.log('Status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      const suggestions = this.extractSuggestions(response.data);
      console.log('Extracted suggestions:', suggestions);
      
      return suggestions;
    } catch (error: any) {
      console.error(`Error with query "${query}":`, error.response?.data || error.message);
      return { suggestions: [] };
    }
  }

  /**
   * Extracts suggestions from API response - Fixed version
   * @param data - API response data
   * @returns Extracted suggestions
   */
  private extractSuggestions(data: any): { suggestions: string[] } {
    const suggestions: string[] = [];

    if (!data) {
      console.log('No data received from API');
      return { suggestions };
    }

    console.log('Processing API response data...');

    // Handle different possible response structures
    let items: any[] = [];
    
    // Try different possible paths for the response data
    if (data.suggestions && Array.isArray(data.suggestions)) {
      items = data.suggestions;
      console.log('Found suggestions array:', items.length, 'items');
    } else if (data.predictions && Array.isArray(data.predictions)) {
      items = data.predictions;
      console.log('Found predictions array:', items.length, 'items');
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
      console.log('Found results array:', items.length, 'items');
    } else if (Array.isArray(data)) {
      items = data;
      console.log('Data is array:', items.length, 'items');
    } else {
      console.log('No recognizable array structure found in response');
      console.log('Available keys:', Object.keys(data));
      
      // Try to find any array in the response
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          items = data[key];
          console.log(`Found array at key "${key}":`, items.length, 'items');
          break;
        }
      }
    }
    
    console.log('Processing', items.length, 'items...');
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\nProcessing item ${i + 1}:`, JSON.stringify(item, null, 2));
      
      const text = this.extractTextFromItem(item);
      console.log(`Extracted text from item ${i + 1}: "${text}"`);
      
      if (text) {
        const isHospital = this.isHospitalRelated(text);
        console.log(`Is hospital related: ${isHospital}`);
        
        if (isHospital) {
          suggestions.push(text);
          console.log(`Added to suggestions: "${text}"`);
        }
      }
    }

    console.log('Final suggestions:', suggestions);
    return { suggestions: [...new Set(suggestions)] }; // Remove duplicates
  }

  /**
   * Extracts text from a single item in various formats - Enhanced version
   * @param item - Item from API response
   * @returns Extracted text or null
   */
  private extractTextFromItem(item: any): string | null {
    if (!item) return null;

    console.log('Extracting text from item:', JSON.stringify(item, null, 2));

    // Try different possible structures
    const possiblePaths = [
      // Query prediction structures
      item?.queryPrediction?.structuredFormat?.mainText?.text,
      item?.queryPrediction?.structuredFormat?.mainText,
      item?.queryPrediction?.text?.text,
      item?.queryPrediction?.text,
      item?.queryPrediction,
      
      // Place prediction structures
      item?.placePrediction?.structuredFormat?.mainText?.text,
      item?.placePrediction?.structuredFormat?.mainText,
      item?.placePrediction?.text?.text,
      item?.placePrediction?.text,
      item?.placePrediction,
      
      // Direct structures
      item?.structuredFormat?.mainText?.text,
      item?.structuredFormat?.mainText,
      item?.text?.text,
      item?.description,
      item?.displayName,
      item?.name,
      item?.title,
      item?.text,
      
      // If item is a string
      typeof item === 'string' ? item : null
    ];

    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && path.trim().length > 0) {
        const cleanText = path.trim();
        console.log(`Found text: "${cleanText}"`);
        return cleanText;
      }
    }

    // If no text found, try to extract from any string property
    if (typeof item === 'object') {
      for (const key of Object.keys(item)) {
        const value = item[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          console.log(`Found text in key "${key}": "${value}"`);
          return value.trim();
        }
        
        // Check nested objects
        if (typeof value === 'object' && value !== null) {
          const nestedText = this.extractTextFromItem(value);
          if (nestedText) {
            console.log(`Found nested text: "${nestedText}"`);
            return nestedText;
          }
        }
      }
    }

    console.log('No text found in item');
    return null;
  }

  /**
   * Checks if a suggestion is hospital-related - Enhanced version
   * @param text - Text to check
   * @returns Boolean indicating if it's hospital-related
   */
  private isHospitalRelated(text: string): boolean {
    const textLower = text.toLowerCase();
    
    // Expanded list of hospital-related keywords
    const hospitalKeywords = [
      'hospital', 'medical', 'clinic', 'health', 'healthcare', 'care',
      'emergency', 'nursing', 'trauma', 'surgery', 'medicare',
      'medical center', 'medical centre', 'medical college', 'general hospital',
      'multispecialty', 'multi specialty', 'super specialty', 'cancer center',
      'heart institute', 'eye hospital', 'dental clinic', 'dispensary',
      'polyclinic', 'nursing home', 'maternity', 'pediatric', 'psychiatric',
      'rehabilitation', 'dialysis', 'diagnostic', 'pathology', 'radiology',
      'cardiology', 'orthopedic', 'neurology', 'oncology', 'icu', 'ot',
      'operation theater', 'emergency ward', 'casualty', 'ambulance',
      'blood bank', 'pharmacy', 'laboratory', 'scan center', 'imaging'
    ];
    
    const isRelated = hospitalKeywords.some(keyword => textLower.includes(keyword));
    console.log(`Checking if "${text}" is hospital-related: ${isRelated}`);
    
    return isRelated;
  }

  /**
   * Verifies if any suggestion matches the hospital name - Enhanced version
   * @param hospitalName - Original hospital name
   * @param suggestions - List of suggestions
   * @returns Verification result with confidence
   */
  private verifyHospitalMatch(hospitalName: string, suggestions: string[]): {
    exists: boolean;
    confidence: number;
  } {
    const hospitalNameLower = hospitalName.toLowerCase();
    let maxConfidence = 0;
    let exists = false;

    console.log(`\nVerifying hospital match for: "${hospitalName}"`);
    console.log('Against suggestions:', suggestions);

    for (const suggestion of suggestions) {
      const suggestionLower = suggestion.toLowerCase();
      
      console.log(`\nChecking suggestion: "${suggestion}"`);
      
      // Check for exact match
      if (suggestionLower.includes(hospitalNameLower) || 
          hospitalNameLower.includes(suggestionLower)) {
        exists = true;
        maxConfidence = Math.max(maxConfidence, 0.9);
        console.log(`Exact match found with confidence 0.9`);
        continue;
      }

      // Check for word-based matching
      const hospitalWords = hospitalNameLower.split(/\s+/).filter(word => word.length > 2);
      const suggestionWords = suggestionLower.split(/\s+/).filter(word => word.length > 2);
      
      let matchingWords = 0;
      for (const hospitalWord of hospitalWords) {
        if (suggestionWords.some(suggestionWord => 
          suggestionWord.includes(hospitalWord) || hospitalWord.includes(suggestionWord)
        )) {
          matchingWords++;
        }
      }
      
      const wordMatchRatio = matchingWords / hospitalWords.length;
      console.log(`Word match ratio: ${wordMatchRatio} (${matchingWords}/${hospitalWords.length})`);
      
      if (wordMatchRatio > 0.5) {
        exists = true;
        maxConfidence = Math.max(maxConfidence, wordMatchRatio * 0.8);
      }

      // Check for similarity using Levenshtein distance
      const similarity = this.calculateSimilarity(hospitalNameLower, suggestionLower);
      maxConfidence = Math.max(maxConfidence, similarity);
      console.log(`Similarity score: ${similarity}`);
      
      if (similarity > 0.6) {
        exists = true;
      }
    }

    console.log(`Final result - exists: ${exists}, confidence: ${maxConfidence}`);
    return { exists, confidence: maxConfidence };
  }

  /**
   * Searches for hospitals in a specific location
   * @param location - Location to search for hospitals
   * @param coordinates - Optional coordinates for better search results
   * @returns Promise with list of hospitals
   */
  async searchHospitalsInLocation(
    location: string,
    coordinates?: LocationCoordinates
  ): Promise<string[]> {
    try {
      const searchQueries = [
        `hospitals in ${location}`,
        `medical centers in ${location}`,
        `healthcare facilities in ${location}`,
        `${location} hospitals`,
        `${location} medical center`,
        `${location} clinic`
      ];

      const allHospitals: string[] = [];

      for (const query of searchQueries) {
        const result = await this.searchWithQuery(query, coordinates);
        allHospitals.push(...result.suggestions);
      }

      // Remove duplicates and return
      return [...new Set(allHospitals)];
    } catch (error) {
      console.error('Error searching hospitals:', error);
      return [];
    }
  }

  /**
   * Handles API errors
   * @param error - Error object
   * @returns Error result
   */
  private handleError(error: any): HospitalVerificationResult {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return {
        exists: false,
        suggestions: [],
        message: 'API authentication failed. Please check your API key.'
      };
    } else if (error.response?.status === 429) {
      return {
        exists: false,
        suggestions: [],
        message: 'Rate limit exceeded. Please wait a moment and try again.'
      };
    } else if (error.response?.status === 400) {
      return {
        exists: false,
        suggestions: [],
        message: 'Invalid request. Please check your input and try again.'
      };
    } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return {
        exists: false,
        suggestions: [],
        message: 'Network error. Please check your internet connection and try again.'
      };
    } else {
      return {
        exists: false,
        suggestions: [],
        message: `Unable to verify hospital: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Calculates similarity between two strings using Levenshtein distance
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Generates a session token for API requests
   * @returns Session token string
   */
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Test method to verify API connectivity
   * @returns Promise with test result
   */
  async testAPI(): Promise<{ success: boolean; message: string }> {
    try {
      const testQuery = "Apollo Hospital Mumbai";
      
      const options = {
        method: 'POST',
        url: this.BASE_URL,
        headers: {
          'x-rapidapi-key': this.API_KEY,
          'x-rapidapi-host': 'google-map-places-new-v2.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        data: {
          input: testQuery,
          includedPrimaryTypes: ['hospital'],
          languageCode: 'en',
          regionCode: 'IN',
          includeQueryPredictions: true,
          sessionToken: this.generateSessionToken()
        }
      };

      const response = await axios.request(options);
      
      if (response.status === 200) {
        const suggestions = this.extractSuggestions(response.data);
        return {
          success: true,
          message: `API test successful. Found ${suggestions.suggestions.length} results. Sample: ${suggestions.suggestions[0] || 'No results'}`
        };
      } else {
        return {
          success: false,
          message: `API test failed with status: ${response.status}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `API test failed: ${error.response?.data?.message || error.message}`
      };
    }
  }

  /**
   * Validates emergency funding form data
   * @param formData - Form data to validate
   * @returns Validation result
   */
  validateEmergencyForm(formData: EmergencyFundingForm): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.hospitalName || formData.hospitalName.trim().length < 2) {
      errors.push('Hospital name is required and must be at least 2 characters long');
    }

    if (!formData.hospitalLocation || formData.hospitalLocation.trim().length < 2) {
      errors.push('Hospital location is required and must be at least 2 characters long');
    }

    if (!formData.patientName || formData.patientName.trim().length < 2) {
      errors.push('Patient name is required and must be at least 2 characters long');
    }

    if (!formData.emergencyType || formData.emergencyType.trim().length < 5) {
      errors.push('Emergency type description is required and must be at least 5 characters long');
    }

    if (!formData.medicalReports || formData.medicalReports.length === 0) {
      errors.push('At least one medical report is required');
    }

    if (!formData.estimatedAmount || formData.estimatedAmount <= 0) {
      errors.push('Estimated amount must be greater than 0');
    }

    if (!formData.contactNumber || !/^\+?[\d\s-()]{10,}$/.test(formData.contactNumber)) {
      errors.push('Valid contact number is required');
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Valid email address is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formats currency for display
   * @param amount - Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  /**
   * Gets user's current location
   * @returns Promise with coordinates
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000
        }
      );
    });
  }
}

// Export singleton instance
export const hospitalVerificationService = new HospitalVerificationService();
export default hospitalVerificationService;