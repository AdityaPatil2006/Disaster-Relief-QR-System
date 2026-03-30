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
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('Biometric models initialized.');
      return true;
    } catch (err) {
      console.error('Failed to load biometric models:', err);
      return false;
    }
  },

  async getDescriptorFromImage(base64) {
    const img = await faceapi.fetchImage(base64);
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                                .withFaceLandmarks()
                                .withFaceDescriptor();
    return detection ? detection.descriptor : null;
  },

  async startVerification(storedPhoto, videoEl, onResult) {
    if (!this.modelsLoaded) await this.loadModels();

    // 1. Get descriptor from registry
    const storedDescriptor = await this.getDescriptorFromImage(storedPhoto);
    if (!storedDescriptor) {
      onResult({ success: false, error: 'Registry photo invalid' });
      return;
    }

    // 2. Start Live Check
    let attempts = 0;
    const maxAttempts = 60; // Total window (~10s)
    let faceSeen = false;
    let mismatchFrames = 0;
    const MISMATCH_LIMIT = 7; // Fast-fail after 7 non-matching frames (< 1s)
    
    const checkFrame = async () => {
      if (attempts > maxAttempts) {
        if (!faceSeen) {
          onResult({ success: false, error: 'No Face Detected' });
        } else {
          onResult({ success: false, error: 'Identity Mismatch: Incorrect Beneficiary' });
        }
        return;
      }

      attempts++;
      const liveDetection = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
                                         .withFaceLandmarks()
                                         .withFaceDescriptor();

      if (liveDetection) {
        faceSeen = true;
        const distance = faceapi.euclideanDistance(storedDescriptor, liveDetection.descriptor);
        
        // Analysis Loop
        if (distance < 0.45) {
          onResult({ success: true, distance });
          return;
        } else {
          // Weighted mismatch for aggressive speed:
          // If the face is clearly different (> 0.7), count it as 3 mismatch events
          // This allows an instant block for a total stranger while being careful with slight deviations.
          const weight = distance > 0.7 ? 3 : 1;
          mismatchFrames += weight;
          
          if (mismatchFrames >= MISMATCH_LIMIT) {
             onResult({ success: false, error: 'Identity Mismatch: Access Revoked' });
             return;
          }
        }
        
        console.log(`Analyzing biometric signatures... (Confidence: ${( (1-distance)*100 ).toFixed(1)}%)`);
      }

      requestAnimationFrame(checkFrame);
    };

    checkFrame();
  }
};
