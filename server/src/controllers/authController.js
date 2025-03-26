const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwtService = require('../services/jwtService');
const totpService = require('../services/totpService');
const { sendEmail } = require('../utils/emailService');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library'); 
dotenv.config();

// Temporary in-memory store for 2FA secrets (for demonstration purposes only)
const TWO_FA_TEMP_STORE = {};

// Helper to generate a device ID based on user-agent and IP
const generateDeviceId = (userId, userAgent, ip) => {
  const input = `${userId}|${userAgent}|${ip}|${Date.now()}`;
  return crypto.createHash('md5').update(input).digest('hex');
};

exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      email, 
      password: hashedPassword,
      name: name || '' // Add name if provided
    });
    await user.save();

    // Generate tokens after successful signup (similar to login)
    const accessToken = jwtService.signAccessToken(user);
    const refreshToken = jwtService.signRefreshToken(user);

    // Generate device ID for this signup
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceId = generateDeviceId(user._id.toString(), userAgent, ip);

    // Save refresh token in DB for token rotation
    const tokenEntry = new RefreshToken({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });
    await tokenEntry.save();

    res.status(201).json({ 
      message: "User created successfully", 
      accessToken, 
      refreshToken,
      deviceId
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    // Generate tokens
    const accessToken = jwtService.signAccessToken(user);
    const refreshToken = jwtService.signRefreshToken(user);

    // Generate device ID for this login
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceId = generateDeviceId(user._id.toString(), userAgent, ip);

    // Save refresh token in DB for token rotation
    const tokenEntry = new RefreshToken({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });
    await tokenEntry.save();

    res.status(200).json({ 
      message: "Login successful", 
      accessToken, 
      refreshToken,
      deviceId // Include the deviceId in the response
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.googleLogin = (req, res) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  );

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  
  res.redirect(authUrl);
};

// Updated googleCallback function in server/src/controllers/authController.js
exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const isMobile = req.query.mobile === 'true'; // Check if request is from mobile app
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    let frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001';
    
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`
    );
    
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    
    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Check if the user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user with a random password
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = new User({
        email,
        password: hashedPassword,
        name,
        googleId
      });
      
      await user.save();
    } else {
      // Update googleId and name if they don't exist
      let updated = false;
      
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      
      if (updated) {
        await user.save();
      }
    }
    
    // Generate tokens
    const accessToken = jwtService.signAccessToken(user);
    const refreshToken = jwtService.signRefreshToken(user);
    
    // Generate device ID for this OAuth login
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceId = generateDeviceId(user._id.toString(), userAgent, ip);
    
    // Save refresh token in DB
    const tokenEntry = new RefreshToken({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });
    await tokenEntry.save();
    
    // Redirect to frontend with tokens and device ID
    frontendUrl = process.env.REACT_APP_FRONTEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}&deviceId=${deviceId}&mobile=${isMobile}`);
    
  } catch (error) {
    console.error("Google OAuth error:", error);
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};

exports.send2fa = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Generate a new TOTP secret for this session
    const secret = require('speakeasy').generateSecret({ length: 20 }).base32;
    const token = totpService.generateTOTP(secret);

    // Store the secret temporarily with a 5-minute expiration
    TWO_FA_TEMP_STORE[user._id] = {
      secret,
      expiration: Date.now() + 5 * 60 * 1000,
    };

    // Send the TOTP code via email
    await sendEmail(user.email, "Your 2FA Code", `Your two-factor authentication code is: ${token}`);

    res.status(200).json({ message: "2FA code sent via email" });
  } catch (error) {
    console.error("Send 2FA error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verify2fa = async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const tempData = TWO_FA_TEMP_STORE[user._id];
    if (!tempData) return res.status(400).json({ message: "No 2FA request found or code expired" });
    if (Date.now() > tempData.expiration) {
      delete TWO_FA_TEMP_STORE[user._id];
      return res.status(400).json({ message: "2FA code expired" });
    }

    // Verify the TOTP code using the stored secret
    const isValid = totpService.verifyTOTP(token, tempData.secret);
    if (!isValid) return res.status(400).json({ message: "Invalid 2FA code" });

    // Remove the temporary secret once verified
    delete TWO_FA_TEMP_STORE[user._id];

    // Generate device ID for this verification
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const deviceId = generateDeviceId(user._id.toString(), userAgent, ip);

    res.status(200).json({ 
      message: "2FA verification successful",
      deviceId // Include the deviceId in the response
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    // Verify the refresh token
    jwtService.verifyRefreshToken(refreshToken, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid refresh token" });
      const userId = decoded.id;

      // Check if the token exists in the database
      RefreshToken.findOne({ userId, token: refreshToken }).then(async (tokenEntry) => {
        if (!tokenEntry) return res.status(401).json({ message: "Refresh token not recognized" });

        // Generate new tokens
        const user = await User.findById(userId);
        const newAccessToken = jwtService.signAccessToken(user);
        const newRefreshToken = jwtService.signRefreshToken(user);

        // Generate a device ID for the refresh
        const userAgent = req.headers['user-agent'];
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const deviceId = generateDeviceId(user._id.toString(), userAgent, ip);

        // Token rotation: update the refresh token in the database
        tokenEntry.token = newRefreshToken;
        tokenEntry.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await tokenEntry.save();

        res.status(200).json({
          message: "Token refreshed",
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          deviceId
        });
      }).catch((error) => {
        console.error("Refresh token DB error:", error);
        res.status(500).json({ message: "Internal server error" });
      });
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    // Invalidate the refresh token by removing it from the database
    await RefreshToken.findOneAndDelete({ token: refreshToken });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};