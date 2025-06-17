<template>
  <div>
    <NavBar />
    <div class="signup-section">
      <div class="signup-container">
        <div class="signup-header-row">
          <h1 class="signup-title">Register</h1>
          <span class="have-account">
            Have an account? <router-link to="/login" class="signin-link">Sign in</router-link>
          </span>
        </div>
        <!-- <div class="oauth-placeholder">[OAuth buttons placeholder]</div> -->
        <form class="signup-form" @submit.prevent="handleRegister">
          <label for="email" class="signup-label">Email Address</label>
          <input id="email" type="email" class="input-field" v-model="email" required />

          <label for="password" class="signup-label">Password</label>
          <div class="password-field-wrapper">
            <input :type="showPassword ? 'text' : 'password'" id="password" class="input-field" v-model="password" required />
            <button type="button" class="show-password-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <!--
          <div class="password-requirements">
            Password must meet the following requirements:
            <ul>
              <li>Minimum length: 8 characters</li>
              <li>At least one uppercase letter (A–Z)</li>
              <li>At least one lowercase letter (a–z)</li>
              <li>At least one digit (0–9)</li>
              <li>At least one special character (!@#$%^&*, etc.)</li>
              <li>No common passwords (like "password123", "qwerty", etc.)</li>
              <li>No repeated characters</li>
            </ul>
          </div>
          -->

          <label for="confirmPassword" class="signup-label">Confirm Password</label>
          <div class="password-field-wrapper">
            <input :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" class="input-field" v-model="confirmPassword" required />
            <button type="button" class="show-password-btn" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? 'Hide' : 'Show' }}
            </button>
          </div>

          <div v-if="!passwordsMatch && confirmPassword" class="password-warning">
            Passwords do not match.
          </div>

          <div class="terms-row">
            <input id="terms" type="checkbox" v-model="acceptedTerms" required />
            <label for="terms">I accept the <a href="#" target="_blank">terms and conditions</a></label>
          </div>

          <button class="btn_primary signup-btn" type="submit" :disabled="!canRegister">
            {{ isSubmitting ? 'Registering...' : 'Register' }}
          </button>
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import { register } from '../api';
export default {
  name: 'SignUpPage',
  components: { NavBar },
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
      showPassword: false,
      showConfirmPassword: false,
      errorMessage: '',
      successMessage: '',
      isSubmitting: false,
    };
  },
  computed: {
    passwordsMatch() {
      return this.password === this.confirmPassword;
    },
    canRegister() {
      return (
        this.email &&
        this.password &&
        this.confirmPassword &&
        this.acceptedTerms &&
        this.passwordsMatch &&
        !this.isSubmitting
      );
    },
  },
  methods: {
    async handleRegister() {
      this.errorMessage = '';
      this.successMessage = '';
      if (!this.passwordsMatch) {
        this.errorMessage = "Passwords do not match.";
        return;
      }
      if (!this.acceptedTerms) {
        this.errorMessage = "You must accept the terms and conditions.";
        return;
      }
      this.isSubmitting = true;
      try {
        const response = await register({
          email: this.email,
          password: this.password,
          confirmPassword: this.confirmPassword,
        });
        this.successMessage = response.message;
        // Auto-redirect to login page after 2 seconds
        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.acceptedTerms = false;
      } catch (err) {
        if (err.response?.data?.message === 'Email already exists') {
          this.errorMessage = 'This email is already registered. Please use a different email.';
        } else {
          this.errorMessage = err.response?.data?.message || 'Registration failed.';
        }
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.signup-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
}
.signup-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.09);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 620px; 
  max-width: 720px;
  margin: 2rem;
}
.signup-header-row {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.signup-title {
  margin-bottom: 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
}
.have-account {
  display: flex;
  align-items: center;
  font-size: 0.89rem;
  color: #444;
  margin-left: 1.2rem;
  white-space: nowrap;
}
.signin-link {
  color: #42b983;
  text-decoration: underline;
  margin-left: 0.3rem;
  transition: color 0.2s;
}
.signin-link:hover {
  color: #369e6f;
}
.oauth-placeholder {
  width: 100%;
  height: 120px;
  background: repeating-linear-gradient(135deg, #e0e0e0, #e0e0e0 10px, #f7f7f7 10px, #f7f7f7 20px);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.1rem;
}
.signup-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.signup-label {
  font-size: 1rem;
  color: #444;
  margin-bottom: 0.2rem;
}
.input-field {
  padding: 0.7rem 2.5rem 0.7rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: #f8f9fa;
  margin-bottom: 0.2rem;
  width: 100%;
  box-sizing: border-box;
}
.input-field:focus {
  border-color: #42b983;
  outline: none;
}
.password-field-wrapper {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.2rem;
  position: relative;
}
.show-password-btn {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #42b983;
  font-size: 0.98rem;
  cursor: pointer;
  padding: 0 0.3rem;
  transition: color 0.2s;
  height: 1.8rem;
  display: flex;
  align-items: center;
}
.show-password-btn:hover {
  color: #239562;
}
.terms-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.98rem;
}
.terms-row label {
  color: #444;
}
.terms-row a {
  color: #42b983;
  text-decoration: underline;
}
.signup-btn {
  margin-top: 0.5rem;
  width: 100%;
}
.password-warning {
  color: #f8143e;
  font-size: 0.98rem;
  margin-bottom: 0.5rem;
  margin-top: -0.5rem;
  text-align: left;
}
.error-message {
  color: #f8143e;
  margin-top: 1rem;
  text-align: center;
}
.success-message {
  color: #42b983;
  margin-top: 1rem;
  text-align: center;
}
</style>