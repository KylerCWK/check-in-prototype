<template>
  <form @submit.prevent="register">
    <input type="email" v-model="email" placeholder="Email" required />
    <input type="password" v-model="password" placeholder="Password" required />
    <button type="submit">Register</button>
    <p>{{ message }}</p>
  </form>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      email: '',
      password: '',
      message: ''
    };
  },
  methods: {
    async register() {
      try {
        const response = await axios.post('http://localhost:3000/register', {
          email: this.email,
          password: this.password
        });
        this.message = response.data.message;
      } catch (err) {
        this.message = err.response?.data?.message || 'Registration failed';
      }
    }
  }
};
</script>
