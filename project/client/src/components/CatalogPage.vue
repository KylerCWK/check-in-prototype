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
              <input 
                v-model="searchQuery" 
                @input="debounceSearch"
                type="text" 
                :placeholder="searchPlaceholder"
                class="search-input"
              />
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
            <button 
              v-for="(tag, index) in popularTags" 
              :key="tag"
              :class="['tag', `tag-color-${index % 5}`]"
              @click="selectTag(tag)"
            >
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
              <img 
                :src="book.coverUrl || '/default-cover.png'" 
                :alt="book.title"
                class="book-cover"
                @error="handleImageError"
              />
              <div class="book-actions">
                <button class="favorite-btn" title="Add to favorites">❤️</button>
                <button class="info-btn" title="View details">ℹ️</button>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="author">{{ book.author }}</p>
              <div class="genres">
                <span v-for="(genre, index) in book.genres.slice(0, 2)" 
                      :key="genre" 
                      :class="['genre-tag', `genre-color-${index % 5}`]">
                  {{ genre }}
                </span>
              </div>
              <div class="stats">
                <span><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
                <span><i class="icon">⭐</i> {{ book.stats.rating || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- List View -->
        <div v-else class="books-list">
          <div v-for="book in books" :key="book._id" class="book-list-item">
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
                  <button class="list-action-btn" title="Add to favorites">❤️</button>
                  <button class="list-action-btn" title="View details">ℹ️</button>
                </div>
              </div>
              <p class="author">{{ book.author }}</p>
              <p class="description" v-if="book.description">{{ truncateDescription(book.description, 150) }}</p>
              <div class="list-footer">
                <div class="genres">
                  <span v-for="(genre, index) in book.genres.slice(0, 3)" 
                        :key="genre" 
                        :class="['genre-tag', `genre-color-${index % 5}`]">
                    {{ genre }}
                  </span>
                </div>
                <div class="stats">
                  <span><i class="icon">👁️</i> {{ book.stats.viewCount }}</span>
                  <span><i class="icon">⭐</i> {{ book.stats.rating || 'N/A' }}</span>
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
        <button 
          :disabled="currentPage === 1"
          @click="loadBooks(currentPage - 1)"
          class="pagination-btn"
        >
          &laquo; Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in displayedPages" 
            :key="page" 
            @click="loadBooks(page)"
            :class="['page-btn', { active: currentPage === page }]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          :disabled="currentPage === pagination.pages"
          @click="loadBooks(currentPage + 1)"
          class="pagination-btn"
        >
          Next &raquo;
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import NavBar from './NavBar.vue';
import axios from 'axios';

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
    const searchPlaceholder = ref('Search by title, author, or genre...');
    const pagination = ref({
      total: 0,
      page: 1,
      pages: 0
    });
    
    // Popular tags for quick filtering
    const popularTags = ref([
      'Fantasy', 'Science Fiction', 'Mystery', 'Romance', 
      'Biography', 'Self Help', 'Contemporary', 'Fiction'
    ]);

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
      searchPlaceholder,
      debounceSearch,
      loadBooks,
      resetFilters,
      handleImageError,
      selectTag,
      updateSearchPlaceholder,
      truncateDescription
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

.view-btn:hover, .view-btn.active {
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
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.tag-color-0 { background-color: #2364AA; }
.tag-color-1 { background-color: #3da5d9; }
.tag-color-2 { background-color: #fec601; color: #333; }
.tag-color-3 { background-color: #73bfb8; }
.tag-color-4 { background-color: #ea7317; }

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input, .genre-select {
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

.search-input:focus, .genre-select:focus {
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
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

.favorite-btn, .info-btn {
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

.favorite-btn:hover, .info-btn:hover {
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

.genre-color-0 { background-color: #2364AA; } /* Primary */
.genre-color-1 { background-color: #3da5d9; } /* Secondary blue */
.genre-color-2 { background-color: #fec601; color: #333; } /* Accent yellow */
.genre-color-3 { background-color: #73bfb8; } /* Teal */
.genre-color-4 { background-color: #ea7317; } /* Orange */

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