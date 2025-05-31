<template>
  <nav class="nav-bar">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        <img src="../assets/logo_icon2.png" alt="QRBook Logo" class="logo-img" />
        <div class="brand-block">
          <span class="brand-title">QRBook</span>
          <span class="brand-tagline">Connect with Every Page</span>
        </div>
      </router-link>
      <div class="nav-links">
        <!-- Common link for everyone -->
        <router-link to="/catalog" class="nav-link">Catalog</router-link>
        
        <!-- Links for logged out users -->
        <template v-if="!isLoggedIn">
          <router-link to="/about" class="nav-link">About</router-link>
          <router-link to="/pricing" class="nav-link">Pricing</router-link>
          <router-link to="/api" class="nav-link">API</router-link>
          <router-link to="/register" class="nav-link sign-up">Sign Up</router-link>
          <div class="login-container">
            <router-link to="/login" class="nav-link login-btn">Login</router-link>
            <!-- Coming soon: Institution login option -->
            <div class="login-dropdown">
              <router-link to="/login" class="dropdown-item">Individual</router-link>
              <router-link to="/login?type=institution" class="dropdown-item institution-login">
                Institution <span class="coming-soon">Soon</span>
              </router-link>
            </div>
          </div>
        </template>
        
        <!-- Links for logged in users -->
        <template v-else>          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/profile" class="nav-link">My Profile</router-link>
          <router-link to="/qrcode" class="nav-link">Scan QR</router-link>
          <router-link to="/favorites" class="nav-link favorites-nav-link">
            <span class="favorites-nav-icon">❤️</span>
            My Favorites
          </router-link>
          <router-link to="/recommendations" class="nav-link ai-nav-link">
            <span class="ai-nav-icon">✨</span>
            Recommendations
          </router-link>
          <div class="user-menu" @mouseenter="showDropdown = true" @mouseleave="hideDropdownWithDelay">
            <button class="user-menu-btn">
              <span class="user-initial">{{ getUserInitial() }}</span>
              <span class="user-name">{{ userName }}</span>
            </button>
            <div class="user-dropdown" :class="{ show: showDropdown }" @mouseenter="clearHideTimeout" @mouseleave="hideDropdownWithDelay">
              <router-link to="/settings" class="dropdown-item">
                <span class="dropdown-icon">⚙️</span> Settings
              </router-link>
              <a href="#" class="dropdown-item logout-item" @click.prevent="logout">
                <span class="dropdown-icon">⎋</span> Sign Out
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      isLoggedIn: false,
      userName: '',
      showDropdown: false,
      hideTimeout: null
    };
  },
  methods: {
    hideDropdownWithDelay() {
      this.hideTimeout = setTimeout(() => {
        this.showDropdown = false;
      }, 200); // 200ms delay
    },
    clearHideTimeout() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    },
    getUserInitial() {
      return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
    },
    logout() {
      // Remove authentication token
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      
      // Update logged in status
      this.isLoggedIn = false;
      this.userName = '';
      
      // Dispatch logout event
      window.dispatchEvent(new Event('auth:logout'));
      
      // Redirect to home page
      this.$router.push('/');
    },
    checkLoginStatus() {
      // Check for token in localStorage
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      
      if (this.isLoggedIn) {
        const email = localStorage.getItem('userEmail');
        if (email) {
          // Extract name from email for now (can be improved later)
          this.userName = email.split('@')[0];
        }
      }
    }
  },
  created() {
    // Check login status when component is created
    this.checkLoginStatus();
    
    // Listen for custom login/logout events
    window.addEventListener('auth:login', this.checkLoginStatus);
    window.addEventListener('auth:logout', this.checkLoginStatus);
  },
  
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('auth:login', this.checkLoginStatus);
    window.removeEventListener('auth:logout', this.checkLoginStatus);
  },
  
  mounted() {
    // Check login status when component mounts
    this.checkLoginStatus();
    
    // Listen for route changes to update login status
    this.$router.afterEach(() => {
      this.checkLoginStatus();
    });
  }
};
</script>

<style scoped>
.nav-bar {
  background: linear-gradient(90deg, #2364AA 0%, #3da5d9 100%);
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
  color: #fec601;
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

.login-btn {
  background-color: #fec601;
  color: #2364AA;
  padding: 0.4rem 1.2rem;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.1rem;
}

.login-btn:hover {
  background-color: #ffd74d;
  color: #2364AA;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.sign-up {
  border: 2px solid #fec601;
  color: #fec601;
  padding: 0.4rem 1rem;
  border-radius: 6px;
}

.sign-up:hover {
  background-color: rgba(254, 198, 1, 0.15);
}

.logout-btn {
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.4rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.logout-btn::before {
  content: "⎋";
  font-size: 1.1em;
}

.login-container {
  position: relative;
}

.login-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  width: 140px;
  display: none;
  z-index: 100;
  margin-top: 5px;
}

.login-container:hover .login-dropdown {
  display: block;
}

.dropdown-item {
  display: block;
  padding: 10px 15px;
  text-decoration: none;
  color: #333;
  font-size: 0.95rem;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #2364AA;
}

.institution-login {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coming-soon {
  font-size: 0.7rem;
  background-color: #3da5d9;
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
}

.user-menu {
  position: relative;
}

.user-menu-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 22px;
  height: 36px;
  padding: 0 16px 0 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.user-menu-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-initial {
  width: 28px;
  height: 28px;
  background: #fec601;
  color: #2364AA;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-left: 8px;
  margin-right: 12px;
}

.user-name {
  font-size: 0.9rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
  min-width: 180px;
  display: none;
  z-index: 100;
  margin-top: 4px;
  overflow: hidden;
}

.user-dropdown.show {
  display: block;
}

.logout-item {
  border-top: 1px solid #eee;
  color: #e74c3c;
}

.logout-item:hover {
  background-color: #fff0f0;
  color: #c0392b;
}

.dropdown-icon {
  margin-right: 10px;
  font-size: 1.1em;
}

.ai-nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.15));
  border-radius: 6px;
}

.ai-nav-icon {
  font-size: 1.05em;
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
