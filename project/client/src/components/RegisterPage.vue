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
        <div class="oauth-placeholder">[OAuth buttons placeholder]</div>
        <form class="signup-form" @submit.prevent="handleRegister">
          <label for="email" class="signup-label">Email Address</label>
          <input id="email" type="email" class="input-field" v-model="email" required />

          <label for="password" class="signup-label">Password</label>
          <input id="password" type="password" class="input-field" v-model="password" required />

          <label for="confirmPassword" class="signup-label">Confirm Password</label>
          <input id="confirmPassword" type="password" class="input-field" v-model="confirmPassword" required />

          <div class="terms-row">
            <input id="terms" type="checkbox" v-model="acceptedTerms" required />
            <label for="terms">I accept the <a href="#" target="_blank">terms and conditions</a></label>
          </div>

          <button class="btn_primary signup-btn" type="submit">Register</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import axios from 'axios';

export default {
  components: { NavBar },
  data() {
    return {
      username: '',
      email: '',
      password: '',
      message: ''
    };
  },
  methods: {
    async registerUser() {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          username: this.username,
          email: this.email,
          password: this.password
        });

        this.message = response.data.message;
        console.log('Signup success:', response.data);
      } catch (error) {
        console.error('Signup error:', error.response.data);
        this.message = error.response.data.error || 'Signup failed';
      }
    }
  }
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
  min-width: 520px;
  max-width: 620px;
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
  padding: 0.7rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: #f8f9fa;
  margin-bottom: 0.2rem;
}
.input-field:focus {
  border-color: #42b983;
  outline: none;
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
</style>
