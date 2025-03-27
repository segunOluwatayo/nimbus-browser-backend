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

app.get('/oauth-callback', (req, res) => {
  const { accessToken, userId, displayName, email, error, mobile } = req.query;
  
  // Handle error case
  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; }
            .error { color: #f44336; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Failed</h1>
          <p>There was a problem signing into your account.</p>
          <p>Error: ${error}</p>
        </body>
      </html>
    `);
  }
  
  // Success case - use the variables in the template
  const userDisplayName = displayName || email || userId || "User";
  const tokenPreview = accessToken ? `${accessToken.substring(0, 10)}...` : "[token not provided]";
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px 20px; }
          .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .loading { margin: 20px auto; width: 50px; height: 50px; border: 5px solid #f3f3f3; 
                    border-top: 5px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .user-info { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px auto; max-width: 400px; }
          .token { font-family: monospace; background: #eee; padding: 4px; border-radius: 4px; }
          .mobile-indicator { color: ${mobile === 'true' ? '#4CAF50' : '#999'}; font-style: italic; }
        </style>
      </head>
      <body>
        <h1 class="success">Authentication Successful!</h1>
        <p>Welcome, ${userDisplayName}!</p>
        
        <div class="user-info">
          <p><strong>User ID:</strong> ${userId || "Not provided"}</p>
          <p><strong>Email:</strong> ${email || "Not provided"}</p>
          <p><strong>Token:</strong> <span class="token">${tokenPreview}</span></p>
          <p class="mobile-indicator">Mobile browser: ${mobile === 'true' ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="loading"></div>
        <p>Your authentication has been processed.</p>
        <p>You can close this window and return to the browser.</p>
      </body>
    </html>
  `);
});
// Start the server using the HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});