<template>
  <div class="daily-recommendation" :class="{ 'loading': loading }">
    <div class="section-header">
      <h3>
        <span class="section-icon">🌟</span> 
        Today's Recommendation
        <small class="subtitle">{{ formattedDate }}</small>
      </h3>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Finding today's perfect book for you...</p>
      </div>
    </div>
    
    <div v-else-if="!recommendation" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>No daily recommendation available right now. We're still learning about your preferences!</p>
      <button @click="$emit('refresh')" class="refresh-btn">
        Generate Recommendation
      </button>
    </div>
    
    <div v-else class="daily-card">
      <div class="daily-left">
        <div class="book-cover-container">
          <img 
            :src="recommendation.coverUrl || '/default-cover.png'" 
            :alt="recommendation.title"
            class="book-cover"
            @error="handleImageError"
          />
        </div>
      </div>
      
      <div class="daily-right">        <div class="daily-message">{{ recommendation.dailyMessage || 'Our pick for you today!' }}</div>
        <h3 class="book-title">{{ recommendation.title }}</h3>
        <p class="book-author">by {{ recommendation.author }}</p>
        
        <p v-if="recommendation.publishDate" class="publish-date">
          Published: {{ formatPublishDate(recommendation.publishDate) }}
        </p>
        
        <p v-if="recommendation.description" class="book-description">
          {{ truncateDescription(recommendation.description, 200) }}
        </p>
        
        <div v-if="recommendation.genres && recommendation.genres.length" class="book-genres">
          <span v-for="(genre, index) in recommendation.genres.slice(0, 3)" :key="index" class="genre-tag">
            {{ genre }}
          </span>
        </div>
        
        <p v-if="recommendation.reason" class="recommendation-reason">
          <strong>Why we picked this:</strong> {{ recommendation.reason }}
        </p>
        
        <div class="actions-row">
          <button @click="viewDetails(recommendation)" class="details-btn">
            View Details
          </button>
          <button 
            v-if="!isInFavorites(recommendation._id)" 
            @click="$emit('add-to-favorites', recommendation)"
            class="favorite-btn"
          >
            Add to Favorites
          </button>
          <button 
            v-else 
            @click="$emit('remove-from-favorites', recommendation._id)"
            class="unfavorite-btn"
          >
            Remove from Favorites
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DailyRecommendation',
  props: {
    recommendation: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    favorites: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    formattedDate() {
      const today = new Date();
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      return today.toLocaleDateString('en-US', options);
    }
  },
  methods: {
    truncateDescription(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    },
    handleImageError(e) {
      e.target.src = '/default-cover.png';
    },
    viewDetails(book) {
      this.$emit('view-details', book);
    },    isInFavorites(bookId) {
      return this.favorites.some(favorite => favorite._id === bookId);
    },
    
    formatPublishDate(publishDate) {
      if (!publishDate) return '';
      
      const date = new Date(publishDate);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      const diffYears = Math.floor(diffMonths / 12);
      
      if (diffMonths < 6) {
        return 'Recent release';
      } else if (diffMonths < 12) {
        return 'This year';
      } else if (diffYears === 1) {
        return 'Last year';
      } else if (diffYears < 5) {
        return `${diffYears} years ago`;
      } else {
        return date.getFullYear().toString();
      }
    }
  }
}
</script>

<style scoped>
.daily-recommendation {
  margin-bottom: 2rem;
  position: relative;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.4rem;
  margin: 0;
  display: flex;
  align-items: center;
}

.section-icon {
  margin-right: 0.5rem;
  font-size: 1.2em;
}

.subtitle {
  font-size: 0.85rem;
  font-weight: normal;
  opacity: 0.7;
  margin-left: 0.5rem;
}

.daily-card {
  display: flex;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.daily-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.daily-left {
  flex: 0 0 250px;
  position: relative;
}

.book-cover-container {
  height: 100%;
  overflow: hidden;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.daily-right {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.daily-message {
  color: #4F46E5;
  font-weight: 500;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.book-title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
  line-height: 1.3;
}

.book-author {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1rem;
}

.publish-date {
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 1rem;
  font-style: italic;
}

.book-description {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.book-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.genre-tag {
  background-color: #f0f0f0;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
}

.recommendation-reason {
  font-size: 0.9rem;
  color: #555;
  margin: 0 0 1.5rem;
  font-style: italic;
}

.actions-row {
  display: flex;
  gap: 1rem;
  margin-top: auto;
}

.details-btn, .favorite-btn, .unfavorite-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  border: none;
  transition: all 0.2s;
}

.details-btn {
  background-color: #4F46E5;
  color: white;
}

.details-btn:hover {
  background-color: #3c35b5;
}

.favorite-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #212529;
  display: flex;
  align-items: center;
}

.favorite-btn:hover {
  background-color: #e9ecef;
}

.unfavorite-btn {
  background-color: #f8d7da;
  color: #842029;
}

.unfavorite-btn:hover {
  background-color: #f5c2c7;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: white;
  border-radius: 12px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(79, 70, 229, 0.2);
  border-radius: 50%;
  border-top-color: #4F46E5;
  animation: spin 1s linear infinite;
}

.loading-indicator p {
  color: #666;
  font-style: italic;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state p {
  color: #666;
  max-width: 400px;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.refresh-btn {
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: #3c35b5;
}

@media (max-width: 768px) {
  .daily-card {
    flex-direction: column;
  }
  
  .daily-left {
    flex: 0 0 250px;
  }
  
  .daily-right {
    padding: 1.5rem;
  }
  
  .actions-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .details-btn, .favorite-btn, .unfavorite-btn {
    width: 100%;
  }
}
</style>
