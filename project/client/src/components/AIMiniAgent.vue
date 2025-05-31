<template>
  <div :class="['ai-mini-agent', { 'expanded': isExpanded, [agentType]: true }]">
    <div class="agent-header" @click="toggleAgent">
      <div class="agent-info">
        <div class="agent-avatar">{{ getAgentEmoji() }}</div>
        <div class="agent-name">{{ getAgentName() }}</div>
      </div>
      <div class="agent-toggle">{{ isExpanded ? '▼' : '▲' }}</div>
    </div>
    
    <div v-if="isExpanded" class="agent-body">
      <div class="agent-conversation">
        <div 
          v-for="(message, index) in conversation" 
          :key="index" 
          :class="['message', message.from]"
        >
          <div class="message-content">{{ message.text }}</div>
          <div v-if="message.options && message.options.length" class="message-options">
            <button 
              v-for="(option, optIndex) in message.options" 
              :key="optIndex"
              @click="handleOptionSelect(option)"
              class="option-button"
            >
              {{ option.text }}
            </button>
          </div>
        </div>
        
        <div v-if="isTyping" class="message agent typing">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <div class="input-area">
        <input 
          v-model="userInput" 
          @keyup.enter="sendMessage" 
          type="text" 
          :placeholder="getInputPlaceholder()"
          :disabled="isTyping"
        />
        <button 
          @click="sendMessage" 
          class="send-button"
          :disabled="!userInput.trim() || isTyping"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIMiniAgent',
  props: {
    agentType: {
      type: String,
      required: true,
      validator: (value) => ['profile', 'support', 'app'].includes(value)
    },
    userId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isExpanded: false,
      conversation: [],
      userInput: '',
      isTyping: false
    };
  },
  mounted() {
    // Initialize with welcome message when first shown
    this.addAgentMessage(this.getWelcomeMessage());
  },
  methods: {
    toggleAgent() {
      this.isExpanded = !this.isExpanded;
    },
    
    getAgentName() {
      switch (this.agentType) {
        case 'profile':
          return 'Profile Assistant';
        case 'support':
          return 'Support Agent';
        case 'app':
          return 'App Guide';
        default:
          return 'AI Assistant';
      }
    },
    
    getAgentEmoji() {
      switch (this.agentType) {
        case 'profile':
          return '👤';
        case 'support':
          return '🛟';
        case 'app':
          return '📱';
        default:
          return '🤖';
      }
    },
    
    getInputPlaceholder() {
      switch (this.agentType) {
        case 'profile':
          return 'Ask about your reading profile...';
        case 'support':
          return 'How can I help you today?';
        case 'app':
          return 'Ask me how to use the app...';
        default:
          return 'Type your message...';
      }
    },
    
    getWelcomeMessage() {
      switch (this.agentType) {
        case 'profile':
          return {
            text: "Hello! I'm your Reading Profile Assistant. I can help you understand your reading habits and preferences. What would you like to know?",
            options: [
              { text: "What are my top genres?", action: "getTopGenres" },
              { text: "How many books have I read?", action: "getBooksRead" },
              { text: "Suggest books based on my profile", action: "suggestBooks" }
            ]
          };
        case 'support':
          return {
            text: "Hi there! I'm your Support Agent. How can I assist you today?",
            options: [
              { text: "How do I use the QR check-in?", action: "explainQRCode" },
              { text: "I can't find a book", action: "cantFindBook" },
              { text: "Account help", action: "accountHelp" }
            ]
          };
        case 'app':
          return {
            text: "Welcome to the QR Check-In app! I'm your guide to getting the most out of the app. What would you like to learn about?",
            options: [
              { text: "Show me top features", action: "topFeatures" },
              { text: "How do recommendations work?", action: "explainRecommendations" },
              { text: "Reading progress tracking", action: "progressTracking" }
            ]
          };
        default:
          return {
            text: "Hello! How can I help you today?",
            options: []
          };
      }
    },
    
    addUserMessage(text) {
      this.conversation.push({
        from: 'user',
        text
      });
    },
    
    addAgentMessage(messageData) {
      const message = {
        from: 'agent',
        text: messageData.text
      };
      
      if (messageData.options && messageData.options.length) {
        message.options = messageData.options;
      }
      
      this.conversation.push(message);
      
      // Auto-scroll to bottom
      this.$nextTick(() => {
        const container = document.querySelector('.agent-conversation');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    async sendMessage() {
      if (!this.userInput.trim() || this.isTyping) return;
      
      const message = this.userInput.trim();
      this.addUserMessage(message);
      this.userInput = '';
      
      // Simulate typing
      this.isTyping = true;
      
      try {
        // Process user message and generate response
        await this.processUserMessage(message);
      } catch (error) {
        console.error(`Error in ${this.agentType} agent:`, error);
        this.addAgentMessage({
          text: "I'm sorry, I encountered an error. Please try again later."
        });
      } finally {
        this.isTyping = false;
      }
    },
    
    handleOptionSelect(option) {
      // Add the selected option as a user message
      this.addUserMessage(option.text);
      
      // Call the corresponding action
      if (option.action && typeof this[option.action] === 'function') {
        this[option.action]();
      }
    },
    
    async processUserMessage(message) {
      // In a real implementation, this would call an AI service to process the message
      // For now, we'll use a simple rule-based system
      
      // Wait a bit to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simple keyword matching for demonstration
      const messageLower = message.toLowerCase();
      
      if (this.agentType === 'profile') {
        // Profile agent responses
        if (messageLower.includes('genre') || messageLower.includes('like to read')) {
          this.getTopGenres();
        } else if (messageLower.includes('books') && (messageLower.includes('read') || messageLower.includes('finished'))) {
          this.getBooksRead();
        } else if (messageLower.includes('suggest') || messageLower.includes('recommend')) {
          this.suggestBooks();
        } else {
          this.addAgentMessage({
            text: "I'm still learning about your reading profile. Is there anything specific you'd like to know?",
            options: [
              { text: "My reading statistics", action: "getReadingStats" },
              { text: "Update my preferences", action: "updatePreferences" }
            ]
          });
        }
      } else if (this.agentType === 'support') {
        // Support agent responses
        if (messageLower.includes('qr') || messageLower.includes('check-in')) {
          this.explainQRCode();
        } else if (messageLower.includes('find') || messageLower.includes('search')) {
          this.cantFindBook();
        } else if (messageLower.includes('account') || messageLower.includes('login') || messageLower.includes('password')) {
          this.accountHelp();
        } else {
          this.addAgentMessage({
            text: "I'm here to help! Please let me know what issue you're having with the app.",
            options: [
              { text: "Contact human support", action: "contactHuman" },
              { text: "View FAQ", action: "viewFAQ" }
            ]
          });
        }
      } else if (this.agentType === 'app') {
        // App guide responses
        if (messageLower.includes('feature') || messageLower.includes('do')) {
          this.topFeatures();
        } else if (messageLower.includes('recommend') || messageLower.includes('suggestion')) {
          this.explainRecommendations();
        } else if (messageLower.includes('progress') || messageLower.includes('track')) {
          this.progressTracking();
        } else {
          this.addAgentMessage({
            text: "I can help you navigate the app and discover all its features. What would you like to know about?",
            options: [
              { text: "Show me app tutorials", action: "showTutorials" },
              { text: "What's new in the app?", action: "whatsNew" }
            ]
          });
        }
      }
    },
    
    // Profile agent actions
    getTopGenres() {
      this.addAgentMessage({
        text: "Based on your reading history, your top genres are: 1. Science Fiction, 2. Mystery, and 3. Biography. Would you like me to recommend books in any of these genres?"
      });
    },
    
    getBooksRead() {
      this.addAgentMessage({
        text: "You've completed 12 books this year, which is 60% of your annual reading goal. Great progress! You're reading at a faster pace than 70% of users with similar profiles."
      });
    },
    
    suggestBooks() {
      this.addAgentMessage({
        text: "Based on your recent interests in technology and history, here are some suggestions: 'The Code Breaker' by Walter Isaacson, 'Klara and the Sun' by Kazuo Ishiguro, and 'The Premonition' by Michael Lewis.",
        options: [
          { text: "Add these to my reading list", action: "addToReadingList" },
          { text: "Show more like these", action: "showMoreSuggestions" }
        ]
      });
    },
    
    getReadingStats() {
      this.addAgentMessage({
        text: "📊 Your Reading Statistics:\n• Reading speed: ~300 words per minute\n• Average session: 35 minutes\n• Preferred reading time: Evenings\n• Book completion rate: 78%\n• Average rating: 4.2/5",
        options: [
          { text: "How can I improve?", action: "improveTips" }
        ]
      });
    },
    
    updatePreferences() {
      this.addAgentMessage({
        text: "To update your reading preferences, go to your profile settings and select 'Reading Preferences'. You can update your favorite genres, authors, and topics there. Would you like me to guide you through the process?"
      });
    },
    
    // Support agent actions
    explainQRCode() {
      this.addAgentMessage({
        text: "The QR Check-In feature lets you scan a book's QR code to instantly log your reading session. Simply open the camera in the app, point it at the QR code on the book, and it will automatically record your progress.",
        options: [
          { text: "I'm having trouble scanning", action: "scanningTrouble" },
          { text: "Where do I find QR codes?", action: "findQRCodes" }
        ]
      });
    },
    
    cantFindBook() {
      this.addAgentMessage({
        text: "If you can't find a specific book, you can try these steps:\n1. Check the spelling of the title and author\n2. Use the advanced search with ISBN if available\n3. Try searching by genre\n4. If the book is very new, it might not be in our database yet",
        options: [
          { text: "Request a book addition", action: "requestBookAddition" }
        ]
      });
    },
    
    accountHelp() {
      this.addAgentMessage({
        text: "For account issues, I can help with password resets, updating your profile information, or subscription management. What specific account help do you need?",
        options: [
          { text: "Reset password", action: "resetPassword" },
          { text: "Update profile", action: "updateProfile" },
          { text: "Subscription issues", action: "subscriptionHelp" }
        ]
      });
    },
    
    contactHuman() {
      this.addAgentMessage({
        text: "I'll connect you with our support team. You can reach them at support@qrcheckin.com or call 1-800-QR-BOOKS during business hours (9am-5pm EST). Your support ticket reference is #RT-2023-" + Math.floor(Math.random() * 10000)
      });
    },
    
    viewFAQ() {
      this.addAgentMessage({
        text: "You can view our frequently asked questions at qrcheckin.com/faq. Would you like me to highlight some common questions now?",
        options: [
          { text: "Yes, show me common questions", action: "showCommonFAQ" }
        ]
      });
    },
    
    // App guide actions
    topFeatures() {
      this.addAgentMessage({
        text: "📱 Top app features:\n• QR code check-in for instant reading progress tracking\n• AI-powered book recommendations\n• Reading stats and insights\n• Social sharing of reading milestones\n• Virtual bookshelf organization\n• Reading goals and achievements",
        options: [
          { text: "Tell me about recommendations", action: "explainRecommendations" },
          { text: "How do I track progress?", action: "progressTracking" }
        ]
      });
    },
    
    explainRecommendations() {
      this.addAgentMessage({
        text: "Our AI recommendation system analyzes your reading history, preferences, and behavior patterns to suggest books you'll love. It considers genres you enjoy, authors you've read, reading pace, and even thematic elements. The more you use the app, the better your recommendations become!",
        options: [
          { text: "Are my recommendations personalized?", action: "personalizedRecommendations" }
        ]
      });
    },
    
    progressTracking() {
      this.addAgentMessage({
        text: "The app tracks your reading in several ways:\n1. QR code check-ins when you start/end a session\n2. Manual page or time tracking\n3. Reading speed calculations\n4. Completion milestones\nAll this data helps build your reading profile for better recommendations!",
        options: [
          { text: "Set reading goals", action: "setReadingGoals" }
        ]
      });
    },
    
    showTutorials() {
      this.addAgentMessage({
        text: "We have step-by-step tutorials for all major features. Go to Settings > Help > Tutorials to view them. Would you like me to show you a specific tutorial now?",
        options: [
          { text: "QR scanning tutorial", action: "qrTutorial" },
          { text: "Reading goals tutorial", action: "goalsTutorial" }
        ]
      });
    },
    
    whatsNew() {
      this.addAgentMessage({
        text: "🆕 Latest app updates:\n• Enhanced AI recommendation engine\n• Daily reading suggestions\n• Improved QR code recognition\n• Dark mode for nighttime reading\n• Reading insights with detailed analytics\n• Mini AI agents (like me!) to assist you"
      });
    },
    
    // Additional methods would be implemented for all the other actions
    // This is just a sampling to demonstrate the concept
  }
};
</script>

<style scoped>
.ai-mini-agent {
  position: fixed;
  bottom: 20px;
  width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  transition: height 0.3s ease;
  z-index: 100;
}

.ai-mini-agent.profile {
  right: 20px;
  background-color: #e9f5ff;
}

.ai-mini-agent.support {
  right: 330px;
  background-color: #fff5e6;
}

.ai-mini-agent.app {
  right: 640px;
  background-color: #f0f8f0;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
}

.ai-mini-agent.profile .agent-header {
  background-color: #0078d4;
  color: white;
}

.ai-mini-agent.support .agent-header {
  background-color: #f7931e;
  color: white;
}

.ai-mini-agent.app .agent-header {
  background-color: #37a158;
  color: white;
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-avatar {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 50%;
  background-color: white;
  color: #333;
}

.agent-name {
  font-weight: 500;
}

.agent-body {
  height: 350px;
  display: flex;
  flex-direction: column;
}

.agent-conversation {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.message.user {
  align-self: flex-end;
  background-color: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.ai-mini-agent.profile .message.user {
  background-color: #e3f2fd;
}

.ai-mini-agent.support .message.user {
  background-color: #fff3e0;
}

.ai-mini-agent.app .message.user {
  background-color: #e8f5e9;
}

.message.agent {
  align-self: flex-start;
  background-color: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.option-button {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.ai-mini-agent.profile .option-button:hover {
  background-color: #0078d4;
  color: white;
  border-color: #0078d4;
}

.ai-mini-agent.support .option-button:hover {
  background-color: #f7931e;
  color: white;
  border-color: #f7931e;
}

.ai-mini-agent.app .option-button:hover {
  background-color: #37a158;
  color: white;
  border-color: #37a158;
}

.input-area {
  padding: 12px;
  display: flex;
  gap: 8px;
  background-color: white;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  font-size: 14px;
  outline: none;
}

.send-button {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.ai-mini-agent.profile .send-button {
  background-color: #0078d4;
}

.ai-mini-agent.profile .send-button:hover:not(:disabled) {
  background-color: #005a9e;
}

.ai-mini-agent.support .send-button {
  background-color: #f7931e;
}

.ai-mini-agent.support .send-button:hover:not(:disabled) {
  background-color: #e07c0a;
}

.ai-mini-agent.app .send-button {
  background-color: #37a158;
}

.ai-mini-agent.app .send-button:hover:not(:disabled) {
  background-color: #2a8046;
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #aaa;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@media (max-width: 992px) {
  .ai-mini-agent.support {
    right: 20px;
    bottom: 400px;
  }
  
  .ai-mini-agent.app {
    right: 20px;
    bottom: 210px;
  }
}

@media (max-width: 768px) {
  .ai-mini-agent {
    width: calc(100% - 40px);
  }
}
</style>
