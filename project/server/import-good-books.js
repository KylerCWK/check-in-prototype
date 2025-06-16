const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./src/models/Book');

// Function to generate fake OLID from title and author
function generateFakeOlid(title, author) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanAuthor = author.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const hash = (cleanTitle + cleanAuthor).substring(0, 10);
    return `OL${hash.padEnd(10, '0')}M`; // Format like real OLIDs: OL1234567890M
}

// Recent bestsellers and popular books 2020-2025
const recentBooks = [
    // 2024-2025 Fiction Bestsellers
    {
        title: "Tomorrow, and Tomorrow, and Tomorrow",
        author: "Gabrielle Zevin",
        isbn: "9780593321201",
        publishDate: new Date('2024-07-05'),
        genres: ["Fiction", "Literary Fiction", "Contemporary"],
        description: "A novel about art, time, identity, and the ways we shape our realities. It follows best friends Sam and Sadie as they create a groundbreaking video game.",
        metadata: {
            publisher: "Knopf",
            pageCount: 416,
            language: "en"
        }
    },
    {
        title: "Lessons in Chemistry",
        author: "Bonnie Garmus",
        isbn: "9780385547345",
        publishDate: new Date('2024-03-15'),
        genres: ["Fiction", "Historical Fiction", "Humor"],
        description: "Set in 1960s California, this novel follows Elizabeth Zott, a scientist whose career takes a detour when she becomes the star of a beloved TV cooking show.",
        metadata: {
            publisher: "Doubleday",
            pageCount: 448,
            language: "en"
        }
    },
    {
        title: "The Atlas Six",
        author: "Olivie Blake",
        isbn: "9781250854445",
        publishDate: new Date('2024-02-20'),
        genres: ["Fantasy", "Dark Academia", "Adult"],
        description: "Six young magicians compete for a place in an ancient society. Only five will be chosen. One will die.",
        metadata: {
            publisher: "Tor Books",
            pageCount: 464,
            language: "en"
        }
    },
    {
        title: "Book Lovers",
        author: "Emily Henry",
        isbn: "9781984806734",
        publishDate: new Date('2024-05-12'),
        genres: ["Romance", "Contemporary", "Fiction"],
        description: "A literary agent finds herself living out the plot of every rom-com she's ever mocked when she keeps running into the same grumpy editor in a small town.",
        metadata: {
            publisher: "Berkley",
            pageCount: 368,
            language: "en"
        }
    },
    {
        title: "The Midnight Library",
        author: "Matt Haig",
        isbn: "9780525559474",
        publishDate: new Date('2023-11-30'),
        genres: ["Fiction", "Philosophy", "Fantasy"],
        description: "Between life and death there is a library where each book represents a different life you could have lived. What would you change?",
        metadata: {
            publisher: "Viking",
            pageCount: 288,
            language: "en"
        }
    },
    
    // 2023-2024 Thrillers/Mystery
    {
        title: "The Thursday Murder Club",
        author: "Richard Osman",
        isbn: "9781984880567",
        publishDate: new Date('2023-09-15'),
        genres: ["Mystery", "Crime", "Humor"],
        description: "Four unlikely friends meet weekly to investigate cold cases, but they soon find themselves pursuing a killer as a fifth member of their team.",
        metadata: {
            publisher: "Pamela Dorman Books",
            pageCount: 368,
            language: "en"
        }
    },
    {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        isbn: "9781250301697",
        publishDate: new Date('2023-12-08'),
        genres: ["Thriller", "Mystery", "Psychological"],
        description: "A woman's act of violence against her husband, and of the therapist obsessed with uncovering her motive.",
        metadata: {
            publisher: "Celadon Books",
            pageCount: 336,
            language: "en"
        }
    },
    {
        title: "The Guest List",
        author: "Lucy Foley",
        isbn: "9780062868930",
        publishDate: new Date('2024-01-25'),
        genres: ["Thriller", "Mystery", "Wedding"],
        description: "A wedding celebration turns dark and deadly in this deliciously wicked thriller.",
        metadata: {
            publisher: "William Morrow",
            pageCount: 320,
            language: "en"
        }
    },
    
    // 2022-2023 Fantasy/Sci-Fi
    {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "9780593135204",
        publishDate: new Date('2022-08-20'),
        genres: ["Science Fiction", "Space", "Humor"],
        description: "A lone astronaut must save the earth when he wakes up on a space station with no memory of how he got there.",
        metadata: {
            publisher: "Ballantine Books",
            pageCount: 496,
            language: "en"
        }
    },
    {
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        isbn: "9780593318171",
        publishDate: new Date('2022-11-10'),
        genres: ["Science Fiction", "Literary Fiction", "AI"],
        description: "From her place in the store, Klara, an artificial friend with outstanding observational qualities, watches carefully the behavior of those who come in to browse.",
        metadata: {
            publisher: "Knopf",
            pageCount: 320,
            language: "en"
        }
    },
    {
        title: "The Invisible Life of Addie LaRue",
        author: "V.E. Schwab",
        isbn: "9780765387561",
        publishDate: new Date('2022-06-30'),
        genres: ["Fantasy", "Romance", "Historical"],
        description: "A woman makes a Faustian bargain to live forever and is cursed to be forgotten by everyone she meets.",
        metadata: {
            publisher: "Tor Books",
            pageCount: 560,
            language: "en"
        }
    },
    
    // Recent Non-Fiction
    {
        title: "Atomic Habits",
        author: "James Clear",
        isbn: "9780735211292",
        publishDate: new Date('2023-03-15'),
        genres: ["Self-Help", "Psychology", "Productivity"],
        description: "An easy & proven way to build good habits & break bad ones. Tiny changes, remarkable results.",
        metadata: {
            publisher: "Avery",
            pageCount: 320,
            language: "en"
        }
    },
    {
        title: "Educated",
        author: "Tara Westover",
        isbn: "9780399590504",
        publishDate: new Date('2023-07-22'),
        genres: ["Memoir", "Biography", "Education"],
        description: "A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University.",
        metadata: {
            publisher: "Random House",
            pageCount: 384,
            language: "en"
        }
    },
    
    // 2024 Romance
    {
        title: "Beach Read",
        author: "Emily Henry",
        isbn: "9781984806772",
        publishDate: new Date('2024-04-18'),
        genres: ["Romance", "Contemporary", "Humor"],
        description: "Two rival writers end up stuck next to each other for the summer and challenge each other to write outside their comfort zones.",
        metadata: {
            publisher: "Berkley",
            pageCount: 352,
            language: "en"
        }
    },
    {
        title: "People We Meet on Vacation",
        author: "Emily Henry",
        isbn: "9781984806758",
        publishDate: new Date('2024-06-05'),
        genres: ["Romance", "Contemporary", "Friends to Lovers"],
        description: "Two best friends. Ten summer trips. One last chance to fall in love.",
        metadata: {
            publisher: "Berkley",
            pageCount: 368,
            language: "en"
        }
    },
    
    // 2025 Anticipated Releases
    {
        title: "The Seven Moons of Maali Almeida",
        author: "Shehan Karunatilaka",
        isbn: "9781641293556",
        publishDate: new Date('2025-01-15'),
        genres: ["Fantasy", "Literary Fiction", "Magical Realism"],
        description: "A photographer wakes up in a cosmic waiting room and has seven moons to solve his own murder and save his friends.",
        metadata: {
            publisher: "Sort of Books",
            pageCount: 416,
            language: "en"
        }
    },
    {
        title: "Babel",
        author: "R.F. Kuang",
        isbn: "9780063021426",
        publishDate: new Date('2025-03-08'),
        genres: ["Fantasy", "Historical", "Dark Academia"],
        description: "A thematic response to the Oxford English Dictionary and the Tower of Babel, about the power of words, language, and translation.",
        metadata: {
            publisher: "Harper Voyager",
            pageCount: 560,
            language: "en"
        }
    },
    
    // YA/Teen favorites
    {
        title: "The Song of Achilles",
        author: "Madeline Miller",
        isbn: "9780062060624",
        publishDate: new Date('2023-05-20'),
        genres: ["Fantasy", "LGBTQ+", "Mythology"],
        description: "A tale of gods, kings, immortal fame and the human heart, The Song of Achilles is a dazzling literary feat.",
        metadata: {
            publisher: "Ecco",
            pageCount: 416,
            language: "en"
        }
    },
    {
        title: "Red, White & Royal Blue",
        author: "Casey McQuiston",
        isbn: "9781250316776",
        publishDate: new Date('2024-02-14'),
        genres: ["Romance", "LGBTQ+", "Contemporary"],
        description: "When the son of the American President falls in love with the Prince of Wales, it threatens to derail a campaign and upend two nations.",
        metadata: {
            publisher: "St. Martin's Griffin",
            pageCount: 432,
            language: "en"
        }
    },
    
    // Recent memoirs/biographies
    {
        title: "Spare",
        author: "Prince Harry",
        isbn: "9780593593806",
        publishDate: new Date('2023-01-10'),
        genres: ["Memoir", "Biography", "Royal Family"],
        description: "Prince Harry tells his story at last, chronicling his journey from trauma to healing.",
        metadata: {
            publisher: "Bantam Doubleday Dell",
            pageCount: 416,
            language: "en"
        }
    },
    
    // Tech/Business books
    {
        title: "The Innovators",
        author: "Walter Isaacson",
        isbn: "9781476708706",
        publishDate: new Date('2022-10-15'),
        genres: ["Technology", "Biography", "History"],
        description: "The story of the people who created the computer and the Internet, showing how their ability to collaborate was what made them so creative.",
        metadata: {
            publisher: "Simon & Schuster",
            pageCount: 560,
            language: "en"
        }
    }
];

async function importRecentBooks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Connected to MongoDB');
        
        console.log(`📚 Importing ${recentBooks.length} recent bestsellers and popular books...`);
        
        let imported = 0;
        let skipped = 0;
        
        for (const bookData of recentBooks) {
            try {                // Check if book already exists
                const fakeOlid = generateFakeOlid(bookData.title, bookData.author);
                const existing = await Book.findOne({ 
                    $or: [
                        { title: bookData.title, author: bookData.author },
                        { isbn: bookData.isbn },
                        { olid: fakeOlid }
                    ]
                });
                
                if (existing) {
                    console.log(`⏭️  Skipping existing book: ${bookData.title}`);
                    skipped++;
                    continue;
                }                // Create the book with enhanced data
                const book = new Book({
                    ...bookData,
                    olid: fakeOlid, // Use the already generated olid
                    source: 'manual_import_recent',
                    dateAdded: new Date(),
                    stats: {
                        viewCount: Math.floor(Math.random() * 1000) + 100,
                        favoriteCount: Math.floor(Math.random() * 200) + 20,
                        averageRating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
                    },
                    aiAnalysis: {
                        themes: generateThemes(bookData.genres),
                        moodTags: generateMoodTags(bookData.genres),
                        complexityScore: Math.floor(Math.random() * 5) + 1,
                        readingTime: Math.floor(Math.random() * 20) + 5
                    }
                });
                
                await book.save();
                console.log(`✅ Imported: ${bookData.title} by ${bookData.author}`);
                imported++;
                
                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (bookError) {
                console.error(`❌ Error importing ${bookData.title}:`, bookError.message);
            }
        }
        
        console.log(`\n📊 Import Summary:`);
        console.log(`✅ Imported: ${imported} books`);
        console.log(`⏭️  Skipped: ${skipped} books`);
        console.log(`📚 Total attempted: ${recentBooks.length} books`);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

function generateThemes(genres) {
    const themeMap = {
        'Romance': ['love', 'relationships', 'passion', 'heartbreak'],
        'Fantasy': ['magic', 'adventure', 'good vs evil', 'coming of age'],
        'Thriller': ['suspense', 'danger', 'mystery', 'justice'],
        'Science Fiction': ['technology', 'future', 'space', 'artificial intelligence'],
        'Mystery': ['investigation', 'secrets', 'justice', 'crime'],
        'Literary Fiction': ['human nature', 'relationships', 'society', 'identity'],
        'Memoir': ['personal growth', 'resilience', 'truth', 'family'],
        'Self-Help': ['improvement', 'habits', 'success', 'motivation']
    };
    
    let themes = [];
    genres.forEach(genre => {
        if (themeMap[genre]) {
            themes.push(...themeMap[genre].slice(0, 2));
        }
    });
    
    return [...new Set(themes)].slice(0, 4);
}

function generateMoodTags(genres) {
    const moodMap = {
        'Romance': ['heartwarming', 'romantic', 'emotional'],
        'Fantasy': ['adventurous', 'magical', 'epic'],
        'Thriller': ['suspenseful', 'intense', 'gripping'],
        'Science Fiction': ['thought-provoking', 'futuristic', 'innovative'],
        'Mystery': ['mysterious', 'intriguing', 'clever'],
        'Literary Fiction': ['contemplative', 'nuanced', 'profound'],
        'Humor': ['funny', 'witty', 'lighthearted'],
        'Contemporary': ['relatable', 'modern', 'realistic']
    };
    
    let moods = [];
    genres.forEach(genre => {
        if (moodMap[genre]) {
            moods.push(...moodMap[genre].slice(0, 2));
        }
    });
    
    return [...new Set(moods)].slice(0, 3);
}

// Run the import
importRecentBooks();
