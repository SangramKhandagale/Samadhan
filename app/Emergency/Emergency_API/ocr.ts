import axios from 'axios';

export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
  entities?: any[];
  rawResponse?: any;
}

// Fixed interface for OCR API response based on the actual structure
interface OCRApiResponse {
  results: Array<{
    status: {
      code: string;
      message: string;
    };
    name: string;
    md5: string;
    width: number;
    height: number;
    entities: Array<{
      kind: string;
      name: string;
      objects?: Array<{
        box: number[];
        entities: Array<{
          kind: string;
          name: string;
          text: string;
          confidence?: number;
        }>;
      }>;
      entities?: Array<{
        text: string;
        confidence?: number;
        bbox?: number[];
      }>;
    }>;
  }>;
}

class OCRService {
  private readonly rapidApiKey = process.env.NEXT_PUBLIC_OCR_API_KEY ;
  
  /**
   * Extract text from image using OCR API
   */
  async extractTextFromImage(imageFile: File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const options = {
        method: 'POST',
        url: 'https://ocr43.p.rapidapi.com/v1/results',
        headers: {
          'x-rapidapi-key': this.rapidApiKey,
          'x-rapidapi-host': 'ocr43.p.rapidapi.com'
        },
        data: formData
      };

      const response = await axios.request(options);
      console.log('OCR API Response:', JSON.stringify(response.data, null, 2));
      
      const apiResponse: OCRApiResponse = response.data;
      
      if (apiResponse.results && apiResponse.results.length > 0) {
        const result = apiResponse.results[0];
        
        if (result.status.code === 'ok') {
          let extractedText = '';
          let allEntities: any[] = [];
          let totalConfidence = 0;
          let confidenceCount = 0;
          
          if (result.entities && result.entities.length > 0) {
            for (const entityGroup of result.entities) {
              allEntities.push(entityGroup);
              
              // Handle the nested objects structure
              if (entityGroup.objects && entityGroup.objects.length > 0) {
                for (const obj of entityGroup.objects) {
                  if (obj.entities && obj.entities.length > 0) {
                    for (const entity of obj.entities) {
                      if (entity.text) {
                        extractedText += (extractedText ? ' ' : '') + entity.text;
                        
                        if (entity.confidence !== undefined) {
                          totalConfidence += entity.confidence;
                          confidenceCount++;
                        }
                      }
                    }
                  }
                }
              }
              
              // Handle direct entities structure (fallback)
              if (entityGroup.entities && entityGroup.entities.length > 0) {
                for (const entity of entityGroup.entities) {
                  if (entity.text) {
                    extractedText += (extractedText ? ' ' : '') + entity.text;
                    
                    if (entity.confidence !== undefined) {
                      totalConfidence += entity.confidence;
                      confidenceCount++;
                    }
                  }
                }
              }
            }
          }
          
          // Calculate average confidence
          const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.9;
          
          // Clean up extracted text
          extractedText = this.cleanExtractedText(extractedText);
          
          console.log('Extracted Text:', extractedText);
          console.log('Confidence:', averageConfidence);
          
          return {
            success: true,
            text: extractedText,
            entities: allEntities,
            confidence: averageConfidence,
            rawResponse: response.data
          };
        } else {
          return {
            success: false,
            error: result.status.message || 'OCR processing failed',
            rawResponse: response.data
          };
        }
      } else {
        return {
          success: false,
          error: 'No OCR results returned',
          rawResponse: response.data
        };
      }
    } catch (error: any) {
      console.error('OCR Error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to process image',
        rawResponse: error.response?.data
      };
    }
  }

  /**
   * Clean and format extracted text
   */
  private cleanExtractedText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  }

  /**
   * Validate file type and size
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP, or BMP)'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Get processing statistics
   */
  getProcessingInfo(result: OCRResult) {
    return {
      textLength: result.text?.length || 0,
      confidence: result.confidence || 0,
      processingTime: new Date().toISOString(),
      success: result.success
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test with a small base64 encoded test image
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await fetch(testImageBase64);
      const blob = await response.blob();
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      
      const result = await this.extractTextFromImage(testFile);
      
      return {
        success: result.success || result.error?.includes('No OCR results') || false,
        message: result.success ? 'OCR API connection successful' : `Connection test completed: ${result.error}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to OCR API'
      };
    }
  }
}

export const ocrService = new OCRService();
export default ocrService;