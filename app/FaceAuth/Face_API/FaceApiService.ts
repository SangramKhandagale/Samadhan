// services/EnhancedFaceApiService.ts

/**
 * Enhanced service for Aadhaar card facial recognition with improved accuracy
 */
export default class EnhancedFaceApiService {
  private static faceapi: any = null;
  private static isModelLoaded: boolean = false;
  
  // Optimized thresholds for Aadhaar authentication
  private static baseThreshold: number = 0.42; // Stricter for document verification
  private static qualityModifier: number = 0;
  private static documentThreshold: number = 0.38; // Even stricter for document photos
  
  // Cache for improved performance
  private static descriptorCache = new Map<string, any>();
  private static maxCacheSize: number = 10;

  /**
   * Check if models are loaded
   */
  static isLoaded(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Alias for isLoaded
   */
  static areModelsLoaded(): boolean {
    return this.isLoaded();
  }

  /**
   * Load face-api.js models with error handling
   */
  static async loadModels(): Promise<void> {
    if (this.isModelLoaded) return;
    
    try {
      console.log("Loading face-api.js models...");
      
      if (typeof (window as any).faceapi === 'undefined') {
        throw new Error('Face API library not loaded');
      }
      
      this.faceapi = (window as any).faceapi;
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.2/model/';
      
      await Promise.all([
        this.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        this.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        this.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        this.faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL) // For additional validation
      ]);
      
      console.log('Face-api models loaded successfully');
      this.isModelLoaded = true;
    } catch (error: any) {
      console.error('Error loading models:', error);
      throw new Error(`Failed to load face-api models: ${error.message}`);
    }
  }

  static async getFaceDescriptor(
    imageElement: HTMLImageElement, 
    isDocumentPhoto: boolean = false
  ): Promise<{
    descriptor: Float32Array;
    quality: number;
    confidence: number;
    faceSize: number;
    landmarks: any;
  }> {
    try {
      if (!this.isModelLoaded) await this.loadModels();

      // Adjust detection options based on image type
      const detectionOptions = new this.faceapi.TinyFaceDetectorOptions({ 
        inputSize: isDocumentPhoto ? 512 : 416, // Higher resolution for documents
        scoreThreshold: isDocumentPhoto ? 0.3 : 0.5 // Lower threshold for document photos
      });
      
      const result = await this.faceapi
        .detectSingleFace(imageElement, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!result) {
        throw new Error(`No face detected in ${isDocumentPhoto ? 'document' : 'live'} image`);
      }

      // Enhanced quality assessment
      const quality = this.assessImageQuality(result, isDocumentPhoto);
      const faceSize = this.calculateFaceSize(result.detection.box);
      
      // Dynamic threshold adjustment
      this.qualityModifier = this.calculateQualityModifier(quality, faceSize, isDocumentPhoto);
      
      return {
        descriptor: result.descriptor,
        quality,
        confidence: result.detection.score,
        faceSize,
        landmarks: result.landmarks
      };
    } catch (error: any) {
      console.error('Error getting face descriptor:', error);
      throw error;
    }
  }
  
  /**
   * Improved quality assessment with document-specific metrics
   */
  private static assessImageQuality(faceDetectionResult: any, isDocumentPhoto: boolean): number {
    const detectionScore = faceDetectionResult.detection.score;
    const landmarks = faceDetectionResult.landmarks.positions;
    const faceBox = faceDetectionResult.detection.box;
    
    let qualityScore = detectionScore * 0.6;
    
    // Face size quality (larger faces generally better quality)
    const faceArea = faceBox.width * faceBox.height;
    const sizeScore = Math.min(1, faceArea / 10000); // Normalized face size
    qualityScore += sizeScore * 0.2;
    
    // Landmark stability
    if (landmarks && landmarks.length > 0) {
      const symmetryScore = this.calculateFaceSymmetry(landmarks);
      qualityScore += symmetryScore * 0.2;
    }
    
    // Document photo bonus (they're usually clearer)
    if (isDocumentPhoto) {
      qualityScore = Math.min(1, qualityScore * 1.1);
    }
    
    console.log(`Quality assessment (${isDocumentPhoto ? 'document' : 'live'}):`, {
      detectionScore: detectionScore.toFixed(3),
      sizeScore: sizeScore.toFixed(3),
      finalQuality: qualityScore.toFixed(3)
    });
    
    return qualityScore;
  }
  
  /**
   * Calculate face symmetry for quality assessment
   */
  private static calculateFaceSymmetry(landmarks: any[]): number {
    const centerX = landmarks.reduce((sum, point) => sum + point.x, 0) / landmarks.length;
    const leftPoints = landmarks.filter(p => p.x < centerX);
    const rightPoints = landmarks.filter(p => p.x > centerX);
    
    if (leftPoints.length === 0 || rightPoints.length === 0) return 0.5;
    
    const leftAvg = leftPoints.reduce((sum, p) => sum + Math.abs(centerX - p.x), 0) / leftPoints.length;
    const rightAvg = rightPoints.reduce((sum, p) => sum + Math.abs(p.x - centerX), 0) / rightPoints.length;
    
    return 1 - Math.min(1, Math.abs(leftAvg - rightAvg) / centerX);
  }
  
  /**
   * Calculate face size for quality assessment
   */
  private static calculateFaceSize(box: any): number {
    return Math.sqrt(box.width * box.height);
  }
  
  /**
   * Calculate quality modifier based on multiple factors
   */
  private static calculateQualityModifier(quality: number, faceSize: number, isDocumentPhoto: boolean): number {
    let modifier = 0;
    
    // Quality-based adjustment
    if (quality < 0.4) modifier -= 0.1; // Penalize low quality
    else if (quality > 0.8) modifier += 0.05; // Reward high quality
    
    // Size-based adjustment
    if (faceSize < 50) modifier -= 0.08; // Penalize small faces
    else if (faceSize > 150) modifier += 0.03; // Reward larger faces
    
    // Document photo adjustment
    if (isDocumentPhoto) modifier -= 0.05; // Stricter for documents
    
    return Math.max(-0.2, Math.min(0.1, modifier));
  }

  /**
   * Enhanced face comparison with Aadhaar-specific logic
   */
  static compareFaces(
    descriptor1: Float32Array | number[], 
    descriptor2: Float32Array | number[],
    isDocumentComparison: boolean = false
  ): {
    distance: number;
    matches: boolean;
    similarity: number;
    confidence: number;
    recommendation: string;
  } {
    const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
    const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

    const distance = this.faceapi.euclideanDistance(desc1, desc2);
    
    // Choose appropriate threshold
    const threshold = isDocumentComparison ? 
      this.documentThreshold + this.qualityModifier : 
      this.baseThreshold + this.qualityModifier;
    
    const matches = distance <= threshold;
    const similarity = Math.max(0, Math.min(100, (1 - distance / 1.4) * 100));
    const confidence = this.calculateConfidence(distance, threshold);
    const recommendation = this.getMatchRecommendation(distance, threshold, confidence);
    
    console.log('Face comparison:', {
      distance: distance.toFixed(4),
      threshold: threshold.toFixed(4),
      similarity: similarity.toFixed(1) + '%',
      confidence: confidence.toFixed(1) + '%',
      matches: matches ? 'YES' : 'NO'
    });

    return { distance, matches, similarity, confidence, recommendation };
  }
  
  /**
   * Calculate confidence percentage
   */
  private static calculateConfidence(distance: number, threshold: number): number {
    if (distance > threshold) return 0;
    
    const maxConfidenceDistance = Math.max(0, threshold - 0.15);
    if (distance <= maxConfidenceDistance) return 100;
    
    return ((threshold - distance) / (threshold - maxConfidenceDistance)) * 100;
  }
  
  /**
   * Get match recommendation
   */
  private static getMatchRecommendation(distance: number, threshold: number, confidence: number): string {
    if (!distance || distance > threshold) return "No match";
    if (confidence >= 80) return "Strong match";
    if (confidence >= 60) return "Good match";
    if (confidence >= 40) return "Possible match";
    return "Weak match";
  }

  /**
   * Aadhaar-specific authentication method
   */
  static async authenticateWithAadhaar(
    aadhaarImageElement: HTMLImageElement,
    liveImageElement: HTMLImageElement
  ): Promise<{
    success: boolean;
    confidence: number;
    similarity: number;
    details: string;
  }> {
    try {
      console.log('Starting Aadhaar authentication...');
      
      // Extract descriptors
      const [aadhaarResult, liveResult] = await Promise.all([
        this.getFaceDescriptor(aadhaarImageElement, true), // Document photo
        this.getFaceDescriptor(liveImageElement, false)    // Live photo
      ]);
      
      // Compare faces
      const comparison = this.compareFaces(
        aadhaarResult.descriptor, 
        liveResult.descriptor, 
        true
      );
      
      // Additional validation checks
      const qualityCheck = aadhaarResult.quality > 0.3 && liveResult.quality > 0.4;
      const sizeCheck = aadhaarResult.faceSize > 40 && liveResult.faceSize > 60;
      
      const success = comparison.matches && qualityCheck && sizeCheck;
      
      console.log('Authentication result:', {
        faceMatch: comparison.matches,
        qualityCheck,
        sizeCheck,
        finalResult: success
      });
      
      return {
        success,
        confidence: comparison.confidence,
        similarity: comparison.similarity,
        details: comparison.recommendation
      };
    } catch (error: any) {
      console.error('Authentication error:', error);
      return {
        success: false,
        confidence: 0,
        similarity: 0,
        details: `Error: ${error.message}`
      };
    }
  }

  /**
   * Cache management for performance
   */
  static cacheDescriptor(key: string, descriptor: Float32Array): void {
    if (this.descriptorCache.size >= this.maxCacheSize) {
      const firstKey = this.descriptorCache.keys().next().value;
      if (typeof firstKey === 'string') {
        this.descriptorCache.delete(firstKey);
      }
    }
    this.descriptorCache.set(key, descriptor);
  }
  
  static getCachedDescriptor(key: string): Float32Array | null {
    return this.descriptorCache.get(key) || null;
  }

  /**
   * Utility method to create image element
   */
  static async createImageElement(imageSource: string | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        img.src = URL.createObjectURL(imageSource);
      }
    });
  }

  /**
   * Cleanup method
   */
  static cleanup(): void {
    this.descriptorCache.clear();
    console.log('Face API service cleaned up');
  }

  /**
   * Get current thresholds
   */
  static getThresholds(): {base: number, document: number, effective: number} {
    return {
      base: this.baseThreshold,
      document: this.documentThreshold,
      effective: this.baseThreshold + this.qualityModifier
    };
  }
  
  /**
   * Set custom thresholds if needed
   */
  static setThresholds(base?: number, document?: number): void {
    if (base !== undefined) this.baseThreshold = Math.max(0.3, Math.min(0.6, base));
    if (document !== undefined) this.documentThreshold = Math.max(0.25, Math.min(0.5, document));
  }}