const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user profile
router.get('/me', userController.getUserProfile);

// Update user profile
router.put('/me', userController.updateUserProfile);

router.delete('/me', userController.deleteAccount);

// Profile picture routes
router.post('/profile-picture', userController.uploadMiddleware, userController.uploadProfilePicture);
router.delete('/profile-picture', userController.deleteProfilePicture);

module.exports = router;