<template>
  <div class="dashboard-container">
    <NavBar />
    <div class="dashboard-content">
      <div class="dashboard-header">
        <h1>Welcome to Your Dashboard</h1>
        <p class="welcome-text">Hello, {{ userName }}! Manage your books, scans, and preferences here.</p>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-number">0</div>
          <div class="stat-label">Books Checked In</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔄</div>
          <div class="stat-number">0</div>
          <div class="stat-label">Recent Scans</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-number">0</div>
          <div class="stat-label">Total Activity</div>
        </div>
      </div>

      <div class="dashboard-actions">
        <div class="action-section">
          <h2>Quick Actions</h2>
          <div class="action-buttons">
            <router-link to="/qrcode" class="action-button">
              <span class="action-icon">📷</span>
              <span class="action-text">Scan QR Code</span>
            </router-link>
            <router-link to="/favorites" class="action-button">
              <span class="action-icon">❤️</span>
              <span class="action-text">My Favorites</span>
            </router-link>
            <button class="action-button" @click="notImplemented">
              <span class="action-icon">📕</span>
              <span class="action-text">View My Books</span>
            </button>
            <router-link to="/catalog" class="action-button">
              <span class="action-icon">🔍</span>
              <span class="action-text">Search Catalog</span>
            </router-link>
            <button class="action-button" @click="notImplemented">
              <span class="action-icon">⚙️</span>
              <span class="action-text">Account Settings</span>
            </button>
          </div>
        </div>
      </div>

      <div class="dashboard-sections">
        <div class="section recent-activity">
          <h2>Recent Activity</h2>
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No recent activity to display</p>
            <p class="empty-hint">Your recent book check-ins and check-outs will appear here</p>
          </div>
        </div>

        <div class="section recommendations">
          <h2>Recommended Books</h2>
          <div class="empty-state">
            <div class="empty-icon">🔮</div>
            <p>Personalized recommendations coming soon!</p>
            <p class="empty-hint">Check back after you've checked in some books</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';

export default {
  name: 'UserDashboard',
  components: { NavBar },
  data() {
    return {
      userName: 'User',
    };
  },
  methods: {
    notImplemented() {
      alert('This feature is coming soon!');
    },

    // selectCatalog() {
    //     this.$router.push('/catalog');
    // },

    logout() {
      // Clear token from local storage
      localStorage.removeItem('token');
      // Redirect to login
      this.$router.push('/login');
    }
  },
  mounted() {
    // Here you would normally fetch user data from the backend
    // using the stored token
    const token = localStorage.getItem('token');
    if (!token) {
      this.$router.push('/login');
    }

    // For now just get email from local storage as example
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      this.userName = userEmail.split('@')[0]; // For now use the part before @ as the name
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f8f9fa;
  color: #2c3e50;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 2.2rem;
  color: #2364AA;
  margin-bottom: 0.5rem;
}

.welcome-text {
  font-size: 1.1rem;
  color: #666;
}

.dashboard-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2364AA;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.95rem;
}

.dashboard-actions {
  margin-bottom: 2rem;
}

.action-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: none;
  border-radius: 10px;
  padding: 1.5rem;
  min-width: 150px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  text-decoration: none;
  color: inherit;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.action-text {
  font-weight: 600;
  font-size: 1rem;
  color: #2364AA;
}

.dashboard-sections {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.section {
  flex: 1;
  min-width: 300px;
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.empty-state p {
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.9rem;
  color: #999;
}

@media (max-width: 768px) {

  .dashboard-stats,
  .dashboard-sections {
    flex-direction: column;
  }

  .section,
  .stat-card {
    min-width: 100%;
  }

  .action-buttons {
    justify-content: center;
  }

  .dashboard-content {
    padding: 1rem;
  }
}
</style>
