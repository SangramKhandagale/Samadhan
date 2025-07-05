// services/OptimizedImageEnhancer.ts

/**
 * Face API optimized image enhancement service
 * Specifically tuned for facial recognition accuracy
 */

type EnhancementResult = {
  dataUrl: string;
  width: number;
  height: number;
  qualityScore: number;
  processingTime: number;
  faceApiReady: boolean;
  recommendations: string[];
};

type FaceRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

/**
 * Enhanced image processing optimized for face-api.js
 */
export const enhanceImageForFaceAPI = async (
  imageSource: File | Blob | string,
  isDocumentPhoto: boolean = false
): Promise<EnhancementResult> => {
  console.log(`Starting face API optimization (${isDocumentPhoto ? 'document' : 'live'} photo)...`);
  const startTime = performance.now();
  
  try {
    const originalImage = await loadImage(imageSource);
    
    // Face API optimal canvas setup
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      willReadFrequently: true,
      desynchronized: true // Better performance
    });
    
    if (!ctx) throw new Error('Canvas context failed');
    
    // Calculate face API optimal dimensions
    const optimalSize = calculateFaceAPIOptimalSize(originalImage, isDocumentPhoto);
    canvas.width = optimalSize.width;
    canvas.height = optimalSize.height;
    
    // High-quality initial render
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Detect face region for targeted enhancement
    const faceRegion = await detectFaceRegion(ctx, canvas.width, canvas.height);
    
    // Apply face API specific enhancements
    await enhanceForFaceAPI(ctx, canvas.width, canvas.height, faceRegion, isDocumentPhoto);
    
    // Final quality assessment
    const qualityScore = assessFaceAPIQuality(ctx, canvas.width, canvas.height, faceRegion);
    const faceApiReady = qualityScore > (isDocumentPhoto ? 0.6 : 0.7);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const processingTime = performance.now() - startTime;
    
    const recommendations = generateFaceAPIRecommendations(qualityScore, faceRegion, isDocumentPhoto);
    
    console.log(`Face API enhancement completed: ${processingTime.toFixed(0)}ms, Quality: ${qualityScore.toFixed(2)}, Ready: ${faceApiReady}`);
    
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      qualityScore,
      processingTime,
      faceApiReady,
      recommendations
    };
  } catch (error) {
    console.error('Face API enhancement failed:', error);
    throw error;
  }
};

/**
 * Calculate optimal dimensions for face-api.js
 */
const calculateFaceAPIOptimalSize = (
  img: HTMLImageElement, 
  isDocumentPhoto: boolean
): { width: number, height: number } => {
  // Face API performs best with these sizes
  const TARGET_SIZE = isDocumentPhoto ? 512 : 416;
  const MIN_SIZE = 320;
  const MAX_SIZE = 640;
  
  const aspectRatio = img.width / img.height;
  let width, height;
  
  // Maintain aspect ratio while hitting optimal size
  if (aspectRatio > 1) {
    width = Math.min(MAX_SIZE, Math.max(MIN_SIZE, TARGET_SIZE));
    height = Math.round(width / aspectRatio);
  } else {
    height = Math.min(MAX_SIZE, Math.max(MIN_SIZE, TARGET_SIZE));
    width = Math.round(height * aspectRatio);
  }
  
  // Face API prefers dimensions divisible by 32
  width = Math.floor(width / 32) * 32;
  height = Math.floor(height / 32) * 32;
  
  // Ensure minimum size
  if (width < MIN_SIZE) width = MIN_SIZE;
  if (height < MIN_SIZE) height = MIN_SIZE;
  
  return { width, height };
};

/**
 * Simple face region detection using color and edge analysis
 */
const detectFaceRegion = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Promise<FaceRegion> => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to grayscale and find skin tone regions
  const skinMap = new Uint8Array(width * height);
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let skinPixels = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple skin tone detection (works for most cases)
      const isSkin = r > 95 && g > 40 && b > 20 && 
                    Math.max(r, Math.max(g, b)) - Math.min(r, Math.min(g, b)) > 15 &&
                    Math.abs(r - g) > 15 && r > g && r > b;
      
      if (isSkin) {
        skinMap[y * width + x] = 255;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        skinPixels++;
      }
    }
  }
  
  // If no skin detected, assume center region
  if (skinPixels < 100) {
    return {
      x: Math.floor(width * 0.25),
      y: Math.floor(height * 0.2),
      width: Math.floor(width * 0.5),
      height: Math.floor(height * 0.6),
      confidence: 0.3
    };
  }
  
  // Expand region by 20% for better face coverage
  const padding = 0.2;
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const expandX = Math.floor(faceWidth * padding);
  const expandY = Math.floor(faceHeight * padding);
  
  return {
    x: Math.max(0, minX - expandX),
    y: Math.max(0, minY - expandY),
    width: Math.min(width - (minX - expandX), faceWidth + 2 * expandX),
    height: Math.min(height - (minY - expandY), faceHeight + 2 * expandY),
    confidence: Math.min(1, skinPixels / (faceWidth * faceHeight))
  };
};

/**
 * Face API specific enhancement pipeline
 */
const enhanceForFaceAPI = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion,
  isDocumentPhoto: boolean
): Promise<void> => {
  // 1. Normalize lighting (crucial for face API)
  normalizeLighting(ctx, width, height, faceRegion);
  
  // 2. Enhance facial contrast
  enhanceFacialContrast(ctx, width, height, faceRegion, isDocumentPhoto);
  
  // 3. Reduce noise while preserving edges
  intelligentNoiseReduction(ctx, width, height, faceRegion);
  
  // 4. Sharpen facial features
  sharpenFacialFeatures(ctx, width, height, faceRegion);
  
  // 5. Final color correction
  finalColorCorrection(ctx, width, height, isDocumentPhoto);
};

/**
 * Advanced lighting normalization for faces
 */
const normalizeLighting = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate face region average brightness
  let faceAvgBrightness = 0;
  let facePixelCount = 0;
  
  for (let y = faceRegion.y; y < faceRegion.y + faceRegion.height; y++) {
    for (let x = faceRegion.x; x < faceRegion.x + faceRegion.width; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        faceAvgBrightness += brightness;
        facePixelCount++;
      }
    }
  }
  
  if (facePixelCount > 0) {
    faceAvgBrightness /= facePixelCount;
    const targetBrightness = 140; // Optimal for face API
    const adjustmentFactor = targetBrightness / faceAvgBrightness;
    
    // Apply adjustment with falloff outside face region
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate distance from face center
        const faceCenterX = faceRegion.x + faceRegion.width / 2;
        const faceCenterY = faceRegion.y + faceRegion.height / 2;
        const distance = Math.sqrt((x - faceCenterX) ** 2 + (y - faceCenterY) ** 2);
        const maxDistance = Math.sqrt(faceRegion.width ** 2 + faceRegion.height ** 2) / 2;
        
        // Apply stronger adjustment to face region
        const strength = Math.max(0.3, 1 - (distance / maxDistance));
        const factor = 1 + (adjustmentFactor - 1) * strength;
        
        for (let c = 0; c < 3; c++) {
          data[i + c] = Math.min(255, Math.max(0, data[i + c] * factor));
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Enhanced facial contrast specifically for face API
 */
const enhanceFacialContrast = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion,
  isDocumentPhoto: boolean
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate face region histogram
  const faceHistogram = new Array(256).fill(0);
  let facePixelCount = 0;
  
  for (let y = faceRegion.y; y < faceRegion.y + faceRegion.height; y++) {
    for (let x = faceRegion.x; x < faceRegion.x + faceRegion.width; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        const intensity = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        faceHistogram[intensity]++;
        facePixelCount++;
      }
    }
  }
  
  if (facePixelCount > 0) {
    // Find 2% and 98% points for gentler contrast
    let sum = 0;
    let p2 = 0, p98 = 255;
    
    for (let i = 0; i < 256; i++) {
      sum += faceHistogram[i];
      const percentage = sum / facePixelCount;
      if (percentage <= 0.02) p2 = i;
      if (percentage <= 0.98) p98 = i;
    }
    
    // Apply contrast enhancement
    const contrastStrength = isDocumentPhoto ? 0.8 : 1.0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Calculate face influence
        const faceCenterX = faceRegion.x + faceRegion.width / 2;
        const faceCenterY = faceRegion.y + faceRegion.height / 2;
        const distance = Math.sqrt((x - faceCenterX) ** 2 + (y - faceCenterY) ** 2);
        const maxDistance = Math.sqrt(faceRegion.width ** 2 + faceRegion.height ** 2) / 2;
        const influence = Math.max(0.2, 1 - (distance / maxDistance)) * contrastStrength;
        
        for (let c = 0; c < 3; c++) {
          const originalValue = data[i + c];
          let enhancedValue;
          
          if (originalValue <= p2) {
            enhancedValue = 0;
          } else if (originalValue >= p98) {
            enhancedValue = 255;
          } else {
            enhancedValue = Math.round(255 * (originalValue - p2) / (p98 - p2));
          }
          
          data[i + c] = Math.round(originalValue + (enhancedValue - originalValue) * influence);
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Intelligent noise reduction that preserves facial features
 */
const intelligentNoiseReduction = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);
  
  // Edge detection for feature preservation
  const edgeMap = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const gx = tempData[i - 4] - tempData[i + 4];
      const gy = tempData[i - width * 4] - tempData[i + width * 4];
      edgeMap[y * width + x] = Math.sqrt(gx * gx + gy * gy) > 20 ? 255 : 0;
    }
  }
  
  // Apply adaptive bilateral filter
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const isEdge = edgeMap[y * width + x] > 0;
      
      // Skip noise reduction on edges to preserve features
      if (isEdge) continue;
      
      // Determine if pixel is in face region
      const inFaceRegion = x >= faceRegion.x && x < faceRegion.x + faceRegion.width &&
                          y >= faceRegion.y && y < faceRegion.y + faceRegion.height;
      
      const filterStrength = inFaceRegion ? 0.7 : 0.4;
      
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let weightSum = 0;
        const centerValue = tempData[i + c];
        
        // 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = ((y + dy) * width + (x + dx)) * 4;
            const neighborValue = tempData[ni + c];
            const colorDiff = Math.abs(centerValue - neighborValue);
            const weight = Math.exp(-(colorDiff * colorDiff) / 800);
            
            sum += neighborValue * weight;
            weightSum += weight;
          }
        }
        
        const filteredValue = sum / weightSum;
        data[i + c] = Math.round(centerValue + (filteredValue - centerValue) * filterStrength);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Sharpen facial features for better face API detection
 */
const sharpenFacialFeatures = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);
  
  // Unsharp mask with face region emphasis
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      // Check if in face region
      const inFaceRegion = x >= faceRegion.x && x < faceRegion.x + faceRegion.width &&
                          y >= faceRegion.y && y < faceRegion.y + faceRegion.height;
      
      const sharpenStrength = inFaceRegion ? 0.6 : 0.3;
      
      for (let c = 0; c < 3; c++) {
        // Calculate local blur
        const blur = (
          tempData[((y-1) * width + (x-1)) * 4 + c] * 0.077 +
          tempData[((y-1) * width + x) * 4 + c] * 0.123 +
          tempData[((y-1) * width + (x+1)) * 4 + c] * 0.077 +
          tempData[(y * width + (x-1)) * 4 + c] * 0.123 +
          tempData[i + c] * 0.2 +
          tempData[(y * width + (x+1)) * 4 + c] * 0.123 +
          tempData[((y+1) * width + (x-1)) * 4 + c] * 0.077 +
          tempData[((y+1) * width + x) * 4 + c] * 0.123 +
          tempData[((y+1) * width + (x+1)) * 4 + c] * 0.077
        );
        
        const originalValue = tempData[i + c];
        const sharpened = originalValue + (originalValue - blur) * sharpenStrength;
        data[i + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Final color correction for optimal face API performance
 */
const finalColorCorrection = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDocumentPhoto: boolean
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Face API performs better with slight desaturation
  const desaturationFactor = isDocumentPhoto ? 0.9 : 0.95;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    
    // Apply desaturation
    data[i] = Math.round(r + (lum - r) * (1 - desaturationFactor));
    data[i + 1] = Math.round(g + (lum - g) * (1 - desaturationFactor));
    data[i + 2] = Math.round(b + (lum - b) * (1 - desaturationFactor));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Assess image quality specifically for face API
 */
const assessFaceAPIQuality = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  faceRegion: FaceRegion
): number => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Face region quality assessment
  let faceScore = 0;
  let facePixelCount = 0;
  let faceBrightness = 0;
  let faceContrast = 0;
  let minVal = 255, maxVal = 0;
  
  for (let y = faceRegion.y; y < faceRegion.y + faceRegion.height; y++) {
    for (let x = faceRegion.x; x < faceRegion.x + faceRegion.width; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const i = (y * width + x) * 4;
        const intensity = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        faceBrightness += intensity;
        minVal = Math.min(minVal, intensity);
        maxVal = Math.max(maxVal, intensity);
        facePixelCount++;
      }
    }
  }
  
  if (facePixelCount > 0) {
    faceBrightness /= facePixelCount;
    faceContrast = maxVal - minVal;
    
    // Optimal brightness for face API (120-160)
    const brightnessScore = 1 - Math.abs(140 - faceBrightness) / 100;
    
    // Good contrast (40-200)
    const contrastScore = Math.min(1, faceContrast / 150);
    
    // Face size score
    const faceSize = Math.sqrt(faceRegion.width * faceRegion.height);
    const sizeScore = Math.min(1, faceSize / 100);
    
    // Region confidence
    const regionScore = faceRegion.confidence;
    
    faceScore = (brightnessScore * 0.3 + contrastScore * 0.3 + sizeScore * 0.25 + regionScore * 0.15);
  }
  
  return Math.max(0, Math.min(1, faceScore));
};

/**
 * Generate face API specific recommendations
 */
const generateFaceAPIRecommendations = (
  qualityScore: number,
  faceRegion: FaceRegion,
  isDocumentPhoto: boolean
): string[] => {
  const recommendations: string[] = [];
  
  if (qualityScore < 0.6) {
    recommendations.push("Image quality needs improvement for reliable face recognition");
  }
  
  if (faceRegion.confidence < 0.5) {
    recommendations.push("Face not clearly detected - ensure face is visible and well-lit");
  }
  
  const faceSize = Math.sqrt(faceRegion.width * faceRegion.height);
  if (faceSize < 80) {
    recommendations.push("Face appears too small - move closer to camera or use higher resolution");
  }
  
  if (isDocumentPhoto) {
    recommendations.push("For document photos: ensure even lighting and clear focus");
  } else {
    recommendations.push("For live photos: face the camera directly with good lighting");
  }
  
  return recommendations;
};

/**
 * Utility function to load images
 */
const loadImage = (source: File | Blob | string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

/**
 * Quick validation for face API compatibility
 */
export const validateForFaceAPI = async (
  imageSource: File | Blob | string,
  isDocumentPhoto: boolean = false
): Promise<{
  isValid: boolean;
  score: number;
  issues: string[];
}> => {
  try {
    const result = await enhanceImageForFaceAPI(imageSource, isDocumentPhoto);
    
    const issues: string[] = [];
    const minScore = isDocumentPhoto ? 0.6 : 0.7;
    
    if (result.qualityScore < minScore) {
      issues.push(`Quality score ${result.qualityScore.toFixed(2)} below required ${minScore}`);
    }
    
    if (result.width < 320 || result.height < 320) {
      issues.push("Image resolution too low for reliable face detection");
    }
    
    return {
      isValid: issues.length === 0 && result.faceApiReady,
      score: result.qualityScore,
      issues
    };
  } catch (error) {
    return {
      isValid: false,
      score: 0,
      issues: [`Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};