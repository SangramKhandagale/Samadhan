// useLivelinessDetection.ts

import { useEffect, useState, useRef } from 'react';
import ImprovedFaceApiService from '@/app/FaceAuth/Face_API/FaceApiService';

/**
 * Interface for hook return values
 */
interface LivelinessDetectionResult {
  isDetecting: boolean;
  timeRemaining: number;
  startDetection: () => Promise<boolean>;
  stopDetection: () => void;
}

/**
 * Custom hook for liveness detection using smile detection with improved sensitivity
 * @param options Configuration options for liveness detection
 * @returns Object containing detection state and control functions
 */
export const useLivelinessDetection = (options: {
  timeLimit?: number;          // Maximum time in seconds to complete the smile detection
  marThreshold?: number;       // Mouth Aspect Ratio threshold to detect a smile (lowered for normal smiles)
  detectionInterval?: number;  // Interval in ms between detection attempts
  requiredFrames?: number;     // Number of consecutive frames with smile required
  smileConfidence?: number;    // Confidence threshold for smile classification
}) => {
  // Default values with more lenient thresholds
  const {
    timeLimit = 7,             // 7 seconds to complete the smile
    marThreshold = 0.3,        // LOWERED threshold for mouth aspect ratio (detects more subtle smiles)
    detectionInterval = 200,   // Check every 200ms
    requiredFrames = 2,        // REDUCED from 3 to 2 frames for easier detection
    smileConfidence = 0.6      // Confidence level for smile classification
  } = options;

  // State
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  
  // Refs to persist across renders
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveSmileFrames = useRef<number>(0);
  const detectionPromiseRef = useRef<{
    resolve: (value: boolean) => void;
    reject: (reason: any) => void;
  } | null>(null);

  /**
   * Clean up any intervals and reset state
   */
  const cleanup = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setIsDetecting(false);
    consecutiveSmileFrames.current = 0;
  };

  /**
   * Improved smile detection with multiple methods
   * 1. Mouth Aspect Ratio (MAR)
   * 2. Lip curvature analysis (smile curve)
   * 3. Mouth corner elevation
   */
  const detectSmile = (landmarks: any): { isSmiling: boolean; confidence: number } => {
    try {
      const mouth = landmarks.getMouth();
      
      if (!mouth || mouth.length < 20) {
        console.error('Invalid mouth landmarks');
        return { isSmiling: false, confidence: 0 };
      }
      
      // METHOD 1: Calculate Mouth Aspect Ratio (MAR)
      // Top lip points (center points)
      const topLipCenter = mouth[14]; // Top lip bottom center
      
      // Bottom lip points (center points)
      const bottomLipCenter = mouth[18]; // Bottom lip top center
      
      // Mouth corners
      const leftCorner = mouth[0];
      const rightCorner = mouth[6];
      
      // Calculate mouth height (vertical distance between lips)
      const mouthHeight = Math.abs(topLipCenter.y - bottomLipCenter.y);
      
      // Calculate mouth width (distance between corners)
      const mouthWidth = Math.sqrt(
        Math.pow(rightCorner.x - leftCorner.x, 2) + 
        Math.pow(rightCorner.y - leftCorner.y, 2)
      );
      
      // Calculate MAR
      const mar = mouthHeight / mouthWidth;
      
      // METHOD 2: Mouth corner elevation (smile lifts the corners)
      const leftCornerY = leftCorner.y;
      const rightCornerY = rightCorner.y;
      
      // Get center point of mouth for reference
      const centerX = (leftCorner.x + rightCorner.x) / 2;
      const centerPoint = mouth.find((p: any) => 
        Math.abs(p.x - centerX) < mouthWidth * 0.1 && 
        p.y > topLipCenter.y && 
        p.y < bottomLipCenter.y
      ) || { y: (topLipCenter.y + bottomLipCenter.y) / 2 };
      
      // Calculate corner elevation relative to center
      const avgCornerY = (leftCornerY + rightCornerY) / 2;
      const cornerElevation = centerPoint.y - avgCornerY;
      const normalizedElevation = cornerElevation / mouthHeight;
      
      // METHOD 3: Lip curvature (smile creates a curve in the lips)
      // Get upper lip points
      const upperLipPoints = mouth.slice(12, 16); // Central points of upper lip
      
      // Calculate average y-coordinate for these points
      let upperLipSum = 0;
      upperLipPoints.forEach((point: any) => {
        upperLipSum += point.y;
      });
      const upperLipAvg = upperLipSum / upperLipPoints.length;
      
      // Calculate curvature (difference between avg and center point)
      const lipCurvature = Math.abs(upperLipAvg - upperLipPoints[2].y) / mouthHeight;
      
      // Combined confidence calculation (weighted average of methods)
      const marConfidence = mar >= marThreshold ? (mar / marThreshold) * 0.6 : 0;
      const elevationConfidence = normalizedElevation >= 0.05 ? normalizedElevation * 4 : 0;
      const curvatureConfidence = lipCurvature >= 0.05 ? lipCurvature * 3 : 0;
      
      const overallConfidence = Math.min(
        1.0, // Cap at 100%
        marConfidence * 0.4 + elevationConfidence * 0.4 + curvatureConfidence * 0.2
      );
      
      console.log(`Smile metrics - MAR: ${mar.toFixed(2)}, Elevation: ${normalizedElevation.toFixed(2)}, Curvature: ${lipCurvature.toFixed(2)}`);
      console.log(`Smile confidence: ${overallConfidence.toFixed(2)}`);
      
      return {
        isSmiling: overallConfidence >= smileConfidence,
        confidence: overallConfidence
      };
    } catch (error) {
      console.error('Error detecting smile:', error);
      return { isSmiling: false, confidence: 0 };
    }
  };

  /**
   * Process a single video frame to detect smile
   */
  const processFrame = async (video: HTMLVideoElement): Promise<boolean> => {
    if (!ImprovedFaceApiService.areModelsLoaded()) {
      await ImprovedFaceApiService.loadModels();
    }
    
    const faceapi = (window as any).faceapi;
    
    try {
      // Detect face with landmarks
      const detectionOptions = new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 416,
        scoreThreshold: 0.5
      });
      
      const detection = await faceapi
        .detectSingleFace(video, detectionOptions)
        .withFaceLandmarks();
      
      if (!detection) {
        console.log('No face detected in frame');
        return false;
      }

      // Check for smile with improved detection
      const { isSmiling, confidence } = detectSmile(detection.landmarks);
      
      if (isSmiling) {
        console.log(`Smile detected with confidence: ${confidence.toFixed(2)}`);
        // Increment consecutive frames counter
        consecutiveSmileFrames.current++;
        
        // Check if we have enough consecutive frames to confirm
        if (consecutiveSmileFrames.current >= requiredFrames) {
          return true;
        }
      } else {
        // Reset counter if not smiling
        consecutiveSmileFrames.current = 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error processing frame:', error);
      return false;
    }
  };

  /**
   * Start the liveness detection process
   */
  const startDetection = async (video?: HTMLVideoElement): Promise<boolean> => {
    // Store the video reference
    if (video) {
      videoRef.current = video;
    }
    
    // Make sure we have a video element
    if (!videoRef.current) {
      throw new Error('No video element provided for liveness detection');
    }
    
    // Clean up any previous detection
    cleanup();
    
    // Set initial state
    setIsDetecting(true);
    setTimeRemaining(timeLimit);
    
    // Create promise that will be resolved when detection completes
    return new Promise<boolean>((resolve, reject) => {
      detectionPromiseRef.current = { resolve, reject };
      
      // Start the countdown timer
      let remainingTime = timeLimit;
      countdownIntervalRef.current = setInterval(() => {
        remainingTime -= 1;
        setTimeRemaining(remainingTime);
        
        if (remainingTime <= 0) {
          cleanup();
          console.log('Liveness detection timeout');
          detectionPromiseRef.current?.resolve(false);
          detectionPromiseRef.current = null;
        }
      }, 1000);
      
      // Start the detection interval
      detectionIntervalRef.current = setInterval(async () => {
        try {
          if (!videoRef.current) {
            throw new Error('Video element no longer available');
          }
          
          const smileDetected = await processFrame(videoRef.current);
          
          if (smileDetected) {
            cleanup();
            console.log('Liveness confirmed: Smile detected!');
            detectionPromiseRef.current?.resolve(true);
            detectionPromiseRef.current = null;
          }
        } catch (error) {
          console.error('Error during liveness detection:', error);
          // Continue trying until timeout - don't reject on individual frame errors
        }
      }, detectionInterval);
    });
  };

  /**
   * Stop the detection process manually
   */
  const stopDetection = () => {
    if (isDetecting) {
      cleanup();
      if (detectionPromiseRef.current) {
        detectionPromiseRef.current.resolve(false);
        detectionPromiseRef.current = null;
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    isDetecting,
    timeRemaining,
    startDetection,
    stopDetection
  };
};

/**
 * Non-hook version for use in non-React environments
 * @param video HTMLVideoElement to process
 * @param options Configuration options
 * @returns Promise that resolves to boolean indicating liveness
 */
export async function detectLiveness(
  video: HTMLVideoElement,
  options: {
    timeLimit?: number;
    marThreshold?: number;
    smileConfidence?: number;
  } = {}
): Promise<boolean> {
  const {
    timeLimit = 7,
    marThreshold = 0.3,      // Lowered threshold
    smileConfidence = 0.6    // Added confidence parameter
  } = options;

  // Ensure face-api models are loaded
  if (!ImprovedFaceApiService.areModelsLoaded()) {
    await ImprovedFaceApiService.loadModels();
  }

  const faceapi = (window as any).faceapi;
  let consecutiveSmileFrames = 0;
  const requiredFrames = 2;  // Reduced from 3 to 2
  
  return new Promise<boolean>((resolve) => {
    // Set timeout to limit total detection time
    const timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      console.log('Liveness detection timeout');
      resolve(false);
    }, timeLimit * 1000);
    
    // Check frame every 200ms
    const intervalId = setInterval(async () => {
      try {
        // Detect face with landmarks
        const detectionOptions = new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 416,
          scoreThreshold: 0.5
        });
        
        const detection = await faceapi
          .detectSingleFace(video, detectionOptions)
          .withFaceLandmarks();
        
        if (!detection) {
          console.log('No face detected in frame');
          return;
        }

        // Get mouth landmarks
        const mouth = detection.landmarks.getMouth();
        
        // METHOD 1: Calculate MAR
        // Top and bottom lip center points
        const topLipCenter = mouth[14]; 
        const bottomLipCenter = mouth[18];
        
        // Mouth corners
        const leftCorner = mouth[0];
        const rightCorner = mouth[6];
        
        // Calculate mouth height and width
        const mouthHeight = Math.abs(topLipCenter.y - bottomLipCenter.y);
        const mouthWidth = Math.sqrt(
          Math.pow(rightCorner.x - leftCorner.x, 2) + 
          Math.pow(rightCorner.y - leftCorner.y, 2)
        );
        
        // Calculate MAR
        const mar = mouthHeight / mouthWidth;
        
        // METHOD 2: Check corner elevation
        const centerX = (leftCorner.x + rightCorner.x) / 2;
        const centerPoint = mouth.find((p: any) => 
          Math.abs(p.x - centerX) < mouthWidth * 0.1 && 
          p.y > topLipCenter.y && 
          p.y < bottomLipCenter.y
        ) || { y: (topLipCenter.y + bottomLipCenter.y) / 2 };
        
        const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
        const cornerElevation = centerPoint.y - avgCornerY;
        const normalizedElevation = cornerElevation / mouthHeight;
        
        // METHOD 3: Lip curvature
        const upperLipPoints = mouth.slice(12, 16);
        let upperLipSum = 0;
        upperLipPoints.forEach((point: any) => {
          upperLipSum += point.y;
        });
        const upperLipAvg = upperLipSum / upperLipPoints.length;
        const lipCurvature = Math.abs(upperLipAvg - upperLipPoints[2].y) / mouthHeight;
        
        // Calculate overall confidence
        const marConfidence = mar >= marThreshold ? (mar / marThreshold) * 0.6 : 0;
        const elevationConfidence = normalizedElevation >= 0.05 ? normalizedElevation * 4 : 0;
        const curvatureConfidence = lipCurvature >= 0.05 ? lipCurvature * 3 : 0;
        
        const overallConfidence = Math.min(
          1.0,
          marConfidence * 0.4 + elevationConfidence * 0.4 + curvatureConfidence * 0.2
        );
        
        // Check if overall confidence exceeds threshold
        const isSmiling = overallConfidence >= smileConfidence;
        
        if (isSmiling) {
          console.log(`Smile detected with confidence: ${overallConfidence.toFixed(2)}`);
          consecutiveSmileFrames++;
          
          // Require multiple consecutive frames for reliability
          if (consecutiveSmileFrames >= requiredFrames) {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            console.log('Liveness confirmed!');
            resolve(true);
          }
        } else {
          // Reset counter if not smiling
          consecutiveSmileFrames = 0;
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    }, 200);
  });
}

export default useLivelinessDetection;