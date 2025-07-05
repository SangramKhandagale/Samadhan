// pages/api/verify-aadhaar.ts - Complete Aadhaar Verification API
// This file contains all functionality for processing and verifying Aadhaar cards

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { kv } from '@vercel/kv';
import { promisify } from 'util';
import fs from 'fs';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface AadhaarData {
  aadhaarNumber: string;
  name: string;
  dob: string;
  gender: 'M' | 'F' | 'O';
}

interface VerificationResponse {
  isValid: boolean;
  aadhaarNumber: string;
  name: string;
  dob: string;
  gender: 'M' | 'F' | 'O';
  photoUrl: string;
  processingTime: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

// In-memory rate limiting storage (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if the IP address has exceeded rate limits
 * @param ip - Client IP address
 * @returns true if request is allowed, false if rate limited
 */
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxRequests = 5; // Maximum 5 requests per minute

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimitStore.get(ip)!;
  
  // Reset window if expired
  if (now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return false;
  }

  // Increment counter
  record.count++;
  return true;
};

// =============================================================================
// VERHOEFF ALGORITHM FOR AADHAAR VALIDATION
// =============================================================================

/**
 * Verhoeff Algorithm Implementation for Aadhaar number validation
 * This algorithm validates the checksum digit of Aadhaar numbers
 * @param aadhaar - 12-digit Aadhaar number as string
 * @returns true if valid, false if invalid
 */
const verhoeffCheck = (aadhaar: string): boolean => {
  // Verhoeff multiplication table
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  // Verhoeff permutation table
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  let c = 0;
  const digits = aadhaar.split('').reverse();
  
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    if (isNaN(digit)) return false;
    c = d[c][p[i % 8][digit]];
  }
  
  return c === 0;
};

// =============================================================================
// TEXT PROCESSING UTILITIES
// =============================================================================

/**
 * Sanitize extracted text by removing unwanted characters
 * @param text - Raw text to sanitize
 * @returns Cleaned text
 */
const sanitizeText = (text: string): string => {
  return text.replace(/[^\w\s.-]/g, '').trim();
};

/**
 * Format date string to ISO format (YYYY-MM-DD)
 * @param dateStr - Date in various formats
 * @returns ISO formatted date string
 */
const formatDate = (dateStr: string): string => {
  try {
    // Clean date string and split by common delimiters
    const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
    const parts = cleanDate.split(/[\/\-\.]/);
    
    if (parts.length === 3) {
      let day = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      // Handle different date formats
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      // Swap day/month if month > 12 (assume DD/MM format)
      if (month > 12 && day <= 12) {
        [day, month] = [month, day];
      }
      
      // Validate date components
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        return date.toISOString().split('T')[0];
      }
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  return '';
};

/**
 * Format Aadhaar number with spaces (XXXX XXXX XXXX)
 * @param aadhaar - 12-digit Aadhaar number
 * @returns Formatted Aadhaar number
 */
const formatAadhaarNumber = (aadhaar: string): string => {
  return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
};

// =============================================================================
// IMAGE PROCESSING
// =============================================================================

/**
 * Process image for better OCR accuracy
 * @param imagePath - Path to the image file
 * @returns Processed image buffer
 */
const processImage = async (imagePath: string): Promise<Buffer> => {
  try {
    return await sharp(imagePath)
      .grayscale() // Convert to grayscale
      .linear(1.5, 0) // Increase contrast
      .threshold(128, { greyscale: false }) // Apply threshold
      .png() // Convert to PNG for better OCR
      .toBuffer();
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Extract photo from Aadhaar card (usually located in top-right area)
 * @param imagePath - Path to the Aadhaar image
 * @returns Base64 encoded photo or empty string
 */
const extractPhoto = async (imagePath: string): Promise<string> => {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    // Calculate crop area for photo (typically top-right 25% x 35%)
    const cropX = Math.floor(metadata.width * 0.75);
    const cropY = Math.floor(metadata.height * 0.10);
    const cropWidth = Math.min(200, metadata.width - cropX);
    const cropHeight = Math.min(250, Math.floor(metadata.height * 0.35));
    
    const photoBuffer = await image
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Photo extraction failed:', error);
    return '';
  }
};

// =============================================================================
// OCR PROCESSING
// =============================================================================

/**
 * Extract text from processed image using Tesseract OCR
 * @param processedImage - Processed image buffer
 * @returns Extracted text
 */
const extractTextFromImage = async (processedImage: Buffer): Promise<string> => {
  let worker: Tesseract.Worker | null = null;
  
  try {
    // Create Tesseract worker with English and Hindi language support
    worker = await Tesseract.createWorker(['eng', 'hin'], undefined, {
      logger: m => {
        if (process.env.NODE_ENV === 'development') {
          console.log('OCR Progress:', m);
        }
      }
    });

    // Configure OCR parameters for better accuracy
    await worker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // LSTM OCR Engine
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // Uniform text block
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ -:.',
      preserve_interword_spaces: '1'
    });

    // Perform OCR
    const { data } = await worker.recognize(processedImage);
    return data.text || '';
    
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error('Failed to extract text from image');
  } finally {
    // Always terminate worker to free resources
    if (worker) {
      await worker.terminate();
    }
  }
};

// =============================================================================
// AADHAAR DATA PARSING
// =============================================================================

/**
 * Parse extracted OCR text to identify Aadhaar details
 * @param text - Raw OCR text
 * @returns Parsed Aadhaar data
 */
const parseAadhaarData = (text: string): AadhaarData => {
  console.log('Raw OCR Text:', text.substring(0, 200) + '...');

  // Extract 12-digit Aadhaar number
  const aadhaarMatch = text.match(/\b\d{4}\s*\d{4}\s*\d{4}\b|\b\d{12}\b/);
  const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : '';

  // Extract name (various patterns)
  let name = '';
  const namePatterns = [
    /(?:name|नाम)[:\s]*([a-zA-Z\s]{2,50})/i,
    /^([A-Z][a-zA-Z\s]{2,30})$/m, // Standalone capitalized name
    /([A-Z][A-Z\s]{5,30})/g // All caps name
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidateName = sanitizeText(match[1]).trim();
      if (candidateName.length > 2 && candidateName.length < 50) {
        name = candidateName;
        break;
      }
    }
  }

  // Extract Date of Birth
  let dob = '';
  const dobPatterns = [
    /(?:dob|date of birth|year of birth|जन्म तिथि)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:dob|date of birth|year of birth|जन्म तिथि)[:\s]*(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i,
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/g,
    /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g
  ];
  
  for (const pattern of dobPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const dateCandidate = Array.isArray(match) ? match[1] : match;
        const formattedDate = formatDate(dateCandidate);
        if (formattedDate) {
          dob = formattedDate;
          break;
        }
      }
      if (dob) break;
    }
  }

  // Extract Gender
  let gender: 'M' | 'F' | 'O' = 'O';
  const genderPatterns = [
    /\b(male|female|other|पुरुष|महिला|अन्य)\b/i,
    /\b(m|f|o)\b/i
  ];
  
  for (const pattern of genderPatterns) {
    const match = text.match(pattern);
    if (match) {
      const g = match[1].toLowerCase();
      if (g.includes('male') && !g.includes('female') || g.includes('पुरुष') || g === 'm') {
        gender = 'M';
        break;
      } else if (g.includes('female') || g.includes('महिला') || g === 'f') {
        gender = 'F';
        break;
      }
    }
  }

  return {
    aadhaarNumber,
    name,
    dob,
    gender
  };
};

// =============================================================================
// FORM PARSING
// =============================================================================

/**
 * Parse multipart form data from request
 * @param req - Next.js API request
 * @returns Promise with parsed fields and files
 */
const parseFormData = (req: NextApiRequest): Promise<{ fields: any; files: any }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
      allowEmptyFiles: false,
      filter: ({ mimetype }) => {
        // Allow only image files
        return mimetype === 'image/png' || 
               mimetype === 'image/jpeg' || 
               mimetype === 'image/jpg';
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error(`Form parsing failed: ${err.message}`));
      } else {
        resolve({ fields, files });
      }
    });
  });
};

// =============================================================================
// FILE CLEANUP UTILITY
// =============================================================================

/**
 * Safely delete temporary file
 * @param filePath - Path to file to delete
 */
const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File cleanup failed:', error);
  }
};

// =============================================================================
// MAIN API HANDLER
// =============================================================================

/**
 * Main API handler for Aadhaar verification
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<VerificationResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                   req.socket.remoteAddress || 
                   'unknown';

  // Apply rate limiting
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ 
      error: 'Too many requests. Limit: 5 requests per minute.' 
    });
  }

  let tempFilePath: string | undefined;

  try {
    // Parse form data
    const { fields, files } = await parseFormData(req);

    // Get uploaded file
    const aadhaarImage = Array.isArray(files.aadhaarImage) 
      ? files.aadhaarImage[0] 
      : files.aadhaarImage;

    if (!aadhaarImage) {
      return res.status(400).json({ 
        error: 'No Aadhaar image file provided' 
      });
    }

    tempFilePath = aadhaarImage.filepath;

    // Validate image properties
    if (!tempFilePath) {
      return res.status(400).json({ 
        error: 'Temporary file path not found.' 
      });
    }

    const metadata = await sharp(tempFilePath).metadata();
    
    if (!metadata.width || !metadata.height) {
      return res.status(400).json({ 
        error: 'Invalid image file' 
      });
    }

    if (metadata.width < 800 || metadata.height < 500) {
      return res.status(400).json({ 
        error: 'Image resolution too low. Minimum 800x500 pixels required.' 
      });
    }

    // Process image for OCR
    console.log('Processing image for OCR...');
    const processedImage = await processImage(tempFilePath);
    
    // Extract text using OCR
    console.log('Extracting text with Tesseract OCR...');
    const extractedText = await extractTextFromImage(processedImage);
    
    if (!extractedText.trim()) {
      return res.status(400).json({ 
        error: 'No readable text found in image. Please ensure image is clear and well-lit.' 
      });
    }

    // Parse Aadhaar data from extracted text
    const parsedData = parseAadhaarData(extractedText);
    
    if (!parsedData.aadhaarNumber) {
      return res.status(400).json({ 
        error: 'Aadhaar number not found in image. Please ensure the image contains a valid Aadhaar card.' 
      });
    }

    if (parsedData.aadhaarNumber.length !== 12) {
      return res.status(400).json({ 
        error: 'Invalid Aadhaar number format. Must be 12 digits.' 
      });
    }

    // Validate Aadhaar number using Verhoeff algorithm
    if (!verhoeffCheck(parsedData.aadhaarNumber)) {
      return res.status(422).json({ 
        error: 'Invalid Aadhaar number. Checksum verification failed.' 
      });
    }

    // Extract photo from Aadhaar card
    console.log('Extracting photo...');
    const photoBase64 = await extractPhoto(tempFilePath!);
    let photoUrl = '';
    
    if (photoBase64 && kv) {
      try {
        // Store photo in Vercel KV with TTL
        const photoKey = `aadhaar_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await kv.setex(photoKey, 600, photoBase64); // 10 minutes TTL
        photoUrl = photoKey;
      } catch (kvError) {
        console.error('Failed to store photo in KV:', kvError);
        // Continue without photo storage
      }
    }

    const processingTime = Date.now() - startTime;

    // Log successful processing (without PII)
    console.log('Aadhaar verification completed:', {
      processingTime,
      hasName: !!parsedData.name,
      hasDob: !!parsedData.dob,
      hasPhoto: !!photoUrl,
      textLength: extractedText.length,
      imageSize: `${metadata.width}x${metadata.height}`
    });

    // Cleanup temporary file
    if (tempFilePath) {
      cleanupFile(tempFilePath);
    }

    // Return successful verification result
    return res.status(200).json({
      isValid: true,
      aadhaarNumber: formatAadhaarNumber(parsedData.aadhaarNumber),
      name: parsedData.name || 'Not found',
      dob: parsedData.dob || 'Not found',
      gender: parsedData.gender,
      photoUrl,
      processingTime
    });

  } catch (error) {
    console.error('Aadhaar verification error:', error);
    
    // Cleanup temporary file on error
    if (tempFilePath) {
      cleanupFile(tempFilePath);
    }

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({ 
      error: 'Aadhaar verification failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// =============================================================================
// NEXT.JS API CONFIGURATION
// =============================================================================

export const config = {
  api: {
    bodyParser: false, // Required for handling multipart form data
    responseLimit: '10mb', // Allow larger responses for base64 images
  },
};

// =============================================================================
// ADDITIONAL UTILITY FUNCTIONS (if needed for external access)
// =============================================================================

/**
 * Validate Aadhaar number format and checksum
 * @param aadhaar - Aadhaar number to validate
 * @returns true if valid
 */
export const validateAadhaarNumber = (aadhaar: string): boolean => {
  // Remove spaces and validate format
  const cleanAadhaar = aadhaar.replace(/\s/g, '');
  
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return false;
  }
  
  return verhoeffCheck(cleanAadhaar);
};

/**
 * Format Aadhaar number for display
 * @param aadhaar - Raw Aadhaar number
 * @returns Formatted number
 */
export const formatAadhaarForDisplay = (aadhaar: string): string => {
  const cleanAadhaar = aadhaar.replace(/\s/g, '');
  return formatAadhaarNumber(cleanAadhaar);
};