import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { z } from 'zod';
import { createHash } from 'crypto';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Request validation schema
const requestSchema = z.object({
  aadhaarNumber: z.string().length(12).regex(/^\d{12}$/),
  hospitalPlaceId: z.string().min(20),
  accidentDetails: z.string().min(10).max(1000),
  loanAmount: z.number().min(1000).max(500000),
  accidentImage: z.optional(z.string().regex(/^data:image\/(png|jpeg);base64,/)),
  userLocation: z.optional(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }))
});

// Response interface
interface RiskScoreResponse {
  approved: boolean;
  approvedAmount: number;
  riskScore: number;
  reasons: string[];
  distanceKm: number;
  imageAnalysis?: {
    topClass: string;
    confidence: number;
  };
}

// Geolocation interfaces
interface Location {
  lat: number;
  lng: number;
}

interface GoogleGeocodeResponse {
  results: Array<{
    geometry: {
      location: Location;
    };
  }>;
}

interface IPInfoResponse {
  loc: string; // "lat,lng" format
  city: string;
  country: string;
}

// Google Vision API Response Interface
interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    error?: {
      message: string;
    };
  }>;
}

// Accident-related classes for image analysis
const ACCIDENT_CLASSES = [
  'ambulance', 'car crash', 'traffic accident', 'bandage', 'hospital',
  'emergency vehicle', 'medical', 'injury', 'wheelchair', 'stretcher',
  'vehicle', 'car', 'accident', 'damage', 'emergency', 'healthcare'
];

// Rate limiting helper
function checkRateLimit(aadhaarNumber: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 5;
  
  // Hash Aadhaar for privacy
  const hashedAadhaar = createHash('sha256').update(aadhaarNumber).digest('hex');
  const current = rateLimitStore.get(hashedAadhaar);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(hashedAadhaar, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get hospital coordinates from Google Places API
async function getHospitalLocation(placeId: string): Promise<Location> {
  const cacheKey = `hospital_coords:${placeId}`;
  
  // Check cache first
  try {
    const cached = await kv.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
  } catch (error) {
    console.warn('Cache read failed for hospital coordinates:', error);
  }

  // Fetch from Google Maps API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch hospital coordinates');
  }
  
  const data: GoogleGeocodeResponse = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('Hospital not found');
  }
  
  const location = data.results[0].geometry.location;
  
  // Cache for 24 hours
  try {
    await kv.set(cacheKey, JSON.stringify(location), { ex: 86400 });
  } catch (error) {
    console.warn('Cache write failed for hospital coordinates:', error);
  }
  
  return location;
}

// Get user location with fallback strategy
async function getUserLocation(
  userLocation?: Location,
  request?: NextRequest
): Promise<Location> {
  // Priority 1: User-provided location
  if (userLocation) {
    return userLocation;
  }
  
  // Priority 2: Vercel's geo data from headers
  const latHeader = request?.headers.get('x-vercel-ip-latitude');
  const lngHeader = request?.headers.get('x-vercel-ip-longitude');
  if (latHeader && lngHeader) {
    return {
      lat: parseFloat(latHeader),
      lng: parseFloat(lngHeader)
    };
  }
  
  // Priority 3: IP-based geolocation
  try {
    const forwardedFor = request?.headers.get('x-forwarded-for') || '';
    // x-forwarded-for can be a comma-separated list; take the first IP
    const ip = forwardedFor.split(',')[0].trim();
    if (ip && process.env.IPINFO_TOKEN) {
      const response = await fetch(
        `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`
      );
      
      if (response.ok) {
        const data: IPInfoResponse = await response.json();
        const [lat, lng] = data.loc.split(',').map(Number);
        return { lat, lng };
      }
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error);
  }
  
  // Fallback to Mumbai coordinates
  return { lat: 19.0760, lng: 72.8777 };
}

// Text severity analysis
function calculateTextSeverity(text: string): number {
  const sanitizedText = text.toLowerCase().trim();
  
  const highSeverity = /(critical|fracture|bleeding|unconscious|serious|severe|emergency|trauma|intensive|surgery)/gi;
  const mediumSeverity = /(injury|pain|accident|hospital|hurt|wound|damage|broken|sprain)/gi;
  const lowSeverity = /(minor|scratch|bruise|light|small)/gi;
  
  if (highSeverity.test(sanitizedText)) return 0.8;
  if (lowSeverity.test(sanitizedText)) return 0.2;
  if (mediumSeverity.test(sanitizedText)) return 0.5;
  return 0.3; // Default moderate 
}

// OPTION 1: Google Vision API for image analysis
async function analyzeAccidentImageWithVision(base64Image: string): Promise<{
  topClass: string;
  confidence: number;
  riskFactor: number;
}> {
  try {
    if (!process.env.GOOGLE_CLOUD_API_KEY) {
      throw new Error('Google Cloud API key not configured');
    }

    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const imageData = base64Image.split(',')[1];
    
    const requestBody = {
      requests: [{
        image: {
          content: imageData
        },
        features: [{
          type: 'LABEL_DETECTION',
          maxResults: 10
        }]
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data: GoogleVisionResponse = await response.json();
    const labels = data.responses[0]?.labelAnnotations || [];

    if (labels.length === 0) {
      return { topClass: 'no_labels_detected', confidence: 0, riskFactor: 0.8 };
    }

    // Find the best accident-related match
    let bestMatch = labels[0];
    let isAccidentRelated = false;

    for (const label of labels) {
      const isMatch = ACCIDENT_CLASSES.some(cls => 
        label.description.toLowerCase().includes(cls.toLowerCase()) ||
        cls.toLowerCase().includes(label.description.toLowerCase())
      );
      
      if (isMatch && label.score > 0.5) {
        bestMatch = label;
        isAccidentRelated = true;
        break;
      }
    }

    // Calculate risk factor
    let riskFactor: number;
    if (isAccidentRelated && bestMatch.score > 0.8) {
      riskFactor = 0.1; // Low risk - clearly accident-related
    } else if (isAccidentRelated && bestMatch.score > 0.5) {
      riskFactor = 0.3; // Medium risk - somewhat accident-related
    } else {
      riskFactor = 0.8; // High risk - not clearly accident-related
    }

    return {
      topClass: bestMatch.description,
      confidence: Math.round(bestMatch.score * 100) / 100,
      riskFactor
    };

  } catch (error) {
    console.error('Vision API analysis failed:', error);
    return { topClass: 'analysis_failed', confidence: 0, riskFactor: 0.6 };
  }
}

// OPTION 2: Simple image validation without ML
async function analyzeAccidentImageSimple(base64Image: string): Promise<{
  topClass: string;
  confidence: number;
  riskFactor: number;
}> {
  try {
    // Extract base64 data
    const imageData = base64Image.split(',')[1];
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Basic image validation
    const imageSize = imageBuffer.length;
    const isValidSize = imageSize > 1000 && imageSize < 5000000; // 1KB to 5MB
    
    // Check if it's a valid image by looking at file headers
    const header = imageBuffer.slice(0, 10);
    const isJPEG = header[0] === 0xFF && header[1] === 0xD8;
    const isPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
    
    const isValidImage = isJPEG || isPNG;
    
    // Simple heuristics based on file characteristics
    let riskFactor: number;
    let confidence: number;
    let topClass: string;
    
    if (!isValidImage) {
      riskFactor = 1.0;
      confidence = 0.9;
      topClass = 'invalid_image_format';
    } else if (!isValidSize) {
      riskFactor = 0.8;
      confidence = 0.7;
      topClass = imageSize < 1000 ? 'image_too_small' : 'image_too_large';
    } else {
      // Assume valid accident image if basic checks pass
      riskFactor = 0.2;
      confidence = 0.6;
      topClass = 'valid_accident_image';
    }
    
    return { topClass, confidence, riskFactor };
    
  } catch (error) {
    console.error('Simple image analysis failed:', error);
    return { topClass: 'analysis_failed', confidence: 0, riskFactor: 0.6 };
  }
}

// OPTION 3: Using Hugging Face API
async function analyzeAccidentImageWithHuggingFace(base64Image: string): Promise<{
  topClass: string;
  confidence: number;
  riskFactor: number;
}> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not configured');
    }

    // Extract base64 data
    const imageData = base64Image.split(',')[1];
    const imageBuffer = Buffer.from(imageData, 'base64');

    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const predictions = await response.json();
    
    if (!predictions || predictions.length === 0) {
      return { topClass: 'no_predictions', confidence: 0, riskFactor: 0.8 };
    }

    const topPrediction = predictions[0];
    const isAccidentRelated = ACCIDENT_CLASSES.some(cls => 
      topPrediction.label.toLowerCase().includes(cls.toLowerCase())
    );
    
    // Calculate risk factor
    let riskFactor: number;
    if (isAccidentRelated && topPrediction.score > 0.8) {
      riskFactor = 0.1;
    } else if (isAccidentRelated && topPrediction.score > 0.5) {
      riskFactor = 0.3;
    } else {
      riskFactor = 0.8;
    }
    
    return {
      topClass: topPrediction.label,
      confidence: Math.round(topPrediction.score * 100) / 100,
      riskFactor
    };

  } catch (error) {
    console.error('Hugging Face analysis failed:', error);
    return { topClass: 'analysis_failed', confidence: 0, riskFactor: 0.6 };
  }
}

// Main image analysis function - choose your preferred method
async function analyzeAccidentImage(base64Image: string): Promise<{
  topClass: string;
  confidence: number;
  riskFactor: number;
}> {
  // Choose one of the following methods:
  
  // Method 1: Google Vision API (most accurate, requires API key)
  // return await analyzeAccidentImageWithVision(base64Image);
  
  // Method 2: Simple validation (no external API needed)
  return await analyzeAccidentImageSimple(base64Image);
  
  // Method 3: Hugging Face (good accuracy, requires API key)
  // return await analyzeAccidentImageWithHuggingFace(base64Image);
}

// Calculate comprehensive risk score
function calculateRiskScore(
  distanceKm: number,
  loanAmount: number,
  accidentDetails: string,
  imageAnalysis?: { riskFactor: number }
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  
  // Distance risk (0-1 scale, 100km max)
  const distanceRisk = Math.min(distanceKm / 100, 1);
  if (distanceKm > 50) {
    reasons.push(`High distance variance (${Math.round(distanceKm)}km)`);
  }
  
  // Amount risk (0-1 scale, ₹200k threshold)
  const amountRisk = Math.min(loanAmount / 200000, 1);
  if (loanAmount > 100000) {
    reasons.push(`High loan amount (₹${(loanAmount / 1000).toFixed(0)}k)`);
  }
  
  // Text severity risk
  const textRisk = calculateTextSeverity(accidentDetails);
  if (textRisk > 0.6) {
    reasons.push('High severity accident description');
  }
  
  // Image analysis risk
  const imageRisk = imageAnalysis ? imageAnalysis.riskFactor : 0.5;
  if (imageRisk > 0.6) {
    reasons.push('Unverified accident image');
  }
  
  // Weighted risk score (0-100)
  const riskScore = (
    distanceRisk * 0.4 +
    amountRisk * 0.3 +
    textRisk * 0.2 +
    imageRisk * 0.1
  ) * 100;
  
  return { score: Math.round(riskScore), reasons };
}

// Main API handler with timeout
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const TIMEOUT_MS = 10000; // 10 seconds
  
  try {
    // Check timeout periodically
    const checkTimeout = () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error('Request timeout');
      }
    };
    
    // Parse and validate request
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    
    const input = validationResult.data;
    
    // Rate limiting check
    if (!checkRateLimit(input.aadhaarNumber)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 requests per hour.' },
        { status: 429 }
      );
    }
    
    checkTimeout();
    
    // Get hospital and user locations
    const [hospitalLocation, userLocation] = await Promise.all([
      getHospitalLocation(input.hospitalPlaceId),
      getUserLocation(input.userLocation, request)
    ]);
    
    checkTimeout();
    
    // Calculate distance
    const distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      hospitalLocation.lat,
      hospitalLocation.lng
    );
    
    // Analyze image if provided
    let imageAnalysis: { topClass: string; confidence: number; riskFactor: number } | undefined;
    if (input.accidentImage) {
      checkTimeout();
      imageAnalysis = await analyzeAccidentImage(input.accidentImage);
    }
    
    checkTimeout();
    
    // Calculate risk score
    const { score: riskScore, reasons } = calculateRiskScore(
      distanceKm,
      input.loanAmount,
      input.accidentDetails,
      imageAnalysis
    );
    
    // Approval decision
    const approved = riskScore <= 60;
    const approvedAmount = approved 
      ? Math.min(input.loanAmount, Math.floor(50000 * (1 - riskScore / 100)))
      : 0;
    
    const response: RiskScoreResponse = {
      approved,
      approvedAmount,
      riskScore,
      reasons,
      distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
      imageAnalysis: imageAnalysis ? {
        topClass: imageAnalysis.topClass,
        confidence: imageAnalysis.confidence
      } : undefined
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Risk score calculation error:', error);
    
    if (error.message === 'Request timeout') {
      return NextResponse.json(
        { error: 'Request processing timeout' },
        { status: 408 }
      );
    }
    
    if (error.message?.includes('Hospital not found')) {
      return NextResponse.json(
        { error: 'Invalid hospital location' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Risk assessment service unavailable' },
      { status: 503 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}