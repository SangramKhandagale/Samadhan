"use client";
import React, { useState, useRef, useEffect } from 'react';
import { enhanceImageForFaceAPI, validateForFaceAPI } from '@/app/FaceAuth/Face_API/ImageEnhancementService';
import LoadingIndicator from '@/app/FaceAuth/LoadingIndicator';
import LocalStorageService from '@/app/FaceAuth/Face_API/LocalStorageService';
import EnhancedFaceApiService from '@/app/FaceAuth/Face_API/FaceApiService';
import { detectAadhaarCard } from '@/app/Emergency/Emergency_API/Verification';
import "@/app/styles/registration.css"

// Define types 
interface EnhancedImageResult {
  originalUrl: string;
  outputUrl: string;
  faceDescriptor: number[];
  quality?: number;
}

interface RegistrationPanelProps {
  username: string;
  setUsername: (username: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  isModelLoaded: boolean;
  registerUser: () => void;
  isRegistering: boolean;
  updateStatus: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onFileSelected: (file: File) => void;
}

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({
  username,
  setUsername,
  phoneNumber,
  setPhoneNumber,
  isModelLoaded,
  registerUser: parentRegisterUser,
  isRegistering,
  updateStatus,
  onFileSelected
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const enhancedImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Component state
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedImage, setEnhancedImage] = useState<EnhancedImageResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhancementAttempts, setEnhancementAttempts] = useState<number>(0);
  const [processingRegistration, setProcessingRegistration] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [faceQualityScore, setFaceQualityScore] = useState<number | null>(null);
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null);
  const [photoRecommendations, setPhotoRecommendations] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [suitabilityResult, setSuitabilityResult] = useState<{
    passes: boolean;
    qualityScore: number;
    failureReasons: string[];
    recommendations: string[];
  } | null>(null);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState<boolean>(false);
  const [isAadhaarCard, setIsAadhaarCard] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [animationStage, setAnimationStage] = useState<string>('idle');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [scanningText, setScanningText] = useState<string>('');
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);

  // Effect to clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (enhancedImage) {
        URL.revokeObjectURL(enhancedImage.originalUrl);
        URL.revokeObjectURL(enhancedImage.outputUrl);
      }
    };
  }, [enhancedImage]);

  // Effect for typing animation in scanning text
  useEffect(() => {
    if (isVerifyingAadhaar) {
      const phrases = [
        "Scanning Neural Patterns...", 
        "Verifying Identity...",
        "Analyzing Aadhaar Data...",
        "Ensuring Document Integrity..."
      ];
      
      let currentPhraseIndex = 0;
      let currentCharIndex = 0;
      let isDeleting = false;
      
      const typeText = () => {
        const currentPhrase = phrases[currentPhraseIndex];
        
        if (isDeleting) {
          setScanningText(currentPhrase.substring(0, currentCharIndex - 1));
          currentCharIndex--;
          
          if (currentCharIndex === 0) {
            isDeleting = false;
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
          }
        } else {
          setScanningText(currentPhrase.substring(0, currentCharIndex + 1));
          currentCharIndex++;
          
          if (currentCharIndex === currentPhrase.length) {
            isDeleting = true;
            setTimeout(() => {}, 1000);
          }
        }
      };
      
      const interval = setInterval(typeText, 100);
      return () => clearInterval(interval);
    } else {
      setScanningText('');
    }
  }, [isVerifyingAadhaar]);

  // Function to validate image before processing
  const validateImage = (file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) {
      updateStatus("File is too large. Maximum size is 10MB.", "error");
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      updateStatus("Invalid file type. Please upload a JPG or PNG image.", "error");
      return false;
    }

    return true;
  };

  // Drag event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateImage(file)) {
        await processFile(file);
      }
    }
  };

  // Function to verify if the uploaded image is an Aadhaar card
  const verifyAadhaarCard = async (file: File): Promise<boolean> => {
    try {
      setIsVerifyingAadhaar(true);
      setAnimationStage('scanning');
      updateStatus("Verifying Aadhaar card...", "info");
      
      const isValidAadhaar = await detectAadhaarCard(file);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isValidAadhaar) {
        setAnimationStage('success');
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        updateStatus("Valid Aadhaar card detected.", "success");
        setIsAadhaarCard(true);
      } else {
        setAnimationStage('error');
        setTimeout(() => setAnimationStage('idle'), 2000);
        updateStatus("This doesn't appear to be an Aadhaar card. Please upload a valid Aadhaar card.", "error");
        setIsAadhaarCard(false);
      }
      
      setAnimationComplete(true);
      setTimeout(() => setAnimationComplete(false), 1000);
      return isValidAadhaar;
    } catch (error) {
      console.error("Error verifying Aadhaar card:", error);
      setAnimationStage('error');
      setTimeout(() => setAnimationStage('idle'), 2000);
      updateStatus("Error verifying Aadhaar card. Please try again.", "error");
      setIsAadhaarCard(false);
      return false;
    } finally {
      setTimeout(() => {
        setIsVerifyingAadhaar(false);
      }, 1000);
    }
  };

  // Function to process the uploaded file
  const processFile = async (file: File) => {
    if (!validateImage(file)) {
      return;
    }
    
    const isValidAadhaar = await verifyAadhaarCard(file);
    
    if (!isValidAadhaar) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setSelectedFile(file);
    setEnhancementAttempts(0);
    setFaceDetected(null);
    setFaceQualityScore(null);
    setFaceConfidence(null);
    setSuitabilityResult(null);
    onFileSelected(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImageRef.current && e.target?.result) {
        previewImageRef.current.src = e.target.result as string;
        previewImageRef.current.classList.remove('hidden');
        
        if (enhancedImageRef.current) {
          enhancedImageRef.current.classList.add('hidden');
        }
        setEnhancedImage(null);
        
        if (isModelLoaded && EnhancedFaceApiService.isLoaded()) {
          checkForFaces(previewImageRef.current);
        }
      }
    };
    reader.readAsDataURL(file);
    
    handleEnhancement(file);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      await processFile(file);
    }
  };

  const checkForFaces = async (imgElement: HTMLImageElement) => {
    try {
      if (!imgElement.complete) {
        await new Promise<void>((resolve) => {
          imgElement.onload = () => resolve();
        });
      }
      
      const { descriptor, quality, confidence } = await EnhancedFaceApiService.getFaceDescriptor(imgElement, true);
      
      setFaceDetected(true);
      setFaceQualityScore(quality);
      setFaceConfidence(confidence);
      
      if (quality < 0.7) {
        setShowRecommendations(true);
      }
      
      return {
        descriptor,
        quality,
        confidence
      };
    } catch (error) {
      console.warn('No face detected in original image:', error);
      setFaceDetected(false);
      setShowRecommendations(true);
      return null;
    }
  };

  const handleEnhancement = async (file: File) => {
    if (!file) return;
    
    setIsEnhancing(true);
    updateStatus('Enhancing your image for better face recognition...', 'info');
    setEnhancementAttempts(prev => prev + 1);
    
    try {
      const originalUrl = URL.createObjectURL(file);
      
      const suitability = await validateForFaceAPI(file, true);
      setSuitabilityResult({
        passes: suitability.isValid,
        qualityScore: suitability.score,
        failureReasons: suitability.issues,
        recommendations: suitability.issues
      });
      
      if (!suitability.isValid) {
        console.warn('Image may not be suitable for face recognition:', suitability.issues);
        setPhotoRecommendations(suitability.issues);
        setShowRecommendations(true);
      }
      
      const enhancementResult = await enhanceImageForFaceAPI(file, true);
      
      if (!enhancementResult.dataUrl) {
        throw new Error("Enhancement service returned empty result");
      }
      
      setFaceQualityScore(enhancementResult.qualityScore);
      
      const enhancedImg = new Image();
      enhancedImg.src = enhancementResult.dataUrl;
      await new Promise<void>((resolve) => {
        enhancedImg.onload = () => resolve();
      });
      
      let faceData = null;
      try {
        faceData = await EnhancedFaceApiService.getFaceDescriptor(enhancedImg, true);
        setFaceDetected(true);
        setFaceQualityScore(faceData.quality);
        setFaceConfidence(faceData.confidence);
        updateStatus(`Face features extracted with quality score: ${(faceData.quality * 10).toFixed(1)}/10`, "success");
      } catch (faceError) {
        console.warn('No face detected in enhanced image:', faceError);
        
        if (previewImageRef.current) {
          try {
            faceData = await EnhancedFaceApiService.getFaceDescriptor(previewImageRef.current, true);
            setFaceDetected(true);
            setFaceQualityScore(faceData.quality);
            setFaceConfidence(faceData.confidence);
            updateStatus("Using original image face features (enhancement didn't improve detection).", "info");
          } catch {
            setFaceDetected(false);
            updateStatus("No facial features detected. Please upload a clearer image with a face.", "warning");
          }
        }
      }
      
      const result: EnhancedImageResult = {
        originalUrl,
        outputUrl: enhancementResult.dataUrl,
        faceDescriptor: faceData ? Array.from(faceData.descriptor) : [],
        quality: faceData ? faceData.quality : enhancementResult.qualityScore
      };
      
      setEnhancedImage(result);
      
      if (enhancedImageRef.current) {
        enhancedImageRef.current.src = enhancementResult.dataUrl;
        enhancedImageRef.current.classList.remove('hidden');
      }
      
      if (enhancementResult.recommendations && enhancementResult.recommendations.length > 0) {
        setPhotoRecommendations(enhancementResult.recommendations);
        setShowRecommendations(true);
      }
      
      if (username.trim() && phoneNumber.trim() && isModelLoaded && 
          faceData && faceData.quality > 0.6) {
        registerUserWithFaceData(result);
      } else if (username.trim() && phoneNumber.trim() && isModelLoaded && faceData) {
        updateStatus('Image processed, but face quality may not be optimal. You can still proceed.', 'info');
      }
    } catch (err: any) {
      console.error('Error enhancing image:', err);
      
      if (err.message && err.message.includes('Failed to load image')) {
        updateStatus(`Enhancement failed: Image could not be loaded properly. Please try a different image format or file.`, "warning");
      } else if (enhancementAttempts >= 2) {
        updateStatus(`Multiple enhancement attempts failed. You may continue with the original image.`, "warning");
      } else {
        updateStatus(`Failed to enhance image: ${err.message || 'Unknown error'}. You can retry or continue with original.`, "warning");
      }
      
      if (previewImageRef.current && previewImageRef.current.src) {
        useOriginalImage();
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const useOriginalImage = async () => {
    if (selectedFile && previewImageRef.current && previewImageRef.current.src) {
      const originalUrl = URL.createObjectURL(selectedFile);
      
      if (isModelLoaded && EnhancedFaceApiService.isLoaded() && previewImageRef.current) {
        try {
          const { descriptor, quality, confidence } = await EnhancedFaceApiService.getFaceDescriptor(previewImageRef.current, true);
          
          setFaceDetected(true);
          setFaceQualityScore(quality);
          setFaceConfidence(confidence);
          
          const result: EnhancedImageResult = {
            originalUrl,
            outputUrl: previewImageRef.current.src,
            faceDescriptor: Array.from(descriptor),
            quality
          };
          
          setEnhancedImage(result);
          
          if (enhancedImageRef.current) {
            enhancedImageRef.current.src = previewImageRef.current.src;
            enhancedImageRef.current.classList.remove('hidden');
          }
          
          updateStatus('Using original image with detected face features for registration.', 'info');
          
          if (username.trim() && phoneNumber.trim() && isModelLoaded) {
            registerUserWithFaceData(result);
          }
        } catch (error) {
          console.error('Failed to get face descriptor from original:', error);
          
          const placeholderVectors = Array(128).fill(0).map(() => Math.random() * 2 - 1);
          
          const result: EnhancedImageResult = {
            originalUrl,
            outputUrl: previewImageRef.current.src,
            faceDescriptor: placeholderVectors,
            quality: 0.3
          };
          
          setEnhancedImage(result);
          setFaceDetected(false);
          setFaceQualityScore(0.3);
          
          if (enhancedImageRef.current) {
            enhancedImageRef.current.src = previewImageRef.current.src;
            enhancedImageRef.current.classList.remove('hidden');
          }
          
          updateStatus('Using original image for registration. No face detected, authentication may be less reliable.', 'warning');
          setShowRecommendations(true);
        }
      } else {
        const placeholderVectors = Array(128).fill(0).map(() => Math.random() * 2 - 1);
        
        const result: EnhancedImageResult = {
          originalUrl,
          outputUrl: previewImageRef.current.src,
          faceDescriptor: placeholderVectors,
          quality: 0.3
        };
        
        setEnhancedImage(result);
        
        if (enhancedImageRef.current) {
          enhancedImageRef.current.src = previewImageRef.current.src;
          enhancedImageRef.current.classList.remove('hidden');
        }
        
        updateStatus('Using original image for registration.', 'info');
      }
    } else {
      updateStatus("No image available", "error");
    }
  };

  const registerUserWithFaceData = async (imageData: EnhancedImageResult) => {
    if (processingRegistration) return;
    setProcessingRegistration(true);
    
    try {
      const quality = imageData.quality || faceQualityScore || 0.5;
      const recommendedThreshold = EnhancedFaceApiService.getThresholds().effective;
      
      const userData = {
        username: username.trim(),
        faceDescriptor: imageData.faceDescriptor,
        imagePath: imageData.originalUrl,
        enhancedImagePath: imageData.outputUrl,
        phone: phoneNumber.trim(),
        registeredAt: new Date().toISOString(),
        faceQualityScore: quality,
        recommendedThreshold,
        isVerifiedAadhaar: isAadhaarCard || false
      };
      
      LocalStorageService.saveUserData(userData);
      
      setAnimationStage('registered');
      updateStatus('Face data saved! Proceeding with registration...', 'success');
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      parentRegisterUser();
    } catch (error) {
      console.error('Error during registration:', error);
      updateStatus('Registration failed. Please try again.', 'error');
      setAnimationStage('error');
    } finally {
      setProcessingRegistration(false);
    }
  };

  const registerUser = () => {
    if (!enhancedImage) {
      updateStatus("No enhanced image available. Please upload an image first.", "error");
      return;
    }
    
    if (!isAadhaarCard) {
      updateStatus("Valid Aadhaar card verification required. Please upload a valid Aadhaar card.", "error");
      return;
    }
    
    registerUserWithFaceData(enhancedImage);
  };

  const retryEnhancement = () => {
    if (selectedFile) {
      setEnhancedImage(null);
      if (enhancedImageRef.current) {
        enhancedImageRef.current.classList.add('hidden');
      }
      
      handleEnhancement(selectedFile);
    } else {
      updateStatus("No image available for enhancement", "error");
    }
  };

  const getQualityLabel = (score: number): {label: string, color: string} => {
    if (score >= 0.8) return { label: "Excellent", color: "text-green-600" };
    if (score >= 0.7) return { label: "Good", color: "text-green-500" };
    if (score >= 0.5) return { label: "Acceptable", color: "text-yellow-500" };
    if (score >= 0.3) return { label: "Poor", color: "text-orange-500" };
    return { label: "Very Poor", color: "text-red-600" };
  };

  const isFormValid = () => {
    return username.trim() !== '' && 
           phoneNumber.trim() !== '' && 
           !isEnhancing && 
           isModelLoaded &&
           isAadhaarCard === true &&
           (enhancedImage !== null || selectedFile !== null);
  };

  const renderScanningAnimation = () => {
    return (
      <div className="scanning-animation w-full h-full absolute top-0 left-0 flex flex-col items-center justify-center z-10">
        <div className="relative w-full max-w-xs">
          <div className="scanning-line bg-cyan-400 h-1 w-full absolute left-0 animate-scanline"></div>
          <div className="typing-text text-center mt-4 h-6 text-cyan-400 font-orbitron">
            {scanningText}
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessAnimation = () => {
    return (
      <div className="success-animation absolute inset-0 flex items-center justify-center z-20">
        <div className="success-icon relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-cyan-400 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute w-14 h-14 bg-cyan-500 rounded-full opacity-30 animate-pulse"></div>
          <svg className="w-10 h-10 text-cyan-500 z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  };

  const renderErrorAnimation = () => {
    return (
      <div className="error-animation absolute inset-0 flex items-center justify-center z-20">
        <div className="error-icon relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-red-400 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute w-14 h-14 bg-red-500 rounded-full opacity-30 animate-pulse"></div>
          <svg className="w-10 h-10 text-red-500 z-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="registration-panel">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="circuit-pattern"></div>
        <div className="top-highlight"></div>
        <div className="bottom-highlight"></div>
        <div className="holographic-particles"></div>
      </div>
      
      {showCelebration && (
        <div className="confetti-container">
          <div className="confetti-animation"></div>
        </div>
      )}
      
      <div className="header">
        <h2 className="title">
         Face Registration
        </h2>
        <p className="subtitle">
          Secure your identity
        </p>
      </div>
      
      <div className="form-area">
        <div className="form-group">
          <label className="input-label">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="input-label">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-input"
            required
          />
        </div>
      </div>

      <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden-input"
        />
        
        <div 
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {(isVerifyingAadhaar || animationStage !== 'idle') && (
            <div className="verification-overlay">
              {isVerifyingAadhaar && renderScanningAnimation()}
              {animationStage === 'success' && renderSuccessAnimation()}
              {animationStage === 'error' && renderErrorAnimation()}
              {animationStage === 'registered' && renderSuccessAnimation()}
            </div>
          )}

          <div className="upload-content">
            <div className="upload-icon-container">
              <svg className={`upload-icon ${isDragging ? 'dragging' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className={`upload-heading ${isDragging ? 'dragging' : ''}`}>
              Upload Aadhaar Card
            </h3>
            <p className="upload-instruction">
              Drag & drop or click to select
            </p>
          </div>
        </div>

        {isAadhaarCard === true && !isVerifyingAadhaar && (
          <div className="status-message success-message">
            <p className="status-text">
              <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Valid Aadhaar card verified & secured
            </p>
          </div>
        )}
        
        {isAadhaarCard === false && !isVerifyingAadhaar && (
          <div className="status-message error-message">
            <p className="status-text">
              <svg className="status-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Document validation failed. Please upload a valid Aadhaar card.
            </p>
          </div>
        )}
        
        <div className="image-preview-grid">
          <div className="preview-container">
            <div className="preview-header">
              Original Image
            </div>
            <div className="preview-content">
              <img ref={previewImageRef} alt="Preview" className="preview-image hidden" />
              {!selectedFile && <p className="no-image-text">No image uploaded</p>}
            </div>
          </div>
          
          <div className="preview-container">
            <div className="preview-header">
              Enhanced Image
            </div>
            <div className="preview-content">
              <img ref={enhancedImageRef} alt="Enhanced" className="preview-image hidden" />
              {isEnhancing && <LoadingIndicator message="Optimizing..." />}
              {!enhancedImage && !isEnhancing && <p className="no-image-text">Awaiting enhancement</p>}
            </div>
          </div>
        </div>
        
        {faceQualityScore !== null && (
          <div className="quality-analysis-container">
            <h4 className="quality-analysis-title">Image Quality Analysis</h4>
            
            <div className="quality-indicators">
              <div className="quality-indicator">
                <div className="quality-label-container">
                  <span className="quality-label">Face Quality:</span>
                  {faceQualityScore && (
                    <span className={`quality-value ${
                      faceQualityScore > 0.7 ? 'high-quality' : 
                      faceQualityScore > 0.5 ? 'good-quality' : 
                      faceQualityScore > 0.4 ? 'medium-quality' : 
                      faceQualityScore > 0.3 ? 'low-quality' : 'poor-quality'
                    }`}>
                      {getQualityLabel(faceQualityScore).label} ({(faceQualityScore * 10).toFixed(1)}/10)
                    </span>
                  )}
                </div>
                <div className="progress-bar-background">
                  <div 
                    className={`progress-bar ${
                      faceQualityScore > 0.7 ? 'high-quality' : 
                      faceQualityScore > 0.5 ? 'good-quality' : 
                      faceQualityScore > 0.4 ? 'medium-quality' : 
                      faceQualityScore > 0.3 ? 'low-quality' : 'poor-quality'
                    }`} 
                    style={{ width: `${Math.max(5, faceQualityScore * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {faceConfidence !== null && (
                <div className="quality-indicator">
                  <div className="quality-label-container">
                    <span className="quality-label">Detection Confidence:</span>
                    <span className="confidence-value">{(faceConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar-background">
                    <div 
                      className="progress-bar confidence-bar" 
                      style={{ width: `${Math.max(5, faceConfidence * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {faceDetected === true && (
              <div className="detection-status success">
                <svg className="detection-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="detection-text">Facial features extracted successfully</span>
              </div>
            )}
            
            {faceDetected === false && (
              <div className="detection-status error">
                <svg className="detection-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="detection-text">No facial features detected</span>
              </div>
            )}
          </div>
        )}
        
        {suitabilityResult && !suitabilityResult.passes && (
          <div className="warning-container">
            <p className="warning-title">Image quality issues detected:</p>
            <ul className="warning-list">
              {suitabilityResult.failureReasons.map((reason, idx) => (
                <li key={idx} className="warning-item">
                  <span className="warning-bullet">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {showRecommendations && photoRecommendations.length > 0 && (
          <div className="recommendations-container">
            <h4 className="recommendations-title">For optimal facial authentication:</h4>
            <ul className="recommendations-list">
              {photoRecommendations.map((tip, index) => (
                <li key={index} className="recommendation-item">
                  <span className="recommendation-bullet">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {isEnhancing && (
          <div className="enhancing-container">
            <div className="loading-pulse-ring"></div>
            <p className="enhancing-text">Enhancing facial pattern recognition...</p>
          </div>
        )}
        
        {selectedFile && !isEnhancing && (!enhancedImage || enhancementAttempts > 0) && (
          <div className="enhancement-actions">
            <button 
              onClick={retryEnhancement}
              className="action-button retry-button"
            >
              <span className="button-content">
                <svg className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Enhancement
              </span>
            </button>
            
            {enhancementAttempts > 0 && (
              <button 
                onClick={useOriginalImage}
                className="action-button use-original-button"
              >
                <span className="button-content">
                  <svg className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Use Original
                </span>
              </button>
            )}
          </div>
        )}
        
        <button
          onClick={registerUser}
          disabled={!isFormValid() || isRegistering || processingRegistration}
          className={`register-button ${
            isFormValid() && !isRegistering && !processingRegistration
              ? 'active'
              : 'disabled'
          }`}
        >
          {isRegistering || processingRegistration ? (
            <>
              <div className="spin-loader"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="register-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Register Facial Identity</span>
            </>
          )}
        </button>
        
        <p className="security-message">
          <svg className="security-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your Identity is Protected by Our Advanced Vault™
        </p>
        
        {process.env.NODE_ENV === 'development' && enhancedImage && (
          <div className="debug-container">
            <p className="debug-title">Debug Info:</p>
            <p className="debug-info">- Vector Length: {enhancedImage.faceDescriptor.length}</p>
            <p className="debug-info">- Image Quality: {enhancedImage.quality?.toFixed(2) || 'N/A'}</p>
            {EnhancedFaceApiService.isLoaded() ? (
              <p className="debug-info">- Current Threshold: {EnhancedFaceApiService.getThresholds().effective.toFixed(3)}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPanel;