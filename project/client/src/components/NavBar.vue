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
          <div class="login-container" 
               @mouseenter="showLoginDropdown = true" 
               @mouseleave="hideLoginDropdownWithDelay">
            <button class="nav-link login-btn" aria-haspopup="true" :aria-expanded="showLoginDropdown">
              Login
            </button>
            <div class="login-dropdown" 
                 :class="{ show: showLoginDropdown }" 
                 @mouseenter="clearLoginHideTimeout" 
                 @mouseleave="hideLoginDropdownWithDelay">
              <router-link to="/login" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon">👤</span>
                Individual
              </router-link>
              <router-link to="/inc/register" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon">🏢</span>
                Institution
              </router-link>
            </div>
          </div>
        </template>
          <!-- Links for logged in users -->
        <template v-else>
          <!-- Show different nav items based on user type -->
          <template v-if="currentCompany">
            <!-- INC/Company User Navigation -->
            <router-link to="/inc/dashboard" class="nav-link">Company Dashboard</router-link>
            <router-link to="/catalog" class="nav-link">Book Catalog</router-link>
          </template>
          <template v-else>
            <!-- Individual User Navigation -->
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
            <router-link to="/favorites" class="nav-link favorites-nav-link">
              <span class="favorites-nav-icon">❤️</span>
              My Favorites
            </router-link>
            <router-link to="/recommendations" class="nav-link ai-nav-link">
              <span class="ai-nav-icon">✨</span>
              Recommendations
            </router-link>
          </template>
          
          <div class="user-menu" 
               @mouseenter="showDropdown = true" 
               @mouseleave="hideDropdownWithDelay"
               role="button"
               aria-haspopup="true"
               :aria-expanded="showDropdown">
            <button class="user-menu-btn">
              <span class="user-initial">{{ getUserInitial() }}</span>
              <span class="user-name">{{ userName }}</span>
              <span v-if="currentCompany" class="company-badge" role="status">
                {{ currentCompany.name }}
              </span>
            </button>
            
            <div class="user-dropdown" 
                 :class="{ show: showDropdown }" 
                 @mouseenter="clearHideTimeout" 
                 @mouseleave="hideDropdownWithDelay"
                 role="menu">
              
              <!-- User Info Section -->
              <div class="dropdown-section">
                <div class="user-info">
                  <span class="user-email">{{ userEmail }}</span>
                </div>
              </div>

              <!-- Company Selection -->
              <template v-if="companyAffiliations.length > 0">
                <div class="dropdown-divider"></div>
                <div class="dropdown-section company-section">
                  <div class="section-title">Your Organizations</div>
                  <template v-for="affiliation in sortedAffiliations" :key="affiliation.company._id">
                    <div
                      class="company-item"
                      :class="{
                        'active': currentCompany?._id === affiliation.company._id,
                        'pending': affiliation.status === 'pending',
                        'disabled': !canSwitchCompany
                      }"
                      @click="switchCompany(affiliation)"
                      role="menuitem"
                      :tabindex="0"
                      :aria-disabled="affiliation.status === 'pending'"
                    >
                      <span class="company-name">{{ affiliation.company.name }}</span>
                      <div class="company-info">
                        <span class="company-role">{{ affiliation.role }}</span>
                        <span v-if="affiliation.status === 'pending'" class="status-badge pending">
                          Pending
                        </span>
                        <span v-else-if="currentCompany?._id === affiliation.company._id" class="status-badge active">
                          Current
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </template>
              
              <div class="dropdown-divider"></div>
              
              <router-link to="/settings" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon">⚙️</span> Settings
              </router-link>
              <a href="#" 
                 class="dropdown-item logout-item" 
                 @click.prevent="logout"
                 role="menuitem">
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
import api from '../api';

export default {
  name: 'NavBar',
  data() {
    return {
      isLoggedIn: false,
      userName: '',
      userEmail: '',
      showDropdown: false,
      hideTimeout: null,
      currentCompany: null,
      companyAffiliations: [],
      dropdownTransitioning: false,
      showLoginDropdown: false,
      loginHideTimeout: null,
    };
  },
  computed: {
    sortedAffiliations() {
      // Sort affiliations by status (approved first) and then by company name
      return [...this.companyAffiliations].sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (a.status !== 'approved' && b.status === 'approved') return 1;
        return a.company.name.localeCompare(b.company.name);
      });
    },
    canSwitchCompany() {
      return !this.dropdownTransitioning;
    }
  },
  methods: {
    hideDropdownWithDelay() {
      // Only hide if not transitioning
      if (!this.dropdownTransitioning) {
        this.hideTimeout = setTimeout(() => {
          this.showDropdown = false;
        }, 200);
      }
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
    async switchCompany(affiliation) {
      if (!this.canSwitchCompany || affiliation.status !== 'approved') {
        return;
      }

      this.dropdownTransitioning = true;
      try {
        // Call API to switch default company
        await api.post('/api/users/switch-company', {
          companyId: affiliation.company._id
        });
        
        // Update current company
        this.currentCompany = affiliation.company;
        localStorage.setItem('currentCompany', JSON.stringify(this.currentCompany));
        
        // Emit company change event
        window.dispatchEvent(new CustomEvent('company:switch', {
          detail: { company: this.currentCompany }
        }));

        // Hide dropdown after successful switch
        this.showDropdown = false;
        
        // Refresh the page to update all components
        window.location.reload();
      } catch (error) {
        console.error('Error switching company:', error);
        alert('Failed to switch company. Please try again.');
      } finally {
        this.dropdownTransitioning = false;
      }
    },
    async logout() {
      // Remove authentication token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('currentCompany');
      
      // Update logged in status
      this.isLoggedIn = false;
      this.userName = '';
      this.currentCompany = null;
      this.companyAffiliations = [];
      
      // Dispatch logout event
      window.dispatchEvent(new Event('auth:logout'));
      
      // Redirect to home page
      this.$router.push('/');
    },
    async checkLoginStatus() {
      // Check for token in localStorage
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      
      if (this.isLoggedIn) {
        // Get email from localStorage
        this.userEmail = localStorage.getItem('userEmail') || '';
        this.userName = this.userEmail.split('@')[0];
        
        // Check for company information
        const savedCompany = localStorage.getItem('currentCompany');
        if (savedCompany) {
          try {
            this.currentCompany = JSON.parse(savedCompany);
          } catch (error) {
            console.error('Error parsing saved company:', error);
            localStorage.removeItem('currentCompany');
          }
        }
        
        try {
          // Optionally get additional user data including company affiliations
          const response = await api.get('/api/users/me');
          const userData = response.data;
          
          this.userEmail = userData.email;
          this.userName = userData.name || userData.email.split('@')[0];
          
          // Set company affiliations if available
          this.companyAffiliations = userData.companyAffiliations || [];
          
          // If no current company but user has affiliations, set default
          if (!this.currentCompany && this.companyAffiliations.length > 0) {
            const defaultAffiliation = this.companyAffiliations.find(a => a.status === 'approved') || 
                                     this.companyAffiliations[0];
            this.currentCompany = defaultAffiliation.company;
            localStorage.setItem('currentCompany', JSON.stringify(this.currentCompany));
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          // Fallback to basic info from localStorage
          const email = localStorage.getItem('userEmail');
          if (email) {
            this.userEmail = email;
            this.userName = email.split('@')[0];
          }
        }
      } else {
        // Reset user data
        this.userEmail = '';
        this.userName = '';
        this.currentCompany = null;
        this.companyAffiliations = [];
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

.login-container {
  position: relative;
}

.login-btn {
  background-color: #fec601;
  color: #2364AA;
  padding: 0.4rem 1.2rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.1rem;
  font-size: 1rem;
}

.login-btn:hover {
  background-color: #ffd74d;
}

.login-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
}

.login-dropdown.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.login-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2c3e50;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.login-dropdown .dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.login-dropdown .dropdown-item:last-child {
  border-radius: 0 0 8px 8px;
}

.login-dropdown .dropdown-item:hover {
  background: #f5f7f9;
}

.login-dropdown .dropdown-item .dropdown-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .login-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 12px 12px 0 0;
  }
  
  .login-dropdown .dropdown-item:first-child {
    border-radius: 12px 12px 0 0;
  }
  
  .login-dropdown .dropdown-item:last-child {
    border-radius: 0;
  }
}

.user-menu {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.user-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-initial {
  width: 32px;
  height: 32px;
  background: #fec601;
  color: #2364AA;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-name {
  font-size: 0.9rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(5px);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  min-width: 260px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
}

.user-dropdown.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.user-dropdown .dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2c3e50;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 0 0.5rem;
}

.user-dropdown .dropdown-item:hover {
  background: #f5f7f9;
  color: #2364AA;
}

.user-dropdown .dropdown-item .dropdown-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.dropdown-section {
  padding: 0.75rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.user-email {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
}

.section-title {
  color: #666;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.company-section {
  max-height: 300px;
  overflow-y: auto;
}

.company-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.company-item:not(.disabled):hover {
  background: #f5f7f9;
}

.company-item.active {
  background: #e8f3ff;
}

.company-item.pending {
  opacity: 0.7;
  cursor: not-allowed;
}

.company-item.disabled {
  opacity: 0.5;
  cursor: wait;
}

.company-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}         

.company-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.company-role {
  color: #6a5a5a;
}

.status-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.dropdown-divider {
  height: 1px;
  background: #edf2f7;
  margin: 0;
}

.dropdown-icon {
  font-size: 1.1rem;
  opacity: 0.8;
}

.logout-item {
  color: #e53e3e;
}

.logout-item:hover {
  background: #fff5f5;
}

/* Make dropdown accessible via keyboard */
.company-item:focus,
.dropdown-item:focus {
  outline: 2px solid #3182ce;
  outline-offset: -2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .user-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 12px 12px 0 0;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .company-section {
    max-height: 40vh;
  }
}
</style>
