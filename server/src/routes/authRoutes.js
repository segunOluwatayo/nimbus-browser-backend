const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup and login routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Placeholder for Google OAuth login
router.get('/google', authController.googleLogin);

// Two-Factor Authentication routes
router.post('/2fa/send', authController.send2fa);
router.post('/2fa/verify', authController.verify2fa);

// Token management routes
router.post('/token/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
