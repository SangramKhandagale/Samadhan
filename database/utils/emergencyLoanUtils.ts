import { LoanApplicationSummary } from '@/app/Emergency/Emergency_API/types';

// Utility function to prepare data for database submission
export const prepareLoanDataForDatabase = (
  aadhaarInfo: any,
  hospitalName: string,
  hospitalLocation: string,
  hospitalVerificationResult: any,
  emergencyFormData: any,
  certificateAnalysis: any,
  aiGeneratedSummary?: string
) => {
  // Ensure all required fields have proper default values
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  return {
    // Applicant Details - with proper defaults (REMOVED applicantVerificationStatus)
    applicantName: aadhaarInfo?.name || emergencyFormData?.patientName || 'Emergency Patient',
    applicantDob: aadhaarInfo?.dateOfBirth || aadhaarInfo?.dob || currentDate,
    applicantGender: aadhaarInfo?.gender || 'Not Specified',
    applicantAadhaarNumber: aadhaarInfo?.aadhaarNumber || 'EMERGENCY-' + Date.now(),
    
    // Hospital Details - with proper defaults
    hospitalName: hospitalName || 'Emergency Hospital',
    hospitalLocation: hospitalLocation || 'Not Specified',
    hospitalVerificationStatus: hospitalVerificationResult?.exists === true ? 'Verified' : 'Not Verified',
    hospitalConfidence: hospitalVerificationResult?.confidence || 0.5,
    
    // Patient Details - with proper defaults
    patientName: emergencyFormData?.patientName || 'Emergency Patient',
    emergencyType: emergencyFormData?.emergencyType || 'Medical Emergency',
    emergencyDescription: emergencyFormData?.emergencyDescription || 'Emergency medical assistance required',
    contactNumber: emergencyFormData?.contactNumber || '0000000000',
    relationshipToPatient: emergencyFormData?.relationshipToPatient || 'Self',
    
    // Loan Details - NEW REQUIRED FIELD
    loanAmountRequired: emergencyFormData?.loanAmountRequired || 50000, // Default amount
    
    // Medical Certificate - with proper defaults (ADDED medicalCertificateText)
    medicalCertificateValid: certificateAnalysis?.analysis?.isValid === true ? true : false,
    medicalCertificateConfidence: certificateAnalysis?.analysis?.confidence || 0,
    medicalCertificatePatientName: certificateAnalysis?.analysis?.patientName || '',
    medicalCertificateDoctorName: certificateAnalysis?.analysis?.doctorName || '',
    medicalCertificateDiagnosis: certificateAnalysis?.analysis?.diagnosis || '',
    medicalCertificateSummary: certificateAnalysis?.analysis?.summary || '',
    medicalCertificateText: certificateAnalysis?.extractedText || '', // NEW FIELD
    
    // Application Status
    loanStatus: 'Pending' as const,
    aiGeneratedSummary: aiGeneratedSummary || 'Emergency loan application submitted',
    
    // Additional required fields
    applicationDate: new Date().toISOString(),
    applicationReference: generateApplicationReference()
  };
};

// Enhanced utility function to submit emergency loan application with better error handling
export const submitEmergencyLoanApplication = async (applicationData: any) => {
  try {
    // Updated required fields validation - removed applicantVerificationStatus, added loanAmountRequired
    const requiredFields = [
      'applicantName',
      'applicantDob', 
      'applicantGender',
      'applicantAadhaarNumber',
      'hospitalName',
      'hospitalLocation',
      'hospitalVerificationStatus',
      'patientName',
      'emergencyType',
      'emergencyDescription',
      'contactNumber',
      'relationshipToPatient',
      'loanAmountRequired' // NEW REQUIRED FIELD
    ];

    const missingFields = requiredFields.filter(field => 
      !applicationData[field] || 
      applicationData[field] === '' || 
      applicationData[field] === null || 
      applicationData[field] === undefined
    );

    if (missingFields.length > 0) {
      console.warn('Missing or empty fields detected:', missingFields);
      console.log('Application data:', applicationData);
      // Don't throw error, just log warning and proceed with submission
    }

    const response = await fetch('/Emergency/Emergency_API/API', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    const result = await response.json();

    if (!response.ok) {
      // Log the full error for debugging
      console.error('API Error Response:', result);
      console.error('Submitted Data:', applicationData);
      throw new Error(result.message || `HTTP ${response.status}: Failed to submit application`);
    }

    return {
      success: true,
      data: result.data,
      applicationId: result.applicationId || result.id,
      message: result.message || 'Application submitted successfully'
    };
  } catch (error: any) {
    console.error('Error submitting emergency loan application:', error);
    
    // Return more detailed error information
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.stack || 'No stack trace available'
    };
  }
};

// NEW: Utility function to get ALL applications by Aadhaar number (supports multiple entries)
export const getApplicationsByAadhaar = async (aadhaarNumber: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(`/Emergency/Emergency_API/API?aadhaar=${aadhaarNumber}&page=${page}&limit=${limit}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch applications');
    }

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      totalApplications: result.pagination?.totalCount || 0
    };
  } catch (error: any) {
    console.error('Error fetching applications by Aadhaar:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

// NEW: Utility function to get only pending applications by Aadhaar number
export const getPendingApplicationsByAadhaar = async (aadhaarNumber: string) => {
  try {
    const response = await fetch(`/Emergency/Emergency_API/API?aadhaar=${aadhaarNumber}&status=Pending`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch pending applications');
    }

    return {
      success: true,
      data: result.data,
      count: result.data?.length || 0
    };
  } catch (error: any) {
    console.error('Error fetching pending applications by Aadhaar:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

// Utility function to get application by ID
export const getApplicationById = async (applicationId: string) => {
  try {
    const response = await fetch(`/Emergency/Emergency_API/API?id=${applicationId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch application');
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    console.error('Error fetching application:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

// Utility function to get applications by status
export const getApplicationsByStatus = async (status: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(`/Emergency/Emergency_API/API?status=${status}&page=${page}&limit=${limit}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch applications');
    }

    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  } catch (error: any) {
    console.error('Error fetching applications by status:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

// Utility function to update application status
export const updateApplicationStatus = async (
  applicationId: string, 
  status: 'Pending' | 'Approved' | 'Rejected',
  additionalData?: {
    approvedBy?: string;
    bankEmployeeNotes?: string;
    loanAmount?: number;
    interestRate?: number;
    repaymentPeriod?: number;
  }
) => {
  try {
    const response = await fetch('/Emergency/Emergency_API/API', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId,
        loanStatus: status,
        approvalDate: status !== 'Pending' ? new Date().toISOString() : undefined,
        ...additionalData
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update application');
    }

    return {
      success: true,
      data: result.data,
      message: result.message
    };
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

// Enhanced utility function to validate emergency form data
export const validateEmergencyFormData = (formData: any) => {
  const errors: string[] = [];

  if (!formData.patientName?.trim()) {
    errors.push('Patient name is required');
  }

  if (!formData.emergencyType?.trim()) {
    errors.push('Emergency type is required');
  }

  if (!formData.emergencyDescription?.trim()) {
    errors.push('Emergency description is required');
  }

  if (!formData.contactNumber?.trim()) {
    errors.push('Contact number is required');
  } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
    errors.push('Contact number must be 10 digits');
  }

  if (!formData.relationshipToPatient?.trim()) {
    errors.push('Relationship to patient is required');
  }

  // NEW VALIDATION: Check for loanAmountRequired
  if (!formData.loanAmountRequired || formData.loanAmountRequired <= 0) {
    errors.push('Loan amount required must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility function to format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Utility function to calculate loan interest
export const calculateLoanInterest = (principal: number, rate: number, time: number) => {
  const monthlyRate = rate / 100 / 12;
  const numberOfPayments = time * 12;
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  const totalAmount = monthlyPayment * numberOfPayments;
  const totalInterest = totalAmount - principal;
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest)
  };
};

// Enhanced utility function to generate application reference number
export const generateApplicationReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `EML-${timestamp}-${randomStr}`;
};

// Utility function to format date
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Utility function to get status color
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Enhanced utility function to mask Aadhaar number
export const maskAadhaarNumber = (aadhaarNumber: string) => {
  if (!aadhaarNumber || aadhaarNumber.length < 12) {
    return aadhaarNumber || 'XXXX XXXX XXXX';
  }
  
  // Remove any existing formatting
  const cleanNumber = aadhaarNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 12) {
    return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 8)} ${cleanNumber.slice(8, 12)}`;
  }
  
  return aadhaarNumber;
};

// Updated utility function to sanitize data before submission
export const sanitizeApplicationData = (data: any) => {
  const sanitized = { ...data };
  
  // Ensure all string fields are properly trimmed and not null
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
    
    // Replace null/undefined with appropriate defaults
    if (sanitized[key] === null || sanitized[key] === undefined) {
      switch (key) {
        case 'applicantDob':
          sanitized[key] = new Date().toISOString().split('T')[0];
          break;
        case 'hospitalVerificationStatus':
          sanitized[key] = 'Not Verified';
          break;
        case 'applicantGender':
          sanitized[key] = 'Not Specified';
          break;
        case 'hospitalConfidence':
        case 'medicalCertificateConfidence':
          sanitized[key] = 0;
          break;
        case 'medicalCertificateValid':
          sanitized[key] = false;
          break;
        case 'loanAmountRequired': // NEW FIELD
          sanitized[key] = 50000; // Default amount
          break;
        default:
          if (typeof sanitized[key] === 'string') {
            sanitized[key] = '';
          }
      }
    }
  });
  
  return sanitized;
};

// NEW: Utility function to check if user has too many pending applications
export const checkApplicationLimits = async (aadhaarNumber: string, maxPending: number = 3) => {
  try {
    const pendingApps = await getPendingApplicationsByAadhaar(aadhaarNumber);
    
    if (!pendingApps.success) {
      return {
        allowed: true,
        message: 'Unable to check existing applications, proceeding with submission'
      };
    }

    const pendingCount = pendingApps.count || 0;
    
    if (pendingCount >= maxPending) {
      return {
        allowed: false,
        message: `You have ${pendingCount} pending applications. Please wait for them to be processed before submitting a new one.`,
        pendingCount
      };
    }

    return {
      allowed: true,
      message: `You can submit a new application. Current pending: ${pendingCount}`,
      pendingCount
    };
  } catch (error: any) {
    console.error('Error checking application limits:', error);
    return {
      allowed: true,
      message: 'Unable to check application limits, proceeding with submission'
    };
  }
};