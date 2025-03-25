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
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error retrieving user profile:", error);
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

    // Get the relative path to the uploaded file
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
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