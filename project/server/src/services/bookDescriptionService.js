/**
 * Enhanced Book Description Service
 * Fetches full descriptions from Open Library and generates AI-enhanced summaries
 */

const axios = require('axios');
const Book = require('../models/Book');
const { HfInference } = require('@huggingface/inference');

class BookDescriptionService {
    constructor() {
        this.BASE_URL = 'https://openlibrary.org';
        this.hf = null;
        this.initializeHuggingFace();
    }

    initializeHuggingFace() {
        if (process.env.HUGGINGFACE_API_KEY) {
            this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
            console.log('✅ Hugging Face initialized for description enhancement');
        } else {
            console.warn('⚠️ HUGGINGFACE_API_KEY not found - AI enhancements will be skipped');
        }
    }

    /**
     * Enhance all books with missing or poor descriptions
     */
    async enhanceAllBookDescriptions() {
        try {
            console.log('🔍 Finding books with missing or incomplete descriptions...');
            
            // Find books without descriptions or with very short ones
            const booksToEnhance = await Book.find({
                $or: [
                    { description: { $exists: false } },
                    { description: '' },
                    { description: { $regex: /^.{0,50}$/ } }, // Less than 50 characters
                    { 'aiAnalysis.enhancedDescription': { $exists: false } }
                ]
            });

            console.log(`📚 Found ${booksToEnhance.length} books that need description enhancement`);

            let enhanced = 0;
            let failed = 0;

            for (let i = 0; i < booksToEnhance.length; i++) {
                const book = booksToEnhance[i];
                console.log(`\n🔄 Processing ${i + 1}/${booksToEnhance.length}: "${book.title}"`);

                try {
                    const result = await this.enhanceBookDescription(book);
                    if (result.enhanced) {
                        enhanced++;
                        console.log(`✅ Enhanced: ${book.title}`);
                    } else {
                        console.log(`⚠️ No enhancement needed: ${book.title}`);
                    }
                } catch (error) {
                    failed++;
                    console.error(`❌ Failed to enhance "${book.title}":`, error.message);
                }

                // Add delay to respect API limits
                if (i < booksToEnhance.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`\n📊 Enhancement Summary:`);
            console.log(`✅ Enhanced: ${enhanced}`);
            console.log(`❌ Failed: ${failed}`);
            console.log(`📚 Total processed: ${booksToEnhance.length}`);

            return { enhanced, failed, total: booksToEnhance.length };

        } catch (error) {
            console.error('Error enhancing book descriptions:', error);
            throw error;
        }
    }

    /**
     * Enhance a single book's description
     */
    async enhanceBookDescription(book) {
        try {
            let updated = false;
            let openLibraryDescription = book.description;

            // Step 1: Try to get full description from Open Library if missing/short
            if (!book.description || book.description.length < 100) {
                console.log(`  📖 Fetching description from Open Library...`);
                openLibraryDescription = await this.fetchOpenLibraryDescription(book.olid);
                
                if (openLibraryDescription && openLibraryDescription !== book.description) {
                    book.description = openLibraryDescription;
                    updated = true;
                    console.log(`  ✅ Updated with Open Library description (${openLibraryDescription.length} chars)`);
                }
            }

            // Step 2: Generate AI-enhanced description if we have source material
            if (this.hf && openLibraryDescription && openLibraryDescription.length > 50) {
                console.log(`  🤖 Generating AI-enhanced description...`);
                
                const aiDescription = await this.generateAIEnhancedDescription(
                    book.title,
                    book.author,
                    openLibraryDescription,
                    book.genres
                );

                if (aiDescription) {
                    // Initialize aiAnalysis if it doesn't exist
                    if (!book.aiAnalysis) {
                        book.aiAnalysis = {};
                    }
                    
                    book.aiAnalysis.enhancedDescription = aiDescription;
                    book.aiAnalysis.lastDescriptionUpdate = new Date();
                    updated = true;
                    console.log(`  ✅ Generated AI-enhanced description (${aiDescription.length} chars)`);
                }
            }

            // Step 3: Save if updated
            if (updated) {
                await book.save();
                return { enhanced: true, book };
            }

            return { enhanced: false, book };

        } catch (error) {
            console.error(`Error enhancing description for "${book.title}":`, error.message);
            throw error;
        }
    }

    /**
     * Fetch detailed description from Open Library
     */
    async fetchOpenLibraryDescription(olid) {
        try {
            // Try work endpoint first
            const workUrl = `${this.BASE_URL}/works/${olid}.json`;
            const workResponse = await axios.get(workUrl, { timeout: 10000 });
            
            if (workResponse.data.description) {
                let description = workResponse.data.description;
                
                // Handle different description formats
                if (typeof description === 'object' && description.value) {
                    description = description.value;
                } else if (typeof description === 'string') {
                    description = description;
                } else {
                    description = '';
                }

                // Clean up the description
                description = this.cleanDescription(description);
                
                if (description && description.length > 50) {
                    return description;
                }
            }

            // If work description is not available, try edition descriptions
            const editionsUrl = `${this.BASE_URL}/works/${olid}/editions.json?limit=10`;
            const editionsResponse = await axios.get(editionsUrl, { timeout: 10000 });
            
            if (editionsResponse.data.entries) {
                for (const edition of editionsResponse.data.entries) {
                    if (edition.description) {
                        let description = edition.description;
                        
                        if (typeof description === 'object' && description.value) {
                            description = description.value;
                        }
                        
                        description = this.cleanDescription(description);
                        
                        if (description && description.length > 50) {
                            return description;
                        }
                    }
                }
            }

            return null;

        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.response?.status === 404) {
                console.log(`  ⚠️ Book not found in Open Library: ${olid}`);
            } else {
                console.error(`  ❌ Error fetching from Open Library:`, error.message);
            }
            return null;
        }
    }    /**
     * Clean and normalize description text
     */
    cleanDescription(description) {
        if (!description || typeof description !== 'string') {
            return '';
        }

        return description
            .replace(/\\n/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^["']|["']$/g, '')
            // Remove source citations like [Source][1] [1]: https://...
            .replace(/\[Source\]\[\d+\]\s*\[\d+\]:\s*https?:\/\/[^\s]+/gi, '')
            // Remove any remaining citation patterns like [1]: url
            .replace(/\[\d+\]:\s*https?:\/\/[^\s]+/gi, '')
            // Remove citation references like [Source][1] or [1]
            .replace(/\[Source\]\[\d+\]/gi, '')
            .replace(/\[\d+\]/g, '')
            // Clean up any double spaces left by removals
            .replace(/\s+/g, ' ')
            .trim();
    }/**
     * Generate AI-enhanced description using Hugging Face or fallback to rule-based enhancement
     */
    async generateAIEnhancedDescription(title, author, originalDescription, genres = []) {
        // Try Hugging Face first if available
        if (this.hf) {
            try {
                const genreText = genres.length > 0 ? genres.slice(0, 3).join(', ') : 'fiction';
                const prompt = `Book Title: "${title}" by ${author}
Genre: ${genreText}

Original Description: ${originalDescription}

Create a complete, compelling book description including all key plot elements. Keep the original content intact but enhance it with literary flair:

Book Description:`;                const response = await this.hf.textGeneration({
                    model: 'gpt2',  // Using more compatible model
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 300,  // Smaller token limit for GPT-2
                        temperature: 0.7,
                        top_p: 0.92,
                        do_sample: true,
                        return_full_text: false
                    }
                });

                let enhancedDescription = response.generated_text;

                // Extract just the generated part after our prompt
                if (enhancedDescription.includes('Book Description:')) {
                    enhancedDescription = enhancedDescription
                        .split('Book Description:')[1]
                        .trim();
                }

                // Clean up the response
                enhancedDescription = enhancedDescription
                    .replace(/^["']|["']$/g, '')
                    .replace(/\n+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Validate the response
                if (enhancedDescription.length > 100) {
                    console.log('  ✅ Generated Hugging Face AI-enhanced description');
                    
                    // Add AI insights
                    const aiInsights = this.generateAIInsights(title, author, enhancedDescription, genres);
                    return enhancedDescription + '\n\n' + aiInsights;
                }

            } catch (error) {
                console.log('  ⚠️ Hugging Face generation failed, falling back to rule-based enhancement');
                console.error('  Error details:', error.message);
            }
        }

        // Fallback to rule-based enhancement
        return this.generateRuleBasedEnhancement(title, author, originalDescription, genres);
    }    /**
     * Generate rule-based enhanced description as fallback
     */
    generateRuleBasedEnhancement(title, author, originalDescription, genres = []) {
        try {
            // Extract key phrases and themes from the original description
            const description = originalDescription.toLowerCase();
            const sentences = originalDescription.split(/[.!?]+/).filter(s => s.trim().length > 10);
            
            if (sentences.length === 0) return null;

            // Define enhancement patterns based on genre
            const genreEnhancements = {
                'fantasy': ['magical', 'epic', 'enchanting', 'mystical', 'otherworldly'],
                'science fiction': ['futuristic', 'thought-provoking', 'innovative', 'visionary', 'cutting-edge'],
                'mystery': ['gripping', 'suspenseful', 'intriguing', 'puzzling', 'thrilling'],
                'romance': ['heartwarming', 'passionate', 'emotional', 'captivating', 'tender'],
                'horror': ['chilling', 'haunting', 'spine-tingling', 'terrifying', 'atmospheric'],
                'historical': ['immersive', 'richly detailed', 'authentic', 'evocative', 'compelling'],
                'biography': ['inspiring', 'revealing', 'intimate', 'enlightening', 'profound'],
                'thriller': ['heart-pounding', 'intense', 'explosive', 'adrenaline-fueled', 'electrifying']
            };

            // Find primary genre and get enhancement words
            const primaryGenre = genres.find(g => 
                Object.keys(genreEnhancements).some(key => 
                    g.toLowerCase().includes(key)
                )
            );
            
            let enhancementWords = ['compelling', 'engaging', 'remarkable', 'captivating'];
            if (primaryGenre) {
                const genreKey = Object.keys(genreEnhancements).find(key => 
                    primaryGenre.toLowerCase().includes(key)
                );
                if (genreKey) {
                    enhancementWords = genreEnhancements[genreKey];
                }
            }

            // Use the whole original description with improvements
            let enhanced = '';
            const enhancementWord = enhancementWords[Math.floor(Math.random() * enhancementWords.length)];
            
            // Format the complete description without random cutoffs
            if (originalDescription.length > 0) {
                enhanced = originalDescription;
            } else if (sentences.length > 0) {
                // If original description is somehow mangled, rebuild from sentences
                enhanced = sentences.join('. ');
            } else {
                // Fallback if no content available
                enhanced = `A ${enhancementWord} ${primaryGenre || 'literary'} work by ${author}.`;
            }
            
            // Make sure we don't have any abrupt endings
            if (!enhanced.endsWith('.') && !enhanced.endsWith('!') && !enhanced.endsWith('?')) {
                enhanced += '.';
            }            // Generate AI insights based on genre and content
            const aiInsights = this.generateAIInsights(title, author, enhanced, genres);

            console.log('  ✅ Generated rule-based enhanced description with AI insights');
            
            // Return the enhanced description with embedded AI insights
            return enhanced + '\n\n' + aiInsights;

        } catch (error) {
            console.error('  ❌ Error in rule-based enhancement:', error.message);
            return null;
        }
    }

    /**
     * Generate specific AI insights for a book
     */
    generateAIInsights(title, author, description, genres = []) {
        try {
            // Define meaningful themes by genre
            const genreThemes = {
                'fantasy': ['heroic journey', 'magical discovery', 'quest', 'transformation', 'good vs evil'],
                'science fiction': ['technological ethics', 'future society', 'human evolution', 'exploration', 'artificial intelligence'],
                'mystery': ['deduction', 'justice', 'moral ambiguity', 'investigation', 'truth'],
                'romance': ['emotional connection', 'vulnerability', 'relationships', 'self-discovery', 'commitment'],
                'horror': ['fear', 'survival', 'psychological dread', 'unknown', 'human nature'],
                'historical': ['cultural perspective', 'period authenticity', 'societal change', 'historical significance'],
                'biography': ['personal growth', 'overcoming adversity', 'legacy', 'influence', 'motivation'],
                'thriller': ['suspense', 'moral complexity', 'resilience', 'danger', 'conflict resolution'],
                'young adult': ['coming of age', 'identity', 'belonging', 'friendship', 'first experiences'],
                'literary': ['human condition', 'social commentary', 'introspection', 'philosophical questions']
            };
            
            // Extract themes for this book
            let bookThemes = ['human experience', 'narrative storytelling']; // default themes
            
            for (const [genreKey, themes] of Object.entries(genreThemes)) {
                if (genres.some(g => g.toLowerCase().includes(genreKey.toLowerCase()))) {
                    // Get 2-3 relevant themes for this genre
                    const selectedThemes = themes.sort(() => 0.5 - Math.random()).slice(0, Math.min(3, themes.length));
                    bookThemes = selectedThemes;
                    break;
                }
            }
            
            // Keywords extraction (simple version - extract interesting words from description)
            let keywords = description.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(' ')
                .filter(word => word.length > 5)
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort(() => 0.5 - Math.random())
                .slice(0, 5);
            
            // Generate specific insights about the themes
            const themeInsight = bookThemes.slice(0, 2).join(' and ');
            const mainTheme = bookThemes[0];
            
            // Format the AI insights section
            let insights = `AI Insights\n\n`;
            insights += `In "${title}", ${author} masterfully explores themes of ${themeInsight}, `;
            
            // Add content based on genre
            if (genres.some(g => g.toLowerCase().includes('fantasy') || g.toLowerCase().includes('adventure'))) {
                insights += `taking readers on an unforgettable journey through richly imagined worlds and compelling character arcs. `;
            } else if (genres.some(g => g.toLowerCase().includes('mystery') || g.toLowerCase().includes('thriller'))) {
                insights += `crafting a suspenseful narrative that keeps readers guessing while examining deeper questions about truth and perception. `;
            } else if (genres.some(g => g.toLowerCase().includes('romance'))) {
                insights += `delving into the complexities of human relationships with emotional depth and authentic character development. `;
            } else if (genres.some(g => g.toLowerCase().includes('science'))) {
                insights += `presenting thought-provoking scenarios that challenge our understanding of technology and humanity's future. `;
            } else if (genres.some(g => g.toLowerCase().includes('historical'))) {
                insights += `bringing historical events to life through meticulous research and compelling personal narratives. `;
            } else {
                insights += `offering readers profound insights into the human condition through skillful storytelling and memorable characters. `;
            }
            
            // Add specific value proposition
            insights += `This book stands out for its ${mainTheme === 'human experience' ? 'nuanced portrayal of complex characters' : `exploration of ${mainTheme}`} `;
            insights += `and will resonate especially with readers who appreciate literature that ${bookThemes.length > 1 ? `examines ${bookThemes[1]} with depth and originality` : 'challenges conventional perspectives'}.`;
            
            return insights;
        } catch (error) {
            console.error('  ⚠️ Error generating AI insights:', error.message);
            // Fallback to simple insight
            return `AI Insights\n\nThis book explores universal themes with depth and nuance, offering readers valuable perspectives on the human experience through engaging storytelling.`;
        }
    }

    /**
     * Get enhanced description for a book (for API responses)
     */
    getBookDescription(book) {
        // Priority: AI enhanced -> Original -> Fallback
        if (book.aiAnalysis?.enhancedDescription) {
            return {
                type: 'ai_enhanced',
                text: book.aiAnalysis.enhancedDescription,
                fallback: book.description || `A ${book.genres?.[0] || 'book'} by ${book.author}.`
            };
        }

        if (book.description && book.description.length > 50) {
            return {
                type: 'original',
                text: book.description,
                fallback: null
            };
        }

        // Generate a basic fallback description
        const genreText = book.genres?.[0] ? ` ${book.genres[0]}` : '';
        const fallback = `A compelling${genreText} work by ${book.author}. Discover what makes "${book.title}" a noteworthy addition to any reading list.`;

        return {
            type: 'fallback',
            text: fallback,
            fallback: null
        };
    }
}

module.exports = BookDescriptionService;
