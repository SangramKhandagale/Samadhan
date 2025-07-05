// pages/api/final-approval.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createHash } from 'crypto';
import { isWithinInterval, subHours } from 'date-fns';

const prisma = new PrismaClient();

// Zod validation schema
const requestSchema = z.object({
  loanId: z.string().regex(/^loan-\d{13}-\d{4}$/, "Invalid loan ID format"),
  documents: z.array(z.object({
    type: z.enum(["FIR", "MEDICAL_REPORT"]),
    text: z.string().min(50, "Document text too short").max(10000, "Document text too long"),
    hash: z.string().length(64, "Invalid hash length")
  })).min(1, "At least one document required").max(5, "Too many documents"),
  hospitalPlaceId: z.string().length(27, "Invalid hospital place ID")
});

type RequestBody = z.infer<typeof requestSchema>;

interface ValidationResult {
  valid: boolean;
  firNumber?: string | null;
  date?: Date | null;
  severity?: number;
}

interface ApprovalResponse {
  approved: boolean;
  approvedAmount: number | null;
  nextSteps: string;
  rejectionReasons?: string[];
  documentStatus: {
    FIR?: "VALID" | "INVALID";
    MEDICAL_REPORT?: "VALID" | "INVALID";
  };
}

// Document validation functions
const validateFIR = (text: string): ValidationResult => {
  const isValid = /(FIR No\.|CR No\.|^[A-Z]{2}\/\d{4}\/\d+)/i.test(text);
  const dateMatch = text.match(/(\d{2}[\/-]\d{2}[\/-]\d{4})/);
  const firNumberMatch = text.match(/(FIR No\.\s*[A-Z0-9\/-]+)/i);
  
  return {
    valid: isValid,
    firNumber: firNumberMatch ? firNumberMatch[0] : null,
    date: dateMatch ? new Date(dateMatch[0].replace(/\//g, '-')) : null
  };
};

const validateMedicalReport = (text: string): ValidationResult => {
  const requiredTerms = ["diagnosis", "treatment", "physician", "hospital"];
  const score = requiredTerms.filter(term => 
    text.toLowerCase().includes(term.toLowerCase())
  ).length;
  
  let severity = 3; // Default to low severity
  if (text.toLowerCase().includes("critical")) {
    severity = 1;
  } else if (text.toLowerCase().includes("serious")) {
    severity = 2;
  }
  
  return {
    valid: score >= 3,
    severity
  };
};

// Fraud detection functions
const checkInconsistencies = (documents: any[], accidentDate: Date): boolean => {
  const dates = documents
    .map(doc => doc.validationResult?.date)
    .filter(date => date !== null && date !== undefined);
    
  return dates.some(date => {
    const timeDiff = Math.abs(new Date(date).getTime() - accidentDate.getTime());
    return timeDiff > 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  });
};

const verifyDocumentHash = async (hash: string): Promise<boolean> => {
  try {
    // In a real implementation, check against stored document hashes
    const storedHash = await prisma.documentHash.findUnique({ 
      where: { hash } 
    });
    return !!storedHash;
  } catch (error) {
    // For demo purposes, simulate hash verification
    return Math.random() > 0.1; // 90% success rate
  }
};

// Mock police API integration
const verifyFIRWithPolice = async (firNumber: string): Promise<boolean> => {
  // In production: integrate with state police API
  // For now, simulate API call with 80% success rate
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return Math.random() > 0.2;
};

// Approval amount calculation
const getApprovedAmount = (medicalSeverity: number): number => {
  switch (medicalSeverity) {
    case 1: return 500000; // Critical
    case 2: return 250000; // Serious
    case 3: return 100000; // Moderate
    default: return 50000; // Default
  }
};

// Rate limiting check
const checkRateLimit = async (loanId: string): Promise<boolean> => {
  const attempts = await prisma.auditLog.count({
    where: {
      loanId,
      action: "FINAL_APPROVAL",
      createdAt: {
        gte: subHours(new Date(), 1) // Last hour
      }
    }
  });
  
  return attempts < 3;
};

// Audit logging
const createAuditLog = async (
  loanId: string, 
  result: string, 
  ipAddress: string | null,
  details?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action: "FINAL_APPROVAL",
        loanId,
        result,
        ipAddress: ipAddress || "unknown",
        details: details ? JSON.stringify(details) : null,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

// Main handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApprovalResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ipAddress = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   req.socket.remoteAddress || null;

  try {
    // 1. Request validation
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: `Invalid request: ${validationResult.error.errors.map(e => e.message).join(', ')}` 
      });
    }

    const input: RequestBody = validationResult.data;

    // 2. Rate limiting check
    const withinRateLimit = await checkRateLimit(input.loanId);
    if (!withinRateLimit) {
      return res.status(429).json({ 
        error: 'Too many attempts. Please try again later.' 
      });
    }

    // 3. Check if loan exists and is in correct status
    const existingLoan = await prisma.loan.findUnique({
      where: { loanId: input.loanId }
    });

    if (!existingLoan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (existingLoan.status !== 'PENDING_APPROVAL') {
      return res.status(409).json({ 
        error: 'Loan has already been processed' 
      });
    }

    // 4. Document validation
    const documentValidations = await Promise.all(
      input.documents.map(async (doc) => {
        let validationResult: ValidationResult;
        
        if (doc.type === "FIR") {
          validationResult = validateFIR(doc.text);
        } else {
          validationResult = validateMedicalReport(doc.text);
        }

        const hashValid = await verifyDocumentHash(doc.hash);
        
        return {
          ...doc,
          validationResult,
          hashValid
        };
      })
    );

    // 5. Collect validation results
    const rejectionReasons: string[] = [];
    const documentStatus: { FIR?: "VALID" | "INVALID"; MEDICAL_REPORT?: "VALID" | "INVALID" } = {};

    let firValid = false;
    let medicalReportValid = false;
    let medicalSeverity = 3;

    for (const docValidation of documentValidations) {
      const { type, validationResult, hashValid } = docValidation;

      if (!hashValid) {
        rejectionReasons.push(`${type} document hash verification failed`);
        documentStatus[type] = "INVALID";
        continue;
      }

      if (type === "FIR") {
        if (validationResult.valid && validationResult.firNumber) {
          // Verify with police API
          const policeVerification = await verifyFIRWithPolice(validationResult.firNumber);
          if (policeVerification) {
            firValid = true;
            documentStatus.FIR = "VALID";
          } else {
            rejectionReasons.push("FIR verification failed with police database");
            documentStatus.FIR = "INVALID";
          }
        } else {
          rejectionReasons.push("FIR format invalid or missing required information");
          documentStatus.FIR = "INVALID";
        }
      }

      if (type === "MEDICAL_REPORT") {
        if (validationResult.valid) {
          medicalReportValid = true;
          medicalSeverity = validationResult.severity || 3;
          documentStatus.MEDICAL_REPORT = "VALID";
        } else {
          rejectionReasons.push("Medical report missing required information (diagnosis, treatment, physician)");
          documentStatus.MEDICAL_REPORT = "INVALID";
        }
      }
    }

    // 6. Check temporal consistency
    const accidentDate = new Date(); // In real app, get from loan data
    const hasInconsistencies = checkInconsistencies(documentValidations, accidentDate);
    
    if (hasInconsistencies) {
      rejectionReasons.push("Document dates are inconsistent with accident timeline");
    }

    // 7. Additional validation: Medical severity check
    if (medicalReportValid && medicalSeverity > 2) {
      rejectionReasons.push("Medical condition severity does not meet minimum requirements");
    }

    // 8. Final approval decision
    const approved = firValid && 
                    medicalReportValid && 
                    !hasInconsistencies && 
                    medicalSeverity <= 2 &&
                    rejectionReasons.length === 0;

    const approvedAmount = approved ? getApprovedAmount(medicalSeverity) : null;

    // 9. Update loan status in database
    await prisma.loan.update({
      where: { loanId: input.loanId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        documents: input.documents,
        riskScore: approved ? medicalSeverity : null,
        approvedAmount: approvedAmount,
        updatedAt: new Date()
      }
    });

    // 10. Create audit log
    await createAuditLog(
      input.loanId,
      approved ? "APPROVED" : "REJECTED",
      ipAddress,
      {
        approvedAmount,
        rejectionReasons,
        documentStatus,
        medicalSeverity
      }
    );

    // 11. Prepare response
    const response: ApprovalResponse = {
      approved,
      approvedAmount,
      nextSteps: approved 
        ? "Funds will be disbursed within 2 hours. You will receive SMS confirmation."
        : "Please review and resubmit with valid documents. Contact support if needed.",
      documentStatus
    };

    if (!approved) {
      response.rejectionReasons = rejectionReasons;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Final approval error:', error);
    
    // Log error for debugging
    if (req.body?.loanId) {
      await createAuditLog(
        req.body.loanId,
        "ERROR",
        ipAddress,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }

    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Export for testing
export {
  validateFIR,
  validateMedicalReport,
  checkInconsistencies,
  getApprovedAmount,
  verifyFIRWithPolice
};