<template>
  <div :class="['recommendations-carousel', { 'loading': loading }]">
    <div class="section-header">
      <h3>
        <span class="section-icon">{{ sectionIcon }}</span> 
        {{ title }}
        <small v-if="subtitle" class="subtitle">{{ subtitle }}</small>
      </h3>
      
      <div class="section-actions" v-if="books.length > 0">
        <button 
          class="view-all-btn"
          v-if="showViewAll"
          @click="$emit('view-all')"
        >
          View All <span class="arrow-icon">→</span>
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Finding the perfect books for you...</p>
      </div>
    </div>
    
    <div v-else-if="books.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p>{{ emptyMessage }}</p>
      <button v-if="showRefreshOnEmpty" @click="$emit('refresh')" class="refresh-btn">
        Refresh Recommendations
      </button>
    </div>
    
    <div v-else class="carousel-container">
      <button class="carousel-control prev" @click="scrollLeft" :disabled="atStart">
        <span>❮</span>
      </button>
      
      <div class="carousel-content" ref="carouselRef">
        <div 
          v-for="(book, index) in books" 
          :key="book._id || index" 
          class="carousel-item"
        >
          <div class="book-card">
            <div class="book-cover-container">
              <img 
                :src="book.coverUrl || '/default-cover.png'" 
                :alt="book.title"
                class="book-cover"
                @error="handleImageError"
              />
              <div class="book-actions">
                <button class="info-btn" @click="viewDetails(book)" title="View details">ℹ️</button>
                <button 
                  v-if="!isInFavorites(book._id)" 
                  class="favorite-btn" 
                  @click="$emit('add-to-favorites', book)" 
                  title="Add to favorites"
                >
                  ❤️
                </button>
                <button 
                  v-else 
                  class="unfavorite-btn" 
                  @click="$emit('remove-from-favorites', book._id)" 
                  title="Remove from favorites"
                >
                  💔
                </button>
              </div>
            </div>
            
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <p class="book-author">{{ book.author }}</p>
              <p v-if="book.reason" class="recommendation-reason">
                {{ book.reason }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <button class="carousel-control next" @click="scrollRight" :disabled="atEnd">
        <span>❯</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecommendationsCarousel',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    books: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    sectionIcon: {
      type: String,
      default: '✨'
    },
    emptyMessage: {
      type: String,
      default: 'No recommendations available right now.'
    },
    favorites: {
      type: Array,
      default: () => []
    },
    showViewAll: {
      type: Boolean,
      default: false
    },
    showRefreshOnEmpty: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      atStart: true,
      atEnd: false,
      scrollAmount: 250
    };
  },
  methods: {
    scrollLeft() {
      const container = this.$refs.carouselRef;
      if (container) {
        container.scrollBy({
          left: -this.scrollAmount,
          behavior: 'smooth'
        });
      }
    },
    scrollRight() {
      const container = this.$refs.carouselRef;
      if (container) {
        container.scrollBy({
          left: this.scrollAmount,
          behavior: 'smooth'
        });
      }
    },
    handleScroll() {
      const container = this.$refs.carouselRef;
      if (!container) return;
      
      this.atStart = container.scrollLeft <= 5;
      this.atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
    },
    handleImageError(e) {
      e.target.src = '/default-cover.png';
    },    viewDetails(book) {
      // Send the view event with the book
      this.$emit('view-details', book);
    },
    isInFavorites(bookId) {
      return this.favorites.some(favorite => favorite._id === bookId);
    }
  },
  mounted() {
    const container = this.$refs.carouselRef;
    if (container) {
      container.addEventListener('scroll', this.handleScroll);
      // Initial check for scroll buttons
      this.$nextTick(() => {
        this.handleScroll();
      });
    }
  },
  beforeUnmount() {
    const container = this.$refs.carouselRef;
    if (container) {
      container.removeEventListener('scroll', this.handleScroll);
    }
  }
}
</script>

<style scoped>
.recommendations-carousel {
  margin-bottom: 2rem;
  position: relative;
}

.recommendations-carousel.loading {
  min-height: 300px;
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

.section-actions {
  display: flex;
  gap: 1rem;
}

.view-all-btn {
  background: none;
  border: none;
  color: var(--primary-color, #4F46E5);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.view-all-btn:hover {
  opacity: 0.8;
}

.arrow-icon {
  margin-left: 0.25rem;
}

.carousel-container {
  position: relative;
  display: flex;
  align-items: center;
}

.carousel-content {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  gap: 1rem;
  padding: 0.5rem 0;
}

.carousel-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.carousel-item {
  flex: 0 0 auto;
  width: 180px;
  scroll-snap-align: start;
}

.book-card {
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.book-cover-container {
  position: relative;
  padding-top: 150%;
  overflow: hidden;
}

.book-cover {
  position: absolute;
  top: 0;
  left: 0;
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
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.book-actions button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.book-actions button:hover {
  transform: scale(1.1);
}

.book-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 0.9rem;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 600;
}

.book-author {
  font-size: 0.8rem;
  color: #666;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommendation-reason {
  font-size: 0.75rem;
  margin-top: auto;
  color: #4F46E5;
  font-style: italic;
}

.carousel-control {
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  transition: all 0.2s;
}

.carousel-control:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.carousel-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-control.prev {
  left: -20px;
}

.carousel-control.next {
  right: -20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state p {
  color: #666;
  max-width: 300px;
  margin: 0 auto 1rem;
}

.refresh-btn {
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: #3c35b5;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
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

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .carousel-control {
    width: 32px;
    height: 32px;
  }
  
  .carousel-control.prev {
    left: -15px;
  }
  
  .carousel-control.next {
    right: -15px;
  }
  
  .carousel-item {
    width: 160px;
  }
}
</style>
