const jwtService = require('../services/jwtService');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
  // Expecting token in the Authorization header as "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(' ')[1];
  jwtService.verifyAccessToken(token, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
