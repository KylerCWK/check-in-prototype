<!-- 
  Interactive Recommendation Controls Component
  Provides intuitive ways to interact with AI recommendations
-->
<template>
  <div class="recommendation-controls">
    <div class="control-header">
      <h4>🎯 Fine-tune Your Recommendations</h4>
      <p>Help our AI learn your preferences better</p>
    </div>

    <div class="control-sections">
      <!-- Mood-based Controls -->
      <div class="control-section">
        <h5>📚 What mood are you in?</h5>
        <div class="mood-buttons">
          <button 
            v-for="mood in moods" 
            :key="mood.id"
            :class="['mood-btn', { active: selectedMood === mood.id }]"
            @click="selectMood(mood.id)"
          >
            <span class="mood-emoji">{{ mood.emoji }}</span>
            <span class="mood-label">{{ mood.label }}</span>
          </button>
        </div>
      </div>

      <!-- Reading Time Controls -->
      <div class="control-section">
        <h5>⏰ How much time do you have?</h5>
        <div class="time-buttons">
          <button 
            v-for="time in readingTimes" 
            :key="time.id"
            :class="['time-btn', { active: selectedTime === time.id }]"
            @click="selectTime(time.id)"
          >
            <span class="time-icon">{{ time.icon }}</span>
            <span class="time-label">{{ time.label }}</span>
          </button>
        </div>
      </div>      <!-- Genre Preferences -->
      <div class="control-section">
        <h5>🎭 What genres interest you today?</h5>
        <div class="genre-tags">
          <button 
            v-for="genre in genres" 
            :key="genre"
            :class="['genre-tag', { active: selectedGenres.includes(genre) }]"
            @click="toggleGenre(genre)"
          >
            {{ genre }}
          </button>
        </div>
      </div>

      <!-- Publication Date Preferences -->
      <div class="control-section">
        <h5>📅 Publication Date Preference</h5>
        <div class="date-buttons">
          <button 
            v-for="dateRange in publicationDateRanges" 
            :key="dateRange.id"
            :class="['date-btn', { active: selectedPublicationDate === dateRange.id }]"
            @click="selectPublicationDate(dateRange.id)"
          >
            <span class="date-icon">{{ dateRange.icon }}</span>
            <span class="date-label">{{ dateRange.label }}</span>
          </button>
        </div>
      </div>

      <!-- AI Insights -->
      <div class="control-section" v-if="aiInsights">
        <h5>🤖 AI Insights About You</h5>
        <div class="ai-insights">
          <div class="insight-item">
            <span class="insight-label">Reading Pattern:</span>
            <span class="insight-value">{{ aiInsights.readingPattern }}</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">Favorite Themes:</span>
            <span class="insight-value">{{ aiInsights.favoriteThemes.join(', ') }}</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">Discovery Score:</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: aiInsights.discoveryScore + '%' }"></div>
              <span class="score-text">{{ aiInsights.discoveryScore }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="control-actions">
        <button 
          class="refresh-smart-btn" 
          @click="getSmartRecommendations"
          :disabled="isLoading"
        >
          <span v-if="isLoading">🔄 Thinking...</span>
          <span v-else>✨ Get Smart Recommendations</span>
        </button>
        
        <button 
          class="surprise-btn" 
          @click="getSurpriseMe"
          :disabled="isLoading"
        >
          🎲 Surprise Me!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecommendationControls',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    aiInsights: {
      type: Object,
      default: null
    }
  },  data() {
    return {
      selectedMood: null,
      selectedTime: null,
      selectedGenres: [],
      selectedPublicationDate: null,
      moods: [
        { id: 'adventurous', emoji: '🗺️', label: 'Adventurous' },
        { id: 'contemplative', emoji: '🤔', label: 'Thoughtful' },
        { id: 'lighthearted', emoji: '😊', label: 'Light & Fun' },
        { id: 'intense', emoji: '🔥', label: 'Intense' },
        { id: 'romantic', emoji: '💕', label: 'Romantic' },
        { id: 'mysterious', emoji: '🕵️', label: 'Mysterious' }
      ],
      readingTimes: [
        { id: 'quick', icon: '⚡', label: 'Quick Read' },
        { id: 'moderate', icon: '📖', label: 'Moderate' },
        { id: 'deep', icon: '📚', label: 'Deep Dive' },
        { id: 'series', icon: '📚📚', label: 'Series Binge' }
      ],
      publicationDateRanges: [
        { id: 'recent', icon: '🆕', label: 'Last 6 months' },
        { id: 'thisYear', icon: '📅', label: 'This year' },
        { id: 'lastFewYears', icon: '🎯', label: 'Last 3 years' },
        { id: 'classic', icon: '📜', label: 'Classic (pre-2000)' },
        { id: 'any', icon: '🌐', label: 'Any time period' }
      ],
      genres: [
        'Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 
        'Romance', 'Contemporary', 'Young Adult', 'Biography', 'Self-Help',
        'Business', 'Technology', 'Psychology', 'Philosophy', 'Science'
      ]
    };
  },
  methods: {
    selectMood(moodId) {
      this.selectedMood = this.selectedMood === moodId ? null : moodId;
      this.emitPreferences();
    },
    
    selectTime(timeId) {
      this.selectedTime = this.selectedTime === timeId ? null : timeId;
      this.emitPreferences();
    },
      toggleGenre(genre) {
      const index = this.selectedGenres.indexOf(genre);
      if (index > -1) {
        this.selectedGenres.splice(index, 1);
      } else {
        this.selectedGenres.push(genre);
      }
      this.emitPreferences();
    },
    
    selectPublicationDate(dateRangeId) {
      this.selectedPublicationDate = this.selectedPublicationDate === dateRangeId ? null : dateRangeId;
      this.emitPreferences();
    },
    
    emitPreferences() {
      this.$emit('preferences-changed', {
        mood: this.selectedMood,
        time: this.selectedTime,
        genres: [...this.selectedGenres],
        publicationDate: this.selectedPublicationDate
      });
    },
    
    getSmartRecommendations() {
      this.$emit('smart-recommendations', {
        mood: this.selectedMood,
        time: this.selectedTime,
        genres: [...this.selectedGenres],
        publicationDate: this.selectedPublicationDate
      });
    },
    
    getSurpriseMe() {
      this.$emit('surprise-me');
    }
  }
};
</script>

<style scoped>
.recommendation-controls {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.control-header {
  text-align: center;
  margin-bottom: 2rem;
}

.control-header h4 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.control-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.control-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
}

.control-section h5 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.mood-buttons, .time-buttons, .date-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.mood-btn, .time-btn, .date-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.mood-btn:hover, .time-btn:hover, .date-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.mood-btn.active, .time-btn.active, .date-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.mood-emoji, .time-icon, .date-icon {
  font-size: 1.5rem;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.genre-tag:hover {
  background: rgba(255, 255, 255, 0.2);
}

.genre-tag.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.ai-insights {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-label {
  font-weight: 500;
  opacity: 0.9;
}

.insight-value {
  font-weight: 400;
}

.score-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.control-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.refresh-smart-btn, .surprise-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.refresh-smart-btn:hover, .surprise-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.refresh-smart-btn:disabled, .surprise-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .recommendation-controls {
    padding: 1.5rem;
  }
  
  .mood-buttons, .time-buttons {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .control-actions {
    flex-direction: column;
  }
}
</style>
