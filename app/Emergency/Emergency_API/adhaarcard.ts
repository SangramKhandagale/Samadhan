import Tesseract from 'tesseract.js';

export interface AadhaarCardInfo {
  name: string;
  dateOfBirth: string;
  gender: string;
  aadhaarNumber: string;
  isValid: boolean;
  confidence: number;
}

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
      'eng+hin', // English + Hindi for better accuracy
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
      normalizedText.includes('AADHAAR') ||
      normalizedText.includes('आधार');
    
    // Check for 12-digit UID pattern (xxxx xxxx xxxx or xxxxxxxxxx)
    const aadhaarNumberPattern = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/;
    const hasAadhaarNumber = aadhaarNumberPattern.test(extractedText);
    
    // Return true if either condition is met
    return hasAadhaarKeywords || hasAadhaarNumber;
    
  } catch (error) {
    console.error('Error during Aadhaar card detection:', error);
    return false; // Return false on error
  }
}

/**
 * Extracts all relevant information from an Aadhaar card image
 * 
 * @param file - The uploaded Aadhaar card image file
 * @returns Promise<AadhaarCardInfo> - Extracted Aadhaar card information
 */
export async function extractAadhaarInfo(file: File): Promise<AadhaarCardInfo> {
  try {
    // Perform OCR with optimized settings
    const result = await Tesseract.recognize(
      file,
      'eng+hin', // English + Hindi for better accuracy
      { 
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    const extractedText = result.data.text;
    console.log('Full OCR Text:', extractedText);
    console.log('All digits found:', extractedText.match(/\d/g)?.join('') || 'No digits found');
    
    // Initialize the result object
    const aadhaarInfo: AadhaarCardInfo = {
      name: '',
      dateOfBirth: '',
      gender: '',
      aadhaarNumber: '',
      isValid: false,
      confidence: result.data.confidence || 0
    };

    // Extract Aadhaar number - Enhanced with multiple comprehensive patterns
    const aadhaarPatterns = [
      // Standard spaced format: 1234 5678 9012
      /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
      // Continuous 12 digits
      /\b\d{12}\b/g,
      // With keywords nearby
      /(?:UID|आधार|AADHAAR)[\s\S]*?(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})/i,
      // Any sequence of exactly 12 digits (even if scattered)
      /(\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d[\s\-]?\d)/g,
      // Different spacing patterns
      /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}\b/g,
      /\b\d{6}[\s\-]?\d{6}\b/g,
      // With various separators
      /\b\d{4}[.\s\-_]?\d{4}[.\s\-_]?\d{4}\b/g,
      // OCR might misread spaces as other characters
      /\b\d{4}[^\d\w]\d{4}[^\d\w]\d{4}\b/g
    ];

    // First, try to find all potential 12-digit sequences
    const allDigitSequences = extractedText.match(/\d/g) || [];
    
    // Try pattern matching first
    for (const pattern of aadhaarPatterns) {
      const matches = extractedText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanedNumber = match.replace(/\D/g, '');
          if (cleanedNumber.length === 12 && /^\d{12}$/.test(cleanedNumber)) {
            aadhaarInfo.aadhaarNumber = cleanedNumber;
            break;
          }
        }
        if (aadhaarInfo.aadhaarNumber) break;
      }
    }

    // If still not found, try extracting from lines containing exactly 12 digits
    if (!aadhaarInfo.aadhaarNumber) {
      const lines = extractedText.split('\n');
      for (const line of lines) {
        const digits = line.match(/\d/g);
        if (digits && digits.length >= 12) {
          const digitString = digits.join('');
          // Look for 12 consecutive digits within this line
          const consecutiveDigits = digitString.match(/\d{12}/);
          if (consecutiveDigits) {
            aadhaarInfo.aadhaarNumber = consecutiveDigits[0];
            break;
          }
        }
      }
    }

    // Last resort: find the longest sequence of digits and check if it's 12
    if (!aadhaarInfo.aadhaarNumber) {
      const allDigits = extractedText.replace(/\D/g, '');
      if (allDigits.length >= 12) {
        // Look for any 12-digit substring
        for (let i = 0; i <= allDigits.length - 12; i++) {
          const potential = allDigits.substring(i, i + 12);
          if (/^\d{12}$/.test(potential)) {
            aadhaarInfo.aadhaarNumber = potential;
            break;
          }
        }
      }
    }

    // Extract Date of Birth - Multiple formats
    const dobPatterns = [
      /\b(\d{2}\/\d{2}\/\d{4})\b/g,           // DD/MM/YYYY
      /\b(\d{2}-\d{2}-\d{4})\b/g,             // DD-MM-YYYY
      /\b(\d{4}-\d{2}-\d{2})\b/g,             // YYYY-MM-DD
      /\b(\d{2}\s\w+\s\d{4})\b/g,             // DD Month YYYY
      /(?:DOB|जन्म|Birth)[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i
    ];

    for (const pattern of dobPatterns) {
      const matches = extractedText.match(pattern);
      if (matches) {
        aadhaarInfo.dateOfBirth = matches[0];
        break;
      }
    }

    // Extract Gender with better patterns
    const genderPatterns = [
      /\b(MALE|FEMALE|पुरुष|महिला|M|F)\b/gi,
      /(?:Gender|लिंग|SEX)[\s\S]*?(MALE|FEMALE|पुरुष|महिला|M|F)/i
    ];

    for (const pattern of genderPatterns) {
      const matches = extractedText.match(pattern);
      if (matches) {
        const gender = matches[matches.length - 1].toUpperCase();
        aadhaarInfo.gender = gender === 'M' ? 'MALE' : 
                            gender === 'F' ? 'FEMALE' : 
                            gender === 'पुरुष' ? 'MALE' :
                            gender === 'महिला' ? 'FEMALE' : gender;
        break;
      }
    }

    // Extract Name - Improved logic
    const textLines = extractedText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Look for name patterns
    const namePatterns = [
      // Look for name after specific keywords
      /(?:Name|नाव|नाम)[\s\S]*?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i,
      // Look for English name pattern in the text
      /\b([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g
    ];

    // Try to find name using patterns
    for (const pattern of namePatterns) {
      const matches = extractedText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const potentialName = match.replace(/^(Name|नाव|नाम)[\s\S]*?/i, '').trim();
          if (potentialName.length > 2 && potentialName.length < 50 && 
              /^[A-Za-z\s]+$/.test(potentialName) &&
              !potentialName.match(/\b(GOVERNMENT|INDIA|UNIQUE|IDENTIFICATION|AADHAAR|AUTHORITY|MALE|FEMALE)\b/i)) {
            aadhaarInfo.name = potentialName.toUpperCase();
            break;
          }
        }
        if (aadhaarInfo.name) break;
      }
    }

    // If name not found through patterns, look in lines
    if (!aadhaarInfo.name) {
      for (const line of textLines) {
        const cleanLine = line.replace(/[^\w\s]/g, '').trim();
        
        // Skip lines with unwanted content
        if (cleanLine.length < 3 || cleanLine.length > 50 ||
            /\d/.test(cleanLine) ||
            /\b(GOVERNMENT|INDIA|UNIQUE|IDENTIFICATION|AADHAAR|AUTHORITY|MALE|FEMALE|DOB|BIRTH|सरकार|आधार)\b/i.test(cleanLine)) {
          continue;
        }

        // Check if it's a valid name (alphabetic with spaces)
        if (/^[A-Za-z\s]+$/.test(cleanLine)) {
          aadhaarInfo.name = cleanLine.toUpperCase();
          break;
        }
      }
    }

    // Validate the extracted information
    aadhaarInfo.isValid = validateAadhaarInfo(aadhaarInfo);

    console.log('Extracted Info:', aadhaarInfo);
    return aadhaarInfo;

  } catch (error) {
    console.error('Error during Aadhaar information extraction:', error);
    return {
      name: '',
      dateOfBirth: '',
      gender: '',
      aadhaarNumber: '',
      isValid: false,
      confidence: 0
    };
  }
}

/**
 * Validates the extracted Aadhaar information
 * 
 * @param info - The extracted Aadhaar information
 * @returns boolean - true if the information appears valid
 */
function validateAadhaarInfo(info: AadhaarCardInfo): boolean {
  // Check if Aadhaar number is 12 digits
  const isValidAadhaarNumber = /^\d{12}$/.test(info.aadhaarNumber);
  
  // Check if we have at least basic information
  const hasBasicInfo = info.name.length > 0 && 
                      info.dateOfBirth.length > 0 && 
                      info.gender.length > 0;

  return isValidAadhaarNumber && hasBasicInfo;
}

/**
 * Verifies if the Aadhaar card image is authentic by checking various security features
 * 
 * @param file - The uploaded Aadhaar card image file
 * @returns Promise<{isAuthentic: boolean, checks: string[]}> - Verification results
 */
export async function verifyAadhaarCard(file: File): Promise<{isAuthentic: boolean, checks: string[]}> {
  try {
    const result = await Tesseract.recognize(file, 'eng+hin');
    const extractedText = result.data.text.toUpperCase();
    
    const checks: string[] = [];
    let passedChecks = 0;
    const totalChecks = 5;

    // Check 1: Government of India text or Hindi equivalent
    if (extractedText.includes('GOVERNMENT OF INDIA') || extractedText.includes('सरकार')) {
      checks.push('✓ Government identification found');
      passedChecks++;
    } else {
      checks.push('✗ Government identification missing');
    }

    // Check 2: Unique Identification Authority text
    

    // Check 3: Aadhaar logo/text
   

    // Check 4: 12-digit UID pattern
    if (/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/.test(extractedText) || /\b\d{12}\b/.test(extractedText)) {
      checks.push('✓ 12-digit UID pattern found');
      passedChecks++;
    } else {
      checks.push('✗ 12-digit UID pattern missing');
    }

    // Check 5: Required fields present
    const hasName = /[A-Z][A-Z\s]{2,}/.test(extractedText);
    const hasGender = /\b(MALE|FEMALE|M|F|पुरुष|महिला)\b/i.test(extractedText);
    const hasDOB = /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(extractedText);
    
    if (hasName && hasGender && hasDOB) {
      checks.push('✓ Essential fields (Name, Gender, DOB) found');
      passedChecks++;
    } else {
      checks.push('✗ Some essential fields missing');
    }

    const isAuthentic = passedChecks >= 3; // At least 3 out of 5 checks should pass

    return {
      isAuthentic,
      checks
    };

  } catch (error) {
    console.error('Error during Aadhaar card verification:', error);
    return {
      isAuthentic: false,
      checks: ['Error during verification process']
    };
  }
}