const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Tab = require('../models/Tab');
const History = require('../models/History');
const Password = require('../models/Password');
const RefreshToken = require('../models/RefreshToken');
const ConnectedDevice = require('../models/ConnectedDevice');

const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename using timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${fileExt}`);
  }
});

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload middleware
exports.uploadMiddleware = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
}).single('profilePicture');

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
      // Log the user ID to help with debugging
      console.log('Attempting to fetch user profile with ID:', req.user.id);
      
      // Check if the ID is a valid MongoDB ObjectId
      if (!req.user.id || !req.user.id.match(/^[0-9a-fA-F]{24}$/)) {
        console.error('Invalid user ID format:', req.user.id);
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        console.error('User not found with ID:', req.user.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('User profile fetched successfully for ID:', req.user.id);
      res.status(200).json(user);
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate input
    if (name && (typeof name !== 'string' || name.length > 50)) {
      return res.status(400).json({ message: "Invalid name format" });
    }
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name } },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    // File upload is handled by multer middleware
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get the correct base URL for production vs development
    let baseUrl;
    if (process.env.NODE_ENV === 'production') {
      // Use the Railway production URL or APP_URL environment variable
      baseUrl = process.env.APP_URL || 'https://nimbus-browser-backend-production.up.railway.app';
    } else {
      // Use the development URL or localhost
      baseUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001';
    }

    const relativePath = `/uploads/profile-pictures/${path.basename(req.file.path)}`;
    const profilePictureUrl = `${baseUrl}${relativePath}`;

    // Update user profile with the new picture URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      // Remove the uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "Profile picture uploaded successfully", 
      user 
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    // Remove the uploaded file in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePicture) {
      // Extract the file path from the URL
      const urlPath = new URL(user.profilePicture).pathname;
      const filePath = path.join(__dirname, '../..', urlPath);
      
      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update user profile
      user.profilePicture = '';
      await user.save();
    }

    res.status(200).json({ 
      message: "Profile picture removed successfully", 
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all user data from various collections
      await Promise.all([
        // Delete user data from all collections
        Bookmark.deleteMany({ userId }, { session }),
        Tab.deleteMany({ userId }, { session }),
        History.deleteMany({ userId }, { session }),
        Password.deleteMany({ userId }, { session }),
        RefreshToken.deleteMany({ userId }, { session }),
        ConnectedDevice.deleteMany({ userId }, { session }),
        
        // Finally, delete the user
        User.findByIdAndDelete(userId, { session })
      ]);
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      // Abort transaction if any operation fails
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};