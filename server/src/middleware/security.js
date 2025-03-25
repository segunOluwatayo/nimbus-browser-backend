const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const securityMiddleware = (app) => {
  // Use Helmet to secure HTTP headers
  app.use(helmet());

  // Setup CORS with default settings (open for now, can be restricted later)
  app.use(cors());

  // Apply rate limiting: 10 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests, please try again later.',
  });
  app.use(limiter);
};

module.exports = securityMiddleware;
