const jwtService = require('../services/jwtService');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
  // Expecting token in the Authorization header as "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error('No authorization header provided');
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received in authMiddleware:', token.substring(0, 20) + '...');
  
  jwtService.verifyAccessToken(token, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: "Invalid token", error: err.message });
    }
    
    console.log('Token verified successfully. User ID:', decoded.id);
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;