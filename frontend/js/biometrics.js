/**
 * Biometric Verification Engine
 * Uses face-api.js for high-precision facial matching
 */

const Biometrics = {
  modelsLoaded: false,
  
  async loadModels() {
    if (this.modelsLoaded) return true;
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Higher precision for registry photo
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('Biometric models initialized (Tiny + SSD).');
      return true;
    } catch (err) {
      console.error('Failed to load biometric models:', err);
      return false;
    }
  },

  // Descriptor Cache to prevent redundant processing of the registry photo
  descriptorCache: new Map(),

  async getDescriptorFromImage(base64) {
    if (!base64 || base64 === 'null' || base64 === 'undefined') return null;
    
    // Check cache first
    if (this.descriptorCache.has(base64)) return this.descriptorCache.get(base64);

    try {
      const img = await faceapi.fetchImage(base64);
      // SSD for registry is fine as it's once per person
      const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                                  .withFaceLandmarks()
                                  .withFaceDescriptor();
      
      const descriptor = detection ? detection.descriptor : null;
      if (descriptor) this.descriptorCache.set(base64, descriptor);
      return descriptor;
    } catch (err) {
      console.error('[Biometric] Error processing registry image:', err);
      return null;
    }
  },

  async startVerification(storedPhoto, videoEl, onResult) {
    if (!this.modelsLoaded) await this.loadModels();

    const storedDescriptor = await this.getDescriptorFromImage(storedPhoto);
    if (!storedDescriptor) {
      onResult({ success: false, error: 'Registry Photo Unreadable' });
      return;
    }

    let attempts = 0;
    let frameCount = 0;
    const maxAttempts = 200; 
    let mismatchFrames = 0;
    const MISMATCH_LIMIT = 50; // Adjusted for frame skipping
    const MATCH_THRESHOLD = 0.65;
    
    const checkFrame = async () => {
      frameCount++;
      
      // OPTIMIZATION: Process only every 3rd frame to save CPU and improve UI responsiveness
      if (frameCount % 3 !== 0) {
        requestAnimationFrame(checkFrame);
        return;
      }

      if (attempts > maxAttempts) {
        onResult({ success: false, error: 'Verification Timeout' });
        return;
      }

      attempts++;
      // OPTIMIZATION: Reduced inputSize to 224 for significantly faster live detection
      const liveDetection = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                                         .withFaceLandmarks()
                                         .withFaceDescriptor();

      if (liveDetection) {
        const distance = faceapi.euclideanDistance(storedDescriptor, liveDetection.descriptor);
        
        if (distance < MATCH_THRESHOLD) {
          onResult({ success: true, distance });
          return;
        } else {
          mismatchFrames += (distance > 0.7 ? 10 : 2);
          if (mismatchFrames >= MISMATCH_LIMIT) {
             onResult({ success: false, error: 'Identity Mismatch' });
             return;
          }
        }
      }

      requestAnimationFrame(checkFrame);
    };

    checkFrame();
  }
};
