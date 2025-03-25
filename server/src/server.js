const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const securityMiddleware = require('./middleware/security');

const app = express();

// Middleware to parse JSON
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


// Apply security middleware
securityMiddleware(app);

// Connect to MongoDB Atlas
connectDB();

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Nimbus Browser Backend is running.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
