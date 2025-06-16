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
          <div class="section-header">
            <h2>Recommended Books</h2>
            <div class="section-actions">
              <button @click="refreshRecommendations" class="refresh-btn" :disabled="loadingRecommendations" title="Get new recommendation">
                <span v-if="loadingRecommendations">🔄</span>
                <span v-else>↻</span>
              </button>
              <button @click="viewAllRecommendations" class="view-all-btn">View All</button>
            </div>
          </div>
          
          <div v-if="loadingRecommendations" class="loading-state">
            <div class="loading-spinner">�</div>
            <p>Finding perfect books for you...</p>
          </div>
          
          <div v-else-if="displayedRecommendedBooks.length > 0" class="books-grid">
            <div 
              v-for="book in displayedRecommendedBooks" 
              :key="book._id" 
              class="book-card"
              @click="showBookDetails(book)"
            >
              <div class="book-cover">
                <img 
                  :src="book.coverUrl || '/default-cover.png'" 
                  :alt="book.title"
                  @error="handleImageError"
                />
              </div>
              <div class="book-info">
                <h4>{{ book.title }}</h4>
                <p class="book-author">{{ book.author }}</p>
                <div v-if="book.genres && book.genres.length" class="book-genres">
                  <span class="genre-tag">{{ book.genres[0] }}</span>
                </div>
                <div class="book-ai-summary">
                  <p>{{ getAiSummary(book) }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">🔮</div>
            <p>Getting recommendations ready...</p>
            <p class="empty-hint">
              <button @click="loadRecommendations" class="load-btn">Load Recommendations</button>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Book Details Modal -->
    <div v-if="selectedBook" class="modal-overlay" @click.self="closeBookDetails">
      <div class="modal-content">
        <div class="modal-close" @click="closeBookDetails">&times;</div>
        
        <div class="book-details">
          <div class="book-details-header">
            <div class="book-cover-large">
              <img 
                :src="selectedBook.coverUrl || '/default-cover.png'" 
                :alt="selectedBook.title"
                @error="handleImageError"
              />
            </div>
            
            <div class="book-details-info">
              <h2>{{ selectedBook.title }}</h2>
              <h3>by {{ selectedBook.author }}</h3>
              
              <div v-if="selectedBook.genres && selectedBook.genres.length" class="book-genres">
                <span v-for="(genre, index) in selectedBook.genres" :key="index" class="genre-tag">
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="book-description" v-if="getMainDescription(selectedBook)">
            <h4>Description</h4>
            <p>{{ getMainDescription(selectedBook) }}</p>
          </div>
          
          <div class="book-ai-insights">
            <h4>AI Insights</h4>
            <p>{{ getAiSummary(selectedBook) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import { getRecommendations, trackRecommendationClick, trackRecommendationRefresh } from '../api';

export default {
  name: 'UserDashboard',
  components: { NavBar },
  data() {
    return {
      userName: 'User',
      recommendedBooks: [],
      allRecommendations: [], // Store all fetched recommendations
      loadingRecommendations: false,
      selectedBook: null
    };
  },
  computed: {
    displayedRecommendedBooks() {
      if (this.allRecommendations.length === 0) return [];
      // Just return the first book from the fresh recommendations
      return this.allRecommendations.slice(0, 1);
    }
  },
  methods: {
    notImplemented() {
      alert('This feature is coming soon!');
    },

    logout() {
      // Clear token from local storage
      localStorage.removeItem('token');
      // Redirect to login
      this.$router.push('/login');
    },

    async loadRecommendations(refresh = false) {
      this.loadingRecommendations = true;
      console.log('🔄 loadRecommendations called with refresh:', refresh);
      try {
        const response = await getRecommendations(12, refresh); // Get 12 books, with refresh option
        console.log('📦 Received recommendations:', response.data?.length || 0, 'books');
        this.allRecommendations = response.data || [];
        this.recommendedBooks = this.allRecommendations; // Keep for compatibility
      } catch (error) {
        console.error('Error loading recommendations:', error);
        this.allRecommendations = [];
        this.recommendedBooks = [];
      } finally {
        this.loadingRecommendations = false;
      }
    },

    async refreshRecommendations() {
      // Track recommendation refresh
      try {
        await trackRecommendationRefresh({
          timestamp: new Date().toISOString(),
          currentRecommendationCount: this.allRecommendations.length
        });
        console.log('Tracked recommendation refresh');
      } catch (error) {
        console.error('Error tracking recommendation refresh:', error);
      }
      
      // Always fetch fresh recommendations when refresh is clicked
      await this.loadRecommendations(true); // Force refresh from server every time
    },

    async viewAllRecommendations() {
      // Track view all recommendations
      try {
        await trackRecommendationClick(null, {
          action: 'view_all_recommendations',
          source: 'dashboard',
          timestamp: new Date().toISOString()
        });
        console.log('Tracked view all recommendations');
      } catch (error) {
        console.error('Error tracking view all recommendations:', error);
      }
      
      this.$router.push('/recommendations');
    },

    async showBookDetails(book) {
      this.selectedBook = book;
      
      // Track recommendation click
      try {
        await trackRecommendationClick(book._id, {
          bookTitle: book.title,
          bookAuthor: book.author,
          timestamp: new Date().toISOString(),
          position: this.displayedRecommendedBooks.findIndex(b => b._id === book._id)
        });
        console.log('Tracked recommendation click for:', book.title);
      } catch (error) {
        console.error('Error tracking recommendation click:', error);
      }
    },

    closeBookDetails() {
      this.selectedBook = null;
    },

    handleImageError(e) {
      e.target.src = '/default-cover.png';
    },

    // Helper functions for displaying book descriptions and AI insights
    getMainDescription(book) {
      const fullDescription = book.displayDescription?.text || book.aiAnalysis?.enhancedDescription || book.description;
      
      if (!fullDescription) {
        return 'No description available.';
      }
      
      // If the description contains AI insights, split it and return only the main part
      if (fullDescription.includes('AI Insights')) {
        const mainPart = fullDescription.split('AI Insights')[0].trim();
        return mainPart || 'No description available.';
      }
      
      return fullDescription;
    },

    getAiSummary(book) {
      // Check if we have enhanced description with AI insights
      if (book.aiAnalysis?.enhancedDescription) {
        const enhancedDesc = book.aiAnalysis.enhancedDescription;
        
        // Extract AI insights section if it exists
        if (enhancedDesc.includes('AI Insights')) {
          const parts = enhancedDesc.split('AI Insights');
          if (parts.length > 1) {
            // Get the AI insights part and clean it up
            let aiInsights = parts[1].trim();
            // Remove any leading newlines or formatting
            aiInsights = aiInsights.replace(/^\n+/, '').trim();
            
            // If the AI insights are long, truncate to first few sentences for dashboard
            const sentences = aiInsights.split(/[.!?]+/).filter(s => s.trim().length > 10);
            if (sentences.length > 1) {
              return sentences.slice(0, 1).join('. ') + '.';
            }
            
            // Return the AI insights if they exist and are meaningful
            if (aiInsights.length > 50) {
              return aiInsights.length > 120 ? aiInsights.substring(0, 120) + '...' : aiInsights;
            }
          }
        }
      }
      
      // Fallback to genre-specific insights
      if (book.genres?.includes('Fantasy')) {
        return `A magical tale perfect for escapist fiction lovers.`;
      } else if (book.genres?.includes('Mystery')) {
        return `A suspenseful mystery that keeps you guessing.`;
      } else if (book.genres?.includes('Romance')) {
        return `An emotional journey exploring love and relationships.`;
      } else if (book.genres?.includes('Science Fiction')) {
        return `Thought-provoking exploration of future possibilities.`;
      }
      
      // Final fallback
      return `Engaging content that resonates with quality literature lovers.`;
    }
  },
  async mounted() {
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

    // Load recommendations automatically
    await this.loadRecommendations();
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

/* New styles for recommendations section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #2364AA;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn, .view-all-btn, .load-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.refresh-btn {
  background: #f0f8ff;
  color: #2364AA;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #e0f2ff;
  transform: rotate(180deg);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.view-all-btn, .load-btn {
  background: #2364AA;
  color: white;
}

.view-all-btn:hover, .load-btn:hover {
  background: #1a4d82;
}

.loading-state {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  font-size: 2rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.books-grid {
  display: flex;
  justify-content: center;
  width: 100%;
}

.book-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 400px;
  width: 100%;
  display: flex;
  gap: 1rem;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.book-cover {
  width: 80px;
  height: 120px;
  flex-shrink: 0;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.book-info h4 {
  margin: 0 0 0.5rem;
  color: #2c3e50;
  font-size: 1.1rem;
  line-height: 1.3;
}

.book-author {
  margin: 0 0 0.5rem;
  color: #666;
  font-size: 0.95rem;
}

.book-genres {
  margin: 0.5rem 0;
}

.genre-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.book-ai-summary {
  margin-top: 0.5rem;
}

.book-ai-summary p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.4;
  font-style: italic;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f5f5f5;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 1001;
}

.modal-close:hover {
  background: #e0e0e0;
}

.book-details {
  padding: 2rem;
}

.book-details-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.book-cover-large {
  width: 200px;
  height: 300px;
  flex-shrink: 0;
}

.book-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.book-details-info h2 {
  margin: 0 0 0.5rem;
  color: #2c3e50;
}

.book-details-info h3 {
  margin: 0 0 1rem;
  color: #666;
  font-weight: normal;
}

.book-description, .book-ai-insights {
  margin-bottom: 2rem;
}

.book-description h4, .book-ai-insights h4 {
  margin: 0 0 1rem;
  color: #2364AA;
}

.book-description p, .book-ai-insights p {
  line-height: 1.6;
  color: #444;
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

  .books-grid {
    justify-content: stretch;
  }

  .book-card {
    flex-direction: column;
    text-align: center;
    max-width: none;
  }

  .book-cover {
    align-self: center;
  }

  .book-details-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .book-cover-large {
    width: 150px;
    height: 225px;
  }

  .modal-content {
    margin: 1rem;
    max-height: 95vh;
  }

  .book-details {
    padding: 1.5rem;
  }
}
</style>
