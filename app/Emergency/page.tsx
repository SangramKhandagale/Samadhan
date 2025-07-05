"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  User, 
  Building2, 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Camera,
  MapPin,
  AlertTriangle,
  Download
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types and Interfaces
interface FormData {
  aadhaar: string;
  hospitalId: string;
  accidentDescription: string;
  accidentImage?: File;
}

interface AadhaarData {
  name: string;
  dob: string;
  isValid: boolean;
}

interface HospitalOption {
  value: string;
  label: string;
  address?: string;
  isRegistered?: boolean;
}

interface RiskScoreResponse {
  approved: boolean;
  provisionalAmount: number;
  riskScore: number;
  reason?: string;
}

interface ValidationStatus {
  isValidating: boolean;
  isValid: boolean | null;
  message?: string;
}

// Zod Validation Schema
const formSchema = z.object({
  aadhaar: z
    .string()
    .length(12, "Aadhaar number must be exactly 12 digits")
    .regex(/^\d+$/, "Aadhaar number must contain only digits"),
  hospitalId: z
    .string()
    .min(1, "Please select a hospital"),
  accidentDescription: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description cannot exceed 500 characters"),
  accidentImage: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      "Image must be less than 5MB"
    )
    .refine(
      (file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      "Only JPEG, PNG, and WebP images are allowed"
    )
});

// Mock data for development
const MOCK_MODE = process.env.NODE_ENV === 'development';

const mockAadhaarFetch = (): AadhaarData => ({
  name: "John Doe",
  dob: "1990-01-01",
  isValid: true
});

const mockHospitals: HospitalOption[] = [
  {
    value: 'mock_hospital_1',
    label: 'Charnock Hospital',
    address: '123/1, Eastern Metropolitan Bypass, Kolkata, West Bengal 700094, India',
    isRegistered: true
  },
  {
    value: 'mock_hospital_2',
    label: 'Apollo Hospital',
    address: '21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006, India',
    isRegistered: true
  },
  {
    value: 'mock_hospital_3',
    label: 'Fortis Hospital',
    address: 'Sector 62, Phase 8, Mohali, Punjab 160062, India',
    isRegistered: true
  }
];

/**
 * Emergency Loan Form Component
 * 
 * A comprehensive form for emergency medical loan applications with real-time validation,
 * hospital search, Aadhaar verification, and image upload capabilities.
 * 
 * Features:
 * - Real-time Aadhaar validation
 * - Searchable hospital dropdown
 * - Image upload with preview
 * - Drag and drop support
 * - Mobile responsive design
 * - Accessibility compliant
 */
export default function EmergencyLoanForm() {
  // Form state management
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      aadhaar: '',
      hospitalId: '',
      accidentDescription: '',
      accidentImage: undefined
    }
  });

  // Component state
  const [aadhaarValidation, setAadhaarValidation] = useState<ValidationStatus>({
    isValidating: false,
    isValid: null
  });
  const [hospitalValidation, setHospitalValidation] = useState<ValidationStatus>({
    isValidating: false,
    isValid: null
  });
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [hospitalOptions, setHospitalOptions] = useState<HospitalOption[]>(MOCK_MODE ? mockHospitals : []);
  const [selectedHospital, setSelectedHospital] = useState<HospitalOption | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');

  // Watch form values
  const aadhaarValue = watch('aadhaar');
  const accidentDescription = watch('accidentDescription');
  const accidentImage = watch('accidentImage');

  /**
   * Validates Aadhaar number via API call
   */
  const validateAadhaar = useCallback(async (aadhaar: string) => {
    if (aadhaar.length !== 12) return;

    setAadhaarValidation({ isValidating: true, isValid: null });

    try {
      if (MOCK_MODE) {
        // Mock validation
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = mockAadhaarFetch();
        setAadhaarData(mockData);
        setAadhaarValidation({
          isValidating: false,
          isValid: mockData.isValid,
          message: mockData.isValid ? 'Aadhaar verified' : 'Invalid Aadhaar number'
        });
        return;
      }

      const response = await fetch('/api/verify-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber: aadhaar })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAadhaarData(data);
        setAadhaarValidation({
          isValidating: false,
          isValid: data.isValid,
          message: data.isValid ? 'Aadhaar verified' : 'Invalid Aadhaar number'
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Aadhaar validation error:', error);
      setAadhaarValidation({
        isValidating: false,
        isValid: false,
        message: 'Verification failed. Please try again.'
      });
    }
  }, []);

  /**
   * Validates hospital via API call
   */
  const validateHospital = useCallback(async (hospitalId: string) => {
    if (!hospitalId) return;

    setHospitalValidation({ isValidating: true, isValid: null });

    try {
      if (MOCK_MODE) {
        // Mock validation
        await new Promise(resolve => setTimeout(resolve, 500));
        const hospital = mockHospitals.find(h => h.value === hospitalId);
        setHospitalValidation({
          isValidating: false,
          isValid: hospital?.isRegistered || false,
          message: hospital?.isRegistered ? 'Hospital verified' : 'Hospital not registered'
        });
        return;
      }

      const response = await fetch('/api/verify-hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setHospitalValidation({
          isValidating: false,
          isValid: data.isRegistered,
          message: data.isRegistered ? 'Hospital verified' : 'Hospital not registered'
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Hospital validation error:', error);
      setHospitalValidation({
        isValidating: false,
        isValid: false,
        message: 'Verification failed. Please try again.'
      });
    }
  }, []);

  /**
   * Fetches Aadhaar data from DigiLocker (mock implementation)
   */
  const handleDigiLockerFetch = async () => {
    try {
      toast.loading('Fetching from DigiLocker...', { id: 'digilocker' });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = mockAadhaarFetch();
      setValue('aadhaar', '123456789012'); // Mock Aadhaar number
      setAadhaarData(mockData);
      
      toast.success('Data fetched successfully!', { id: 'digilocker' });
      
      // Trigger validation
      await validateAadhaar('123456789012');
    } catch (error) {
      toast.error('Failed to fetch from DigiLocker', { id: 'digilocker' });
    }
  };

  /**
   * Handles image file selection and preview
   */
  const handleImageChange = (file: File) => {
    setValue('accidentImage', file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handles drag and drop for image upload
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageChange(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  /**
   * Handles hospital search with debouncing
   */
  const searchHospitals = useCallback(async (searchTerm: string) => {
    if (!searchTerm || MOCK_MODE) return;

    try {
      // In a real implementation, this would call an ABDM API
      const response = await fetch(`/api/search-hospitals?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (response.ok) {
        setHospitalOptions(data.hospitals || []);
      }
    } catch (error) {
      console.error('Hospital search error:', error);
    }
  }, []);

  /**
   * Form submission handler
   */
  const onSubmit = async (data: FormData) => {
    try {
      toast.loading('Submitting application...', { id: 'submit' });

      // Prepare form data for submission
      const formData = new FormData();
      formData.append('aadhaarNumber', data.aadhaar);
      formData.append('hospitalId', data.hospitalId);
      formData.append('accidentDescription', data.accidentDescription);
      
      if (data.accidentImage) {
        formData.append('accidentImage', data.accidentImage);
      }

      const response = await fetch('/api/risk-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaarNumber: data.aadhaar,
          hospitalId: data.hospitalId,
          accidentDetails: {
            description: data.accidentDescription,
            imageUrl: data.accidentImage ? 'uploaded' : undefined
          }
        })
      });

      const result: RiskScoreResponse = await response.json();

      if (response.ok) {
        toast.success('Application submitted successfully!', { id: 'submit' });
        
        // Show result
        if (result.approved) {
          toast.success(
            `Approved! Provisional amount: ₹${result.provisionalAmount.toLocaleString()}`,
            { duration: 5000 }
          );
        } else {
          toast.error(`Application denied. Reason: ${result.reason}`, { duration: 5000 });
        }
        
        // In a real app, you would redirect to a confirmation page
        console.log('Risk assessment result:', result);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application. Please try again.', { id: 'submit' });
    }
  };

  // Effects
  useEffect(() => {
    if (aadhaarValue && aadhaarValue.length === 12) {
      const timeoutId = setTimeout(() => {
        validateAadhaar(aadhaarValue);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAadhaarValidation({ isValidating: false, isValid: null });
      setAadhaarData(null);
    }
  }, [aadhaarValue, validateAadhaar]);

  useEffect(() => {
    if (hospitalSearchTerm) {
      const timeoutId = setTimeout(() => {
        searchHospitals(hospitalSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [hospitalSearchTerm, searchHospitals]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Emergency Medical Loan Application
        </h1>
        <p className="text-gray-600">
          Apply for instant emergency medical assistance. All fields are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Aadhaar Number Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Aadhaar Verification</h2>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="aadhaar" className="block text-sm font-medium text-gray-700">
              Aadhaar Number
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Controller
                  name="aadhaar"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="aadhaar"
                      placeholder="Enter 12-digit Aadhaar number"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.aadhaar ? 'border-red-500' : 'border-gray-300'
                      }`}
                      maxLength={12}
                      aria-describedby="aadhaar-error aadhaar-status"
                    />
                  )}
                />
                
                {/* Validation Status */}
                <div className="absolute right-3 top-2.5">
                  {aadhaarValidation.isValidating && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {aadhaarValidation.isValid === true && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {aadhaarValidation.isValid === false && (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleDigiLockerFetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Download className="w-4 h-4" />
                <span>DigiLocker</span>
              </button>
            </div>
            
            {/* Error Messages */}
            {errors.aadhaar && (
              <p id="aadhaar-error" className="text-sm text-red-600">
                {errors.aadhaar.message}
              </p>
            )}
            {aadhaarValidation.message && (
              <p
                id="aadhaar-status"
                className={`text-sm ${
                  aadhaarValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {aadhaarValidation.message}
              </p>
            )}
            
            {/* Aadhaar Data Display */}
            {aadhaarData && aadhaarData.isValid && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>Name:</strong> {aadhaarData.name}
                </p>
                <p className="text-sm text-green-800">
                  <strong>DOB:</strong> {aadhaarData.dob}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Hospital Information</h2>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="hospital" className="block text-sm font-medium text-gray-700">
              Select Hospital
            </label>
            <div className="relative">
              <select
                onChange={(e) => {
                  const hospital = hospitalOptions.find(h => h.value === e.target.value);
                  setSelectedHospital(hospital || null);
                  setValue('hospitalId', e.target.value);
                  if (e.target.value) {
                    validateHospital(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hospitalId ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby="hospital-error hospital-status"
              >
                <option value="">Select a hospital</option>
                {hospitalOptions.map((hospital) => (
                  <option key={hospital.value} value={hospital.value}>
                    {hospital.label}
                  </option>
                ))}
              </select>
              
              {/* Validation Status */}
              <div className="absolute right-3 top-2.5">
                {hospitalValidation.isValidating && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                {hospitalValidation.isValid === true && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {hospitalValidation.isValid === false && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            
            {/* Error Messages */}
            {errors.hospitalId && (
              <p id="hospital-error" className="text-sm text-red-600">
                {errors.hospitalId.message}
              </p>
            )}
            {hospitalValidation.message && (
              <p
                id="hospital-status"
                className={`text-sm ${
                  hospitalValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {hospitalValidation.message}
              </p>
            )}
            
            {/* Hospital Details */}
            {selectedHospital && selectedHospital.address && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{selectedHospital.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Accident Details Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Accident Details</h2>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Accident Description
            </label>
            <Controller
              name="accidentDescription"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="description"
                  rows={4}
                  placeholder="Please provide detailed information about the accident, injuries, and required treatment..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                    errors.accidentDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby="description-error description-count"
                />
              )}
            />
            
            <div className="flex justify-between">
              <div>
                {errors.accidentDescription && (
                  <p id="description-error" className="text-sm text-red-600">
                    {errors.accidentDescription.message}
                  </p>
                )}
              </div>
              <p
                id="description-count"
                className={`text-sm ${
                  (accidentDescription?.length || 0) > 450 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {accidentDescription?.length || 0}/500
              </p>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Accident/Injury Photos (Optional)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Accident preview"
                    className="max-w-full h-48 object-cover mx-auto rounded-md"
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setValue('accidentImage', undefined);
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Remove
                    </button>
                    <label className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageChange(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600">
                      Drag and drop an image here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageChange(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPEG, WebP up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            {errors.accidentImage && (
              <p className="text-sm text-red-600">{errors.accidentImage.message}</p>
            )}
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Important Information:</p>
              <ul className="space-y-1 text-xs">
                <li>• This application will be processed within 15 minutes</li>
                <li>• Approval is subject to risk assessment and hospital verification</li>
                <li>• Funds will be directly transferred to the hospital</li>
                <li>• Misuse of this service may result in legal action</li>
              </ul>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !aadhaarValidation.isValid || !hospitalValidation.isValid}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit Emergency Loan Application</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}