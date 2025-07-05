// pages/api/loan-status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { differenceInDays, addMonths, isAfter, isBefore } from 'date-fns';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Zod validation schema
const querySchema = z.object({
  loanId: z.string().regex(/^loan-\d{13}-\d{4}$/, "Invalid loan ID format")
});

// Types
interface Repayment {
  id: string;
  amount: number;
  date: Date;
  method: 'UPI' | 'NETBANKING' | 'AUTO_DEBIT';
  status: 'PAID' | 'PENDING' | 'FAILED';
  loanId: string;
}

interface InsuranceCoverage {
  covered: boolean;
  coverageAmount: number;
  scheme: string;
}

interface LoanStatusResponse {
  status: string;
  amount: number;
  amountDue: number;
  dueDate: string | null;
  nextPayment: number;
  daysRemaining: number | null;
  insurance: InsuranceCoverage;
  repaymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    status: string;
  }>;
  rejectionReason?: string;
  paymentLink?: string;
}

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const current = rateLimitMap.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
};

// JWT verification
const verifyToken = (token: string): { aadhaar: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return { aadhaar: decoded.aadhaar };
  } catch (error) {
    return null;
  }
};

// Calculate amount due based on repayments
function calculateAmountDue(totalAmount: number, repayments: Repayment[]): number {
  const paidAmount = repayments
    .filter(r => r.status === "PAID")
    .reduce((sum, r) => sum + r.amount, 0);
  
  return Math.max(0, totalAmount - paidAmount);
}

// Calculate due date (1 month from disbursement or creation)
function calculateDueDate(startDate: Date): Date {
  return addMonths(new Date(startDate), 1);
}

// Calculate next payment amount
function calculateNextPayment(amountDue: number, repayments: Repayment[]): number {
  if (amountDue === 0) return 0;
  
  // For this example, we'll use a simple monthly installment
  // In production, this would be based on loan terms
  const monthlyInstallment = Math.min(amountDue, 50000000); // Max 5 lakhs per month
  return monthlyInstallment;
}

// Mock PM-JAY insurance integration
const getInsuranceCoverage = async (aadhaar: string): Promise<InsuranceCoverage> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock response based on aadhaar (in real implementation, call PM-JAY API)
  const covered = Math.random() > 0.3; // 70% coverage rate
  
  return {
    covered,
    coverageAmount: covered ? 500000000 : 0, // 5 lakhs in paise
    scheme: covered ? "Ayushman Bharat" : "Not Covered"
  };
};

// Mock Razorpay payment link generation
const generateRazorpayLink = async (loanId: string, amount: number): Promise<string> => {
  // In production, integrate with actual Razorpay API
  const mockPaymentId = `pay_${Date.now()}`;
  return `https://rzp.io/l/${mockPaymentId}`;
};

// Get client IP address
const getClientIP = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return req.socket.remoteAddress || '127.0.0.1';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoanStatusResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  try {
    // 1. Rate limiting
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    // 2. Query validation
    const validationResult = querySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: `Invalid query parameters: ${validationResult.error.errors.map(e => e.message).join(', ')}` 
      });
    }

    const { loanId } = validationResult.data;

    // 3. Authentication (optional in development, required in production)
    const authHeader = req.headers.authorization;
    let authenticatedAadhaar: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        authenticatedAadhaar = decoded.aadhaar;
      }
    }

    // 4. Fetch loan from database
    const loan = await prisma.loan.findUnique({
      where: { loanId },
      include: {
        repayments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // 5. Authorization check (verify aadhaar matches)
    if (authenticatedAadhaar && loan.aadhaar !== authenticatedAadhaar) {
      return res.status(403).json({ error: 'Unauthorized access to loan data' });
    }

    // 6. Calculate dynamic fields
    const currentDate = new Date();
    const dueDate = loan.dueDate ? new Date(loan.dueDate) : calculateDueDate(loan.disbursedAt || loan.createdAt);
    const amountDue = calculateAmountDue(loan.amount, loan.repayments as Repayment[]);
    const nextPayment = calculateNextPayment(amountDue, loan.repayments as Repayment[]);
    const daysRemaining = dueDate ? differenceInDays(dueDate, currentDate) : null;

    // 7. Update status if payment is overdue
    let currentStatus = loan.status;
    if (currentStatus === 'REPAYMENT' && dueDate && isAfter(currentDate, dueDate) && amountDue > 0) {
      currentStatus = 'DELAYED';
      
      // Update in database
      await prisma.loan.update({
        where: { loanId },
        data: { status: 'DELAYED' }
      });
    }

    // 8. Update status if loan is fully repaid
    if (amountDue === 0 && (currentStatus === 'REPAYMENT' || currentStatus === 'DELAYED')) {
      currentStatus = 'CLOSED';
      
      // Update in database
      await prisma.loan.update({
        where: { loanId },
        data: { 
          status: 'CLOSED',
          repaidAt: new Date()
        }
      });
    }

    // 9. Get insurance coverage
    const insurance = await getInsuranceCoverage(loan.aadhaar);

    // 10. Generate payment link for delayed payments
    let paymentLink: string | undefined;
    if (currentStatus === 'DELAYED' && amountDue > 0) {
      paymentLink = await generateRazorpayLink(loanId, amountDue);
    }

    // 11. Format repayment history
    const repaymentHistory = loan.repayments.map((repayment: any) => ({
      date: repayment.date.toISOString().split('T')[0],
      amount: repayment.amount,
      method: repayment.method,
      status: repayment.status
    }));

    // 12. Prepare response
    const response: LoanStatusResponse = {
      status: currentStatus,
      amount: loan.amount,
      amountDue,
      dueDate: dueDate ? dueDate.toISOString() : null,
      nextPayment,
      daysRemaining,
      insurance,
      repaymentHistory
    };

    // Add rejection reason for rejected loans
    if (currentStatus === 'REJECTED') {
      response.rejectionReason = loan.rejectionReason || 'Document verification failed';
    }

    // Add payment link for delayed payments
    if (paymentLink) {
      response.paymentLink = paymentLink;
    }

    // 13. Log access for audit
    await prisma.auditLog.create({
      data: {
        action: 'LOAN_STATUS_CHECK',
        loanId,
        result: 'SUCCESS',
        ipAddress: clientIP,
        details: JSON.stringify({ 
          status: currentStatus, 
          amountDue,
          authenticatedUser: !!authenticatedAadhaar 
        })
      }
    }).catch((error: any) => {
      console.error('Failed to create audit log:', error);
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('Loan status error:', error);

    // Log error for debugging
    await prisma.auditLog.create({
      data: {
        action: 'LOAN_STATUS_CHECK',
        loanId: req.query.loanId as string || 'unknown',
        result: 'ERROR',
        ipAddress: clientIP,
        details: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }).catch(() => {
      // Ignore audit log errors
    });

    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Utility function to mask sensitive data
export const maskAadhaar = (aadhaar: string): string => {
  if (aadhaar.length !== 12) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
};

// Export functions for testing
export {
  calculateAmountDue,
  calculateDueDate,
  calculateNextPayment,
  getInsuranceCoverage,
  checkRateLimit,
  verifyToken
};