<script>
import axios from 'axios';

export default {
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

<template>
  <div>
    <h2>Register</h2>
    <form @submit.prevent="registerUser">
      <input v-model="username" placeholder="Username" />
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Register</button>
    </form>
    <p>{{ message }}</p>
  </div>
</template>
