"use client"
import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import "@/app/styles/FaceAuth.css";
import RegistrationPanel from '@/app/FaceAuth/RegistrationPanel';
import AuthenticationPanel from '@/app/FaceAuth/AuthenticationPanel';
import { blandApiService} from '@/app/FaceAuth/Face_API/BlandApiService';
import { UserData, EnhancedImageResult, AuthFailureLog } from '@/app/FaceAuth/Face_API/types';
import LocalStorageService from '@/app/FaceAuth/Face_API/LocalStorageService';

// StatusMessage Component
const StatusMessage: React.FC<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }> = ({ message, type }) => {
  const getStatusClass = () => {
    switch (type) {
      case 'success': return 'status-success';
      case 'warning': return 'status-warning';
      case 'error': return 'status-error';
      default: return 'status-info';
    }
  };

  return (
    <div className={`status-message ${getStatusClass()}`}>
      {message}
    </div>
  );
};

// SecurityAlert Component
const SecurityAlert: React.FC<{ failedAttempts: number; lastNotificationTime: number }> = ({ failedAttempts, lastNotificationTime }) => {
  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="security-alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <strong>Security Alert</strong>
        <p>Failed authentication attempts: {failedAttempts}</p>
        {lastNotificationTime > 0 && (
          <p className="notification-time">
            Last notification sent: {formatTime(lastNotificationTime)}
          </p>
        )}
      </div>
    </div>
  );
};

// ActionToggle Component
const ActionToggle: React.FC<{
  showAuthentication: boolean;
  setShowAuthentication: (show: boolean) => void;
  registeredUsername: string | null;
  startVideo: () => void;
  updateStatus: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}> = ({ showAuthentication, setShowAuthentication, registeredUsername, startVideo, updateStatus }) => {
  const handleToggle = (toAuthentication: boolean) => {
    setShowAuthentication(toAuthentication);
    if (toAuthentication && registeredUsername) {
      startVideo();
      updateStatus('Switched to authentication mode. Position your face for authentication.', 'info');
    } else {
      updateStatus('Registration mode active. Enter your details to register.', 'info');
    }
  };

  return (
    <div className="action-toggle">
      <button 
        className={`toggle-btn ${!showAuthentication ? 'active' : ''}`}
        onClick={() => handleToggle(false)}
      >
        Register
      </button>
      <button 
        className={`toggle-btn ${showAuthentication ? 'active' : ''}`}
        onClick={() => handleToggle(true)}
        disabled={!registeredUsername}
      >
        Authenticate
      </button>
    </div>
  );
};

// InfoSection Component
const InfoSection: React.FC = () => {
  return (
    <div className="info-section">
      <h3>How to Use:</h3>
      <div className="info-steps">
        <div className="step">
          <span className="step-number">1</span>
          <p><strong>Register:</strong> Enter your username, phone number, and upload a clear photo of your face.</p>
        </div>
        <div className="step">
          <span className="step-number">2</span>
          <p><strong>Authenticate:</strong> Enter your username and position your face in front of the camera.</p>
        </div>
        <div className="step">
          <span className="step-number">3</span>
          <p><strong>Access:</strong> Complete the liveness check and gain access to your dashboard.</p>
        </div>
      </div>
      <div className="security-features">
        <h4>Security Features:</h4>
        <ul>
          <li>Face recognition with liveness detection</li>
          <li>Automatic security alerts after failed attempts</li>
          <li>Phone notification system for suspicious activity</li>
          <li>Secure local data storage</li>
        </ul>
      </div>
    </div>
  );
};

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
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [isCallingUser, setIsCallingUser] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  
  // Helper function to update status with appropriate styling
  const updateStatus = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Load face-api.js models when the component mounts
  useEffect(() => {
    // Generate a unique session ID when the component mounts
    const sessionId = Date.now().toString();
    sessionStorage.setItem('authSessionId', sessionId);
    
    // Reset failed attempts on fresh page load
    setFailedAttempts(0);
    setLastNotificationTime(0);
    
    const loadModels = async () => {
      try {
        updateStatus('Loading Face API models... Please wait.', 'info');
        console.log("Starting to load face-api.js models...");
        
        // Check if face-api is available
        if (typeof (window as any).faceapi === 'undefined') {
          window.location.reload();
          throw new Error('Face API library not loaded. Check your internet connection or try a different browser.');
        }
        
        const faceapi = (window as any).faceapi;
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
        
        // Check for stored face data - use LocalStorageService for consistency
        const userData = LocalStorageService.getUserData();
        if (userData) {
          setRegisteredUsername(userData.username);
          setRegisteredFaceDescriptor(new Float32Array(userData.faceDescriptor));
          setLoginUsername(userData.username);
          setPhoneNumber(userData.phone || '');
          updateStatus(`User "${userData.username}" already registered. Ready for authentication.`, 'success');
          setShowAuthentication(true);
          startVideo();
        }
        
        // Only load failed attempts if they belong to the current session
        checkFailedAuthAttempts();
      } catch (error: any) {
        console.error('Error loading models:', error);
        updateStatus(`Failed to load models: ${error.message}`, 'error');
      }
    };

    loadModels();

    // Cleanup function to stop video stream when component unmounts
    return () => {
      stopVideo();
    };
  }, []);

  // Check failed authentication attempts from localStorage
  const checkFailedAuthAttempts = () => {
    try {
      const failedAuthData = localStorage.getItem('failedAuthAttempts');
      if (failedAuthData) {
        const authData: AuthFailureLog & { sessionId?: string } = JSON.parse(failedAuthData);
        
        // Get current session ID
        const currentSessionId = sessionStorage.getItem('authSessionId');
        
        // Check if data belongs to current session
        if (authData.sessionId === currentSessionId) {
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
        } else {
          // Data belongs to different session, reset it
          localStorage.removeItem('failedAuthAttempts');
          setFailedAttempts(0);
          setLastNotificationTime(0);
        }
      }
    } catch (error) {
      console.error('Error loading failed authentication data:', error);
      // Reset on error
      setFailedAttempts(0);
      setLastNotificationTime(0);
    }
  };

  // Save failed authentication attempts to localStorage
  const saveFailedAuthAttempts = (attempts: number, notificationSent: boolean) => {
    try {
      const currentSessionId = sessionStorage.getItem('authSessionId') || Date.now().toString();
      
      const authData: AuthFailureLog & { sessionId: string } = {
        timestamp: Date.now(),
        username: registeredUsername || '',
        attempts: attempts,
        notificationSent: notificationSent,
        sessionId: currentSessionId
      };
      localStorage.setItem('failedAuthAttempts', JSON.stringify(authData));
    } catch (error) {
      console.error('Error saving failed authentication data:', error);
    }
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
  
  // Helper function to create image from URL
  const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Register user's face - this now acts as a wrapper for the RegistrationPanel's function
  const registerUser = async () => {
    // The actual registration is done in RegistrationPanel now, 
    // this function just handles what happens after registration
    
    try {
      setIsRegistering(true);
      
      // After registration in RegistrationPanel, get the stored user data
      const userData = LocalStorageService.getUserData();
      
      if (!userData) {
        throw new Error('Registration failed: User data not found');
      }
      
      // Update our local state with the registered data
      setRegisteredUsername(userData.username);
      setRegisteredFaceDescriptor(new Float32Array(userData.faceDescriptor));
      setLoginUsername(userData.username);
      
      // Reset failed attempts when registering
      setFailedAttempts(0);
      setLastNotificationTime(0);
      saveFailedAuthAttempts(0, false);
      
      // Show success message and toast notification
      updateStatus(`User "${userData.username}" registered successfully! Redirecting to authentication...`, 'success');
      
      const toastId = toast.loading("Registration successful!");
      setTimeout(() => {
        toast.success(`Welcome ${userData.username}! Please authenticate yourself.`, {id: toastId});
      }, 1000);
      
      // Switch to authentication panel
      setTimeout(() => {
        setShowAuthentication(true);
        startVideo();
      }, 2000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      updateStatus(`Error during registration: ${error.message}`, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Make call using Bland API to notify user of suspicious login attempts
  const notifyUserViaBland = async () => {
    if (isCallingUser) return false;
    
    try {
      setIsCallingUser(true);
      updateStatus('Security alert: Contacting account owner...', 'warning');
      
      // Use LocalStorageService for consistency
      const userData = LocalStorageService.getUserData();
      if (!userData) {
        throw new Error('User data not found');
      }
      
      if (!userData.phone) {
        throw new Error('No phone number registered for notifications');
      }
      
      // Use the imported blandApiService singleton instance
      const result = await blandApiService.notifyUserOfSuspiciousActivity(
        {
          username: userData.username,
          phone: userData.phone
        },
        failedAttempts
      );
      
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

  // Modified authenticateUser function for integration with liveness detection
  const authenticateUser = async () => {
    if (!registeredFaceDescriptor || !registeredUsername) {
      updateStatus('No user registered! Please register first.', 'warning');
      return false;
    }
    
    if (!isModelLoaded) {
      window.location.reload();
      updateStatus('Face API models not loaded. Please wait or refresh the page.', 'error');
      return false;
    }
    
    // Check username
    const enteredUsername = loginUsername.trim();
    if (!enteredUsername) {
      updateStatus('Please enter your username!', 'warning');
      return false;
    }
    
    if (enteredUsername !== registeredUsername) {
      updateStatus('Authentication failed! Username does not match.', 'error');
      return false;
    }
    
    try {
      setIsAuthenticating(true);
      updateStatus('Authenticating... Keep your face visible.', 'info');
      
      const faceapi = (window as any).faceapi;
      
      // Take multiple samples for better accuracy
      const samples = 3;
      let totalDistance = 0;
      let successfulSamples = 0;
      
      for(let i = 0; i < samples; i++) {
        // Add a small delay between samples
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Detect face in current video frame with more options for better detection
        const results = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,  // Larger input size for better detection
            scoreThreshold: 0.5  // Lower threshold to detect faces more easily
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (results) {
          // Compare with registered face descriptor
          const distance = faceapi.euclideanDistance(results.descriptor, registeredFaceDescriptor);
          console.log(`Face match sample ${i+1} distance:`, distance);
          totalDistance += distance;
          successfulSamples++;
        }
      }
      
      // If we couldn't get any successful samples
      if (successfulSamples === 0) {
        updateStatus('No face detected in camera! Please ensure your face is clearly visible.', 'warning');
        setIsAuthenticating(false);
        return false;
      }
      
      // Calculate average distance from successful samples
      const averageDistance = totalDistance / successfulSamples;
      console.log('Average face match distance:', averageDistance);

      // More relaxed threshold for face matching
      if (averageDistance < 0.50) {
        // Initial face match successful - liveness check will happen in AuthenticationPanel
        updateStatus(`Face recognized! Proceeding with liveness check...`, 'info');
        setIsAuthenticating(false);
        return true;
      }  else {
        // No match - Authentication failed
        updateStatus('Authentication failed! Face not recognized.', 'error');
        
        // Increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        // Check if we should send a security notification
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (newFailedAttempts >= 2 && lastNotificationTime < thirtyMinutesAgo) {
          // Call the Bland API to notify the user
          notifyUserViaBland();
        } else {
          saveFailedAuthAttempts(newFailedAttempts, lastNotificationTime >= thirtyMinutesAgo);
        }
        
        setIsAuthenticating(false);
        return false;
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      updateStatus(`Error during authentication: ${error.message}`, 'error');
      setIsAuthenticating(false);
      return false;
    }
  };

  // Handle the final authentication result after face recognition and liveness check
  const handleSuccessfulAuthentication = () => {
    const toastId = toast.loading("Authentication verified!");
    setTimeout(() => {
      toast.success("You will be redirected to the dashboard", {id: toastId});
    }, 1000);
    
    // Successfully authenticated
    setTimeout(() => {
      updateStatus(`Authentication successful! Welcome, ${registeredUsername}!`, 'success');
      // Reset failed attempts on successful login
      setFailedAttempts(0);
      saveFailedAuthAttempts(0, false);
      // Redirect to dashboard
      router.push("/UserDashboard");
    }, 2000);
  };

  // Reset stored data
  const resetRegistration = async () => {
    try {
      // Use LocalStorageService for consistency
      LocalStorageService.clearUserData();
      localStorage.removeItem('failedAuthAttempts');
      
      setRegisteredFaceDescriptor(null);
      setRegisteredUsername(null);
      setFailedAttempts(0);
      setLastNotificationTime(0);
      setSelectedFile(null);
      
      // Stop webcam if it's running
      stopVideo();
      
      // Reset upload input and username fields
      setUsername('');
      setLoginUsername('');
      setPhoneNumber('');
      
      // Show registration section
      setShowAuthentication(false);
      
      updateStatus('Registration data cleared. You can register a new user.', 'info');
    } catch (error: any) {
      console.error('Error resetting registration:', error);
      updateStatus(`Error resetting registration: ${error.message}`, 'error');
    }
  };

  // Handle file selection for enhanced registration panel
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
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
        <h1 className="face-auth-title">Adhaar Card Based Facial Authentication System</h1>
        
        <StatusMessage message={statusMessage} type={statusType} />
        
        {failedAttempts > 0 && (
          <SecurityAlert 
            failedAttempts={failedAttempts} 
            lastNotificationTime={lastNotificationTime} 
          />
        )}
        
        <ActionToggle 
          showAuthentication={showAuthentication}
          setShowAuthentication={setShowAuthentication}
          registeredUsername={registeredUsername}
          startVideo={startVideo}
          updateStatus={updateStatus}
        />
        
        {!showAuthentication ? (
          <RegistrationPanel
            username={username}
            setUsername={setUsername}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            isModelLoaded={isModelLoaded}
            registerUser={registerUser}
            isRegistering={isRegistering}
            updateStatus={updateStatus}
            onFileSelected={handleFileSelected}
          />
        ) : (
          <AuthenticationPanel
            loginUsername={loginUsername}
            setLoginUsername={setLoginUsername}
            videoRef={videoRef}
            authenticateUser={authenticateUser}
            resetRegistration={resetRegistration}
            isAuthenticating={isAuthenticating}
            isCallingUser={isCallingUser}
            onAuthenticationComplete={handleSuccessfulAuthentication}
          />
        )}
        
        <InfoSection />
      </div>
      <Toaster position='top-right'/>
    </>
  );
};

export default EnhancedFaceAuth;