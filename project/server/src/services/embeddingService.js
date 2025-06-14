/**
 * Embedding Service for generating vector embeddings
 * Supports multiple embedding providers and models
 */

// For production use, uncomment and configure your preferred embedding service:
// const { Configuration, OpenAIApi } = require('openai');
// const { HfInference } = require('@huggingface/inference');

class EmbeddingService {
    constructor() {
        this.provider = process.env.EMBEDDING_PROVIDER || 'mock';
        this.model = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
        this.dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
        
        this.initializeProvider();
    }

    initializeProvider() {
        switch (this.provider) {
            case 'openai':
                this.initializeOpenAI();
                break;
            case 'huggingface':
                this.initializeHuggingFace();
                break;
            case 'cohere':
                this.initializeCohere();
                break;
            case 'azure':
                this.initializeAzureOpenAI();
                break;
            default:
                console.log('Using mock embedding service. Configure a real provider for production.');
                break;
        }
    }

    initializeOpenAI() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not found, falling back to mock embeddings');
            this.provider = 'mock';
            return;
        }
        
        // Uncomment for production use:
        /*
        const { Configuration, OpenAIApi } = require('openai');
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.client = new OpenAIApi(configuration);
        */
    }

    initializeHuggingFace() {
        if (!process.env.HUGGINGFACE_API_KEY) {
            console.warn('HUGGINGFACE_API_KEY not found, falling back to mock embeddings');
            this.provider = 'mock';
            return;
        }
        
        // Uncomment for production use:
        /*
        const { HfInference } = require('@huggingface/inference');
        this.client = new HfInference(process.env.HUGGINGFACE_API_KEY);
        */
    }

    initializeCohere() {
        if (!process.env.COHERE_API_KEY) {
            console.warn('COHERE_API_KEY not found, falling back to mock embeddings');
            this.provider = 'mock';
            return;
        }
        
        // Uncomment for production use:
        /*
        const cohere = require('cohere-ai');
        cohere.init(process.env.COHERE_API_KEY);
        this.client = cohere;
        */
    }

    initializeAzureOpenAI() {
        if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
            console.warn('Azure OpenAI credentials not found, falling back to mock embeddings');
            this.provider = 'mock';
            return;
        }
        
        // Initialize Azure OpenAI client
        // Implementation depends on Azure OpenAI SDK
    }

    /**
     * Generate embeddings for text input
     * @param {string|string[]} input - Text or array of texts to embed
     * @param {Object} options - Additional options
     * @returns {Promise<number[]|number[][]>} - Embedding vector(s)
     */
    async generateEmbedding(input, options = {}) {
        const isArray = Array.isArray(input);
        const texts = isArray ? input : [input];

        try {
            switch (this.provider) {
                case 'openai':
                    return await this.generateOpenAIEmbedding(texts, options);
                case 'huggingface':
                    return await this.generateHuggingFaceEmbedding(texts, options);
                case 'cohere':
                    return await this.generateCohereEmbedding(texts, options);
                case 'azure':
                    return await this.generateAzureEmbedding(texts, options);
                default:
                    return await this.generateMockEmbedding(texts, options);
            }
        } catch (error) {
            console.error('Error generating embeddings:', error);
            // Fallback to mock embeddings
            const mockResults = await this.generateMockEmbedding(texts, options);
            return isArray ? mockResults : mockResults[0];
        }
    }

    async generateOpenAIEmbedding(texts, options) {
        /*
        // Uncomment for production use:
        const response = await this.client.createEmbedding({
            model: options.model || this.model,
            input: texts,
        });
        
        const embeddings = response.data.data.map(item => item.embedding);
        return Array.isArray(input) ? embeddings : embeddings[0];
        */
        
        // Mock implementation
        return await this.generateMockEmbedding(texts, options);
    }

    async generateHuggingFaceEmbedding(texts, options) {
        /*
        // Uncomment for production use:
        const model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
        const embeddings = [];
        
        for (const text of texts) {
            const response = await this.client.featureExtraction({
                model: model,
                inputs: text,
            });
            embeddings.push(response);
        }
        
        return Array.isArray(input) ? embeddings : embeddings[0];
        */
        
        // Mock implementation
        return await this.generateMockEmbedding(texts, options);
    }

    async generateCohereEmbedding(texts, options) {
        /*
        // Uncomment for production use:
        const response = await this.client.embed({
            texts: texts,
            model: options.model || 'embed-english-v2.0',
        });
        
        return Array.isArray(input) ? response.body.embeddings : response.body.embeddings[0];
        */
        
        // Mock implementation
        return await this.generateMockEmbedding(texts, options);
    }

    async generateAzureEmbedding(texts, options) {
        // Azure OpenAI implementation would go here
        return await this.generateMockEmbedding(texts, options);
    }    async generateMockEmbedding(texts, options) {
        // Generate deterministic but varied embeddings for consistent testing
        // Use custom dimensions if provided, otherwise fall back to default
        const dimensions = options?.dimensions || this.dimensions;
        
        return texts.map(text => {
            const embedding = new Array(dimensions).fill(0);
            
            for (let i = 0; i < dimensions; i++) {
                // Create pseudo-embedding based on text content
                const hash = this.simpleHash(text + i);
                embedding[i] = (hash % 200 - 100) / 100; // Values between -1 and 1
            }
            
            // Normalize the vector
            const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            if (magnitude > 0) {
                for (let i = 0; i < embedding.length; i++) {
                    embedding[i] /= magnitude;
                }
            }
            
            return embedding;
        });
    }

    /**
     * Generate embeddings optimized for book content
     * @param {Object} bookData - Book data object
     * @returns {Promise<Object>} - Object with different embedding types
     */
    async generateBookEmbeddings(bookData) {
        try {
            const {
                title,
                author,
                description,
                genres = [],
                themes = [],
                moodTags = []
            } = bookData;

            // Combine different text elements for various embedding types
            const textualContent = `${title} by ${author}. ${description || ''}`;
            const semanticContent = `${title} ${themes.join(' ')} ${moodTags.join(' ')} ${description || ''}`;
            const styleContent = `Genre: ${genres.join(', ')}. Author: ${author}. ${description || ''}`;
            const emotionalContent = `${moodTags.join(' ')} ${themes.join(' ')} emotional tone and feeling`;
            
            // Generate combined content for the primary embedding
            const combinedContent = `${textualContent} ${genres.join(' ')} ${themes.join(' ')} ${moodTags.join(' ')}`;            // Generate embeddings for different aspects with correct dimensions for Atlas
            const [textual, semantic, style, emotional, combined] = await Promise.all([
                this.generateEmbedding(textualContent, { dimensions: 512 }),     // textual - not used in Atlas
                this.generateEmbedding(semanticContent, { dimensions: 384 }),    // semantic - used in Atlas  
                this.generateEmbedding(styleContent, { dimensions: 256 }),       // style - not used in Atlas
                this.generateEmbedding(emotionalContent, { dimensions: 128 }),   // emotional - used in Atlas
                this.generateEmbedding(combinedContent, { dimensions: 384 })     // combined - main vector in Atlas
            ]);

            return {
                textual: textual[0] || textual,
                semantic: semantic[0] || semantic,
                style: style[0] || style,
                emotional: emotional[0] || emotional,
                combined: combined[0] || combined
            };

        } catch (error) {
            console.error('Error generating book embeddings:', error);
            return this.generateFallbackBookEmbeddings();
        }
    }    generateFallbackBookEmbeddings() {
        // Return zero vectors as fallback with correct dimensions for Atlas index
        // Atlas expects: combined=384, semantic=384, emotional=128
        return {
            textual: new Array(512).fill(0),      // Not used in Atlas index
            semantic: new Array(384).fill(0),     // Used in Atlas index
            style: new Array(256).fill(0),        // Not used in Atlas index
            emotional: new Array(128).fill(0),    // Used in Atlas index
            combined: new Array(384).fill(0)      // Used in Atlas index (main vector)
        };
    }

    // Simple hash function for deterministic pseudo-embeddings
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Get similarity between two embeddings
     * @param {number[]} embedding1 
     * @param {number[]} embedding2 
     * @returns {number} Cosine similarity score
     */
    calculateSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
            return 0;
        }

        const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
        const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }
}

// Export singleton instance
module.exports = new EmbeddingService();
