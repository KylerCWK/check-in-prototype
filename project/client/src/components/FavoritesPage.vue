<template>
  <div class="favorites-page">
    <nav-bar />
    <div class="favorites-container">
      <h1>My Favorites</h1>

      <div class="section-header">
        <h2>
          <span class="heart-icon">❤️</span> 
          Your Favorites
          <small class="subtitle">{{ favorites.length }} saved books</small>
        </h2>
        <div class="section-actions">
          <div class="view-options">
            <button 
              :class="['view-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
              title="Grid view"
            >
              <i class="grid-icon">▦</i>
            </button>
            <button 
              :class="['view-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
              title="List view"
            >
              <i class="list-icon">≡</i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">Loading your favorites...</div>
      </div>

      <div v-else-if="favorites.length" :class="['favorites-list', viewMode]">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="books-grid">
          <div v-for="book in favorites" :key="book._id" class="book-card">
            <div class="book-cover-container">
              <img 
                :src="book.coverUrl || '/default-cover.png'" 
                :alt="book.title"
                class="book-cover"
                @error="handleImageError"
              />
              <div class="book-actions">
                <button class="info-btn" title="View details">ℹ️</button>
                <button class="remove-btn" @click="removeFromFavorites(book._id)" title="Remove from favorites">❌</button>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="author">{{ book.author }}</p>
              
              <div class="genres" v-if="book.genres && book.genres.length">
                <span v-for="(genre, index) in book.genres.slice(0, 2)" 
                      :key="genre" 
                      :class="['genre-tag', `genre-color-${index % 5}`]">
                  {{ genre }}
                </span>
              </div>
              
              <div class="stats" v-if="book.stats">
                <span v-if="book.stats.rating"><i class="icon">⭐</i> {{ book.stats.rating || 'N/A' }}</span>
                <span v-if="book.stats.viewCount"><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- List View -->
        <div v-else class="books-list">
          <div v-for="book in favorites" :key="book._id" class="book-list-item">
            <div class="list-cover">
              <img 
                :src="book.coverUrl || '/default-cover.png'" 
                :alt="book.title"
                @error="handleImageError"
              />
            </div>
            <div class="list-content">
              <div class="list-header">
                <h3 class="book-title">{{ book.title }}</h3>
                <div class="list-actions">
                  <button class="list-action-btn" title="View details">ℹ️</button>
                  <button class="list-action-btn remove-action" @click="removeFromFavorites(book._id)" title="Remove from favorites">❌</button>
                </div>
              </div>
              <p class="author">{{ book.author }}</p>
              
              <p class="description" v-if="book.description">{{ truncate(book.description, 150) }}</p>
              
              <div class="list-footer">
                <div class="genres" v-if="book.genres && book.genres.length">
                  <span v-for="(genre, index) in book.genres.slice(0, 3)" 
                        :key="genre" 
                        :class="['genre-tag', `genre-color-${index % 5}`]">
                    {{ genre }}
                  </span>
                </div>
                
                <div class="stats" v-if="book.stats">
                  <span v-if="book.stats.rating"><i class="icon">⭐</i> {{ book.stats.rating || 'N/A' }}</span>
                  <span v-if="book.stats.viewCount"><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="no-favorites">
        <div class="no-favorites-icon">❤️</div>
        <h3>Your favorites list is empty</h3>
        <p>Books you save will appear here</p>
        <router-link to="/catalog" class="browse-books-btn">Browse Books</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import { ref, onMounted, watch } from 'vue';
import { getFavorites, removeFromFavorites as apiRemoveFromFavorites } from '../api';

export default {
  name: 'FavoritesPage',
  components: { NavBar },
  setup() {
    const favorites = ref([]);
    const viewMode = ref('grid');
    const loading = ref(false);

    const loadFavorites = async () => {
      try {
        loading.value = true;
        const response = await getFavorites();
        favorites.value = response.data || [];
      } catch (error) {
        console.error('Error fetching favorites:', error);
        favorites.value = [];
      } finally {
        loading.value = false;
      }
    };

    const removeFromFavorites = async (bookId) => {
      if (confirm('Are you sure you want to remove this book from your favorites?')) {
        try {
          await apiRemoveFromFavorites(bookId);
          favorites.value = favorites.value.filter(book => book._id !== bookId);
        } catch (error) {
          console.error('Error removing from favorites:', error);
          alert('Error removing book from favorites. Please try again.');
        }
      }
    };

    const truncate = (text, maxLength) => {
      if (!text) return '';
      return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
    };
    
    const handleImageError = (event) => {
      event.target.src = '/default-cover.png';
    };

    onMounted(async () => {
      await loadFavorites();
      
      // Load user's preferred view mode from localStorage
      const savedViewMode = localStorage.getItem('bookViewMode');
      if (savedViewMode === 'grid' || savedViewMode === 'list') {
        viewMode.value = savedViewMode;
      }
      
      // Save view preference to localStorage if user changes it
      watch(viewMode, (newValue) => {
        localStorage.setItem('bookViewMode', newValue);
      });
    });

    return {
      favorites,
      viewMode,
      loading,
      truncate,
      removeFromFavorites,
      handleImageError
    };
  }
};
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.favorites-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.favorites-container h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 20px;
}

.section-header {
  margin: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h2 {
  font-size: 22px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.heart-icon {
  font-size: 20px;
  color: #ff5252;
}

.subtitle {
  font-size: 14px;
  color: #777;
  font-weight: normal;
  margin-left: 10px;
}

.section-actions {
  display: flex;
  align-items: center;
}

.view-options {
  display: flex;
  gap: 5px;
}

.view-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: all 0.2s;
}

.view-btn:hover, .view-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.grid-icon, .list-icon {
  font-style: normal;
  font-size: 18px;
}

/* Grid View Styling */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.book-card {
  border-radius: 10px;
  overflow: hidden;
  background: white;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.book-cover-container {
  position: relative;
  height: 280px;
  overflow: hidden;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.book-card:hover .book-cover {
  transform: scale(1.05);
}

.book-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.info-btn, .remove-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn:hover, .remove-btn:hover {
  transform: scale(1.1);
}

.remove-btn:hover {
  background: rgba(255, 200, 200, 0.9);
}

.book-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.book-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}

.author {
  color: #666;
  margin: 8px 0;
  font-style: italic;
}

/* List View Styling */
.books-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.book-list-item {
  display: flex;
  border-radius: 10px;
  background: white;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.book-list-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.list-cover {
  flex: 0 0 120px;
  height: 180px;
  overflow: hidden;
}

.list-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-content {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.list-actions {
  display: flex;
  gap: 10px;
}

.list-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
  transition: all 0.2s;
}

.list-action-btn:hover {
  opacity: 1;
  transform: scale(1.2);
}

.remove-action:hover {
  color: #ff5252;
}

.description {
  color: #666;
  font-size: 0.9em;
  margin: 10px 0;
  flex: 1;
}

.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

/* No Favorites State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  font-size: 18px;
  color: #007bff;
  animation: pulse 1.5s infinite alternate;
}

.no-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin: 40px auto;
  max-width: 400px;
}

.no-favorites-icon {
  font-size: 50px;
  margin-bottom: 20px;
  opacity: 0.5;
  animation: pulse 1.5s infinite alternate;
}

.no-favorites h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.no-favorites p {
  margin-bottom: 25px;
}

.browse-books-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.browse-books-btn:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
}

/* Common Elements */
.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}

.genre-tag {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.genre-color-0 { background-color: #2364AA; }
.genre-color-1 { background-color: #3da5d9; }
.genre-color-2 { background-color: #fec601; color: #333; }
.genre-color-3 { background-color: #73bfb8; }
.genre-color-4 { background-color: #ea7317; }

.stats {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 0.9em;
  margin-top: 10px;
}

.stats span {
  display: flex;
  align-items: center;
}

.stats .icon {
  margin-right: 5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }

  .book-cover-container {
    height: 220px;
  }

  .book-list-item {
    flex-direction: column;
  }

  .list-cover {
    flex: 0 0 auto;
    height: 200px;
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .book-cover-container {
    height: 200px;
  }

  .genre-tag {
    font-size: 0.7em;
  }
}
</style>
