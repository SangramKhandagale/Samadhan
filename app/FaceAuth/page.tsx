
"use client"
import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import axios from 'axios';
import "@/app/styles/FaceAuth.css"
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
// Define types for our component
interface UserData {
  username: string;
  faceDescriptor: number[];
  imagePath: string;
  enhancedImagePath?: string;
  phone?: string; // Added phone number field
}

interface FaceAPI {
  nets: {
    tinyFaceDetector: { loadFromUri: (url: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (url: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (url: string) => Promise<void> };
  };
  TinyFaceDetectorOptions: new () => unknown;
  detectSingleFace: (input: HTMLVideoElement | HTMLImageElement, options: unknown) => Promise<any>;
  euclideanDistance: (descriptor1: Float32Array, descriptor2: Float32Array) => number;
}

interface EnhancedImageResult {
  originalUrl: string;
  outputUrl: string;
  vectors?: number[];
}

// New interface for Bland API call tracking
interface AuthFailureLog {
  timestamp: number;
  username: string;
  attempts: number;
  notificationSent: boolean;
}

const EnhancedFaceAuth: React.FC = () => {
  // State variables
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [registeredUsername, setRegisteredUsername] = useState<string | null>(null);
  const [registeredFaceDescriptor, setRegisteredFaceDescriptor] = useState<Float32Array | null>(null);
  const [username, setUsername] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Loading models...');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [showAuthentication, setShowAuthentication] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedImage, setEnhancedImage] = useState<EnhancedImageResult | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [isCallingUser, setIsCallingUser] = useState<boolean>(false);
  const router=useRouter();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const enhancedImageRef = useRef<HTMLImageElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // Load face-api.js models when the component mounts
  useEffect(() => {
    const loadModels = async () => {
      try {
        updateStatus('Loading Face API models... Please wait.', 'info');
        console.log("Starting to load face-api.js models...");
        
        // Check if face-api is available

        if (typeof (window as Window & { faceapi?: unknown }).faceapi === 'undefined') {
          window.location.reload();
          throw new Error('Face API library not loaded. Check your internet connection or try a different browser.');
        }
        
        const faceapi = (window as Window & { faceapi: FaceAPI }).faceapi;
        // Set the models URL to a reliable CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
        
        // Load all required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        console.log('Models loaded successfully');
        setIsModelLoaded(true);
        updateStatus('Models loaded. Enter your username and upload an image to register.', 'success');
        
        // Check for stored face data
        const storedUser = localStorage.getItem('registeredUser');
        if (storedUser) {
          const userData: UserData = JSON.parse(storedUser);
          setRegisteredUsername(userData.username);
          setRegisteredFaceDescriptor(new Float32Array(userData.faceDescriptor));
          setLoginUsername(userData.username);
          setPhoneNumber(userData.phone || '');
          updateStatus(`User "${userData.username}" already registered. Ready for authentication.`, 'success');
          setShowAuthentication(true);
          startVideo();
        }
        
        // Load failed authentication attempts
        loadFailedAuthAttempts();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading models:', error);
        updateStatus(`Failed to load models: ${error.message}`, 'error');
      }
    };

    loadModels();

    // Cleanup function to stop video stream when component unmounts
    return () => {
      stopVideo();
      // Revoke any created object URLs
      if (enhancedImage) {
        if (enhancedImage.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.originalUrl);
        }
        if (enhancedImage.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.outputUrl);
        }
      }
    };
  }, []);

  // Load failed authentication attempts from localStorage
  const loadFailedAuthAttempts = () => {
    try {
      const failedAuthData = localStorage.getItem('failedAuthAttempts');
      if (failedAuthData) {
        const authData: AuthFailureLog = JSON.parse(failedAuthData);
        
        // Only use data if it's from the last 30 minutes
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (authData.timestamp > thirtyMinutesAgo) {
          setFailedAttempts(authData.attempts);
          setLastNotificationTime(authData.notificationSent ? authData.timestamp : 0);
        } else {
          // Reset if older than 30 minutes
          localStorage.removeItem('failedAuthAttempts');
          setFailedAttempts(0);
          setLastNotificationTime(0);
        }
      }
    } catch (error) {
      console.error('Error loading failed authentication data:', error);
    }
  };

  // Save failed authentication attempts to localStorage
  const saveFailedAuthAttempts = (attempts: number, notificationSent: boolean) => {
    try {
      const authData: AuthFailureLog = {
        timestamp: Date.now(),
        username: registeredUsername || '',
        attempts: attempts,
        notificationSent: notificationSent
      };
      localStorage.setItem('failedAuthAttempts', JSON.stringify(authData));
    } catch (error) {
      console.error('Error saving failed authentication data:', error);
    }
  };

  // Helper function to update status with appropriate styling
  const updateStatus = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Start webcam video stream
  const startVideo = async () => {
    try {
      // Stop any existing stream
      stopVideo();
      
      updateStatus('Activating webcam...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
      }
      
      updateStatus('Webcam active. Position your face for authentication.', 'success');
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      updateStatus('Cannot access webcam. Please allow camera permissions and refresh.', 'error');
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
  };

  // Handle image upload change
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB
        updateStatus("File is too large. Maximum size is 10MB.", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImageRef.current && e.target?.result) {
          previewImageRef.current.src = e.target.result as string;
          previewImageRef.current.classList.remove('hidden');
        }
      };
      reader.readAsDataURL(file);
      
      // Enhance the image automatically
      enhanceImage(file);
    }
  };
  
  // Apply enhancement to the image
  const enhanceImage = async (file: File) => {
    setIsEnhancing(true);
    updateStatus('Enhancing your image for better face recognition...', 'info');
    
    try {
      // Create a URL for the original image for display
      const originalUrl = URL.createObjectURL(file);
      
      // Apply the enhancement process
      const enhancedDataUrl = await applyEnhancement(file);
      
      // Create the result object
      const result: EnhancedImageResult = {
        originalUrl,
        outputUrl: enhancedDataUrl
      };
      
      // Save the result
      setEnhancedImage(result);
      
      // Show the enhanced image
      if (enhancedImageRef.current) {
        enhancedImageRef.current.src = enhancedDataUrl;
        enhancedImageRef.current.classList.remove('hidden');
      }
      
      updateStatus('Image enhanced successfully! You can now register.', 'success');
    } catch (err) {
      console.error('Error enhancing image:', err);
      updateStatus('Failed to enhance image. Continuing with original.', 'warning');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Apply enhancement to the image
  const applyEnhancement = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          try {
            // Create a canvas with 4x scaling for better face recognition (changed from 2x to 4x)
            const canvas = document.createElement('canvas');
            canvas.width = img.width * 4;  // Changed from 2x to 4x
            canvas.height = img.height * 4; // Changed from 2x to 4x
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Apply base scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Apply sharpening for better facial features (increased strength from 1.5 to 2.0)
            applySharpening(ctx, canvas.width, canvas.height, 2.0); 
            
            // Apply stronger contrast enhancement for better feature detection
            ctx.filter = 'contrast(1.3) brightness(1.05) saturate(1.1)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            
            // Return the enhanced image as a data URL
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Apply a sharpening convolution filter to the canvas
  const applySharpening = (ctx: CanvasRenderingContext2D, width: number, height: number, strength: number) => {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const dataBackup = new Uint8ClampedArray(data);
    
    // Sharpening kernel
    const factor = Math.min(0.5, (strength - 1) * 0.25);
    const kernel = [
      -factor, -factor, -factor,
      -factor, 1 + factor * 8, -factor,
      -factor, -factor, -factor
    ];
    
    // Apply convolution filter (skip 1px at edges)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const offset = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              const dataIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += dataBackup[dataIndex] * kernel[kernelIndex];
            }
          }
          data[offset + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Register user's face from enhanced image
  const registerUser = async () => {
    if (!isModelLoaded) {
      updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
      return;
    }
    
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      updateStatus('Please select an image first!', 'warning');
      return;
    }
    
    if (!username.trim()) {
      updateStatus('Please enter a username!', 'warning');
      return;
    }

    if (!phoneNumber.trim()) {
      updateStatus('Please enter a phone number for security notifications!', 'warning');
      return;
    }
    
    try {
      setIsRegistering(true);
      updateStatus('Processing enhanced image for registration...', 'info');
      
      const faceapi = (window as any).faceapi;
      
      // Use the enhanced image if available, otherwise use the original
      const imageToProcess = enhancedImage ? enhancedImage.outputUrl : URL.createObjectURL(fileInputRef.current.files[0]);
      
      // Create an Image object to use with face-api
      const img = await createImageFromUrl(imageToProcess);
      
      // Detect face and get descriptor
      const results = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!results) {
        updateStatus('No face detected in the image! Please try another image.', 'error');
        setIsRegistering(false);
        return;
      }
      
      // Store face descriptor and username
      setRegisteredFaceDescriptor(results.descriptor);
      const trimmedUsername = username.trim();
      setRegisteredUsername(trimmedUsername);
      
      // Store face descriptor, username, and phone number in localStorage
      const userData: UserData = {
        username: trimmedUsername,
        faceDescriptor: Array.from(results.descriptor),
        imagePath: enhancedImage ? enhancedImage.originalUrl : URL.createObjectURL(fileInputRef.current.files[0]),
        enhancedImagePath: enhancedImage ? enhancedImage.outputUrl : undefined,
        phone: phoneNumber.trim() // Store phone number
      };
      
      localStorage.setItem('registeredUser', JSON.stringify(userData));
      
      // Reset failed attempts when registering
      setFailedAttempts(0);
      setLastNotificationTime(0);
      saveFailedAuthAttempts(0, false);
      
      updateStatus(`User "${trimmedUsername}" registered successfully with enhanced image! Ready for authentication.`, 'success');
      setIsRegistering(false);
      
      // Show authentication section
      setShowAuthentication(true);
      setLoginUsername(trimmedUsername);
      startVideo();
    } catch (error: any) {
      console.error('Registration error:', error);
      updateStatus(`Error during registration: ${error.message}`, 'error');
      setIsRegistering(false);
    }
  };

  // Helper function to create image from URL
  const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Make call using Bland API to notify user of suspicious login attempts
  const notifyUserViaBland = async () => {
    if (isCallingUser) return false;
    
    try {
      setIsCallingUser(true);
      updateStatus('Security alert: Contacting account owner...', 'warning');
      
      const storedUser = localStorage.getItem('registeredUser');
      if (!storedUser) {
        throw new Error('User data not found');
      }
      
      const userData: UserData = JSON.parse(storedUser);
      if (!userData.phone) {
        throw new Error('No phone number registered for notifications');
      }
      
      // Create support request object
      const request = {
        name: userData.username,
        phone: userData.phone,
        subject: "Security Alert: Unauthorized Access Attempt",
        description: `There have been ${failedAttempts} failed login attempts to your account in the last 30 minutes. This might be a security breach attempt.`
      };
      
      // Create analysis response object
      const analysis = {
        solution: "We detected suspicious login activity on your account. As a security measure, we're calling to verify if this is you trying to log in. If not, we recommend changing your password immediately.",
        language: "en" // Default to English
      };
      
      const result = await makePhoneCall(request, analysis);
      
      if (result) {
        updateStatus(`Security alert sent to registered phone number. The account owner has been notified.`, 'warning');
        setLastNotificationTime(Date.now());
        saveFailedAuthAttempts(failedAttempts, true);
        return true;
      } else {
        updateStatus('Failed to send security notification. Please try again later.', 'error');
        return false;
      }
    } catch (error: any) {
      console.error('Error making notification call:', error);
      updateStatus(`Error sending notification: ${error.message}`, 'error');
      return false;
    } finally {
      setIsCallingUser(false);
    }
  };
  
  // Implementation of Bland AI phone call function
  const makePhoneCall = async (request: any, analysis: any): Promise<boolean> => {
    try {
      const blandApiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
      
      if (!blandApiKey) {
        throw new Error('Bland.ai API key is not defined');
      }
      
      // Format the phone number to E.164 format
      const formattedPhone = request.phone.replace(/\D/g, '');
      if (!formattedPhone || formattedPhone.length < 10) {
        throw new Error('Invalid phone number');
      }
      
      const phoneWithCountryCode = formattedPhone.startsWith('1') ? 
        `+${formattedPhone}` : `+91${formattedPhone}`;
      
      // Headers for Bland.ai API
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${blandApiKey}`
      };
      
      // Enhanced Bland.ai API call configuration
      const data = {
        phone_number: phoneWithCountryCode,
        task: `You're a bank security system. The customer ${request.name} has suspicious login activity: ${request.description}. Based on our analysis, please inform them: ${analysis.solution}. Call them to notify about this security concern. Make it clear this is an automated security call. Speak to them in ${analysis.language}. Make it Natural but urgent.`,
        voice: "June",
        wait_for_greeting: false,
        record: true,
        amd: false,
        answered_by_enabled: false,
        noise_cancellation: false,
        interruption_threshold: 100,
        block_interruptions: false,
        max_duration: 12,
        model: "base",
        language: "en", // Default to English
        background_track: "none",
        endpoint: "https://api.bland.ai",
        voicemail_action: "hangup"
      };
      
      const response = await axios.post('https://api.bland.ai/v1/calls', data, { headers });
      
      return !!response.data.call_id;
    } catch (error) {
      console.error('Error making phone call with Bland.ai:', error);
      return false;
    }
  };

  // Authenticate user against registered face
  const authenticateUser = async () => {
    if (!registeredFaceDescriptor || !registeredUsername) {
      updateStatus('No user registered! Please register first.', 'warning');
      return;
    }
    
    if (!isModelLoaded) {
window.location.reload();

    // Example usage: Refresh the page every 5 seconds
    // autoRefresh(5000);
      updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
      return;
    }
    
    // Check username
    const enteredUsername = loginUsername.trim();
    if (!enteredUsername) {
      updateStatus('Please enter your username!', 'warning');
      return;
    }
    
    if (enteredUsername !== registeredUsername) {
      updateStatus('Authentication failed! Username does not match.', 'error');
      return;
    }
    
    try {
      setIsAuthenticating(true);
      updateStatus('Authenticating... Keep your face visible.', 'info');
      
      const faceapi = (window as any).faceapi;
      // Detect face in current video frame
      const results = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!results) {
        updateStatus('No face detected in camera! Please ensure your face is clearly visible.', 'warning');
        setIsAuthenticating(false);
        return;
      }
      
      // Compare with registered face descriptor (which came from the enhanced image)
      const distance = faceapi.euclideanDistance(results.descriptor, registeredFaceDescriptor);
      console.log('Face match distance:', distance);

      // Here is the updated function with 3 different authentication scenarios based on match distance
      if (distance < 0.47) {
        const toastId =toast.loading("Authenticating...");
        setTimeout(() => {
          toast.success("you will be redirected to the dashboard",{id:toastId})
        }, 2000);
        // Scenario 1: Strong match - Successfully authenticated
        setTimeout(() => {
          updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
        router.push("/UserDashboard")
        // Reset failed attempts on successful login
        setFailedAttempts(0);
        saveFailedAuthAttempts(0, false);
        }, 3000);
      } else if (distance < 0.56) {
        // Scenario 2: Partial match - Need better photo quality
        updateStatus(`Partial match detected. Please update your profile photo with better quality for improved recognition.`, 'warning');
        
        const toastId =toast.loading("Authenticating...");
        setTimeout(() => {
          toast.success("you will be redirected to the dashboard",{id:toastId})
        }, 2000);
        // Scenario 1: Strong match - Successfully authenticated
        setTimeout(() => {
          updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
        router.push("/UserDashboard")
        // Reset failed attempts on successful login
        setFailedAttempts(0);
        saveFailedAuthAttempts(0, false);
        }, 3000);
        // Increment failed attempts but don't trigger security alert yet
        // const newFailedAttempts = failedAttempts + 1;
        // setFailedAttempts(newFailedAttempts);
        // saveFailedAuthAttempts(newFailedAttempts, false);
      } else {
        // Scenario 3: No match - Authentication failed
        updateStatus('Authentication failed! Face not recognized.', 'error');
        
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Check if we should send a security notification
        // Criteria: 3+ failed attempts AND no notification in the last 30 minutes
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (newFailedAttempts >= 3 && lastNotificationTime < thirtyMinutesAgo) {
          // Call the Bland API to notify the user
          notifyUserViaBland();
        } else {
          saveFailedAuthAttempts(newFailedAttempts, lastNotificationTime >= thirtyMinutesAgo);
        }
      }
      
      setIsAuthenticating(false);
    } catch (error: any) {
      console.error('Authentication error:', error);
      updateStatus(`Error during authentication: ${error.message}`, 'error');
      setIsAuthenticating(false);
    }
  };

  // Reset stored data
  const resetRegistration = async () => {
    try {
      localStorage.removeItem('registeredUser');
      localStorage.removeItem('failedAuthAttempts');
      setRegisteredFaceDescriptor(null);
      setRegisteredUsername(null);
      setFailedAttempts(0);
      setLastNotificationTime(0);
      
      // Stop webcam if it's running
      stopVideo();
      
      // Reset upload input and username fields
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUsername('');
      setLoginUsername('');
      setPhoneNumber('');
      if (previewImageRef.current) previewImageRef.current.classList.add('hidden');
      if (enhancedImageRef.current) enhancedImageRef.current.classList.add('hidden');
      
      // Clear enhanced image
      if (enhancedImage) {
        if (enhancedImage.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.originalUrl);
        }
        if (enhancedImage.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.outputUrl);
        }
      }
      setEnhancedImage(null);
      
      // Show registration section
      setShowAuthentication(false);
      
      updateStatus('Registration data cleared. You can register a new user.', 'info');
    } catch (error: any) {
      console.error('Error resetting registration:', error);
      updateStatus(`Error resetting registration: ${error.message}`, 'error');
    }
  };

  // Render the component
  return (
    <>
  <Script
    src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
    strategy="beforeInteractive"
    onLoad={() => {
      console.log("Face API script loaded successfully");
    }}
    onError={(e) => {
      console.error("Error loading Face API script:", e);
    }}
  />
  <div className="face-auth-container">
    <h1 className="face-auth-title">Enhanced Face Authentication System</h1>
    <div id="status" className={`status-message status-${statusType}`}>
      {statusMessage}
    </div>
    
    {/* Security alert badge when there are failed attempts */}
    {failedAttempts > 0 && (
      <div className="security-alert">
        <svg xmlns="http://www.w3.org/2000/svg" className="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="alert-content">
          <span className="alert-title">Security Alert:</span> {failedAttempts} failed authentication attempt{failedAttempts !== 1 ? 's' : ''} detected.
          {failedAttempts >= 3 && lastNotificationTime > 0 && (
            <span className="notification-info">Account owner has been notified via phone call.</span>
          )}
        </div>
      </div>
    )}
    
    {/* Toggle buttons for authentication/registration */}
    <div className="action-buttons">
      <div className={`toggle-container ${showAuthentication ? 'authenticate-active' : ''}`}>
        <button 
          onClick={() => setShowAuthentication(false)}
          className={`register-button ${!showAuthentication ? 'active' : ''}`}
        >
          Register Face
        </button>
        <button 
          onClick={() => {
            if (registeredUsername) {
              setShowAuthentication(true);
              startVideo();
            } else {
              updateStatus('No user registered! Please register first.', 'warning');
            }
          }}
          className={`authenticate-button ${showAuthentication ? 'active' : ''}`}
        >
          Authenticate Face
        </button>
      </div>
    </div>
    
    
    {!showAuthentication && (
      <div className="registration-panel">
        <h2 className="panel-title">Registration</h2>
        <div className="form-group">
        <div className="mb-4">
              <label htmlFor="username" className="input-label">Username:</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-input"
              />
            </div>
          <label htmlFor="phoneNumber" className="input-label">Phone Number:</label>
          <input
            type="tel"
            id="phoneNumber"
            placeholder="Enter your registered phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="upload-section">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-button"
          >
            Upload your Adhaar Card
          </button>
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden-input"
          />
          
          {isEnhancing && (
            <div className="enhancing-indicator">
              <div className="loading-indicator">
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="enhancing-text">Enhancing your image for better face recognition...</span>
              </div>
            </div>
          )}
          
          <div className="image-preview-container">
            <div className="original-image-container">
              <h3 className="image-title">Original Image</h3>
              <div className="image-display">
                <img
                  id="uploadPreview"
                  className="preview-image"
                  alt="Original"
                  ref={previewImageRef}
                />
              </div>
            </div>
            
            <div className="enhanced-image-container">
              <h3 className="image-title">Enhanced Image (4x)</h3>
              <div className="image-display">
                <img
                  id="enhancedPreview"
                  className="preview-image"
                  alt="Enhanced"
                  ref={enhancedImageRef}
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={registerUser}
            disabled={isRegistering || !isModelLoaded || isEnhancing || !phoneNumber.trim()}
            className="register-face-button"
          >
            {isRegistering ? 'Processing...' : 'Register Face'}
          </button>
          
          {enhancedImage && (
            <div className="download-section">
              <a 
                href={enhancedImage.outputUrl} 
                download={`enhanced_${phoneNumber.trim() || 'profile'}.jpg`}
                className="download-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="download-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Enhanced Image
              </a>
            </div>
          )}
        </div>
      </div>
    )}
    
    {/* Authentication Section */}
    {showAuthentication && (
      <div className="authentication-panel">
        <h2 className="panel-title">Authentication</h2>
        <div className="form-group">
          <label htmlFor="loginUsername" className="input-label">Username:</label>
          <input
            type="tel"
            id="loginUsername"
            placeholder="Enter your registered phone number"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="text-input"
          />
        </div>
        <div className="video-container">
          <video
            id="video"
            width="640"
            height="480"
            autoPlay
            muted
            ref={videoRef}
            className="webcam-video"
          />
        </div>
        <div className="auth-buttons">
          <button
            onClick={authenticateUser}
            disabled={isAuthenticating || isCallingUser}
            className="authenticate-face-button"
          >
            {isAuthenticating ? 'Processing...' : 'Authenticate'}
          </button>
          <button 
            onClick={resetRegistration}
            className="reset-button"
          >
            Reset Registration
          </button>
        </div>
      </div>
    )}
    
    <div className="info-section">
      <p>This application uses enhanced face recognition technology with 4x upscaling. For optimal results:</p>
      <ul className="info-list">
        <li>Use a clear, well-lit image for registration</li>
        <li>Ensure your face is fully visible during authentication</li>
        <li>Remove glasses or other accessories that might obstruct facial features</li>
        <li>When multiple failed attempts are detected, a security call will be made to the registered phone number</li>
      </ul>
    </div>
  </div>
  <Toaster position='top-right'/>
</>
  );
};

export default EnhancedFaceAuth;
