<template>
  <nav class="nav-bar">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        <div class="logo-placeholder">LOGO</div>
        <span class="brand-title">QR Code Check-In</span>
      </router-link>
      <div class="nav-links">
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link to="/pricing" class="nav-link">Pricing</router-link>
        <router-link to="/api" class="nav-link">API</router-link>
        <router-link to="/register" class="nav-link">Sign Up</router-link>
        <router-link to="/login" class="nav-link">Login</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar',
};
</script>

<style scoped>
.nav-bar {
  background: linear-gradient(90deg, #73bfb8 0%, #239562 100%);
  padding: 0.5rem 2rem;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.nav-container {
  width: 100%;
  max-width: 1400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}
.logo-placeholder {
  background: #fff;
  color: #42b983;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  margin-right: 1rem;
  font-size: 1.2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.brand-title {
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.nav-links {
  display: flex;
  gap: 1.2rem;
}
.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  transition: background 0.2s, color 0.2s;
}
.nav-link:hover {
  background: rgba(255,255,255,0.13);
  color: #fec601;
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
