import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { kv } from '@vercel/kv';
import { z } from 'zod';
import { createHash } from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

// Rate limiting stores
const ipRateLimit = new Map<string, { count: number; resetTime: number }>();
const loanAttempts = new Map<string, number>();

// Request validation schema
const requestSchema = z.object({
  loanId: z.string().regex(/^loan-\d{13}-\d{4}$/),
  hospitalPlaceId: z.string().length(27),
  patientName: z.string().min(3).max(50).regex(/^[a-zA-Z\s.]+$/),
  contact: z.string().regex(/^\+91[6-9]\d{9}$/)
});

// Response interfaces
interface ConfirmationResponse {
  confirmed: boolean;
  hospitalName: string;
  nextSteps: string;
  retryAfter?: number;
}

interface GooglePlaceDetails {
  result: {
    name: string;
    formatted_phone_number?: string;
    place_id: string;
  };
  status: string;
}

interface AuditEntry {
  timestamp: string;
  loanId: string;
  hospitalPlaceId: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  ip: string;
  failureReason?: string;
}

// Failure simulation parameters
const CONFIRMATION_SUCCESS_RATE = 0.7; // 70% success rate
const FAILURE_REASONS = [
  "Hospital at capacity",
  "Patient not admitted", 
  "Contact number unreachable",
  "Invalid patient details",
  "Hospital system maintenance",
  "Patient information mismatch"
];

// Rate limiting helpers
function checkIPRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const current = ipRateLimit.get(ip);
  
  if (!current || now > current.resetTime) {
    ipRateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

function checkLoanAttempts(loanId: string): boolean {
  const attempts = loanAttempts.get(loanId) || 0;
  if (attempts >= 5) {
    return false;
  }
  loanAttempts.set(loanId, attempts + 1);
  return true;
}

// Generate idempotency key
function generateIdempotencyKey(loanId: string, hospitalPlaceId: string): string {
  const combined = `${loanId}:${hospitalPlaceId}`;
  return createHash('sha256').update(combined).digest('hex');
}

// Audit logging
async function logAuditEntry(entry: AuditEntry): Promise<void> {
  try {
    await kv.lpush(`audit:${entry.loanId}`, JSON.stringify(entry));
    // Keep only last 100 entries per loan
    await kv.ltrim(`audit:${entry.loanId}`, 0, 99);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

// Get hospital details from Google Places API
async function getHospitalDetails(placeId: string): Promise<{ name: string; phone?: string }> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch hospital details');
  }

  const data: GooglePlaceDetails = await response.json();
  
  if (data.status !== 'OK' || !data.result) {
    throw new Error('Hospital not found');
  }

  return {
    name: data.result.name,
    phone: data.result.formatted_phone_number
  };
}

// Simulate hospital SMS confirmation
function simulateHospitalConfirmation(
  contact: string, 
  patientName: string,
  hospitalName: string
): { confirmed: boolean; reason?: string } {
  // Simulate realistic delay
  const processingDelay = Math.random() * 2000 + 1000; // 1-3 seconds
  
  // Simulate confirmation outcome
  const isConfirmed = Math.random() < CONFIRMATION_SUCCESS_RATE;
  
  if (isConfirmed) {
    console.log(`[MOCK SMS] to ${contact}: "Confirm admission for ${patientName} at ${hospitalName}? Reply CONFIRM"`);
    console.log(`[MOCK SMS RESPONSE]: CONFIRM received from ${hospitalName}`);
    return { confirmed: true };
  } else {
    const reason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
    console.log(`[MOCK SMS] to ${contact}: "Confirm admission for ${patientName} at ${hospitalName}? Reply CONFIRM"`);
    console.log(`[MOCK SMS RESPONSE]: FAIL - ${reason}`);
    return { confirmed: false, reason };
  }
}

// Update loan request status
async function updateLoanStatus(
  loanId: string, 
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED',
  hospitalData?: any,
  patientData?: any
): Promise<void> {
  await prisma.loanRequest.upsert({
    where: { loanId },
    update: {
      status,
      hospital: hospitalData,
      patient: patientData,
      updatedAt: new Date()
    },
    create: {
      loanId,
      status,
      hospital: hospitalData,
      patient: patientData
    }
  });
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting checks
    if (!checkIPRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }

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
    
    // Check loan attempt limits
    if (!checkLoanAttempts(input.loanId)) {
      await logAuditEntry({
        timestamp: new Date().toISOString(),
        loanId: input.loanId,
        hospitalPlaceId: input.hospitalPlaceId,
        status: 'REJECTED',
        ip,
        failureReason: 'Maximum attempts exceeded'
      });
      
      return NextResponse.json(
        { error: 'Maximum confirmation attempts exceeded' },
        { status: 423 }
      );
    }

    // Generate idempotency key and check cache
    const idempotencyKey = generateIdempotencyKey(input.loanId, input.hospitalPlaceId);
    const cacheKey = `confirmation:${idempotencyKey}`;
    
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached as string));
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }

    // Check existing loan request
    const existingRequest = await prisma.loanRequest.findUnique({
      where: { loanId: input.loanId }
    });

    // Handle existing confirmed/rejected requests
    if (existingRequest) {
      if (existingRequest.status === 'CONFIRMED') {
        const response: ConfirmationResponse = {
          confirmed: true,
          hospitalName: (existingRequest.hospital as any)?.name || 'Unknown Hospital',
          nextSteps: 'Proceed to document upload'
        };
        
        // Cache the response
        try {
          await kv.set(cacheKey, JSON.stringify(response), { ex: 7200 }); // 2 hours
        } catch (error) {
          console.warn('Cache write failed:', error);
        }
        
        return NextResponse.json(response);
      }
      
      if (existingRequest.status === 'REJECTED') {
        const response: ConfirmationResponse = {
          confirmed: false,
          hospitalName: '',
          nextSteps: 'Contact hospital administration for assistance'
        };
        
        return NextResponse.json(response);
      }
    }

    // Get hospital details
    const hospitalDetails = await getHospitalDetails(input.hospitalPlaceId);
    
    // Simulate hospital confirmation process
    const confirmationResult = simulateHospitalConfirmation(
      input.contact,
      input.patientName,
      hospitalDetails.name
    );

    // Prepare hospital and patient data
    const hospitalData = {
      placeId: input.hospitalPlaceId,
      name: hospitalDetails.name,
      phone: hospitalDetails.phone,
      contactUsed: input.contact
    };

    const patientData = {
      name: input.patientName,
      aadhaarLast4: input.loanId.split('-')[2]
    };

    let response: ConfirmationResponse;
    let auditStatus: 'CONFIRMED' | 'REJECTED' | 'PENDING';

    if (confirmationResult.confirmed) {
      // Update database - CONFIRMED
      await updateLoanStatus(input.loanId, 'CONFIRMED', hospitalData, patientData);
      
      response = {
        confirmed: true,
        hospitalName: hospitalDetails.name,
        nextSteps: 'Proceed to document upload'
      };
      auditStatus = 'CONFIRMED';
      
    } else {
      // Update database - REJECTED
      await updateLoanStatus(input.loanId, 'REJECTED', hospitalData, patientData);
      
      response = {
        confirmed: false,
        hospitalName: '',
        nextSteps: 'Contact hospital administration for assistance'
      };
      auditStatus = 'REJECTED';
    }

    // Log audit entry
    await logAuditEntry({
      timestamp: new Date().toISOString(),
      loanId: input.loanId,
      hospitalPlaceId: input.hospitalPlaceId,
      status: auditStatus,
      ip,
      failureReason: confirmationResult.reason
    });

    // Simulate realistic processing time (minimum 1 second)
    const processingTime = Date.now() - startTime;
    if (processingTime < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - processingTime));
    }

    // Cache successful responses
    try {
      await kv.set(cacheKey, JSON.stringify(response), { ex: 7200 }); // 2 hours
    } catch (error) {
      console.warn('Cache write failed:', error);
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Hospital confirmation error:', error);
    
    // Log error to audit
    if (request.body) {
      try {
        const body = await request.json();
        await logAuditEntry({
          timestamp: new Date().toISOString(),
          loanId: body.loanId || 'unknown',
          hospitalPlaceId: body.hospitalPlaceId || 'unknown',
          status: 'REJECTED',
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          failureReason: `System error: ${error.message}`
        });
      } catch (logError) {
        console.error('Error logging failed:', logError);
      }
    }

    if (error.message?.includes('Hospital not found')) {
      return NextResponse.json(
        { error: 'Invalid hospital. Please verify hospital selection.' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Loan ID not found')) {
      return NextResponse.json(
        { error: 'Loan request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Hospital confirmation service temporarily unavailable' },
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