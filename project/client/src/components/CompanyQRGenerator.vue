<template>
  <div class="qr-generator-container">
    <div class="qr-header">
      <h2>Company QR Code Generator</h2>
      <p class="subtitle">Generate branded QR codes for your company's books</p>
    </div>

    <div class="qr-content">
      <div class="qr-settings">
        <div class="form-group">
          <label>Book ID or ISBN</label>
          <input 
            type="text" 
            v-model="bookIdentifier"
            class="input-field"
            placeholder="Enter book ID or ISBN"
          />
        </div>

        <div class="form-group">
          <label>QR Code Template</label>
          <select v-model="template" class="select-field">
            <option value="default">Default</option>
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
          </select>
        </div>

        <div class="color-settings">
          <div class="form-group">
            <label>Primary Color</label>
            <input 
              type="color" 
              v-model="primaryColor"
              class="color-picker"
            />
          </div>

          <div class="form-group">
            <label>Secondary Color</label>
            <input 
              type="color" 
              v-model="secondaryColor"
              class="color-picker"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Company Logo</label>
          <div class="logo-upload">
            <input 
              type="file" 
              @change="handleLogoUpload"
              accept="image/*"
              ref="logoInput"
              class="file-input"
            />
            <button class="upload-btn" @click="$refs.logoInput.click()">
              <span v-if="!logo">Upload Logo</span>
              <span v-else>Change Logo</span>
            </button>
          </div>
          <img v-if="logo" :src="logo" class="logo-preview" alt="Company Logo" />
        </div>

        <button 
          class="generate-btn" 
          @click="generateQRCode"
          :disabled="!bookIdentifier"
        >
          Generate QR Code
        </button>

        <button 
          v-if="qrCodeUrl" 
          class="download-btn"
          @click="downloadQRCode"
        >
          Download QR Code
        </button>

        <button 
          class="save-settings-btn"
          @click="saveQRSettings"
        >
          Save as Default Settings
        </button>
      </div>

      <div class="qr-preview">
        <div v-if="qrCodeUrl" class="qr-result">
          <img :src="qrCodeUrl" alt="Generated QR Code" class="qr-image" />
        </div>
        <div v-else class="qr-placeholder">
          QR code preview will appear here
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import companyQrService from '../services/companyQrService';

export default {
  name: 'CompanyQRGenerator',
  data() {
    return {
      bookIdentifier: '',
      template: 'default',
      primaryColor: '#2364AA',
      secondaryColor: '#FEC601',
      logo: null,
      qrCodeUrl: null,
      uploadedLogo: null
    };
  },
  methods: {
    async handleLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Create preview
      this.logo = URL.createObjectURL(file);
      this.uploadedLogo = file;
    },
    async generateQRCode() {
      try {
        this.qrCodeUrl = await companyQrService.generateQRCode(this.bookIdentifier, {
          template: this.template,
          primaryColor: this.primaryColor,
          secondaryColor: this.secondaryColor,
          logo: this.uploadedLogo
        });
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code. Please try again.');
      }
    },
    downloadQRCode() {
      if (!this.qrCodeUrl) return;

      const link = document.createElement('a');
      link.href = this.qrCodeUrl;
      link.download = `qr-code-${this.bookIdentifier}.png`;
      link.click();
    },
    async saveQRSettings() {
      try {
        await companyQrService.updateQRSettings({
          template: this.template,
          primaryColor: this.primaryColor,
          secondaryColor: this.secondaryColor,
          logo: this.uploadedLogo
        });
        alert('QR code settings saved successfully!');
      } catch (error) {
        console.error('Error saving QR settings:', error);
        alert('Failed to save settings. Please try again.');
      }
    },
    async loadCompanySettings() {
      try {
        const settings = await companyQrService.getQRSettings();
        this.template = settings.template || 'default';
        this.primaryColor = settings.primaryColor || '#2364AA';
        this.secondaryColor = settings.secondaryColor || '#FEC601';
        this.logo = settings.logo || null;
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    }
  },
  mounted() {
    this.loadCompanySettings();
  }
};
</script>

<style scoped>
.qr-generator-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.qr-header {
  margin-bottom: 2rem;
  text-align: center;
}

.qr-header h2 {
  color: #2c3e50;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.qr-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.qr-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.input-field,
.select-field {
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;
}

.input-field:focus,
.select-field:focus {
  border-color: #2364AA;
  outline: none;
}

.color-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.color-picker {
  width: 100%;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.logo-upload {
  display: flex;
  gap: 1rem;
}

.file-input {
  display: none;
}

.upload-btn,
.generate-btn,
.download-btn,
.save-settings-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn {
  background: #f8f9fa;
  border: 2px solid #e1e5e9;
  color: #2c3e50;
}

.upload-btn:hover {
  background: #e9ecef;
}

.generate-btn {
  background: linear-gradient(135deg, #2364AA 0%, #3da5d9 100%);
  color: white;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(35, 100, 170, 0.2);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.download-btn {
  background: #fec601;
  color: #2364AA;
}

.download-btn:hover {
  background: #ffd74d;
}

.save-settings-btn {
  background: #e9ecef;
  color: #2c3e50;
}

.save-settings-btn:hover {
  background: #dee2e6;
}

.logo-preview {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  margin-top: 1rem;
}

.qr-preview {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.qr-result {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  max-width: 250px;
  height: auto;
}

.qr-placeholder {
  color: #adb5bd;
  font-size: 1.1rem;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .qr-content {
    grid-template-columns: 1fr;
  }
  
  .color-settings {
    grid-template-columns: 1fr;
  }
  
  .qr-preview {
    min-height: 250px;
  }
}
</style>
