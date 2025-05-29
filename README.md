# Check-In Prototype

A QR code-based tool for physical books that instantly provides AI-generated summaries (via Mistral 7B/BART), aggregated reviews (from Open Library/Goodreads), price comparisons (Amazon, Bookshop.org), and personalized recommendations. Targets independent bookstores, libraries, and schools to boost engagement and compete with Amazon’s recommendation engine. Features include dynamic QR code generation, real-time analytics for publishers, and affiliate revenue from price-comparison links. Monetized via tiered subscriptions (Basic, Pro) and freemium upgrades.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB account (the app uses MongoDB Atlas by default)

### Quick Setup (Cross-Platform)

The easiest way to set up the application is by running the setup script, which automatically:
- Finds available ports for both server and client
- Creates necessary environment files
- Sets up configuration for cross-environment compatibility
- Installs dependencies

```bash
# Clone the repository
git clone https://github.com/KylerCWK/check-in-prototype.git
cd Check-In-Prototype/project

# Run the setup script
npm run setup

# Start the application
npm run dev
```

### Manual Setup

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