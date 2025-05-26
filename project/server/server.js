const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./src/models/User');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

app.get('/', (req, res) => res.send('Hello from backend!'));
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered!' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

//app.listen(3000, () => console.log('Server running on http://localhost:3000'));