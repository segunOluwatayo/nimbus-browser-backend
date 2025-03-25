const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const securityMiddleware = require('./middleware/security');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const tabRoutes = require('./routes/tabRoutes');
const historyRoutes = require('./routes/historyRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Apply security middleware
securityMiddleware(app);

app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/passwords', passwordRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


// Connect to MongoDB Atlas
connectDB();

// Basic route to test the server
app.get('/', (req, res) => {
  res.send('Nimbus Browser Backend is running.');
});

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Import and set up Socket.io synchronization
const setupSyncSocket = require('./sockets/syncSocket');
setupSyncSocket(server);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start the server using the HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
