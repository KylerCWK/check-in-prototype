const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function fetchBookCovers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' });
    console.log('Connected to MongoDB');
    
    // Get all books without cover URLs
    const booksWithoutCovers = await mongoose.connection.db.collection('books').find({ 
      $or: [
        { coverUrl: { $exists: false } },
        { coverUrl: null },
        { coverUrl: '' }
      ]
    }).toArray();
    
    console.log(`Found ${booksWithoutCovers.length} books without covers`);
    
    let updated = 0;
    
    for (const book of booksWithoutCovers) {
      try {
        console.log(`\nSearching for cover: ${book.title} by ${book.author}`);
        
        // Try multiple search strategies
        let coverUrl = null;
        
        // Strategy 1: Search by title and author
        const searchQuery = `${book.title} ${book.author}`.replace(/[^\w\s]/g, '');
        const searchResponse = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=5`);
        
        if (searchResponse.data.docs && searchResponse.data.docs.length > 0) {
          for (const doc of searchResponse.data.docs) {
            if (doc.cover_i) {
              coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
              console.log(`  Found cover via search: ${coverUrl}`);
              break;
            }
          }
        }
        
        // Strategy 2: If no cover found, try ISBN search if available
        if (!coverUrl && book.isbn) {
          const isbnResponse = await axios.get(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`, {
            maxRedirects: 0,
            validateStatus: function (status) {
              return status < 400; // Accept any status less than 400
            }
          });
          
          if (isbnResponse.status === 200) {
            coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
            console.log(`  Found cover via ISBN: ${coverUrl}`);
          }
        }
        
        // Strategy 3: If still no cover, use a placeholder or default
        if (!coverUrl) {
          // Try to find a cover based on genre or use a generic book cover
          coverUrl = '/default-cover.png';
          console.log(`  No cover found, using default`);
        }
        
        // Update the book with the cover URL
        await mongoose.connection.db.collection('books').updateOne(
          { _id: book._id },
          { $set: { coverUrl: coverUrl } }
        );
        
        updated++;
        console.log(`  Updated: ${book.title}`);
        
        // Be nice to the API
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`  Error processing ${book.title}:`, error.message);
      }
    }
    
    console.log(`\nUpdate complete. Updated ${updated} books with cover URLs.`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fetchBookCovers();
