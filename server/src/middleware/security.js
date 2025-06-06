const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const securityMiddleware = (app) => {
  // Use Helmet with custom CSP configuration
  if (process.env.NODE_ENV !== 'production') {
    // In development, allow both HTTP and HTTPS for images
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", process.env.REACT_APP_API_URL || "http://localhost:3000"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "http:", "blob:"], // Allow HTTP in development
          fontSrc: ["'self'", "data:"],
        },
      },
    }));
  } else {
    // In production, only allow HTTPS for images
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", process.env.REACT_APP_API_URL || "*"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"], // Only HTTPS in production
            fontSrc: ["'self'", "data:"],
          },
        },
      })
    );
  }

  // Setup CORS with your domain
  app.use(cors({
    origin: process.env.NODE_ENV !== 'production' ? '*' : (process.env.REACT_APP_FRONTEND_URL || '*'),
    credentials: true
  }));
  
  // Apply rate limiting: 20 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10000, // change it back to 20 when you are done testing
    message: 'Too many requests, please try again later.',
  });
  app.use(limiter);
};

module.exports = securityMiddleware;
//