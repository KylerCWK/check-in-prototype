require('dotenv').config(); // load .env from root of server/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);

mongoose.connect(process.env.MONGO_URI)

.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch(err => console.error(err));
