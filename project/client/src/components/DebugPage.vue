<template>
  <div class="debug-page">
    <h1>API Debug Page</h1>
    
    <div class="debug-section">
      <h2>API Configuration</h2>
      <p><strong>Base URL:</strong> {{ apiBaseUrl }}</p>
      <p><strong>Environment:</strong> {{ environment }}</p>
      <p><strong>Current URL:</strong> {{ currentUrl }}</p>
    </div>

    <div class="debug-section">
      <h2>Health Check</h2>
      <button @click="testHealth" :disabled="isLoading">Test Health Endpoint</button>
      <div v-if="healthResult" class="result">
        <pre>{{ healthResult }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h2>Login Test</h2>
      <input v-model="testEmail" placeholder="Email" />
      <input v-model="testPassword" placeholder="Password" type="password" />
      <button @click="testLogin" :disabled="isLoading">Test Login</button>
      <div v-if="loginResult" class="result">
        <pre>{{ loginResult }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h2>Catalog Test</h2>
      <button @click="testCatalog" :disabled="isLoading">Test Catalog</button>
      <div v-if="catalogResult" class="result">
        <pre>{{ catalogResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { login, getCatalogBooks } from '../api';

export default {
  name: 'DebugPage',
  data() {
    return {
      apiBaseUrl: '',
      environment: '',
      currentUrl: '',
      isLoading: false,
      testEmail: 'demo@bookworm.ai',
      testPassword: 'demo123456',
      healthResult: null,
      loginResult: null,
      catalogResult: null,
    };
  },
  mounted() {
    this.apiBaseUrl = api.defaults.baseURL;
    this.environment = import.meta.env.MODE;
    this.currentUrl = window.location.href;
  },
  methods: {
    async testHealth() {
      this.isLoading = true;
      this.healthResult = null;
      try {
        const response = await api.get('/api/health');
        this.healthResult = JSON.stringify(response.data, null, 2);
      } catch (error) {
        this.healthResult = JSON.stringify({
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          }
        }, null, 2);
      } finally {
        this.isLoading = false;
      }
    },

    async testLogin() {
      this.isLoading = true;
      this.loginResult = null;
      try {
        const response = await login(this.testEmail, this.testPassword);
        this.loginResult = JSON.stringify(response, null, 2);
      } catch (error) {
        this.loginResult = JSON.stringify({
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          }
        }, null, 2);
      } finally {
        this.isLoading = false;
      }
    },

    async testCatalog() {
      this.isLoading = true;
      this.catalogResult = null;
      try {
        const response = await getCatalogBooks({ page: 1, limit: 3 });
        this.catalogResult = JSON.stringify({
          booksCount: response.books?.length,
          pagination: response.pagination,
          firstBook: response.books?.[0]?.title
        }, null, 2);
      } catch (error) {
        this.catalogResult = JSON.stringify({
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          }
        }, null, 2);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.debug-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.debug-section h2 {
  margin-top: 0;
  color: #333;
}

.result {
  margin-top: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}

.result pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

input {
  padding: 8px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}
</style>
