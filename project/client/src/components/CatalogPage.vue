<template>
  <div class="catalog-page">
    <nav-bar />

    <div class="catalog-container">
      <div class="catalog-header">
        <h1>Book Catalog</h1>

        <!-- Search and Filter -->
        <div class="catalog-filters">
          <div class="search-bar">
            <div class="search-container">
              <input v-model="searchQuery" @input="debounceSearch" type="text" :placeholder="searchPlaceholder"
                class="search-input" />
              <span class="search-icon">🔍</span>
            </div>

            <div class="search-options">
              <select v-model="searchBy" @change="updateSearchPlaceholder" class="search-select">
                <option value="all">All Fields</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="genre">Genre</option>
              </select>

              <select v-model="sortBy" @change="loadBooks(1)" class="sort-select">
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          <select v-model="selectedGenre" @change="loadBooks(1)" class="genre-select">
            <option value="">All Genres</option>
            <option v-for="genre in genres" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </div>

        <!-- Popular Tags -->
        <div class="popular-tags">
          <span class="tags-label">Popular tags:</span>
          <div class="tags-list">
            <button v-for="(tag, index) in popularTags" :key="tag" :class="['tag', `tag-color-${index % 5}`]"
              @click="selectTag(tag)">
              {{ tag }}
            </button>
          </div>
        </div>
      </div>

      <!-- Trending Books Section -->
      <div class="section-header">
        <h2>
          <span class="trending-icon">📈</span>
          Trending Books
          <small class="subtitle">Top picks for readers</small>
        </h2>
        <div class="section-actions">
          <div class="view-options">
            <button :class="['view-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Grid view">
              <i class="grid-icon">▦</i>
            </button>
            <button :class="['view-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'" title="List view">
              <i class="list-icon">≡</i>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading books...</p>
      </div>

      <!-- Books Grid or List View -->
      <div v-else-if="books.length" :class="['books-container', viewMode]">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="books-grid">
          <div v-for="book in books" :key="book._id" class="book-card">
            <div class="book-cover-container">
              <img :src="book.coverUrl || '/default-cover.png'" :alt="book.title" class="book-cover"
                @error="handleImageError" />
              <div class="book-actions">
                <button class="favorite-btn" title="Add to favorites" @click="addToFavorites(book)">❤️
                </button>
                <button class="info-btn" title="View details" @click="openBookDetails(book)">ℹ️</button>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="author">{{ book.author }}</p>

              <!-- AI Insights Badge -->
              <div class="ai-insights">
                <span class="ai-badge">AI Insights</span>
              </div>

              <div class="genres">
                <span v-for="(genre, index) in book.genres.slice(0, 2)" :key="genre"
                  :class="['genre-tag', `genre-color-${index % 5}`]">
                  {{ genre }}
                </span>
              </div>

              <div class="ai-tags">
                <span class="ai-tag">{{ getAiMoodTag(book) }}</span>
              </div>              <div class="stats">
                <span><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
                <span class="rating-display" :title="`Rating: ${formatRating(book)}/5.0`">
                  {{ getStarRating(book) }} {{ formatRating(book) }}
                </span>
                <span title="Reading complexity"><i class="icon">📊</i> {{ getComplexityLevel(book) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="books-list">
          <div v-for="book in books" :key="book._id" class="book-list-item">
            <div class="list-cover">
              <img :src="book.coverUrl || '/default-cover.png'" :alt="book.title" @error="handleImageError" />
            </div>
            <div class="list-content">
              <div class="list-header">
                <h3 class="book-title">{{ book.title }}</h3>
                <div class="list-actions">
                  <button class="list-action-btn" title="Add to favorites" @click="addToFavorites(book)">
                    ❤️
                  </button>
                  <button class="list-action-btn" title="View details" @click="openBookDetails(book)">ℹ️</button>
                </div>
              </div>
              <p class="author">{{ book.author }}</p>              <div class="list-ai-section">
                <!-- AI Badge and Summary -->
                <span class="ai-badge">AI Insights</span>
                <p class="ai-summary">{{ getAiSummary(book) }}</p>
              </div>

              <p class="description" v-if="book.displayDescription?.text || book.description">
                {{ truncateDescription(book.displayDescription?.text || book.description, 150) }}
              </p>
              <div class="list-footer">
                <div class="top-row">
                  <div class="genres">
                    <span v-for="(genre, index) in book.genres.slice(0, 3)" :key="genre"
                      :class="['genre-tag', `genre-color-${index % 5}`]">
                      {{ genre }}
                    </span>
                  </div>

                  <div class="ai-tags">
                    <span class="ai-tag">{{ getAiMoodTag(book) }}</span>
                    <span class="ai-reading-level">{{ getReadingLevel(book) }}</span>
                  </div>
                </div>                <div class="stats">
                  <span><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
                  <span class="rating-display" :title="`Rating: ${formatRating(book)}/5.0`">
                    {{ getStarRating(book) }} {{ formatRating(book) }}
                  </span>
                  <span title="Reading complexity"><i class="icon">📊</i> {{ getComplexityLevel(book) }}</span>
                  <span title="Estimated reading time"><i class="icon">⏱️</i> {{ getReadingTime(book) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="no-results">
        <p>No books found matching your search.</p>
        <button @click="resetFilters" class="reset-btn">Reset Filters</button>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && pagination.pages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="loadBooks(currentPage - 1)" class="pagination-btn">
          &laquo; Previous
        </button>

        <div class="page-numbers">
          <button v-for="page in displayedPages" :key="page" @click="loadBooks(page)"
            :class="['page-btn', { active: currentPage === page }]">
            {{ page }}
          </button>
        </div>

        <button :disabled="currentPage === pagination.pages" @click="loadBooks(currentPage + 1)" class="pagination-btn">
          Next &raquo;
        </button>
      </div>

      <!-- Book Details Modal -->
      <div v-if="selectedBook" class="modal-overlay" @click.self="closeBookDetails">
        <div class="modal-content">
          <div class="modal-close" @click="closeBookDetails">&times;</div>

          <div class="book-details">
            <div class="book-details-header">
              <div class="book-details-cover">
                <img :src="selectedBook.coverUrl || '/default-cover.png'" :alt="selectedBook.title"
                  @error="handleImageError" />
              </div>

              <div class="book-details-info">
                <h2>{{ selectedBook.title }}</h2>
                <p class="author">by {{ selectedBook.author }}</p>
                <div class="genres">
                  <span v-for="(genre, index) in selectedBook.genres" :key="genre"
                    :class="['genre-tag', `genre-color-${index % 5}`]">
                    {{ genre }}
                  </span>
                </div>                <div class="stats">
                  <span><i class="icon">👁️</i> {{ selectedBook.stats.viewCount }}</span>
                  <span class="rating-display" :title="`Rating: ${formatRating(selectedBook)}/5.0`">
                    {{ getStarRating(selectedBook) }} {{ formatRating(selectedBook) }}
                  </span>
                  <span title="Reading complexity"><i class="icon">📊</i> {{ getComplexityLevel(selectedBook) }}</span>
                  <span title="Estimated reading time"><i class="icon">⏱️</i> {{ getReadingTime(selectedBook) }}</span>
                </div>
                <div class="actions">
                  <button class="action-btn primary" @click="addToFavorites(selectedBook)">
                    Add to Favorites ❤️
                  </button>
                </div>
              </div>
            </div>            <div class="book-description">
              <h3>Description</h3>
              <p>{{ getMainDescription(selectedBook) }}</p>
              <div v-if="selectedBook.displayDescription?.type" class="description-type">
                <small>{{ getDescriptionTypeLabel(selectedBook.displayDescription.type) }}</small>
              </div>
            </div><div class="book-ai-insights">
              <h3>AI Insights</h3>
              <p>{{ getAiSummary(selectedBook) }}</p>
              <div class="ai-tags">
                <span class="ai-tag">{{ getAiMoodTag(selectedBook) }}</span>
                <span class="ai-reading-level">{{ getReadingLevel(selectedBook) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import NavBar from './NavBar.vue';
import axios from 'axios';
import { trackBookView, addToFavorites as apiAddToFavorites } from '../api';

export default {
  name: 'CatalogPage',
  components: {
    NavBar
  },

  setup() {
    const books = ref([]);
    const genres = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const searchQuery = ref('');
    const searchBy = ref('all');
    const sortBy = ref('popular');
    const selectedGenre = ref('');
    const currentPage = ref(1);
    const viewMode = ref('grid'); // grid or list
    const searchPlaceholder = ref('Search by title, author, or genre...');    const pagination = ref({
      total: 0,
      page: 1,
      pages: 0
    });

    // Popular tags for quick filtering
    const popularTags = ref([
      'Fantasy', 'Science Fiction', 'Mystery', 'Romance',
      'Biography', 'Self Help', 'Contemporary', 'Fiction'
    ]);

    // Modal view to show book details
    const selectedBook = ref(null);
    const viewStartTime = ref(null);

    const showBookDetails = (book) => {
      selectedBook.value = book;
      viewStartTime.value = Date.now();
      // Track the view immediately to increment view count
      trackView(book._id, 0);
    };

    const closeBookDetails = () => {
      if (selectedBook.value && viewStartTime.value) {
        // Calculate view duration in seconds when closing details
        const viewDuration = Math.round((Date.now() - viewStartTime.value) / 1000);
        trackView(selectedBook.value._id, viewDuration);
      }
      selectedBook.value = null;
      viewStartTime.value = null;
    };    // AI Utility functions
    const getAiSummary = (book) => {
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
            
            // If the AI insights are long, truncate to first few sentences
            const sentences = aiInsights.split(/[.!?]+/).filter(s => s.trim().length > 10);
            if (sentences.length > 2) {
              return sentences.slice(0, 2).join('. ') + '.';
            }
            
            // Return the AI insights if they exist and are meaningful
            if (aiInsights.length > 50) {
              return aiInsights.length > 200 ? aiInsights.substring(0, 200) + '...' : aiInsights;
            }
          }
        }
        
        // Generate insight based on themes if available in aiAnalysis
        if (book.aiAnalysis?.themes?.length > 0) {
          const themes = book.aiAnalysis.themes.slice(0, 2).join(' and ');
          return `This compelling work explores ${themes}, offering readers deep insights into human nature and society. A thoughtful read that resonates long after the final page.`;
        }
        
        // Use enhanced description to create summary if no AI insights found
        const words = enhancedDesc.split(' ');
        if (words.length > 20) {
          // Try to find the main description part (before AI Insights)
          const mainDesc = enhancedDesc.split('AI Insights')[0].trim();
          if (mainDesc.length > 100) {
            return `${mainDesc.substring(0, 150)}... This work offers readers an immersive experience that showcases the author's storytelling mastery.`;
          }
        }
      }
      
      // Genre-specific fallbacks for books without AI insights
      if (book.genres?.includes('Fantasy')) {
        return `A magical tale that transports readers to new worlds. Perfect for those who love escapist fiction with rich world-building and memorable characters.`;
      } else if (book.genres?.includes('Mystery')) {
        return `A suspenseful mystery that keeps readers guessing until the final revelation. Ideal for fans of puzzles, detective work, and psychological intrigue.`;
      } else if (book.genres?.includes('Romance')) {
        return `An emotional journey that explores the complexities of love and relationships. Great for readers seeking both heartwarming moments and character development.`;
      } else if (book.genres?.includes('Science Fiction')) {
        return `A thought-provoking exploration of future possibilities and human nature. Appeals to readers interested in technology, society, and philosophical questions.`;
      } else if (book.genres?.includes('Horror')) {
        return `A chilling experience that builds tension and atmosphere masterfully. Perfect for readers who enjoy psychological thrills and supernatural elements.`;
      }
      
      // Final fallback for books without enhanced descriptions
      const genre = book.genres?.[0] || 'book';
      const genreInsights = {
        'Fiction': 'A compelling narrative that explores the human experience through vivid storytelling.',
        'Biography': 'An inspiring look into a remarkable life, offering insights and lessons for readers.',
        'History': 'A fascinating exploration of past events that illuminate our present understanding.',
        'Philosophy': 'A thought-provoking work that challenges readers to examine fundamental questions.',
        'Science': 'An enlightening exploration of scientific concepts and discoveries.'
      };
      
      return genreInsights[genre] || `This ${genre.toLowerCase()} offers engaging content that resonates with readers interested in quality literature.`;
    };

    const getAiMoodTag = (book) => {
      // Use actual AI mood tags if available
      if (book.aiAnalysis?.moodTags?.length > 0) {
        return book.aiAnalysis.moodTags[0];
      }
      
      // Generate mood based on genre
      const genreMoods = {
        'Fantasy': 'Magical',
        'Science Fiction': 'Futuristic', 
        'Mystery': 'Suspenseful',
        'Romance': 'Heartwarming',
        'Horror': 'Thrilling',
        'Biography': 'Inspiring',
        'Historical': 'Immersive',
        'Contemporary': 'Relatable'
      };
      
      const primaryGenre = book.genres?.[0];
      return genreMoods[primaryGenre] || 'Engaging';
    };    const getComplexityLevel = (book) => {
      // Use AI complexity score if available
      if (book.aiAnalysis?.complexityScore !== undefined) {
        const score = book.aiAnalysis.complexityScore;
        if (score <= 3) return 'Easy';
        if (score <= 7) return 'Moderate';
        return 'Complex';
      }
      
      // Determine complexity based on genre and reading level
      const complexGenres = ['Academic', 'Philosophy', 'Science', 'Technical'];
      const easyGenres = ['Children', 'Young Adult', 'Romance'];
      
      const hasComplexGenre = book.genres?.some(g => complexGenres.some(cg => g.includes(cg)));
      const hasEasyGenre = book.genres?.some(g => easyGenres.some(eg => g.includes(eg)));
      
      if (hasComplexGenre) return 'Complex';
      if (hasEasyGenre) return 'Easy';
      return 'Moderate';
    };    const formatRating = (book) => {
      // Handle multiple possible rating fields
      const rating = book.stats?.rating || 
                    book.stats?.averageRating || 
                    book.rating || 
                    book.averageRating;
                    
      if (!rating || rating === 0) return 'N/A';
      
      // Format to 1 decimal place
      return Number(rating).toFixed(1);
    };

    const getStarRating = (book) => {
      // Handle multiple possible rating fields
      const rating = book.stats?.rating || 
                    book.stats?.averageRating || 
                    book.rating || 
                    book.averageRating;
                    
      if (!rating || rating === 0) return '☆☆☆☆☆';
      
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      return '★'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(emptyStars);
    };

    const getReadingLevel = (book) => {
      // Use metadata reading level if available
      if (book.metadata?.readingLevel) {
        const levelMap = {
          'elementary': 'Elementary',
          'middle': 'Middle School',
          'high_school': 'High School',
          'college': 'College',
          'graduate': 'Graduate'
        };
        return levelMap[book.metadata.readingLevel] || 'General';
      }
      
      // Determine reading level based on genres
      if (book.genres?.some(g => g.includes('Children') || g.includes('Picture'))) {
        return 'Elementary';
      }
      if (book.genres?.some(g => g.includes('Young Adult') || g.includes('Teen'))) {
        return 'Young Adult';
      }
      if (book.genres?.some(g => g.includes('Academic') || g.includes('Textbook'))) {
        return 'Academic';
      }      
      return 'General';
    };

    const getDescriptionTypeLabel = (type) => {
      const labels = {
        'ai_enhanced': 'AI Enhanced Description',
        'original': 'Original Description',
        'fallback': 'Generated Description'
      };
      return labels[type] || 'Description';
    };

    const getReadingTime = (book) => {
      // Estimate reading time based on page count if available or generate a default
      if (book.pageCount) {
        const mins = book.pageCount * 2; // Assuming 2 mins per page on average
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        return `${hours} hr ${mins % 60} min`;
      }
      // Default time ranges
      const times = ["2-3 hrs", "4-5 hrs", "6-8 hrs", "10+ hrs"];
      return book.readingTime || times[Math.floor(Math.random() * times.length)];
    };

    const trackView = async (bookId, viewDuration) => {
      try {        // Check if token exists in localStorage before making the API call
        const token = localStorage.getItem('token');
        if (!token) {
          // Still update the UI for a better user experience
          if (viewDuration > 0) {
            const book = books.value.find(b => b._id === bookId);
            if (book && book.stats) {
              book.stats.viewCount = (book.stats.viewCount || 0) + 1;
            }
          }
          return;
        }

        await trackBookView(bookId, viewDuration);
        // If it's a short view (initial tracking), don't update the UI
        if (viewDuration > 0) {
          // Update the local view count for the book in the UI
          const book = books.value.find(b => b._id === bookId);
          if (book && book.stats) {
            book.stats.viewCount = (book.stats.viewCount || 0) + 1;
          }
        }
      } catch (error) {
        console.error('Error tracking book view:', error);
      }
    };

    // Compute displayed page numbers for pagination
    const displayedPages = computed(() => {
      const totalPages = pagination.value.pages;
      const current = currentPage.value;

      if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      if (current <= 3) {
        return [1, 2, 3, 4, 5];
      }

      if (current >= totalPages - 2) {
        return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      }

      return [current - 2, current - 1, current, current + 1, current + 2];
    });

    // Debounce search
    let searchTimeout;
    const debounceSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadBooks(1);
      }, 300);
    };

    const updateSearchPlaceholder = () => {
      switch (searchBy.value) {
        case 'title':
          searchPlaceholder.value = 'Search by title...';
          break;
        case 'author':
          searchPlaceholder.value = 'Search by author...';
          break;
        case 'genre':
          searchPlaceholder.value = 'Search by genre...';
          break;
        default:
          searchPlaceholder.value = 'Search by title, author, or genre...';
      }
    };

    const selectTag = (tag) => {
      selectedGenre.value = tag;
      loadBooks(1);
    };

    const truncateDescription = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const resetFilters = () => {
      searchQuery.value = '';
      selectedGenre.value = '';
      searchBy.value = 'all';
      sortBy.value = 'popular';
      updateSearchPlaceholder();
      loadBooks(1);
    };

    const loadBooks = async (page) => {
      loading.value = true;
      error.value = null;

      try {
        // Using the baseURL from Vite's proxy configuration
        const response = await axios.get('/api/catalog', {
          params: {
            page,
            limit: 20,
            genre: selectedGenre.value,
            search: searchQuery.value,
            searchBy: searchBy.value,
            sortBy: sortBy.value
          }
        });

        books.value = response.data.books;
        pagination.value = response.data.pagination;
        currentPage.value = page;
      } catch (err) {
        console.error('Error loading books:', err);
        error.value = 'Failed to load books. Please try again later.';
        books.value = [];
      } finally {
        loading.value = false;
      }
    };

    const loadGenres = async () => {
      try {
        const response = await axios.get('/api/catalog/genres');
        genres.value = response.data.filter(genre => genre && genre.trim()); // Remove empty genres
      } catch (err) {
        console.error('Error loading genres:', err);
        genres.value = [];

        // Show some default genres if API fails
        if (genres.value.length === 0) {
          genres.value = ['Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Biography'];
        }
      }
    };

    const handleImageError = (event) => {
      event.target.src = '/default-cover.png';
    };

    onMounted(() => {
      loadGenres();
      loadBooks(1);

      // Save view preference to localStorage if user changes it
      watch(viewMode, (newValue) => {
        localStorage.setItem('bookViewMode', newValue);
      });

      // Load user's preferred view mode from localStorage
      const savedViewMode = localStorage.getItem('bookViewMode');
      if (savedViewMode === 'grid' || savedViewMode === 'list') {
        viewMode.value = savedViewMode;
      }
    });

    const addToFavorites = async (book) => {
      try {
        await apiAddToFavorites(book._id);
        alert(`Added "${book.title}" to favorites.`);
      } catch (error) {
        console.error('Error adding to favorites:', error);
        if (error.response?.status === 409) {
          alert(`"${book.title}" is already in favorites.`);
        } else {
          alert('Error adding book to favorites. Please try again.');
        }
      }
    };

    const openBookDetails = (book) => {
      showBookDetails(book);
    };

    // Update Grid and List display to include book details view
    const handleBookItemClick = (book) => {
      showBookDetails(book);
    };

    // Add click handlers to grid and list view items
    const updateBookClickHandlers = () => {
      // In grid view
      const gridItems = document.querySelectorAll('.book-card');
      gridItems.forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.book-actions')) {
            const bookId = item.getAttribute('data-book-id');
            const book = books.value.find(b => b._id === bookId);
            if (book) showBookDetails(book);
          }
        });
      });

      // In list view
      const listItems = document.querySelectorAll('.book-list-item');
      listItems.forEach(item => {
        const infoBtn = item.querySelector('.list-action-btn[title="View details"]');
        if (infoBtn) {
          infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = item.getAttribute('data-book-id');
            const book = books.value.find(b => b._id === bookId);
            if (book) showBookDetails(book);
          });
        }
      });
    };

    // Call this after books are loaded
    watch(books, () => {
      // Use nextTick to ensure DOM is updated
      setTimeout(updateBookClickHandlers, 100);
    });

    // Add book id data attribute to templates
    const addBookIds = () => {
      setTimeout(() => {
        const gridItems = document.querySelectorAll('.book-card');
        gridItems.forEach(item => {
          const index = Array.from(item.parentNode.children).indexOf(item);
          if (books.value[index]) {
            item.setAttribute('data-book-id', books.value[index]._id);
          }
        });

        const listItems = document.querySelectorAll('.book-list-item');
        listItems.forEach(item => {
          const index = Array.from(item.parentNode.children).indexOf(item);
          if (books.value[index]) {
            item.setAttribute('data-book-id', books.value[index]._id);
          }
        });
      }, 100);
    };

    watch(books, addBookIds);
    watch(viewMode, () => setTimeout(addBookIds, 100));

    watch(selectedBook, async (newBook) => {
      if (newBook) {
        aiSummary.value = 'Loading summary...';
        try {
          aiSummary.value = await getAiSummary(newBook);
        } catch (err) {
          console.error('Failed to load AI summary:', err);
          aiSummary.value = 'Error loading summary.';
        }
      } else {
        aiSummary.value = '';
      }    });

    // Helper function to extract main description (without AI insights)
    const getMainDescription = (book) => {
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
    };

    return {
      books,
      genres,
      loading,
      error,
      searchQuery,
      searchBy,
      sortBy,
      selectedGenre,
      currentPage,
      pagination,
      viewMode,
      displayedPages,
      popularTags,
      searchPlaceholder,      debounceSearch,
      loadBooks,
      resetFilters,
      handleImageError,
      selectTag,
      updateSearchPlaceholder,
      truncateDescription,
      getMainDescription,
      getAiSummary,
      getAiMoodTag,      getComplexityLevel,
      formatRating,
      getStarRating,
      getReadingLevel,
      getDescriptionTypeLabel,
      getReadingTime,
      addToFavorites,
      openBookDetails,
      closeBookDetails,
      selectedBook,
      showBookDetails,
      handleBookItemClick
    };
  }
};
</script>

<style scoped>
.catalog-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.catalog-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.catalog-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.catalog-header h1 {
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

.section-header .subtitle {
  font-size: 14px;
  color: #777;
  font-weight: normal;
  margin-left: 10px;
}

.trending-icon {
  font-size: 20px;
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

.view-btn:hover,
.view-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.catalog-filters {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.search-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 300px;
}

.search-options {
  display: flex;
  gap: 10px;
}

.search-select,
.sort-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
}

.search-container {
  position: relative;
  width: 100%;
}

.popular-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 15px 0;
  gap: 10px;
}

.tags-label {
  font-size: 14px;
  color: #666;
  margin-right: 5px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.tag-color-0 {
  background-color: #2364AA;
}

.tag-color-1 {
  background-color: #3da5d9;
}

.tag-color-2 {
  background-color: #fec601;
  color: #333;
}

.tag-color-3 {
  background-color: #73bfb8;
}

.tag-color-4 {
  background-color: #ea7317;
}

/* AI Elements */
.ai-insights {
  margin: 5px 0;
}

.ai-badge {
  background: linear-gradient(90deg, #3da5d9, #2364AA);
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
}

.ai-badge::before {
  content: "🤖";
  margin-right: 4px;
  font-size: 0.8rem;
}

.ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 8px 0;
}

.ai-tag {
  background-color: #f0f8ff;
  color: #2364AA;
  border: 1px solid #d0e6ff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  min-height: 20px;
}

.ai-reading-level {
  background-color: #ffe8d6;
  color: #ea7317;
  border: 1px solid #ffd0b0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  min-height: 20px;
}

.list-ai-section {
  margin: 10px 0;
  padding: 8px 12px;
  background-color: #f5f9ff;
  border-left: 3px solid #3da5d9;
  border-radius: 0 4px 4px 0;
}

.ai-summary {
  font-size: 0.85rem;
  margin: 8px 0 0 0;
  color: #666;
  font-style: italic;
}

.top-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input,
.genre-select {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: white;
}

.search-input {
  width: 100%;
  padding-right: 40px;
}

.search-input:focus,
.genre-select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.genre-select {
  min-width: 150px;
}

.books-container {
  margin-bottom: 30px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 25px;
}

.books-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.book-card {
  border-radius: 10px;
  overflow: hidden;
  background: white;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.book-list-item {
  display: flex;
  border-radius: 10px;
  background: white;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.book-list-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
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
}

.book-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.book-cover-container {
  position: relative;
  height: 300px;
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

.favorite-btn,
.info-btn {
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

.favorite-btn:hover,
.info-btn:hover {
  transform: scale(1.1);
}

.book-info {
  padding: 15px;
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
}

.genre-color-0 {
  background-color: #2364AA;
}

/* Primary */
.genre-color-1 {
  background-color: #3da5d9;
}

/* Secondary blue */
.genre-color-2 {
  background-color: #fec601;
  color: #333;
}

/* Accent yellow */
.genre-color-3 {
  background-color: #73bfb8;
}

/* Teal */
.genre-color-4 {
  background-color: #ea7317;
}

/* Orange */

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

.rating-display {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.rating-display:hover {
  color: #333;
  cursor: help;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
}

.pagination-btn {
  padding: 8px 16px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #0056b3;
}

.pagination-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(.active) {
  background: #e9ecef;
}

.page-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 123, 255, 0.3);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-results {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.reset-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #0056b3;
}

/* Modal Styles */
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.4s ease-out;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #007bff;
}

.book-details {
  padding: 20px;
}

.book-details-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.book-details-cover {
  flex: 0 0 150px;
  height: 225px;
  overflow: hidden;
  border-radius: 8px;
}

.book-details-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-details-info {
  flex: 1;
}

.book-details-info h2 {
  font-size: 22px;
  color: #333;
  margin: 0 0 10px 0;
}

.book-details-info .author {
  color: #666;
  margin: 0 0 10px 0;
  font-style: italic;
}

.book-details-info .genres {
  margin: 10px 0;
}

.book-details-info .stats {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.book-details-info .actions {
  margin-top: 10px;
}

.action-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.action-btn:hover {
  background: #0056b3;
}

.book-description {
  margin: 20px 0;
}

.book-ai-insights {
  margin: 20px 0;
}

.modal-content {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-bar {
    min-width: 100%;
  }

  .genre-select {
    width: 100%;
  }

  .catalog-filters {
    flex-direction: column;
    gap: 15px;
  }

  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }

  .book-cover-container {
    height: 240px;
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

  .modal-content {
    width: 95%;
  }
}

@media (max-width: 480px) {
  .search-options {
    flex-direction: column;
    gap: 8px;
  }

  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .book-cover-container {
    height: 200px;
  }

  .genre-tag {
    font-size: 0.7em;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>