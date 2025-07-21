// Types for Emergency Loan Application

export interface AadhaarCardInfo {
  name: string;
  dateOfBirth: string;
  gender: string;
  aadhaarNumber: string;
  isVerified?: boolean;
}

export interface VerificationResult {
  isAuthentic: boolean;
  checks: string[];
}

export interface HospitalDetails {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  placeId: string;
  businessHours?: string[];
}

export interface HospitalVerificationResult {
  exists: boolean;
  suggestions: string[];
  message: string;
  confidence?: number;
  hospitalDetails?: HospitalDetails;
}

export interface EmergencyFormData {
  patientName: string;
  emergencyType: string;
  emergencyDescription: string;
  medicalCertificate?: File;
  contactNumber: string;
  relationshipToPatient: string;
}

export interface MedicalCertificateAnalysis {
  isValid: boolean;
  confidence: number;
  patientName?: string;
  doctorName?: string;
  diagnosis?: string;
  summary?: string;
}

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export interface CertificateAnalysisResult {
  ocr: OCRResult;
  analysis: MedicalCertificateAnalysis;
}

export interface LoanApplicationSummary {
  applicantDetails: {
    name: string;
    dob: string;
    gender: string;
    aadhaarNumber: string;
    verificationStatus: string;
  };
  hospitalDetails: {
    name: string;
    location: string;
    verificationStatus: string;
    confidence?: number;
  };
  patientDetails: {
    name: string;
    emergencyType: string;
    emergencyDescription: string;
    contactNumber: string;
    relationship: string;
  };
  medicalCertificate?: {
    isValid: boolean;
    confidence: number;
    patientName?: string;
    doctorName?: string;
    diagnosis?: string;
    summary?: string;
  };
  timestamp: string;
  loanStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface DatabaseLoanApplication {
  // Applicant Details
  applicantName: string;
  applicantDob: string;
  applicantGender: string;
  applicantAadhaarNumber: string;
  applicantVerificationStatus: string;
  
  // Hospital Details
  hospitalName: string;
  hospitalLocation: string;
  hospitalVerificationStatus: string;
  hospitalConfidence?: number;
  
  // Patient Details
  patientName: string;
  emergencyType: string;
  emergencyDescription: string;
  contactNumber: string;
  relationshipToPatient: string;
  
  // Medical Certificate
  medicalCertificateValid?: boolean;
  medicalCertificateConfidence?: number;
  medicalCertificatePatientName?: string;
  medicalCertificateDoctorName?: string;
  medicalCertificateDiagnosis?: string;
  medicalCertificateSummary?: string;
  
  // Application Status
  loanStatus: 'Pending' | 'Approved' | 'Rejected';
  aiGeneratedSummary?: string;
  
  // Additional fields for database
  applicationDate?: Date;
  lastUpdated?: Date;
  bankEmployeeNotes?: string;
  approvedBy?: string;
  approvalDate?: Date;
  loanAmount?: number;
  interestRate?: number;
  repaymentPeriod?: number;
}

export interface SubmissionResult {
  success: boolean;
  data?: any;
  applicationId?: string;
  message?: string;
  error?: string;
}

export interface ApplicationListResponse {
  success: boolean;
  data?: DatabaseLoanApplication[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

export interface StatusUpdateData {
  applicationId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  bankEmployeeNotes?: string;
  loanAmount?: number;
  interestRate?: number;
  repaymentPeriod?: number;
}

export interface LoanCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  applicationId?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}