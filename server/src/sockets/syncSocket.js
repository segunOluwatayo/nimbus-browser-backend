const socketIO = require('socket.io');

const setupSyncSocket = (server) => {
  // Initialize Socket.io with CORS options (adjust origins as needed)
  const io = socketIO(server, {
    cors: {
      origin: "*", // TODO: Restrict to allowed domains for production
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Optionally, a client can join a room (e.g., using their userId)
    // socket.on('join', (userId) => {
    //   socket.join(userId);
    //   console.log(`Socket ${socket.id} joined room: ${userId}`);
    // });

    // Initial synchronization request
    socket.on('sync.request', (data) => {
      console.log(`sync.request received:`, data);
      // Here you would typically retrieve and send back initial sync data.
      socket.emit('sync.response', { message: 'Initial sync data placeholder' });
    });

    // ---------------------------
    // Bookmarks events
    // ---------------------------
    socket.on('bookmark.added', (data) => {
      console.log('bookmark.added:', data);
      // TODO: Implement conflict resolution using timestamp comparison
      socket.broadcast.emit('bookmark.added', data);
    });

    socket.on('bookmark.updated', (data) => {
      console.log('bookmark.updated:', data);
      // TODO: Conflict resolution: last-write-wins based on timestamp
      socket.broadcast.emit('bookmark.updated', data);
    });

    socket.on('bookmark.deleted', (data) => {
      console.log('bookmark.deleted:', data);
      socket.broadcast.emit('bookmark.deleted', data);
    });

    // ---------------------------
    // Open Tabs events
    // ---------------------------
    socket.on('tab.opened', (data) => {
      console.log('tab.opened:', data);
      socket.broadcast.emit('tab.opened', data);
    });

    socket.on('tab.updated', (data) => {
      console.log('tab.updated:', data);
      // TODO: Check timestamp and apply last-write-wins if needed
      socket.broadcast.emit('tab.updated', data);
    });

    socket.on('tab.closed', (data) => {
      console.log('tab.closed:', data);
      socket.broadcast.emit('tab.closed', data);
    });

    // ---------------------------
    // Browsing History events
    // ---------------------------
    socket.on('history.added', (data) => {
      console.log('history.added:', data);
      socket.broadcast.emit('history.added', data);
    });

    socket.on('history.cleared', (data) => {
      console.log('history.cleared:', data);
      socket.broadcast.emit('history.cleared', data);
    });

    // ---------------------------
    // Saved Passwords events
    // ---------------------------
    socket.on('password.added', (data) => {
      console.log('password.added:', data);
      socket.broadcast.emit('password.added', data);
    });

    socket.on('password.updated', (data) => {
      console.log('password.updated:', data);
      // TODO: Use timestamp for conflict resolution if required
      socket.broadcast.emit('password.updated', data);
    });

    socket.on('password.deleted', (data) => {
      console.log('password.deleted:', data);
      socket.broadcast.emit('password.deleted', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSyncSocket;
