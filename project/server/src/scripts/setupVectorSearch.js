/**
 * MongoDB Atlas Vector Search Index Setup Script
 * 
 * This script provides the necessary commands and configuration
 * to set up vector search indexes in MongoDB Atlas.
 * 
 * NOTE: Vector search indexes must be created through MongoDB Atlas UI
 * or mongosh command line tool - they cannot be created via Mongoose.
 */

const setupInstructions = `
=== MONGODB ATLAS VECTOR SEARCH SETUP ===

1. LOG INTO MONGODB ATLAS
   - Go to https://cloud.mongodb.com
   - Navigate to your cluster

2. CREATE VECTOR SEARCH INDEX
   - Go to "Atlas Search" section
   - Click "Create Search Index"
   - Choose "JSON Editor"
   - Use the configuration below

3. VECTOR SEARCH INDEX CONFIGURATION:

{
  "fields": [
    {
      "type": "vector",
      "path": "embeddings.combined",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "vector", 
      "path": "embeddings.semantic",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "vector",
      "path": "embeddings.emotional", 
      "numDimensions": 128,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "processing.embeddingsGenerated"
    },
    {
      "type": "filter",
      "path": "genres"
    },
    {
      "type": "filter",
      "path": "_id"
    }
  ]
}

4. INDEX NAME: books_vector_index

5. ALTERNATIVE MONGOSH COMMAND:
If you prefer using mongosh, run these commands in your MongoDB shell:

db.books.createSearchIndex({
  "name": "books_vector_index",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embeddings.combined", 
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "vector",
        "path": "embeddings.semantic",
        "numDimensions": 384, 
        "similarity": "cosine"
      },
      {
        "type": "vector",
        "path": "embeddings.emotional",
        "numDimensions": 128,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "processing.embeddingsGenerated"
      },
      {
        "type": "filter", 
        "path": "genres"
      },
      {
        "type": "filter",
        "path": "_id"
      }
    ]
  }
});

6. VERIFY INDEX CREATION:
After creating the index, verify it's working by running:

db.books.aggregate([
  {
    $vectorSearch: {
      index: "books_vector_index",
      path: "embeddings.combined",
      queryVector: [/* your test vector here */],
      numCandidates: 100,
      limit: 5
    }
  }
]);

=== ENVIRONMENT VARIABLES ===

Add these to your .env file to configure embedding services:

# Embedding Service Configuration
EMBEDDING_PROVIDER=mock # Options: openai, huggingface, cohere, azure, mock
EMBEDDING_MODEL=text-embedding-ada-002
EMBEDDING_DIMENSIONS=768

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Hugging Face Configuration (if using Hugging Face)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Cohere Configuration (if using Cohere)
COHERE_API_KEY=your_cohere_api_key_here

# Azure OpenAI Configuration (if using Azure)
AZURE_OPENAI_API_KEY=your_azure_api_key_here
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here

=== TESTING VECTOR SEARCH ===

1. Use the semantic search endpoint:
POST /api/catalog/semantic-search
{
  "query": "adventure fantasy books",
  "limit": 10
}

2. Monitor the logs to see if vector search is working or falling back to text search.

=== TROUBLESHOOTING ===

Common issues:
1. Index not found: Ensure the index name matches exactly "books_vector_index"
2. Vector dimensions mismatch: Ensure embedding dimensions match the index configuration
3. No embeddings generated: Run the embedding generation script for your books
4. Permission issues: Ensure your Atlas user has search index privileges

For more information, see: https://docs.atlas.mongodb.com/atlas-search/vector-search/
`;

console.log(setupInstructions);

module.exports = {
    setupInstructions,
    
    // Vector search index configuration object
    vectorIndexConfig: {
        "name": "books_vector_index",
        "definition": {
            "fields": [
                {
                    "type": "vector",
                    "path": "embeddings.combined",
                    "numDimensions": 768,
                    "similarity": "cosine"
                },
                {
                    "type": "vector",
                    "path": "embeddings.semantic", 
                    "numDimensions": 384,
                    "similarity": "cosine"
                },
                {
                    "type": "vector",
                    "path": "embeddings.emotional",
                    "numDimensions": 128,
                    "similarity": "cosine"
                },
                {
                    "type": "filter",
                    "path": "processing.embeddingsGenerated"
                },
                {
                    "type": "filter",
                    "path": "genres"
                },
                {
                    "type": "filter",
                    "path": "_id"
                }
            ]
        }
    },

    // Text search index configuration
    textIndexConfig: {
        "name": "books_text_index",
        "definition": {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "title": {
                        "type": "string",
                        "analyzer": "lucene.standard"
                    },
                    "author": {
                        "type": "string", 
                        "analyzer": "lucene.standard"
                    },
                    "description": {
                        "type": "string",
                        "analyzer": "lucene.standard"
                    },
                    "genres": {
                        "type": "string",
                        "analyzer": "lucene.keyword"
                    },
                    "aiAnalysis.themes": {
                        "type": "string",
                        "analyzer": "lucene.standard"
                    },
                    "aiAnalysis.moodTags": {
                        "type": "string",
                        "analyzer": "lucene.standard"
                    }
                }
            }
        }
    }
};
