"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';
import axios from 'axios';
import "@/app/styles/FaceAuth.css"
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

interface UserData {
  username: string;
  faceDescriptor: number[];
  imagePath: string;
  enhancedImagePath?: string;
  phone?: string;
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

interface AuthFailureLog {
  timestamp: number;
  username: string;
  attempts: number;
  notificationSent: boolean;
}

declare global {
  interface Window {
    faceapi: FaceAPI;
  }
}

const EnhancedFaceAuth: React.FC = () => {
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
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const enhancedImageRef = useRef<HTMLImageElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const notifyUserViaBland = async (): Promise<boolean> => {
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
      const request = {
        name: userData.username,
        phone: userData.phone,
        subject: "Security Alert: Unauthorized Access Attempt",
        description: `There have been ${failedAttempts} failed login attempts to your account in the last 30 minutes. This might be a security breach attempt.`
      };
      const analysis = {
        solution: "We detected suspicious login activity on your account. As a security measure, we're calling to verify if this is you trying to log in. If not, we recommend changing your password immediately.",
        language: "en"
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
    } catch (error) {
      console.error('Error making notification call:', error);
      updateStatus(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return false;
    } finally {
      setIsCallingUser(false);
    }
  };

  const makePhoneCall = async (request: any, analysis: any): Promise<boolean> => {
    try {
      const blandApiKey = process.env.NEXT_PUBLIC_BLAND_AI_API_KEY;
      if (!blandApiKey) {
        throw new Error('Bland.ai API key is not defined');
      }
      const formattedPhone = request.phone.replace(/\D/g, '');
      if (!formattedPhone || formattedPhone.length < 10) {
        throw new Error('Invalid phone number');
      }
      const phoneWithCountryCode = formattedPhone.startsWith('1') ? `+${formattedPhone}` : `+91${formattedPhone}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${blandApiKey}`
      };
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
        language: "en",
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

  const updateStatus = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const startVideo = useCallback(async () => {
    try {
      stopVideo();
      updateStatus('Activating webcam...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoStreamRef.current = stream;
      }
      updateStatus('Webcam active. Position your face for authentication.', 'success');
    } catch (err) {
      console.error('Error accessing webcam:', err);
      updateStatus('Cannot access webcam. Please allow camera permissions and refresh.', 'error');
    }
  }, []);

  const stopVideo = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        updateStatus('Loading Face API models... Please wait.', 'info');
        if (typeof window.faceapi === 'undefined') {
          window.location.reload();
          throw new Error('Face API library not loaded. Check your internet connection or try a different browser.');
        }
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
        updateStatus('Models loaded. Enter your username and upload an image to register.', 'success');
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
        loadFailedAuthAttempts();
      } catch (error) {
        console.error('Error loading models:', error);
        updateStatus(`Failed to load models: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    };

    loadModels();

    return () => {
      stopVideo();
      if (enhancedImage) {
        if (enhancedImage.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.originalUrl);
        }
        if (enhancedImage.outputUrl.startsWith('blob:')) {
          URL.revokeObjectURL(enhancedImage.outputUrl);
        }
      }
    };
  }, [enhancedImage, startVideo]);

  const loadFailedAuthAttempts = () => {
    try {
      const failedAuthData = localStorage.getItem('failedAuthAttempts');
      if (failedAuthData) {
        const authData: AuthFailureLog = JSON.parse(failedAuthData);
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (authData.timestamp > thirtyMinutesAgo) {
          setFailedAttempts(authData.attempts);
          setLastNotificationTime(authData.notificationSent ? authData.timestamp : 0);
        } else {
          localStorage.removeItem('failedAuthAttempts');
          setFailedAttempts(0);
          setLastNotificationTime(0);
        }
      }
    } catch (error) {
      console.error('Error loading failed authentication data:', error);
    }
  };

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

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log("Face API script loaded successfully")}
        onError={(e) => console.error("Error loading Face API script:", e)}
      />
      <div className="face-auth-container">
        <h1 className="face-auth-title">Enhanced Face Authentication System</h1>
        <div id="status" className={`status-message status-${statusType}`}>
          {statusMessage}
        </div>
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
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 10 * 1024 * 1024) {
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
                  }
                }}
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
                    <Image
                      src={previewImageRef.current?.src || ''}
                      alt="Original"
                      width={400}
                      height={400}
                      ref={previewImageRef}
                      className="preview-image"
                    />
                  </div>
                </div>
                <div className="enhanced-image-container">
                  <h3 className="image-title">Enhanced Image (4x)</h3>
                  <div className="image-display">
                    <Image
                      src={enhancedImage?.outputUrl || ''}
                      alt="Enhanced"
                      width={400}
                      height={400}
                      ref={enhancedImageRef}
                      className="preview-image"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
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
                    const imageToProcess = enhancedImage ? enhancedImage.outputUrl : URL.createObjectURL(fileInputRef.current.files[0]);
                    const img = await createImageFromUrl(imageToProcess);
                    const results = await window.faceapi
                      .detectSingleFace(img, new window.faceapi.TinyFaceDetectorOptions())
                      .withFaceLandmarks()
                      .withFaceDescriptor();
                    if (!results) {
                      updateStatus('No face detected in the image! Please try another image.', 'error');
                      setIsRegistering(false);
                      return;
                    }
                    setRegisteredFaceDescriptor(results.descriptor);
                    const trimmedUsername = username.trim();
                    setRegisteredUsername(trimmedUsername);
                    const userData: UserData = {
                      username: trimmedUsername,
                      faceDescriptor: Array.from(results.descriptor),
                      imagePath: enhancedImage ? enhancedImage.originalUrl : URL.createObjectURL(fileInputRef.current.files[0]),
                      enhancedImagePath: enhancedImage ? enhancedImage.outputUrl : undefined,
                      phone: phoneNumber.trim()
                    };
                    localStorage.setItem('registeredUser', JSON.stringify(userData));
                    setFailedAttempts(0);
                    setLastNotificationTime(0);
                    saveFailedAuthAttempts(0, false);
                    updateStatus(`User "${trimmedUsername}" registered successfully with enhanced image! Ready for authentication.`, 'success');
                    setIsRegistering(false);
                    setShowAuthentication(true);
                    setLoginUsername(trimmedUsername);
                    startVideo();
                  } catch (error) {
                    console.error('Registration error:', error);
                    updateStatus(`Error during registration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                    setIsRegistering(false);
                  }
                }}
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
                onClick={async () => {
                  if (!registeredFaceDescriptor || !registeredUsername) {
                    updateStatus('No user registered! Please register first.', 'warning');
                    return;
                  }
                  if (!isModelLoaded) {
                    window.location.reload();
                    updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
                    return;
                  }
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
                    const results = await window.faceapi
                      .detectSingleFace(videoRef.current!, new window.faceapi.TinyFaceDetectorOptions())
                      .withFaceLandmarks()
                      .withFaceDescriptor();
                    if (!results) {
                      updateStatus('No face detected in camera! Please ensure your face is clearly visible.', 'warning');
                      setIsAuthenticating(false);
                      return;
                    }
                    const distance = window.faceapi.euclideanDistance(results.descriptor, registeredFaceDescriptor);
                    console.log('Face match distance:', distance);
                    if (distance < 0.47) {
                      const toastId = toast.loading("Authenticating...");
                      setTimeout(() => {
                        toast.success("you will be redirected to the dashboard", { id: toastId });
                      }, 2000);
                      setTimeout(() => {
                        updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
                        router.push("/UserDashboard");
                        setFailedAttempts(0);
                        saveFailedAuthAttempts(0, false);
                      }, 3000);
                    } else if (distance < 0.56) {
                      updateStatus(`Partial match detected. Please update your profile photo with better quality for improved recognition.`, 'warning');
                      const toastId = toast.loading("Authenticating...");
                      setTimeout(() => {
                        toast.success("you will be redirected to the dashboard", { id: toastId });
                      }, 2000);
                      setTimeout(() => {
                        updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
                        router.push("/UserDashboard");
                        setFailedAttempts(0);
                        saveFailedAuthAttempts(0, false);
                      }, 3000);
                    } else {
                      updateStatus('Authentication failed! Face not recognized.', 'error');
                      const newFailedAttempts = failedAttempts + 1;
                      setFailedAttempts(newFailedAttempts);
                      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
                      if (newFailedAttempts >= 3 && lastNotificationTime < thirtyMinutesAgo) {
                        notifyUserViaBland();
                      } else {
                        saveFailedAuthAttempts(newFailedAttempts, lastNotificationTime >= thirtyMinutesAgo);
                      }
                    }
                    setIsAuthenticating(false);
                  } catch (error) {
                    console.error('Authentication error:', error);
                    updateStatus(`Error during authentication: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                    setIsAuthenticating(false);
                  }
                }}
                disabled={isAuthenticating || isCallingUser}
                className="authenticate-face-button"
              >
                {isAuthenticating ? 'Processing...' : 'Authenticate'}
              </button>
              <button 
                onClick={async () => {
                  try {
                    localStorage.removeItem('registeredUser');
                    localStorage.removeItem('failedAuthAttempts');
                    setRegisteredFaceDescriptor(null);
                    setRegisteredUsername(null);
                    setFailedAttempts(0);
                    setLastNotificationTime(0);
                    stopVideo();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setUsername('');
                    setLoginUsername('');
                    setPhoneNumber('');
                    if (previewImageRef.current) previewImageRef.current.classList.add('hidden');
                    if (enhancedImageRef.current) enhancedImageRef.current.classList.add('hidden');
                    if (enhancedImage) {
                      if (enhancedImage.originalUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(enhancedImage.originalUrl);
                      }
                      if (enhancedImage.outputUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(enhancedImage.outputUrl);
                      }
                    }
                    setEnhancedImage(null);
                    setShowAuthentication(false);
                    updateStatus('Registration data cleared. You can register a new user.', 'info');
                  } catch (error) {
                    console.error('Error resetting registration:', error);
                    updateStatus(`Error resetting registration: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                  }
                }}
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