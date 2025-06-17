# 📚 Bookly

Bookly provides users with access to a large selection of popular books, complete with AI-generated summaries and personalized recommendations. Users can explore titles based on selected genres and add books to their favorites list for future reading. The platform is designed to help readers quickly discover new books they may enjoy, using smart AI features to enhance the experience.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB Atlas account
- Hugging Face Access Key (for AI features)

### Environment Setup (REQUIRED FIRST)

**⚠️ IMPORTANT: Set environment variables BEFORE running setup!**

#### Windows (PowerShell)
```powershell
$env:MONGODB_URI = "your_mongodb_connection_string"
$env:HUGGINGFACE_API_KEY = "your_huggingface_api_key"
```

#### Unix/Linux/macOS
```bash
export MONGODB_URI="your_mongodb_connection_string"
export HUGGINGFACE_API_KEY="your_huggingface_api_key"
```

### Quick Setup (Cross-Platform)

After setting environment variables, run the setup script:

```bash
# Clone the repository
git clone https://github.com/KylerCWK/check-in-prototype.git
cd Check-In-Prototype/project

# Run the setup script (validates environment variables)
node setup.js

# Start the application
npm run dev
```

### Manual Setup

**Note: Manual setup still requires environment variables to be set.**

If you prefer to configure the application manually:

1. Create `.env` file in the `server` directory:
```
PORT=5000 {Your Port}
MONGO_URI=mongodb+srv://your-mongo-uri
JWT_SECRET=your-secret-key
```

2. Create `.env` file in the `client` directory:
```
VITE_PORT=3000 {Your port}
VITE_API_BASE_URL=http://localhost:5000
```

3. Install dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

4. Start the application:
```bash
npm run dev
```

## Troubleshooting

### Port Conflicts

If you encounter port conflicts, the application will automatically try to use the next available port. You can also set custom ports:
- For the server: Edit `PORT` in `server/.env`
- For the client: Edit `VITE_PORT` in `client/.env`

### API Connection Issues

If the client cannot connect to the API:
1. Check that both client and server are running
2. Verify that the `VITE_API_BASE_URL` in `client/.env` matches the server's address
3. Check for CORS issues in browser developer console
