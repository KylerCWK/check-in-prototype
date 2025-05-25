<template>
  <div class="home-container">
    <h1>Welcome to the QR Code Check-In Prototype</h1>
    <p>
      This platform streamlines clock-in/clock-out processes using QR code scanning, with features like biometric verification, real-time analytics, offline support, customizable reports, and API integrations.
    </p>
    <router-link to ="/login">
      <button class="btn_primary">Go to Login</button>
    </router-link>
    <router-link to="/signup">
      <button class="btn_primary">Go to Sign Up</button>
    </router-link>
    <router-link to="/qrcode">
      <button class="btn_primary">Go to QR Code Generator</button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8f9fa;
  padding: 3rem; 
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  max-width: 1800px;
  margin: auto;
}
h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 1rem;
}
p {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  text-align: center;
}
.btn_primary {
  background: #fec601;
  color: #1c1a1a;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn_primary:hover {
  background: #dbab00;
}
</style>
