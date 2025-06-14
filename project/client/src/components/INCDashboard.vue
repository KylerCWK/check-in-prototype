<template>
  <div class="inc-dashboard">
    <NavBar />
    
    <!-- Company Header -->
    <header class="company-header">
      <div class="header-content">
        <div class="company-info">
          <h1>{{ company.name }}</h1>
          <p>{{ company.description }}</p>
        </div>
        <div class="header-actions">
          <router-link to="/inc/qr-generator" class="action-btn qr-btn">
            <i class="fas fa-qrcode"></i>
            Generate QR Codes
          </router-link>
          <button class="scan-button" @click="startScanning" v-if="!isScanning">
            <i class="fas fa-qrcode"></i>
            Start Scanning
          </button>
          <button class="scan-button stop" @click="stopScanning" v-else>
            <i class="fas fa-stop"></i>
            Stop Scanning
          </button>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Content -->
    <main class="dashboard-content">
      <div class="dashboard-grid">
        <!-- Scanner Section -->
        <section class="scanner-section" :class="{ active: isScanning }">
          <div class="scanner-container">
            <div class="scanner-header">
              <h2>QR Code Scanner</h2>
              <div class="scanner-status">
                Status: {{ isScanning ? 'Active' : 'Inactive' }}
              </div>
            </div>
            
            <!-- Scanner Preview -->
            <div class="scanner-preview" v-show="isScanning">
              <video ref="scannerVideo" class="scanner-video"></video>
              <canvas ref="scannerCanvas" class="scanner-canvas"></canvas>
              <div class="scanner-overlay">
                <div class="scanner-target"></div>
              </div>
            </div>

            <!-- Last Scan Result -->
            <div class="scan-result" v-if="lastScan">
              <h3>Last Scan</h3>
              <div class="scan-info">
                <p><strong>Book:</strong> {{ lastScan.title }}</p>
                <p><strong>Time:</strong> {{ formatScanTime(lastScan.timestamp) }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Scans -->
        <section class="recent-scans">
          <h2>Recent Scans</h2>
          <div class="scans-list">
            <div v-for="scan in recentScans" :key="scan.id" class="scan-item">
              <div class="scan-item-content">
                <img :src="scan.book.coverUrl || '/default-cover.png'" alt="Book cover" class="scan-book-cover">
                <div class="scan-details">
                  <h4>{{ scan.book.title }}</h4>
                  <p>{{ scan.book.author }}</p>
                  <small>{{ formatScanTime(scan.timestamp) }}</small>
                </div>
              </div>
              <div class="scan-actions">
                <button @click="viewBookDetails(scan.book.id)" class="action-btn">
                  <i class="fas fa-info-circle"></i>
                </button>
              </div>
            </div>
            <div v-if="recentScans.length === 0" class="no-scans">
              No recent scans
            </div>
          </div>
        </section>

        <!-- Statistics -->
        <section class="statistics">
          <h2>Scanning Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Today</h3>
              <div class="stat-value">{{ stats.today }}</div>
              <div class="stat-label">Scans</div>
            </div>
            <div class="stat-card">
              <h3>This Week</h3>
              <div class="stat-value">{{ stats.thisWeek }}</div>
              <div class="stat-label">Scans</div>
            </div>
            <div class="stat-card">
              <h3>Total</h3>
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Scans</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import api from '../api';
import { BrowserMultiFormatReader } from '@zxing/library';

export default {
  name: 'INCDashboard',
  components: { NavBar },
  
  data() {
    return {
      company: {
        name: '',
        description: ''
      },
      isScanning: false,
      codeReader: null,
      lastScan: null,
      recentScans: [],
      stats: {
        today: 0,
        thisWeek: 0,
        total: 0
      }
    };
  },

  async created() {
    await this.loadCompanyData();
    await this.loadScanningStats();
    await this.loadRecentScans();
    this.initializeScanner();
  },

  beforeDestroy() {
    this.cleanupScanner();
  },

  methods: {
    async loadCompanyData() {
      try {
        const response = await api.get('/api/companies/current');
        this.company = response.data;
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    },

    async loadScanningStats() {
      try {
        const response = await api.get('/api/companies/scanning-stats');
        this.stats = response.data;
      } catch (error) {
        console.error('Error loading scanning stats:', error);
      }
    },

    async loadRecentScans() {
      try {
        const response = await api.get('/api/companies/recent-scans');
        this.recentScans = response.data;
      } catch (error) {
        console.error('Error loading recent scans:', error);
      }
    },

    initializeScanner() {
      this.codeReader = new BrowserMultiFormatReader();
    },

    async startScanning() {
      if (!this.codeReader) {
        this.initializeScanner();
      }

      try {
        this.isScanning = true;
        const videoElement = this.$refs.scannerVideo;
        
        await this.codeReader.decodeFromVideoDevice(
          undefined, 
          videoElement,
          async (result) => {
            if (result) {
              await this.handleScanResult(result.getText());
            }
          }
        );
      } catch (error) {
        console.error('Error starting scanner:', error);
        this.isScanning = false;
      }
    },

    async stopScanning() {
      if (this.codeReader) {
        this.codeReader.reset();
        this.isScanning = false;
      }
    },

    cleanupScanner() {
      if (this.codeReader) {
        this.codeReader.reset();
        this.codeReader = null;
      }
    },

    async handleScanResult(qrData) {
      try {
        // Process the QR code data
        const response = await api.post('/api/companies/process-scan', {
          qrData,
          timestamp: new Date().toISOString()
        });

        // Update the UI with the scan result
        this.lastScan = {
          ...response.data,
          timestamp: new Date()
        };

        // Refresh recent scans and stats
        await Promise.all([
          this.loadRecentScans(),
          this.loadScanningStats()
        ]);
      } catch (error) {
        console.error('Error processing scan:', error);
      }
    },

    formatScanTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now - date) / 60000);
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    },

    viewBookDetails(bookId) {
      this.$router.push(`/book/${bookId}`);
    }
  }
};
</script>

<style scoped>
.inc-dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.company-header {
  background: #fff;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.company-info h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.company-info p {
  margin: 0.5rem 0 0;
  color: #666;
}

.scan-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.scan-button:hover {
  background: #45a049;
}

.scan-button.stop {
  background: #f44336;
}

.scan-button.stop:hover {
  background: #e53935;
}

.dashboard-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.scanner-section {
  grid-column: 1 / -1;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.scanner-preview {
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: 8px;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-canvas {
  display: none;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.1);
}

.scanner-target {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
}

.scan-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.recent-scans {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.scan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.scan-item:last-child {
  border-bottom: none;
}

.scan-item-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.scan-book-cover {
  width: 50px;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
}

.scan-details h4 {
  margin: 0;
  color: #2c3e50;
}

.scan-details p {
  margin: 0.25rem 0;
  color: #666;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  color: #4CAF50;
  cursor: pointer;
}

.statistics {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4CAF50;
  margin: 0.5rem 0;
}

.stat-label {
  color: #666;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.qr-btn {
  background: #fec601;
  color: #2364AA;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.qr-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 198, 1, 0.3);
}

.qr-btn i {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
