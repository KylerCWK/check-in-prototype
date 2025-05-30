<template>
  <div>
    <NavBar />
    <div class="login-section">
      <div class="login-container">
        <div class="login-header-row">
          <h1 class="login-title">Login</h1>
          <span class="or-create"
            >or
            <router-link to="/register" class="create-account-link">Create an Account</router-link
          ></span>
        </div>
        <!-- <div class="oauth-placeholder">[OAuth buttons placeholder]</div> -->
        <form class="login-form" @submit.prevent="handleLogin">
          <label for="username" class="login-label">Username or Email</label>
          <input id="username" type="text" class="input-field" placeholder="" v-model="username" />

          <label for="password" class="login-label">Password</label>
          <div class="password-field-wrapper">
            <input :type="showPassword ? 'text' : 'password'" id="password" class="input-field" placeholder="" v-model="password" />
            <button type="button" class="show-password-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>

          <div class="remember-row">
            <input id="remember" type="checkbox" v-model="remember" />
            <label for="remember">Remember me</label>
          </div>

          <button class="btn_primary login-btn" type="submit">Login</button>
        </form>
        <router-link to="/reset-password" class="lost-password-link">Forgot password?</router-link>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import api from '../api';

export default {
  name: 'LoginPage',
  components: { NavBar },
  data() {
    return {
      username: '',
      password: '',
      remember: false,
      showPassword: false,
      errorMessage: '',
    };
  },
  methods: {
    async handleLogin() {
      this.errorMessage = '';
      try {
        const response = await api.post('/api/auth/login', {
          email: this.username,
          password: this.password,
        });
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        // Store email for personalization (temporary solution)
        localStorage.setItem('userEmail', this.username);
        
        // Dispatch a custom event to notify components that login was successful
        window.dispatchEvent(new Event('auth:login'));
        
        // Check if there's a redirect path stored
        const redirect = this.$route.query.redirect || localStorage.getItem('redirectAfterLogin') || '/dashboard';
        localStorage.removeItem('redirectAfterLogin'); // Clear the stored path
        
        // Login successful - redirect to the saved path or dashboard
        this.$router.push(redirect);
      } catch (err) {
        if (err.response?.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else {
          this.errorMessage = 'An error occurred during login. Please try again later.';
        }
      }
    },
  },
};
</script>

<style scoped>
.login-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
}
.login-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.09);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 520px;
  max-width: 620px;
  margin: 2rem;
}
.login-header-row {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.login-title {
  margin-bottom: 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
}
.or-create {
  display: flex;
  align-items: center;
  font-size: 1.05rem;
  color: #444;
  margin-left: 1.2rem;
  white-space: nowrap;
}
.create-account-link {
  color: #42b983;
  text-decoration: underline;
  margin-left: 0.3rem;
  transition: color 0.2s;
}
.create-account-link:hover {
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

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.login-label {
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
.remember-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.login-btn {
  margin-top: 0.5rem;
  width: 100%;
}
.lost-password-link {
  margin-top: 1.5rem;
  color: #888;
  font-size: 0.98rem;
  text-decoration: underline;
  display: flex;
  justify-content: center;
  width: 100%;
  transition: color 0.2s;
}
.lost-password-link:hover {
  color: #f8143e;
}
.error-message {
  margin-top: 1rem;
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
}
</style>