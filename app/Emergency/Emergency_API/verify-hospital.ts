import { NextRequest, NextResponse } from 'next/server';
import { Client, Language } from '@googlemaps/google-maps-services-js';
import { kv } from '@vercel/kv';
import { z } from 'zod';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Validation schema
const requestSchema = z.object({
  query: z.string().min(3).max(200),
  location: z.optional(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }))
});

// Response type
interface HospitalVerificationResponse {
  isRegistered: boolean;
  address: string;
  placeId: string;
  name: string;
  confidence: number;
}

// Medical keywords for name validation
const MEDICAL_KEYWORDS = /(hospital|clinic|medical|health|care|centre|center)/i;

// Valid medical types for secondary validation
const MEDICAL_TYPES = ['health', 'emergency', 'clinic', 'doctor', 'medical', 'pharmacy'];

// Rate limiting helper
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const current = rateLimitStore.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Input sanitization
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially harmful characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Generate cache key
function generateCacheKey(query: string): string {
  const normalized = query.toLowerCase().replace(/\s+/g, '_');
  return `hospital:${normalized}`;
}

// Calculate confidence score
function calculateConfidence(place: any): number {
  let confidence = 0;
  
  // Primary type is hospital (highest confidence)
  if (place.types?.includes('hospital')) {
    confidence = 95;
  }
  // Secondary medical types
  else if (place.types?.some((type: string) => MEDICAL_TYPES.includes(type))) {
    confidence = 80;
  }
  // Name contains medical keywords
  else if (MEDICAL_KEYWORDS.test(place.name || '')) {
    confidence = 60;
  }
  
  // Boost confidence if multiple indicators present
  const hasMultipleIndicators = [
    place.types?.includes('hospital'),
    place.types?.some((type: string) => MEDICAL_TYPES.includes(type)),
    MEDICAL_KEYWORDS.test(place.name || '')
  ].filter(Boolean).length;
  
  if (hasMultipleIndicators > 1) {
    confidence = Math.min(100, confidence + 10);
  }
  
  return confidence;
}

// Validate if place is a hospital
function isValidHospital(place: any): boolean {
  // Primary type includes 'hospital'
  if (place.types?.includes('hospital')) {
    return true;
  }
  
  // Secondary types include medical types
  if (place.types?.some((type: string) => MEDICAL_TYPES.includes(type))) {
    return true;
  }
  
  // Name contains medical keywords
  if (MEDICAL_KEYWORDS.test(place.name || '')) {
    return true;
  }
  
  return false;
}

// Find best hospital match
function findBestMatch(results: any[]): any | null {
  if (!results || results.length === 0) return null;
  
  // Filter valid hospitals
  const validHospitals = results.filter(isValidHospital);
  if (validHospitals.length === 0) return null;
  
  // Sort by confidence (primary hospital types first)
  return validHospitals.sort((a, b) => {
    const aIsPrimary = a.types?.includes('hospital');
    const bIsPrimary = b.types?.includes('hospital');
    
    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;
    
    return calculateConfidence(b) - calculateConfidence(a);
  })[0];
}

// Fallback nearby search
async function nearbySearch(client: Client, location: { lat: number; lng: number }, query: string) {
  try {
    const response = await client.placesNearby({
      params: {
        location: `${location.lat},${location.lng}`,
        radius: 5000,
        type: 'hospital',
        keyword: query,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        language: Language.en
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Nearby search failed:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );
    }

    // Parse and validate request body
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
    const sanitizedQuery = sanitizeQuery(input.query);
    
    // Check cache
    const cacheKey = generateCacheKey(sanitizedQuery);
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached as string));
      }
    } catch (cacheError) {
      console.warn('Cache read failed:', cacheError);
    }

    // Initialize Google Maps client
    const client = new Client({});
    
    // Prepare search parameters
    const params: any = {
      query: sanitizedQuery,
      key: process.env.GOOGLE_MAPS_API_KEY!,
      language: Language.en
    };
    if (input.location) {
      params.location = { lat: input.location.lat, lng: input.location.lng };
      params.radius = 5000;
    }
    // Only add type if it matches PlaceType1 (which is 'hospital' in this case)
    // @ts-ignore
    params.type = 'hospital';

    let searchResults: any[] = [];
    
    try {
      // Primary text search
      const response = await client.textSearch({ params });
      searchResults = response.data.results?.slice(0, 3) || [];
      
      // Fallback to nearby search if no results and location provided
      if (searchResults.length === 0 && input.location) {
        searchResults = await nearbySearch(client, input.location, sanitizedQuery);
        searchResults = searchResults.slice(0, 3);
      }
      
    } catch (error: any) {
      console.error('Google Maps API error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable due to rate limits' },
          { 
            status: 429,
            headers: { 'Retry-After': '300' }
          }
        );
      }
      
      // Try to return cached data if available
      try {
        const fallbackData = await kv.get(`${cacheKey}:fallback`);
        if (fallbackData) {
          return NextResponse.json(JSON.parse(fallbackData as string));
        }
      } catch (fallbackError) {
        console.warn('Fallback cache read failed:', fallbackError);
      }
      
      return NextResponse.json(
        { error: 'Hospital verification service unavailable' },
        { status: 503 }
      );
    }

    // Find best match
    const bestMatch = findBestMatch(searchResults);
    
    const response: HospitalVerificationResponse = bestMatch ? {
      isRegistered: true,
      address: bestMatch.formatted_address || '',
      placeId: bestMatch.place_id || '',
      name: bestMatch.name || '',
      confidence: calculateConfidence(bestMatch)
    } : {
      isRegistered: false,
      address: '',
      placeId: '',
      name: '',
      confidence: 0
    };

    // Cache the response
    try {
      await kv.set(cacheKey, JSON.stringify(response), { ex: 3600 }); // 1 hour
      
      // Also cache as fallback data with longer expiry
      if (response.isRegistered) {
        await kv.set(`${cacheKey}:fallback`, JSON.stringify(response), { ex: 86400 }); // 24 hours
      }
    } catch (cacheError) {
      console.warn('Cache write failed:', cacheError);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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