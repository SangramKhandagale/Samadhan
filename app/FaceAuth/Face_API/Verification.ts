import Tesseract from 'tesseract.js';

/**
 * Detects whether an uploaded image contains an Aadhaar card
 * by using OCR to identify Aadhaar-specific keywords or a 12-digit UID pattern
 * 
 * @param file - The uploaded image file to analyze
 * @returns Promise<boolean> - true if Aadhaar card is detected, false otherwise
 */
export async function detectAadhaarCard(file: File): Promise<boolean> {
  try {
    // Perform OCR on the uploaded image
    const result = await Tesseract.recognize(
      file,
      'eng', // English language
      { 
        logger: m => {
          // Optional: If you want to see progress in console
          // console.log(m);
        }
      }
    );

    // Extract the recognized text
    const extractedText = result.data.text;
    
    // Log the extracted text for debugging
    console.log('OCR Extracted Text:', extractedText);
    
    // Convert to uppercase for case-insensitive matching
    const normalizedText = extractedText.toUpperCase();
    
    // Check for Aadhaar-specific keywords
    const hasAadhaarKeywords = 
      normalizedText.includes('GOVERNMENT OF INDIA') ||
      normalizedText.includes('UNIQUE IDENTIFICATION') ||
      normalizedText.includes('AADHAAR');
    
    // Check for 12-digit UID pattern (xxxx xxxx xxxx)
    // This regex looks for 12 digits, potentially separated into groups of 4
    const aadhaarNumberPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
    const hasAadhaarNumber = aadhaarNumberPattern.test(extractedText);
    
    // Return true if either condition is met
    return hasAadhaarKeywords || hasAadhaarNumber;
    
  } catch (error) {
    console.error('Error during Aadhaar card detection:', error);
    return false; // Return false on error
  }
}