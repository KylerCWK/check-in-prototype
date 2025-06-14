/**
 * Vector Search Testing Script
 * 
 * This script tests the new MongoDB vector search functionality
 * and compares it with traditional search methods.
 */

const mongoose = require('mongoose');
const Book = require('../models/Book');
const embeddingService = require('../services/embeddingService');
const { getRecommendedBooks, getSimilarBooks, getNewReleasesForUser } = require('../services/aiService');
require('dotenv').config();

class VectorSearchTester {
    constructor() {
        this.testResults = {
            vectorSearch: { success: 0, failed: 0, totalTime: 0 },
            textSearch: { success: 0, failed: 0, totalTime: 0 },
            recommendations: { success: 0, failed: 0, totalTime: 0 },
            similarBooks: { success: 0, failed: 0, totalTime: 0 }
        };
    }

    async runAllTests() {
        try {
            console.log('🧪 Starting Vector Search Testing Suite\n');

            // Connect to MongoDB
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
            console.log('📊 Connected to MongoDB\n');

            // Test 1: Vector Search vs Text Search
            await this.testVectorVsTextSearch();

            // Test 2: Recommendation Performance
            await this.testRecommendationPerformance();

            // Test 3: Similar Books Performance
            await this.testSimilarBooksPerformance();

            // Test 4: Embedding Quality
            await this.testEmbeddingQuality();

            // Test 5: Search Relevance
            await this.testSearchRelevance();

            // Generate report
            this.generateReport();

        } catch (error) {
            console.error('❌ Error in testing suite:', error);
        } finally {
            await mongoose.connection.close();
            console.log('\n🔌 Database connection closed');
        }
    }

    async testVectorVsTextSearch() {
        console.log('🔍 Testing Vector Search vs Text Search Performance\n');

        const testQueries = [
            'fantasy adventure magic',
            'romantic comedy love story',
            'science fiction space exploration',
            'mystery thriller detective',
            'historical fiction world war',
            'self help productivity mindset',
            'dystopian future society',
            'coming of age young adult'
        ];

        for (const query of testQueries) {
            console.log(`   Testing query: "${query}"`);

            // Test Vector Search
            const vectorStartTime = Date.now();
            try {
                const vectorResults = await this.performVectorSearch(query);
                const vectorTime = Date.now() - vectorStartTime;
                
                this.testResults.vectorSearch.success++;
                this.testResults.vectorSearch.totalTime += vectorTime;
                
                console.log(`     ✅ Vector Search: ${vectorResults.length} results in ${vectorTime}ms`);
            } catch (error) {
                this.testResults.vectorSearch.failed++;
                console.log(`     ❌ Vector Search failed: ${error.message}`);
            }

            // Test Text Search
            const textStartTime = Date.now();
            try {
                const textResults = await this.performTextSearch(query);
                const textTime = Date.now() - textStartTime;
                
                this.testResults.textSearch.success++;
                this.testResults.textSearch.totalTime += textTime;
                
                console.log(`     ✅ Text Search: ${textResults.length} results in ${textTime}ms`);
            } catch (error) {
                this.testResults.textSearch.failed++;
                console.log(`     ❌ Text Search failed: ${error.message}`);
            }

            console.log('');
        }
    }

    async testRecommendationPerformance() {
        console.log('🎯 Testing Recommendation Performance\n');

        // Get some test users (or create mock user IDs)
        const testUserIds = ['60f7b1234567890123456789', '60f7b1234567890123456790', '60f7b1234567890123456791'];

        for (const userId of testUserIds) {
            console.log(`   Testing recommendations for user: ${userId}`);

            const startTime = Date.now();
            try {
                const recommendations = await getRecommendedBooks(userId, 10);
                const timeTaken = Date.now() - startTime;
                
                this.testResults.recommendations.success++;
                this.testResults.recommendations.totalTime += timeTaken;
                
                console.log(`     ✅ Generated ${recommendations.length} recommendations in ${timeTaken}ms`);
                
                // Analyze recommendation quality
                const hasVectorSearch = recommendations.some(rec => 
                    rec.metadata?.factors?.includes('vector_search') || 
                    rec.metadata?.factors?.includes('embedding_match')
                );
                
                console.log(`     📊 Uses vector search: ${hasVectorSearch ? 'Yes' : 'No'}`);
                
            } catch (error) {
                this.testResults.recommendations.failed++;
                console.log(`     ❌ Recommendations failed: ${error.message}`);
            }

            console.log('');
        }
    }

    async testSimilarBooksPerformance() {
        console.log('📚 Testing Similar Books Performance\n');

        // Get some test books
        const testBooks = await Book.find({ 'processing.embeddingsGenerated': true }).limit(5);

        for (const book of testBooks) {
            console.log(`   Testing similar books for: ${book.title}`);

            const startTime = Date.now();
            try {
                const similarBooks = await getSimilarBooks(book._id, 5);
                const timeTaken = Date.now() - startTime;
                
                this.testResults.similarBooks.success++;
                this.testResults.similarBooks.totalTime += timeTaken;
                
                console.log(`     ✅ Found ${similarBooks.length} similar books in ${timeTaken}ms`);
                
                // Check search method used
                const searchMethod = similarBooks[0]?.searchMethod || 'unknown';
                console.log(`     🔧 Search method: ${searchMethod}`);
                
            } catch (error) {
                this.testResults.similarBooks.failed++;
                console.log(`     ❌ Similar books failed: ${error.message}`);
            }

            console.log('');
        }
    }

    async testEmbeddingQuality() {
        console.log('📊 Testing Embedding Quality\n');

        const booksWithEmbeddings = await Book.find({ 
            'processing.embeddingsGenerated': true,
            'embeddings.combined': { $exists: true }
        }).limit(10);

        let validEmbeddings = 0;
        let invalidEmbeddings = 0;

        for (const book of booksWithEmbeddings) {
            const isValid = this.validateEmbeddingStructure(book.embeddings);
            
            if (isValid) {
                validEmbeddings++;
                console.log(`   ✅ ${book.title}: Valid embeddings`);
            } else {
                invalidEmbeddings++;
                console.log(`   ❌ ${book.title}: Invalid embeddings`);
            }
        }

        console.log(`\n   📈 Embedding Quality: ${validEmbeddings}/${validEmbeddings + invalidEmbeddings} valid (${((validEmbeddings / (validEmbeddings + invalidEmbeddings)) * 100).toFixed(1)}%)\n`);
    }

    async testSearchRelevance() {
        console.log('🎯 Testing Search Relevance\n');

        const relevanceTests = [
            {
                query: 'harry potter magic school',
                expectedGenres: ['Fantasy', 'Young Adult'],
                description: 'Should find fantasy books about magic schools'
            },
            {
                query: 'romance love story marriage',
                expectedGenres: ['Romance', 'Contemporary Fiction'],
                description: 'Should find romance novels'
            },
            {
                query: 'artificial intelligence technology future',
                expectedGenres: ['Science Fiction', 'Technology'],
                description: 'Should find sci-fi books about AI'
            }
        ];

        for (const test of relevanceTests) {
            console.log(`   Testing: ${test.description}`);
            console.log(`   Query: "${test.query}"`);

            try {
                const results = await this.performVectorSearch(test.query, 10);
                
                if (results.length > 0) {
                    // Analyze genre relevance
                    const genreMatches = results.filter(book => 
                        book.genres?.some(genre => 
                            test.expectedGenres.some(expected => 
                                genre.toLowerCase().includes(expected.toLowerCase())
                            )
                        )
                    );

                    const relevanceScore = (genreMatches.length / results.length) * 100;
                    console.log(`     📊 Relevance Score: ${relevanceScore.toFixed(1)}% (${genreMatches.length}/${results.length} matches)`);
                    
                    if (relevanceScore >= 60) {
                        console.log(`     ✅ Good relevance`);
                    } else if (relevanceScore >= 30) {
                        console.log(`     ⚠️  Moderate relevance`);
                    } else {
                        console.log(`     ❌ Poor relevance`);
                    }
                } else {
                    console.log(`     ❌ No results found`);
                }

            } catch (error) {
                console.log(`     ❌ Search failed: ${error.message}`);
            }

            console.log('');
        }
    }    async performVectorSearch(query, limit = 20) {
        // Generate query embedding with the correct dimensions for Atlas index (384)
        const queryEmbedding = await embeddingService.generateEmbedding(query, { dimensions: 384 });
        const embedding = Array.isArray(queryEmbedding) ? queryEmbedding[0] : queryEmbedding;

        const pipeline = [
            {
                $vectorSearch: {
                    index: "books_vector_index",
                    path: "embeddings.combined",
                    queryVector: embedding,
                    numCandidates: 100,
                    limit: limit
                }
            },
            {
                $addFields: {
                    vectorSearchScore: { $meta: "vectorSearchScore" }
                }
            },
            {
                $project: {
                    title: 1,
                    author: 1,
                    genres: 1,
                    vectorSearchScore: 1
                }
            }
        ];

        return await Book.aggregate(pipeline);
    }

    async performTextSearch(query, limit = 20) {
        return await Book.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('title author genres');
    }    validateEmbeddingStructure(embeddings) {
        return (
            embeddings &&
            Array.isArray(embeddings.combined) &&
            embeddings.combined.length === 384 &&  // Atlas index expects 384
            Array.isArray(embeddings.semantic) &&
            embeddings.semantic.length === 384 &&  // Atlas index expects 384
            Array.isArray(embeddings.emotional) &&
            embeddings.emotional.length === 128 &&  // Atlas index expects 128
            Array.isArray(embeddings.textual) &&
            embeddings.textual.length === 512 &&   // Not used in Atlas
            Array.isArray(embeddings.style) &&
            embeddings.style.length === 256        // Not used in Atlas
        );
    }

    generateReport() {
        console.log('📋 TEST RESULTS SUMMARY\n');

        const { vectorSearch, textSearch, recommendations, similarBooks } = this.testResults;

        console.log('🔍 SEARCH PERFORMANCE:');
        console.log(`   Vector Search: ${vectorSearch.success} success, ${vectorSearch.failed} failed`);
        if (vectorSearch.success > 0) {
            console.log(`   Average Vector Search Time: ${(vectorSearch.totalTime / vectorSearch.success).toFixed(0)}ms`);
        }
        console.log(`   Text Search: ${textSearch.success} success, ${textSearch.failed} failed`);
        if (textSearch.success > 0) {
            console.log(`   Average Text Search Time: ${(textSearch.totalTime / textSearch.success).toFixed(0)}ms`);
        }

        console.log('\n🎯 RECOMMENDATION PERFORMANCE:');
        console.log(`   Recommendations: ${recommendations.success} success, ${recommendations.failed} failed`);
        if (recommendations.success > 0) {
            console.log(`   Average Recommendation Time: ${(recommendations.totalTime / recommendations.success).toFixed(0)}ms`);
        }

        console.log('\n📚 SIMILAR BOOKS PERFORMANCE:');
        console.log(`   Similar Books: ${similarBooks.success} success, ${similarBooks.failed} failed`);
        if (similarBooks.success > 0) {
            console.log(`   Average Similar Books Time: ${(similarBooks.totalTime / similarBooks.success).toFixed(0)}ms`);
        }

        console.log('\n🏆 OVERALL RESULTS:');
        const totalTests = vectorSearch.success + vectorSearch.failed + textSearch.success + textSearch.failed + 
                          recommendations.success + recommendations.failed + similarBooks.success + similarBooks.failed;
        const totalSuccess = vectorSearch.success + textSearch.success + recommendations.success + similarBooks.success;
        const successRate = ((totalSuccess / totalTests) * 100).toFixed(1);
        
        console.log(`   Success Rate: ${successRate}% (${totalSuccess}/${totalTests})`);
        
        if (successRate >= 90) {
            console.log('   🏆 Excellent performance!');
        } else if (successRate >= 75) {
            console.log('   ✅ Good performance');
        } else if (successRate >= 50) {
            console.log('   ⚠️  Needs improvement');
        } else {
            console.log('   ❌ Poor performance - check configuration');
        }

        console.log('\n📋 RECOMMENDATIONS:');
        if (vectorSearch.failed > 0) {
            console.log('   - Check MongoDB Atlas Vector Search index configuration');
            console.log('   - Verify embedding dimensions match index setup');
        }
        if (recommendations.failed > 0) {
            console.log('   - Ensure user reading profiles are properly initialized');
            console.log('   - Check embedding generation for user preferences');
        }
        if (similarBooks.failed > 0) {
            console.log('   - Verify book embeddings are generated correctly');
            console.log('   - Check vector search fallback mechanisms');
        }
    }
}

// Command line interface
if (require.main === module) {
    const tester = new VectorSearchTester();
    tester.runAllTests();
}

module.exports = VectorSearchTester;
