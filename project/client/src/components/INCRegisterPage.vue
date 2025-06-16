<template>
  <div>
    <NavBar />
    <div class="page-container">
      <div class="registration-container">
        <div class="registration-header">
          <img src="../assets/logo_icon2.png" alt="QRBook Logo" class="logo" />
          <h1>Institution Registration</h1>
          <p class="subtitle">Create or join a company account to manage your organization's books</p>
        </div>

        <div class="registration-tabs">
          <button 
            :class="['tab-button', { active: registrationType === 'new' }]" 
            @click="registrationType = 'new'"
          >
            Register New Company
          </button>
          <button 
            :class="['tab-button', { active: registrationType === 'join' }]" 
            @click="registrationType = 'join'"
          >
            Join Existing Company
          </button>
        </div>

        <!-- Register New Company Form -->
        <div v-if="registrationType === 'new'" class="form-section">
          <form @submit.prevent="handleRegisterCompany" class="registration-form">
            <div class="form-group">
              <label for="companyName">Company Name *</label>
              <input 
                id="companyName" 
                v-model="newCompanyForm.companyName" 
                class="input-field" 
                :class="{ 'error': validation.company }"
                placeholder="Enter your company's name"
                required
              />
              <div v-if="validation.company" class="validation-error">{{ validation.company }}</div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="adminEmail">Admin Email *</label>
                <input 
                  id="adminEmail" 
                  v-model="newCompanyForm.email" 
                  type="email" 
                  class="input-field" 
                  :class="{ 'error': validation.email }"
                  placeholder="Admin email address"
                  required
                />
                <div v-if="validation.email" class="validation-error">{{ validation.email }}</div>
              </div>
              <div class="form-group flex-1">
                <label for="phone">Phone Number (Optional)</label>
                <input 
                  id="phone" 
                  v-model="newCompanyForm.phone" 
                  type="tel" 
                  class="input-field" 
                  placeholder="Company phone number"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="password">Password *</label>
                <div class="password-field">
                  <input 
                    id="password" 
                    v-model="newCompanyForm.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    class="input-field" 
                    :class="{ 'error': validation.password }"
                    placeholder="Create a strong password"
                    required
                  />
                  <button 
                    type="button" 
                    class="password-toggle" 
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? '🔒' : '👁️' }}
                  </button>
                </div>
                <div v-if="validation.password" class="validation-error">{{ validation.password }}</div>
                <div class="password-requirements">
                  Password requirements:
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Contains at least one uppercase letter</li>
                    <li>Contains at least one lowercase letter</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character</li>
                  </ul>
                </div>
              </div>

              <div class="form-group flex-1">
                <label for="confirmPassword">Confirm Password *</label>
                <div class="password-field">
                  <input 
                    id="confirmPassword" 
                    v-model="newCompanyForm.confirmPassword" 
                    :type="showPassword ? 'text' : 'password'" 
                    class="input-field" 
                    :class="{ 'error': !newPasswordsMatch && newCompanyForm.confirmPassword }"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <div v-if="!newPasswordsMatch && newCompanyForm.confirmPassword" class="validation-error">
                  Passwords do not match
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="domain">Email Domain (Optional)</label>
              <div class="domain-field">
                <span class="domain-at">@</span>
                <input 
                  id="domain" 
                  v-model="newCompanyForm.domain" 
                  class="input-field"
                  :class="{ 'error': validation.domain }"
                  placeholder="company.com"
                />
              </div>
              <div v-if="validation.domain" class="validation-error">{{ validation.domain }}</div>
              <small class="help-text">Add your company's email domain for user verification</small>
            </div>

            <div class="settings-section">
              <h3>Company Settings</h3>
              <div class="settings-grid">
                <div class="setting-item">
                  <input 
                    id="autoApprove" 
                    type="checkbox" 
                    v-model="newCompanyForm.autoApproveMembers"
                  />
                  <label for="autoApprove">
                    <span class="setting-title">Auto-approve Members</span>
                    <span class="setting-desc">Automatically approve new member requests from verified company email domains</span>
                  </label>
                </div>
                <div class="setting-item">
                  <input 
                    id="require2FA" 
                    type="checkbox" 
                    v-model="newCompanyForm.require2FA"
                  />
                  <label for="require2FA">
                    <span class="setting-title">Require 2FA</span>
                    <span class="setting-desc">Enforce two-factor authentication for all members</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group terms-section">
              <div class="checkbox-wrapper">
                <input 
                  id="terms" 
                  type="checkbox" 
                  v-model="newCompanyForm.acceptTerms"
                  required
                />
                <label for="terms">
                  I accept the <a href="#" target="_blank">terms of service</a> and <a href="#" target="_blank">privacy policy</a>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="submit-button" 
                :disabled="!canRegisterCompany || isSubmitting"
              >
                <span v-if="isSubmitting">
                  <span class="loading-spinner"></span>
                  Creating your company...
                </span>
                <span v-else>Create Company Account</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Join Company Form -->
        <div v-if="registrationType === 'join'" class="form-section">
          <form @submit.prevent="handleJoinCompany" class="registration-form">
            <div class="form-group">
              <label for="joinCode">Company Code *</label>
              <input 
                id="joinCode" 
                v-model="joinForm.companyId" 
                class="input-field" 
                :class="{ 'error': validation.company }"
                placeholder="Enter your company's registration code"
                required
              />
              <div v-if="validation.company" class="validation-error">{{ validation.company }}</div>
              <small class="help-text">Ask your company administrator for the code</small>
            </div>

            <div class="form-group">
              <label for="joinEmail">Work Email *</label>
              <input 
                id="joinEmail" 
                v-model="joinForm.email" 
                type="email" 
                class="input-field" 
                :class="{ 'error': validation.email }"
                placeholder="Your work email address"
                required
              />
              <div v-if="validation.email" class="validation-error">{{ validation.email }}</div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="joinPassword">Password *</label>
                <div class="password-field">
                  <input 
                    id="joinPassword" 
                    v-model="joinForm.password" 
                    :type="showJoinPassword ? 'text' : 'password'" 
                    class="input-field" 
                    :class="{ 'error': validation.password }"
                    placeholder="Create a password"
                    required
                  />
                  <button 
                    type="button" 
                    class="password-toggle" 
                    @click="showJoinPassword = !showJoinPassword"
                  >
                    {{ showJoinPassword ? '🔒' : '👁️' }}
                  </button>
                </div>
                <div v-if="validation.password" class="validation-error">{{ validation.password }}</div>
                <div class="password-requirements">
                  Password requirements:
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Contains at least one uppercase letter</li>
                    <li>Contains at least one lowercase letter</li>
                    <li>Contains at least one number</li>
                    <li>Contains at least one special character</li>
                  </ul>
                </div>
              </div>

              <div class="form-group flex-1">
                <label for="joinConfirmPassword">Confirm Password *</label>
                <div class="password-field">
                  <input 
                    id="joinConfirmPassword" 
                    v-model="joinForm.confirmPassword" 
                    :type="showJoinPassword ? 'text' : 'password'" 
                    class="input-field" 
                    :class="{ 'error': !passwordsMatch && joinForm.confirmPassword }"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <div v-if="!passwordsMatch && joinForm.confirmPassword" class="validation-error">
                  Passwords do not match
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="department">Department (Optional)</label>
              <input 
                id="department" 
                v-model="joinForm.department" 
                class="input-field" 
                placeholder="Your department name"
              />
            </div>

            <div class="form-group terms-section">
              <div class="checkbox-wrapper">
                <input 
                  id="joinTerms" 
                  type="checkbox" 
                  v-model="joinForm.acceptTerms"
                  required
                />
                <label for="joinTerms">
                  I accept the <a href="#" target="_blank">terms of service</a> and <a href="#" target="_blank">privacy policy</a>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="submit-button" 
                :disabled="!canJoin || isSubmitting"
              >
                <span v-if="isSubmitting">
                  <span class="loading-spinner"></span>
                  Joining company...
                </span>
                <span v-else>Join Company</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Messages -->
        <div v-if="errorMessage" class="message error">
          <span class="message-icon">⚠️</span>
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="message success">
          <span class="message-icon">✅</span>
          {{ successMessage }}
        </div>

        <div class="auth-footer">
          <p>
            Already have an account? 
            <router-link to="/login" class="auth-link">Sign in here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import api from '../api';

export default {
  name: 'INCRegisterPage',
  components: { NavBar },
  data() {
    return {
      registrationType: 'new',
      showPassword: false,
      showJoinPassword: false,
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      
      // Form validation messages
      validation: {
        company: '',
        email: '',
        password: '',
        domain: ''
      },
      
      joinForm: {
        companyId: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        acceptTerms: false
      },
      
      newCompanyForm: {
        companyName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        domain: '',
        autoApproveMembers: true,
        require2FA: false,
        acceptTerms: false
      }
    };
  },
  
  computed: {
    passwordsMatch() {
      return this.joinForm.password === this.joinForm.confirmPassword;
    },
    newPasswordsMatch() {
      return this.newCompanyForm.password === this.newCompanyForm.confirmPassword;
    },
    canJoin() {
      return (
        this.joinForm.companyId &&
        this.joinForm.email &&
        this.joinForm.password &&
        this.joinForm.confirmPassword &&
        this.passwordsMatch &&
        this.joinForm.acceptTerms &&
        !this.isSubmitting &&
        this.isValidEmail(this.joinForm.email)
      );
    },
    canRegisterCompany() {
      return (
        this.newCompanyForm.companyName &&
        this.newCompanyForm.email &&
        this.newCompanyForm.password &&
        this.newCompanyForm.confirmPassword &&
        this.newPasswordsMatch &&
        this.newCompanyForm.acceptTerms &&
        !this.isSubmitting &&
        this.isValidEmail(this.newCompanyForm.email) &&
        (!this.newCompanyForm.domain || this.isValidDomain(this.newCompanyForm.domain))
      );
    }
  },
  
  methods: {
    isValidEmail(email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    },

    isValidDomain(domain) {
      // Domain validation pattern: subdomain optional, domain required, TLD required
      const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      return domainPattern.test(domain);
    },

    validateForm(type) {
      this.validation = { company: '', email: '', password: '', domain: '' };
      let isValid = true;

      if (type === 'join') {
        if (!this.joinForm.companyId) {
          this.validation.company = 'Company code is required';
          isValid = false;
        }
        if (!this.isValidEmail(this.joinForm.email)) {
          this.validation.email = 'Please enter a valid email address';
          isValid = false;
        }
        if (this.joinForm.password.length < 8) {
          this.validation.password = 'Password must be at least 8 characters long';
          isValid = false;
        }
      } else {
        if (!this.newCompanyForm.companyName) {
          this.validation.company = 'Company name is required';
          isValid = false;
        }
        if (!this.isValidEmail(this.newCompanyForm.email)) {
          this.validation.email = 'Please enter a valid email address';
          isValid = false;
        }
        if (this.newCompanyForm.password.length < 8) {
          this.validation.password = 'Password must be at least 8 characters long';
          isValid = false;
        }
        if (this.newCompanyForm.domain && !this.isValidDomain(this.newCompanyForm.domain)) {
          this.validation.domain = 'Please enter a valid domain (e.g., company.com)';
          isValid = false;
        }
      }

      return isValid;
    },
    
    async handleJoinCompany() {
      this.errorMessage = '';
      this.successMessage = '';
      
      if (!this.validateForm('join')) {
        return;
      }
      
      if (!this.passwordsMatch) {
        this.validation.password = 'Passwords do not match';
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        const response = await api.post('/api/auth/register', {
          email: this.joinForm.email,
          password: this.joinForm.password,
          confirmPassword: this.joinForm.confirmPassword,
          companyId: this.joinForm.companyId,
          companyDepartment: this.joinForm.department
        });
        
        this.successMessage = response.data.requiresVerification 
          ? 'Registration successful! Please check your email for verification instructions.' 
          : 'Successfully joined company! Redirecting to login...';
        
        // Clear form
        this.joinForm = {
          companyId: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: '',
          acceptTerms: false
        };
        
        // Only redirect if email verification is not required
        if (!response.data.requiresVerification) {
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Error joining company:', error);
        if (error.response?.status === 400 && error.response.data.message.includes('domain')) {
          this.errorMessage = 'Your email domain is not authorized for this company. Please use your company email address.';
        } else if (error.response?.status === 404) {
          this.errorMessage = 'Company code not found. Please check the code and try again.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Failed to join company. Please try again.';
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    
    async handleRegisterCompany() {
      this.errorMessage = '';
      this.successMessage = '';
      
      if (!this.validateForm('new')) {
        return;
      }
      
      if (!this.newPasswordsMatch) {
        this.validation.password = 'Passwords do not match';
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        const response = await api.post('/api/auth/register', {
          email: this.newCompanyForm.email,
          password: this.newCompanyForm.password,
          confirmPassword: this.newCompanyForm.confirmPassword,
          companyName: this.newCompanyForm.companyName,
          companyPhone: this.newCompanyForm.phone,
          domains: this.newCompanyForm.domain ? [this.newCompanyForm.domain] : [],
          authSettings: {
            require2FA: this.newCompanyForm.require2FA,
            autoApproveMembers: this.newCompanyForm.autoApproveMembers,
            requireEmailVerification: true // Always require email verification for new companies
          }
        });
        
        this.successMessage = response.data.requiresVerification 
          ? 'Company registration successful! Please check your email for verification instructions.' 
          : 'Company successfully registered! Redirecting to login...';
        
        // Clear form
        this.newCompanyForm = {
          companyName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          domain: '',
          autoApproveMembers: true,
          require2FA: false,
          acceptTerms: false
        };
        
        // Only redirect if email verification is not required
        if (!response.data.requiresVerification) {
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Error registering company:', error);
        if (error.response?.status === 400 && error.response.data.message.includes('exists')) {
          this.errorMessage = 'A company with this name already exists. Please choose a different name.';
        } else {
          this.errorMessage = error.response?.data?.message || 'Failed to register company. Please try again.';
        }
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.registration-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.registration-header {
  text-align: center;
  margin-bottom: 3rem;
}

.logo {
  height: 64px;
  width: auto;
  margin-bottom: 1.5rem;
}

.registration-header h1 {
  font-size: 2.5rem;
  color: #2364AA;
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 0;
}

.registration-tabs {
  display: flex;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 2.5rem;
}

.tab-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: #2364AA;
  color: white;
  box-shadow: 0 4px 12px rgba(35, 100, 170, 0.3);
}

.tab-button:hover:not(.active) {
  background: #e9ecef;
  color: #2364AA;
}

.form-section {
  margin-bottom: 2rem;
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.flex-1 {
  flex: 1;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.input-field {
  padding: 0.875rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.input-field:focus {
  border-color: #2364AA;
  outline: none;
  background: white;
  box-shadow: 0 0 0 4px rgba(35, 100, 170, 0.1);
}

.input-field.error {
  border-color: #dc2626;
  background: #fef2f2;
}

.password-field {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #2364AA;
}

.password-requirements {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid #2364AA;
}

.password-requirements ul {
  margin: 0.5rem 0 0 1.25rem;
  padding: 0;
}

.password-requirements li {
  margin-bottom: 0.4rem;
  line-height: 1.4;
}

.password-requirements li::marker {
  color: #2364AA;
}

.company-settings {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.company-settings h3 {
  margin: 0 0 1rem 0;
  color: #2364AA;
  font-size: 1.1rem;
  font-weight: 600;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.setting-item input[type="checkbox"] {
  margin-top: 0.25rem;
  transform: scale(1.2);
}

.setting-item label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.setting-title {
  font-weight: 600;
  color: #2c3e50;
}

.setting-desc {
  font-size: 0.875rem;
  color: #666;
}

.terms-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e9ecef;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-wrapper input[type="checkbox"] {
  margin-top: 0.25rem;
  transform: scale(1.1);
}

.checkbox-wrapper label {
  font-size: 0.95rem;
  color: #2c3e50;
  line-height: 1.5;
}

.checkbox-wrapper a {
  color: #2364AA;
  text-decoration: none;
  font-weight: 500;
}

.checkbox-wrapper a:hover {
  text-decoration: underline;
}

.form-actions {
  margin-top: 2rem;
}

.submit-button {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #2364AA 0%, #3da5d9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(35, 100, 170, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.help-text {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
  font-style: italic;
}

.validation-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.message {
  margin-top: 2rem;
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.message.error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

.message.success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.message-icon {
  font-size: 1.25rem;
}

.auth-footer {
  text-align: center;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.auth-footer p {
  color: #666;
  margin-bottom: 0;
}

.auth-link {
  color: #2364AA;
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }
  
  .registration-container {
    padding: 2rem 1.5rem;
  }
  
  .registration-header h1 {
    font-size: 2rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .registration-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .registration-container {
    padding: 1.5rem 1rem;
  }
  
  .registration-header h1 {
    font-size: 1.75rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}</style>
