<template>
  <div>
    <NavBar />
    <div class="home-container">
      <h1>Welcome to the QR Code Check-In Prototype</h1>
      <p>
        This is a prototype application for QR Code book check in and check-out with AI  recommendations and API integration.
      </p>
      <router-link to="/qrcode">
        <button class="btn_primary">Go to QR Code</button>
      </router-link>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
export default {
  name: 'HomePage',
  components: { NavBar },
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
@media (max-width: 900px) {
  .nav-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }
  .nav-links {
    width: 100%;
    flex-wrap: wrap;
    gap: 0.7rem;
  }
}
@media (max-width: 600px) {
  .nav-bar {
    padding: 0.5rem 0.5rem;
  }
  .nav-container {
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  .nav-links {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .logo-placeholder {
    font-size: 1rem;
    padding: 0.3rem 0.7rem;
    margin-right: 0.5rem;
  }
  .brand-title {
    font-size: 1rem;
  }
}
</style>
