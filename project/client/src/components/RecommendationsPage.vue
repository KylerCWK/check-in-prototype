<template>
  <div class="recommendations-page">
    <nav-bar />

    <div class="recommendations-container">
      <header class="page-header">
        <h1>Your Book Recommendations</h1>
        <div class="refresh-container">
          <button @click="refreshAllRecommendations" class="refresh-btn" :disabled="isRefreshing">
            <span v-if="isRefreshing">Refreshing...</span>
            <span v-else>Refresh All</span>
          </button>
          <span v-if="lastUpdated" class="last-updated">
            Last updated: {{ formattedLastUpdate }}
          </span>
        </div>
      </header>      <!-- Daily Recommendation -->
      <daily-recommendation
        :recommendation="dailyRecommendation"
        :loading="loadingStates.daily"
        :favorites="favorites"
        @view-details="showBookDetails"
        @add-to-favorites="addToFavorites"
        @remove-from-favorites="removeFromFavorites"
        @refresh="fetchDailyRecommendation"
      />

      <!-- Interactive Recommendation Controls -->
      <recommendation-controls
        :is-loading="isRefreshing"
        :ai-insights="aiInsights"
        @smart-recommendations="handleSmartRecommendations"
        @surprise-me="handleSurpriseMe"
        @preferences-changed="handlePreferencesChanged"
      />

      <!-- Personalized Recommendations -->
      <recommendations-carousel
        title="Recommended Books"
        subtitle="Based on your reading history"
        section-icon="✨"
        :books="recommendedBooks"
        :loading="loadingStates.recommended"
        :favorites="favorites"
        :empty-message="'We\'re still learning about your preferences. Add books to your favorites to see more recommendations.'"
        @view-details="showBookDetails"
        @add-to-favorites="addToFavorites"
        @remove-from-favorites="removeFromFavorites"
        @refresh="fetchRecommendedBooks"
        show-view-all
        @view-all="viewAllRecommendations('recommended')"
      />

      <!-- Books You May Like -->
      <recommendations-carousel
        title="Books You May Like"
        subtitle="Similar to your favorites"
        section-icon="🤔"
        :books="booksYouMayLike"
        :loading="loadingStates.mayLike"
        :favorites="favorites"
        :empty-message="'Add books to your favorites to see recommendations based on your taste.'"
        @view-details="showBookDetails"
        @add-to-favorites="addToFavorites"
        @remove-from-favorites="removeFromFavorites"
        @refresh="fetchBooksYouMayLike"
      />

      <!-- New Releases -->
      <recommendations-carousel
        title="Newly Released Books"
        subtitle="Matching your interests"
        section-icon="🆕"
        :books="newReleases"
        :loading="loadingStates.newReleases"
        :favorites="favorites"
        :empty-message="'No new releases matching your interests right now. Check back soon!'"
        @view-details="showBookDetails"
        @add-to-favorites="addToFavorites"
        @remove-from-favorites="removeFromFavorites"
        @refresh="fetchNewReleases"
      />

      <!-- New Releases You May Like -->
      <recommendations-carousel
        title="New Releases You May Like"
        subtitle="Based on your reading profile"
        section-icon="📚"
        :books="newReleasesYouMayLike"
        :loading="loadingStates.newReleasesYouMayLike"
        :favorites="favorites"
        :empty-message="'No new releases matching your profile right now. Check back soon!'"
        @view-details="showBookDetails"
        @add-to-favorites="addToFavorites"
        @remove-from-favorites="removeFromFavorites"
        @refresh="fetchNewReleasesYouMayLike"
      />

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
                
                <div class="book-metadata">
                  <div v-if="selectedBook.metadata?.publishDate" class="metadata-item">
                    <span class="metadata-label">Published:</span>
                    <span>{{ formatDate(selectedBook.metadata.publishDate) }}</span>
                  </div>
                  
                  <div v-if="selectedBook.metadata?.publisher" class="metadata-item">
                    <span class="metadata-label">Publisher:</span>
                    <span>{{ selectedBook.metadata.publisher }}</span>
                  </div>
                  
                  <div v-if="selectedBook.metadata?.pageCount" class="metadata-item">
                    <span class="metadata-label">Pages:</span>
                    <span>{{ selectedBook.metadata.pageCount }}</span>
                  </div>
                  
                  <div v-if="selectedBook.metadata?.language" class="metadata-item">
                    <span class="metadata-label">Language:</span>
                    <span>{{ selectedBook.metadata.language.toUpperCase() }}</span>
                  </div>
                </div>
                
                <div v-if="selectedBook.genres && selectedBook.genres.length" class="book-genres">
                  <span v-for="(genre, index) in selectedBook.genres" :key="index" class="genre-tag">
                    {{ genre }}
                  </span>
                </div>
                
                <div class="book-actions">
                  <button 
                    v-if="!isInFavorites(selectedBook._id)" 
                    @click="addToFavorites(selectedBook)"
                    class="favorite-btn-large"
                  >
                    <span class="heart-icon">❤️</span> Add to Favorites
                  </button>
                  <button 
                    v-else 
                    @click="removeFromFavorites(selectedBook._id)"
                    class="unfavorite-btn-large"
                  >
                    <span class="heart-icon">💔</span> Remove from Favorites
                  </button>
                </div>
              </div>
            </div>
            
            <div class="book-description" v-if="selectedBook.description">
              <h4>Description</h4>
              <p>{{ selectedBook.description }}</p>
            </div>
            
            <div class="book-ai-insights" v-if="selectedBook.aiAnalysis">
              <h4>AI Insights</h4>
              
              <div v-if="selectedBook.aiAnalysis.themes && selectedBook.aiAnalysis.themes.length" class="ai-section">
                <h5>Themes</h5>
                <div class="themes-list">
                  <span 
                    v-for="(theme, index) in selectedBook.aiAnalysis.themes" 
                    :key="index" 
                    class="theme-tag"
                  >
                    {{ theme }}
                  </span>
                </div>
              </div>
              
              <div v-if="selectedBook.aiAnalysis.moodTags && selectedBook.aiAnalysis.moodTags.length" class="ai-section">
                <h5>Moods</h5>
                <div class="moods-list">
                  <span 
                    v-for="(mood, index) in selectedBook.aiAnalysis.moodTags" 
                    :key="index" 
                    class="mood-tag"
                  >
                    {{ mood }}
                  </span>
                </div>
              </div>
              
              <div v-if="selectedBook.aiAnalysis.complexityScore" class="ai-section">
                <h5>Reading Complexity</h5>
                <div class="complexity-meter">
                  <div 
                    class="complexity-fill" 
                    :style="{ width: (selectedBook.aiAnalysis.complexityScore * 20) + '%' }"
                  ></div>
                  <span class="complexity-label">
                    {{ getComplexityLabel(selectedBook.aiAnalysis.complexityScore) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import DailyRecommendation from './DailyRecommendation.vue';
import RecommendationsCarousel from './RecommendationsCarousel.vue';
import RecommendationControls from './RecommendationControls.vue';
import api, { 
  trackBookView, 
  getRecommendations, 
  getDailyRecommendation, 
  getNewReleases,
  getSimilarBooks,
  updateUserAIProfile,
  getFavorites,
  addToFavorites as apiAddToFavorites,
  removeFromFavorites as apiRemoveFromFavorites 
} from '../api';
import { ensureAuthenticated } from '../utils/auth';

export default {
  name: 'RecommendationsPage',
  components: {
    NavBar,
    DailyRecommendation,
    RecommendationsCarousel,
    RecommendationControls
  },  beforeCreate() {
    this.$api = api;
  },
  async mounted() {
    // Ensure user is authenticated before loading data
    try {
      const isAuth = await ensureAuthenticated();
      if (isAuth) {
        await this.initializeRecommendations();
      } else {
        console.error('Authentication failed');
        this.showErrorMessage('Unable to authenticate. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      this.showErrorMessage('Error loading recommendations. Please refresh the page.');
    }
  },
  data() {
    return {
      dailyRecommendation: null,
      recommendedBooks: [],
      booksYouMayLike: [],
      newReleases: [],
      newReleasesYouMayLike: [],
      favorites: [],
      selectedBook: null,
      viewStartTime: null,
      lastUpdated: null,
      isRefreshing: false,
      userPreferences: {
        mood: null,
        time: null,
        genres: []
      },
      aiInsights: {
        readingPattern: 'Eclectic Explorer',
        favoriteThemes: ['Adventure', 'Mystery', 'Self-Discovery'],
        discoveryScore: 78
      },
      loadingStates: {
        daily: true,
        recommended: true,
        mayLike: true,
        newReleases: true,
        newReleasesYouMayLike: true,
        favorites: true
      }
    };
  },
  computed: {
    formattedLastUpdate() {    if (!this.lastUpdated) return '';
      return new Date(this.lastUpdated).toLocaleString();
    }
  },
  methods: {
    async initializeRecommendations() {
      try {
        // Load user favorites first
        await this.fetchFavorites();
        
        // Load AI insights
        await this.loadAIInsights();
        
        // Load all recommendation categories
        await Promise.all([
          this.fetchDailyRecommendation(),
          this.fetchRecommendedBooks(),
          this.fetchBooksYouMayLike(),
          this.fetchNewReleases(),
          this.fetchNewReleasesYouMayLike()
        ]);
        
        this.lastUpdated = new Date();
        console.log('✅ All recommendations loaded successfully');
      } catch (error) {
        console.error('Error initializing recommendations:', error);
        this.showErrorMessage('Some recommendations could not be loaded. Using fallback content.');
      }
    },

    async loadAIInsights() {
      try {
        // In a real app, this would fetch AI insights from the backend
        // For now, we'll use mock data based on user activity
        this.aiInsights = {
          readingPattern: 'Eclectic Explorer',
          favoriteThemes: ['Adventure', 'Mystery', 'Self-Discovery'],
          discoveryScore: Math.floor(Math.random() * 40) + 60 // 60-100
        };
      } catch (error) {
        console.error('Error loading AI insights:', error);
      }
    },

    async fetchFavorites() {
      try {
        this.loadingStates.favorites = true;
        const response = await getFavorites();
        this.favorites = response.data;
      } catch (error) {
        console.error('Error fetching favorites:', error);
        // Initialize empty favorites array for graceful fallback
        this.favorites = [];
      } finally {
        this.loadingStates.favorites = false;
      }
    },
      async fetchDailyRecommendation() {
      try {
        this.loadingStates.daily = true;
        const response = await getDailyRecommendation();
        this.dailyRecommendation = response.data;
        this.lastUpdated = new Date();      } catch (error) {
        console.error('Error fetching daily recommendation:', error);
        // Only provide fallback content if no existing data
        if (!this.dailyRecommendation) {
          this.dailyRecommendation = {
            _id: 'fallback-daily',
            title: 'The Art of Learning',
            author: 'Josh Waitzkin',
            coverUrl: '/default-cover.png',
            genres: ['Self-Help', 'Learning', 'Personal Growth'],
            description: 'A fascinating journey into the art of learning and peak performance, combining Eastern philosophy with Western psychology.',
            reason: 'Perfect for developing new skills and mindsets',
            recommendationScore: 0.9,
            dailyMessage: 'Start your day with insights that can transform how you approach any challenge.',
            stats: { rating: 4.5, viewCount: 1247 }
          };
        }
      } finally {
        this.loadingStates.daily = false;
      }
    },
      async fetchRecommendedBooks() {      try {
        this.loadingStates.recommended = true;
        const response = await getRecommendations(10);
        this.recommendedBooks = response.data;
      } catch (error) {
        console.error('Error fetching recommended books:', error);
        // Only provide fallback content if no existing data
        if (this.recommendedBooks.length === 0) {
          this.recommendedBooks = [
            {
              _id: 'fallback-rec-1',
              title: 'Atomic Habits',
              author: 'James Clear',
              coverUrl: '/default-cover.png',
              genres: ['Self-Help', 'Productivity'],
              description: 'A practical guide to building good habits and breaking bad ones.',
              reason: 'Highly recommended for personal development',
              recommendationScore: 0.95,
              stats: { rating: 4.7, viewCount: 2156 }
            },
            {
              _id: 'fallback-rec-2',
              title: 'The Psychology of Money',
              author: 'Morgan Housel',
              coverUrl: '/default-cover.png',
              genres: ['Finance', 'Psychology'],
              description: 'Timeless lessons on wealth, greed, and happiness.',
              reason: 'Essential reading for financial literacy',
              recommendationScore: 0.92,
              stats: { rating: 4.6, viewCount: 1834 }
            },
            {
              _id: 'fallback-rec-3',
              title: 'Sapiens',
              author: 'Yuval Noah Harari',
              coverUrl: '/default-cover.png',
              genres: ['History', 'Anthropology'],
              description: 'A brief history of humankind from the Stone Age to the present.',
              reason: 'Expands perspective on human civilization',
              recommendationScore: 0.90,
              stats: { rating: 4.5, viewCount: 3241 }
            }
          ];
        }
      } finally {
        this.loadingStates.recommended = false;
      }
    },      async fetchBooksYouMayLike() {
      try {
        this.loadingStates.mayLike = true;
        // Use the similar endpoint with the first recommended book as seed
        const recommendedResponse = await getRecommendations(1);
        if (recommendedResponse.data && recommendedResponse.data.length > 0) {
          const seedBook = recommendedResponse.data[0];
          const response = await getSimilarBooks(seedBook._id, 10);
          this.booksYouMayLike = response.data;
        } else {
          // Fallback to general recommendations
          const response = await getRecommendations(10);
          this.booksYouMayLike = response.data;
        }      } catch (error) {
        console.error('Error fetching books you may like:', error);
        // Only provide fallback content if no existing data
        if (this.booksYouMayLike.length === 0) {
          this.booksYouMayLike = [
            {
              _id: 'fallback-like-1',
              title: 'The Seven Husbands of Evelyn Hugo',
              author: 'Taylor Jenkins Reid',
              coverUrl: '/default-cover.png',
              genres: ['Contemporary Fiction', 'Romance'],
              description: 'A reclusive Hollywood icon finally tells her story to a young journalist.',
              reason: 'Similar themes to your recent reads',
              similarityScore: 0.87,
              stats: { rating: 4.6, viewCount: 1923 }
            },
            {
              _id: 'fallback-like-2',
              title: 'Project Hail Mary',
              author: 'Andy Weir',
              coverUrl: '/default-cover.png',
              genres: ['Science Fiction', 'Adventure'],
              description: 'A lone astronaut must save humanity in this thrilling space adventure.',
              reason: 'Matches your interest in problem-solving narratives',
              similarityScore: 0.84,
              stats: { rating: 4.5, viewCount: 1456 }
            }
          ];
        }
      } finally {
        this.loadingStates.mayLike = false;
      }
    },
      async fetchNewReleases() {
      try {
        this.loadingStates.newReleases = true;
        const response = await getNewReleases(10);
        this.newReleases = response.data;      } catch (error) {
        console.error('Error fetching new releases:', error);
        // Only provide fallback content if no existing data
        if (this.newReleases.length === 0) {
          this.newReleases = [
            {
              _id: 'fallback-new-1',
              title: 'Fourth Wing',
              author: 'Rebecca Yarros',
              coverUrl: '/default-cover.png',
              genres: ['Fantasy', 'Romance', 'Young Adult'],
              description: 'A thrilling fantasy romance set in a war college for dragon riders.',
              reason: 'Trending new release in fantasy',
              publishDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              stats: { rating: 4.8, viewCount: 892 }
            },
            {
              _id: 'fallback-new-2',
              title: 'Tomorrow, and Tomorrow, and Tomorrow',
              author: 'Gabrielle Zevin',
              coverUrl: '/default-cover.png',
              genres: ['Literary Fiction', 'Technology'],
              description: 'A novel about friendship, art, and the creation of video games.',
              reason: 'Critically acclaimed recent release',
              publishDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
              stats: { rating: 4.4, viewCount: 567 }
            }
          ];
        }
      } finally {
        this.loadingStates.newReleases = false;
      }
    },
      async fetchNewReleasesYouMayLike() {
      try {
        this.loadingStates.newReleasesYouMayLike = true;
        // Fetch new releases tailored to user preferences
        const response = await getNewReleases(10);
        this.newReleasesYouMayLike = response.data;      } catch (error) {
        console.error('Error fetching new releases you may like:', error);
        // Only provide fallback content if no existing data
        if (this.newReleasesYouMayLike.length === 0) {
          this.newReleasesYouMayLike = [
            {
              _id: 'fallback-new-like-1',
              title: 'The Atlas Six',
              author: 'Olivie Blake',
              coverUrl: '/default-cover.png',
              genres: ['Fantasy', 'Dark Academia'],
              description: 'Six magicians compete for a place in an exclusive society.',
              reason: 'New release matching your fantasy preferences',
              publishDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
              stats: { rating: 4.3, viewCount: 743 }
            },
            {
              _id: 'fallback-new-like-2',
              title: 'The Midnight Library',
              author: 'Matt Haig',
              coverUrl: '/default-cover.png',
              genres: ['Literary Fiction', 'Philosophy'],
              description: 'A magical library between life and death where every book is a different life you could have lived.',
              reason: 'Recent philosophical fiction you might enjoy',
              publishDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
              stats: { rating: 4.2, viewCount: 1034 }
            }
          ];
        }
      } finally {
        this.loadingStates.newReleasesYouMayLike = false;
      }
    },
      async refreshAllRecommendations() {
      this.isRefreshing = true;
      // Update AI profile first
      try {
        await updateUserAIProfile();
        
        // Then fetch all recommendations
        await Promise.all([
          this.fetchDailyRecommendation(),
          this.fetchRecommendedBooks(),
          this.fetchBooksYouMayLike(),
          this.fetchNewReleases(),
          this.fetchNewReleasesYouMayLike()
        ]);
        
      } catch (error) {
        console.error('Error refreshing recommendations:', error);
      } finally {
        this.isRefreshing = false;
      }
    },
    showBookDetails(book) {
      this.selectedBook = book;
      this.viewStartTime = Date.now();
      // Track the view immediately with zero duration to increment view count
      this.trackBookView(book._id, 0);
    },
    
    closeBookDetails() {
      if (this.selectedBook && this.viewStartTime) {
        // Calculate view duration in seconds
        const viewDuration = Math.round((Date.now() - this.viewStartTime) / 1000);
        // Only track again if the user spent meaningful time viewing
        if (viewDuration > 2) {
          this.trackBookView(this.selectedBook._id, viewDuration);
        }
      }
      this.selectedBook = null;
      this.viewStartTime = null;
    },
    
    async trackBookView(bookId, viewDuration) {
      try {
        // Use the new API function for tracking views
        await this.$api.trackBookView(bookId, viewDuration);
        
        // Update local view count for the book
        if (this.selectedBook && this.selectedBook._id === bookId) {
          if (!this.selectedBook.stats) {
            this.selectedBook.stats = { viewCount: 1 };
          } else {
            this.selectedBook.stats.viewCount = (this.selectedBook.stats.viewCount || 0) + 1;
          }
        }
        
        // Update view count in all book lists
        ['recommendedBooks', 'booksYouMayLike', 'newReleases', 'newReleasesYouMayLike'].forEach(listName => {
          const bookIndex = this[listName].findIndex(b => b._id === bookId);
          if (bookIndex !== -1) {
            const book = this[listName][bookIndex];
            if (!book.stats) {
              book.stats = { viewCount: 1 };
            } else {
              book.stats.viewCount = (book.stats.viewCount || 0) + 1;
            }
          }
        });
        
        if (this.dailyRecommendation && this.dailyRecommendation._id === bookId) {
          if (!this.dailyRecommendation.stats) {
            this.dailyRecommendation.stats = { viewCount: 1 };
          } else {
            this.dailyRecommendation.stats.viewCount = (this.dailyRecommendation.stats.viewCount || 0) + 1;
          }
        }
      } catch (error) {
        console.error('Error tracking book view:', error);
      }
    },
      async addToFavorites(book) {
      try {
        await apiAddToFavorites(book._id);
        this.favorites.push(book);
      } catch (error) {
        console.error('Error adding to favorites:', error);
      }
    },
    
    async removeFromFavorites(bookId) {
      try {
        await apiRemoveFromFavorites(bookId);
        this.favorites = this.favorites.filter(b => b._id !== bookId);
        
        if (this.selectedBook && this.selectedBook._id === bookId) {
          this.selectedBook = {
            ...this.selectedBook,
            isFavorite: false
          };
        }
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }    },
    
    isInFavorites(bookId) {
      return this.favorites.some(book => book._id === bookId);
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    handleImageError(e) {
      e.target.src = '/default-cover.png';
    },
    
    getComplexityLabel(score) {
      if (score <= 1) return 'Very Simple';
      if (score <= 2) return 'Simple';
      if (score <= 3) return 'Moderate';
      if (score <= 4) return 'Complex';
      return 'Very Complex';
    },    
    viewAllRecommendations(type) {
      // This could navigate to a filtered view or show more books
      console.log(`View all ${type} recommendations`);
    },

    // Interactive Recommendation Methods
    handlePreferencesChanged(preferences) {
      this.userPreferences = { ...preferences };
      console.log('User preferences updated:', preferences);
    },

    async handleSmartRecommendations(preferences) {
      this.isRefreshing = true;
      try {
        console.log('Getting smart recommendations with preferences:', preferences);
        
        // Update AI profile with new preferences
        await updateUserAIProfile();
        
        // Fetch recommendations based on preferences
        if (preferences.mood || preferences.time || preferences.genres.length > 0) {
          // This would be a new API endpoint for contextual recommendations
          console.log('Fetching contextual recommendations...');
          await this.fetchRecommendedBooks();
          await this.fetchBooksYouMayLike();
        } else {
          await this.refreshAllRecommendations();
        }
        
        // Show success message
        this.showSuccessMessage('✨ Smart recommendations updated based on your preferences!');
        
      } catch (error) {
        console.error('Error getting smart recommendations:', error);
        this.showErrorMessage('Failed to update recommendations. Please try again.');
      } finally {
        this.isRefreshing = false;
      }
    },

    async handleSurpriseMe() {
      this.isRefreshing = true;
      try {
        console.log('Getting surprise recommendations...');
        
        // Fetch random/diverse recommendations
        const response = await getRecommendations(15);
        const surpriseBooks = response.data
          .sort(() => Math.random() - 0.5) // Randomize
          .slice(0, 10); // Take 10 random books
        
        this.recommendedBooks = surpriseBooks;
        this.showSuccessMessage('🎲 Surprise! Here are some unexpected discoveries for you!');
        
      } catch (error) {
        console.error('Error getting surprise recommendations:', error);
        this.showErrorMessage('Failed to get surprise recommendations. Please try again.');
      } finally {
        this.isRefreshing = false;
      }
    },

    showSuccessMessage(message) {
      // In a real app, this would show a toast notification
      console.log('✅', message);
      // You could integrate with a toast library here
    },

    showErrorMessage(message) {
      // In a real app, this would show an error toast
      console.error('❌', message);
      // You could integrate with a toast library here
    }
  }
};
</script>

<style scoped>
.recommendations-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 3rem;
}

.recommendations-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin: 0;
  color: #212529;
}

.refresh-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.refresh-btn {
  background-color: #4F46E5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #3c35b5;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.last-updated {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.5rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  color: #adb5bd;
  cursor: pointer;
  z-index: 1;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-close:hover {
  color: #212529;
}

/* Book Details */
.book-details {
  padding: 2rem;
}

.book-details-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.book-cover-large {
  flex: 0 0 220px;
  height: 330px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.book-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-details-info {
  flex: 1;
}

.book-details-info h2 {
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
  color: #212529;
}

.book-details-info h3 {
  font-size: 1.2rem;
  font-weight: normal;
  margin: 0 0 1.5rem 0;
  color: #495057;
}

.book-metadata {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.book-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.genre-tag {
  background-color: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  color: #495057;
}

.book-actions {
  margin-top: 1.5rem;
}

.favorite-btn-large,
.unfavorite-btn-large {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.favorite-btn-large {
  background-color: #4F46E5;
  color: white;
}

.favorite-btn-large:hover {
  background-color: #3c35b5;
}

.unfavorite-btn-large {
  background-color: #f8d7da;
  color: #842029;
}

.unfavorite-btn-large:hover {
  background-color: #f5c2c7;
}

.heart-icon {
  font-size: 1.1rem;
}

.book-description {
  margin-bottom: 2rem;
}

.book-description h4,
.book-ai-insights h4 {
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  color: #212529;
  position: relative;
  padding-bottom: 0.5rem;
}

.book-description h4:after,
.book-ai-insights h4:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: #4F46E5;
}

.book-description p {
  font-size: 1rem;
  line-height: 1.6;
  color: #495057;
}

.book-ai-insights {
  margin-top: 2rem;
}

.ai-section {
  margin-bottom: 1.5rem;
}

.ai-section h5 {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #212529;
}

.themes-list,
.moods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.theme-tag {
  background-color: #d8f3dc;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  color: #1b4332;
}

.mood-tag {
  background-color: #d8e2ff;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  color: #3c54a5;
}

.complexity-meter {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  position: relative;
  margin-bottom: 0.5rem;
}

.complexity-fill {
  height: 100%;
  background-color: #4F46E5;
  border-radius: 4px;
}

.complexity-label {
  font-size: 0.85rem;
  color: #495057;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .refresh-container {
    align-items: flex-start;
  }
  
  .book-details-header {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .book-cover-large {
    margin: 0 auto;
  }
  
  .book-metadata {
    grid-template-columns: 1fr;
  }
}
</style>
