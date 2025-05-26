<template>
  <nav class="nav-bar">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        <img src="/src/assets/logo_icon.png" alt="QRBook Logo" class="logo-img" />
        <div class="brand-block">
          <span class="brand-title">QRBook</span>
          <span class="brand-tagline">Connect with Every Page</span>
        </div>
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
  background: linear-gradient(90deg, #73bfb8 0%, #3da5d9 100%);
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
.logo-img {
  height: 48px;
  width: auto;
  margin-right: 1.2rem;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}
.brand-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.brand-title {
  font-size: 2rem;
  font-weight: 700;
  color: #f8143e;
  letter-spacing: 1px;
  line-height: 1.1;
}
.brand-tagline {
  font-size: 1.05rem;
  color: #e0e0e0;
  margin-top: 0.1rem;
  font-weight: 400;
  letter-spacing: 0.2px;
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
  .brand-title {
    font-size: 1.3rem;
  }
  .brand-tagline {
    font-size: 0.95rem;
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
  .logo-img {
    height: 36px;
    margin-right: 0.7rem;
  }
  .brand-title {
    font-size: 1.1rem;
  }
  .brand-tagline {
    font-size: 0.85rem;
  }
}
</style>
