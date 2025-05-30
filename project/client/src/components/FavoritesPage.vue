<template>
  <div class="favorites-page">
    <nav-bar />
    <div class="favorites-container">
      <h1>My Favorites</h1>

      <div class="view-options">
        <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">Grid</button>
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">List</button>
      </div>

      <div v-if="favorites.length" :class="['favorites-list', viewMode]">
        <div 
          v-for="book in favorites" 
          :key="book._id" 
          :class="['book-card', viewMode === 'grid' ? 'grid-style' : 'list-style']"
        >
          <img 
            :src="book.coverUrl || '/default-cover.png'" 
            :alt="book.title" 
            class="cover"
          />
          <div class="details">
            <h3>{{ book.title }}</h3>
            <p>{{ book.author }}</p>
            <p v-if="viewMode === 'list' && book.description">{{ truncate(book.description, 150) }}</p>
            <button class="unfavorite-button" @click="removeFromFavorites(book._id)">❌ Remove</button>
          </div>
        </div>
      </div>

      <p v-else>No favorite books yet.</p>
    </div>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import { ref, onMounted } from 'vue';

export default {
  name: 'FavoritesPage',
  components: { NavBar },
  setup() {
    const favorites = ref([]);
    const viewMode = ref('grid');

    const loadFavorites = () => {
      favorites.value = JSON.parse(localStorage.getItem('favorites') || '[]');
    };

    const removeFromFavorites = (bookId) => {
      favorites.value = favorites.value.filter(book => book._id !== bookId);
      localStorage.setItem('favorites', JSON.stringify(favorites.value));
    };

    const truncate = (text, maxLength) => {
      if (!text) return '';
      return text.length <= maxLength ? text : text.slice(0, maxLength) + '...';
    };

    onMounted(() => {
      loadFavorites();
    });

    return {
      favorites,
      viewMode,
      truncate,
      removeFromFavorites
    };
  }
};
</script>

<style scoped>
.favorites-page {
  padding: 0px;
  background-color: #f9f9f9;
}

.favorites-container {
  max-width: 1000px;
  margin: auto;
}

.view-options {
  margin: 10px 0;
  display: flex;
  gap: 10px;
}

.view-options button.active {
  font-weight: bold;
  background-color: #ddd;
}

.favorites-list.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.book-card.grid-style {
  width: 180px;
  background: white;
  padding: 10px;
  border-radius: 8px;
}

.book-card.list-style {
  display: flex;
  background: white;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
}

.cover {
  width: 100px;
  height: 150px;
  object-fit: cover;
  margin-right: 10px;
}

.unfavorite-button {
  margin-top: 10px;
  background-color: #ffdddd;
  color: #a00;
  border: 1px solid #a00;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.unfavorite-button:hover {
  background-color: #ffcccc;
}
</style>
