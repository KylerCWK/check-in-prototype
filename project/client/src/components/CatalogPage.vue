<template>
  <div class="catalog-page">
    <div class="catalog-header">
      <h1>Book Catalog</h1>
      
      <!-- Search and Filter -->
      <div class="catalog-filters">
        <input 
          v-model="searchQuery" 
          @input="debounceSearch"
          type="text" 
          placeholder="Search books..."
          class="search-input"
        />
        
        <select v-model="selectedGenre" @change="loadBooks(1)" class="genre-select">
          <option value="">All Genres</option>
          <option v-for="genre in genres" :key="genre" :value="genre">
            {{ genre }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      Loading books...
    </div>

    <!-- Books Grid -->
    <div v-else class="books-grid">
      <div v-for="book in books" :key="book._id" class="book-card">
        <img 
          :src="book.coverUrl || '/default-cover.png'" 
          :alt="book.title"
          class="book-cover"
        />
        <div class="book-info">
          <h3>{{ book.title }}</h3>
          <p class="author">{{ book.author }}</p>
          <div class="genres">
            <span v-for="genre in book.genres.slice(0, 2)" 
                  :key="genre" 
                  class="genre-tag">
              {{ genre }}
            </span>
          </div>
          <div class="stats">
            <span>👁️ {{ book.stats.viewCount }}</span>
            <span>⭐ {{ book.stats.rating || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="loadBooks(currentPage - 1)"
      >
        Previous
      </button>
      
      <span>Page {{ currentPage }} of {{ pagination.pages }}</span>
      
      <button 
        :disabled="currentPage === pagination.pages"
        @click="loadBooks(currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'CatalogPage',
  
  setup() {
    const books = ref([]);
    const genres = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedGenre = ref('');
    const currentPage = ref(1);
    const pagination = ref({
      total: 0,
      page: 1,
      pages: 0
    });

    // Debounce search
    let searchTimeout;
    const debounceSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadBooks(1);
      }, 300);
    };

    const loadBooks = async (page) => {
      loading.value = true;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/catalog`, {
          params: {
            page,
            limit: 20,
            genre: selectedGenre.value,
            search: searchQuery.value
          }
        });
        
        books.value = response.data.books;
        pagination.value = response.data.pagination;
        currentPage.value = page;
      } catch (error) {
        console.error('Error loading books:', error);
      }
      loading.value = false;
    };

    const loadGenres = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/genres`);
        genres.value = response.data;
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };

    onMounted(() => {
      loadGenres();
      loadBooks(1);
    });

    return {
      books,
      genres,
      loading,
      searchQuery,
      selectedGenre,
      currentPage,
      pagination,
      debounceSearch,
      loadBooks
    };
  }
};
</script>

<style scoped>
.catalog-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.catalog-header {
  margin-bottom: 30px;
}

.catalog-filters {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.search-input, .genre-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-input {
  flex: 1;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.book-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.book-cover {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.book-info {
  padding: 15px;
}

.book-info h3 {
  margin: 0;
  font-size: 1.1em;
  line-height: 1.3;
}

.author {
  color: #666;
  margin: 5px 0;
}

.genres {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.genre-tag {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.stats {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 0.9em;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination button {
  padding: 8px 16px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}
</style>