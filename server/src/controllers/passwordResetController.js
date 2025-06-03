const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const dotenv = require('dotenv');
dotenv.config();

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: "If an account with that email exists, we've sent a password reset link." 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save reset token to database (expires in 10 minutes)
    const passwordReset = new PasswordReset({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    await passwordReset.save();
    
    // Create reset URL - prioritize APP_URL for Railway deployment
    let frontendUrl;
    if (process.env.NODE_ENV === 'production') {
      // In production, use APP_URL (Railway URL)
      frontendUrl = process.env.APP_URL || process.env.REACT_APP_FRONTEND_URL;
    } else {
      // In development, use frontend URL or fallback to localhost
      frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001';
    }
    
    // Remove trailing slash if present
    frontendUrl = frontendUrl.replace(/\/$/, '');
    
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    console.log('Password reset URL generated:', resetUrl); // For debugging
    
    // Send email
    const emailContent = `
You requested a password reset for your Nimbus account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 10 minutes.

If you didn't request this, please ignore this email.
    `;
    
    await sendEmail(
      user.email,
      "Password Reset Request - Nimbus",
      emailContent
    );
    
    res.status(200).json({ 
      message: "If an account with that email exists, we've sent a password reset link." 
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }
    });
    
    if (!passwordReset) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    // Find user
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    user.password = hashedPassword;
    await user.save();
    
    // Delete the used reset token
    await PasswordReset.deleteOne({ _id: passwordReset._id });
    
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};