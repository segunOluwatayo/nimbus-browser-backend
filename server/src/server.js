// const express = require('express');
// const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config();

// const connectDB = require('./config/db');
// const securityMiddleware = require('./middleware/security');
// const bookmarkRoutes = require('./routes/bookmarkRoutes');
// const tabRoutes = require('./routes/tabRoutes');
// const historyRoutes = require('./routes/historyRoutes');
// const passwordRoutes = require('./routes/passwordRoutes');
// const userRoutes = require('./routes/userRoutes');
// const deviceRoutes = require('./routes/deviceRoutes'); // New import

// const app = express();

// // Middleware to parse JSON
// app.use(express.json());

// // Apply security middleware
// securityMiddleware(app);

// // Serve static files from the uploads directory
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// app.use('/api/bookmarks', bookmarkRoutes);
// app.use('/api/tabs', tabRoutes);
// app.use('/api/history', historyRoutes);
// app.use('/api/passwords', passwordRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/devices', deviceRoutes); // New route

// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);


// // Connect to MongoDB Atlas
// connectDB();

// // Basic route to test the server
// app.get('/', (req, res) => {
//   res.send('Nimbus Browser Backend is running.');
// });

// // Create HTTP server
// const http = require('http');
// const server = http.createServer(app);

// // Import and set up Socket.io synchronization
// const setupSyncSocket = require('./sockets/syncSocket');
// setupSyncSocket(server);

// app.use((err, req, res, next) => {
//   console.error("Unhandled error:", err);
//   res.status(500).json({ message: "Internal server error" });
// });

// // Start the server using the HTTP server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const securityMiddleware = require('./middleware/security');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const tabRoutes = require('./routes/tabRoutes');
const historyRoutes = require('./routes/historyRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Apply security middleware
securityMiddleware(app);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);

// Connect to MongoDB Atlas
connectDB();

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Import and set up Socket.io synchronization
const setupSyncSocket = require('./sockets/syncSocket');
setupSyncSocket(server);

// Serve static files from the React frontend app
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
console.log('Frontend build path:', frontendBuildPath);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendBuildPath));
  
  // Serve the index.html file for any unknown paths (React router will handle it)
  app.get('*', (req, res) => {
    // Only serve index.html for non-API requests to allow API routes to work correctly
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    } else {
      // This will fall through to the error handler for unmatched API routes
      res.status(404).json({ message: "API endpoint not found" });
    }
  });
} else {
  // Basic route to test the server in development
  app.get('/', (req, res) => {
    res.send('Nimbus Browser Backend is running in development mode.');
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start the server using the HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});