<template>
  <div class="qr-scanner">
    <div class="scanner-header">
      <h2>QR Code Scanner</h2>
      <button @click="$router.back()" class="back-btn">Back</button>
    </div>
    
    <div class="scanner-container">
      <div v-if="!scanning && !scanResult" class="scan-prompt">
        <div class="qr-icon">📱</div>
        <p>Tap the button below to scan a QR code</p>
        <button @click="startScan" class="scan-btn" :disabled="loading">
          {{ loading ? 'Initializing...' : 'Start Scanning' }}
        </button>
      </div>
      
      <div v-if="scanning" class="scanning-active">
        <div class="camera-container">
          <video 
            ref="videoElement" 
            autoplay 
            muted 
            playsinline
            class="camera-video"
          ></video>
          <div class="scan-overlay">
            <div class="scan-frame">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
          </div>
        </div>
        <p>Point your camera at a QR code</p>
        <button @click="stopScan" class="stop-btn">Stop Scanning</button>
      </div>
      
      <div v-if="scanResult" class="scan-result">
        <h3>Scan Result:</h3>
        <div class="result-content">
          <p>{{ scanResult }}</p>
        </div>
        <div class="result-actions">
          <button @click="scanAgain" class="scan-again-btn">Scan Again</button>
          <button @click="processScan" class="process-btn">Process Check-in</button>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="clearError" class="clear-error-btn">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script>
import QrScanner from 'qr-scanner';
import { Device } from '@capacitor/device';

export default {
  name: 'QRScanner',
  data() {
    return {
      scanning: false,
      loading: false,
      scanResult: null,
      error: null,
      isNative: false,
      qrScanner: null
    };
  },
  async mounted() {
    // Check if we're running on a native device
    const info = await Device.getInfo();
    this.isNative = info.platform !== 'web';
    
    // Check if QR scanner is supported
    if (!QrScanner.hasCamera()) {
      this.error = 'Camera not available on this device';
    }
  },
  beforeUnmount() {
    if (this.qrScanner) {
      this.qrScanner.destroy();
    }
  },
  methods: {
    async startScan() {
      try {
        this.loading = true;
        this.error = null;
        
        // Request camera permissions
        const hasPermission = await QrScanner.hasCamera();
        if (!hasPermission) {
          throw new Error('Camera not available');
        }
        
        this.scanning = true;
        this.loading = false;
        
        // Initialize QR scanner
        this.qrScanner = new QrScanner(
          this.$refs.videoElement,
          result => this.onScanSuccess(result),
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment' // Use back camera if available
          }
        );
        
        await this.qrScanner.start();
        
      } catch (error) {
        console.error('Scan error:', error);
        this.error = 'Failed to start camera: ' + error.message;
        this.scanning = false;
        this.loading = false;
      }
    },
    
    onScanSuccess(result) {
      console.log('QR scan result:', result);
      this.scanResult = result.data || result;
      this.stopScan();
    },
    
    stopScan() {
      if (this.qrScanner) {
        this.qrScanner.stop();
        this.qrScanner.destroy();
        this.qrScanner = null;
      }
      this.scanning = false;
    },
    
    scanAgain() {
      this.scanResult = null;
      this.error = null;
      this.startScan();
    },
    
    clearError() {
      this.error = null;
    },
    
    async processScan() {
      try {
        // Process the QR code result
        const result = this.scanResult;
        
        // For now, just show success and navigate back
        // In the future, this would make an API call to process the check-in
        console.log('Processing scan result:', result);
        
        // Simulate API call
        setTimeout(() => {
          this.$router.push('/dashboard?checkin=success');
        }, 1000);
        
      } catch (error) {
        console.error('Processing error:', error);
        this.error = 'Failed to process check-in';
      }
    }
  }
};
</script>

<style scoped>
.qr-scanner {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.scanner-header h2 {
  margin: 0;
  font-size: 24px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.scanner-container {
  text-align: center;
}

.scan-prompt {
  padding: 40px 20px;
}

.qr-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.scan-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 25px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.scan-btn:disabled {
  background: #666;
  cursor: not-allowed;
}

.scanning-active {
  padding: 20px;
}

.camera-container {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto 20px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-frame {
  position: relative;
  width: 240px;
  height: 240px;
  border: 2px solid rgba(76, 175, 80, 0.8);
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #4CAF50;
}

.corner.top-left {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: -3px;
  right: -3px;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: -3px;
  left: -3px;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
}

.stop-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  cursor: pointer;
}

.scan-result {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.result-content {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  word-break: break-all;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.scan-again-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.process-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.error-message {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #f44336;
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.clear-error-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .qr-scanner {
    padding: 15px;
  }
  
  .camera-container {
    width: 280px;
    height: 280px;
  }
  
  .scan-frame {
    width: 200px;
    height: 200px;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .scan-again-btn,
  .process-btn {
    width: 100%;
  }
}
</style>
