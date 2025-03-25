const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt');
const jwtService = require('../services/jwtService');
const totpService = require('../services/totpService');
const { sendEmail } = require('../utils/emailService');
const dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library'); 
dotenv.config();

// Temporary in-memory store for 2FA secrets (for demonstration purposes only)
const TWO_FA_TEMP_STORE = {};

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, password: hashedPassword });
    await user.save();

    // Generate tokens after successful signup (similar to login)
    const accessToken = jwtService.signAccessToken(user);
    const refreshToken = jwtService.signRefreshToken(user);

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
      refreshToken 
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

    // Save refresh token in DB for token rotation
    const tokenEntry = new RefreshToken({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });
    await tokenEntry.save();

    res.status(200).json({ message: "Login successful", accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.googleLogin = (req, res) => {
  // // Placeholder for Google OAuth flow
  // res.status(200).json({ message: "Google login endpoint - to be implemented" });

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/google/callback`
  );

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  
  res.redirect(authUrl);
};

exports.googleCallback = async (req, res) => {
  // This would handle the callback from Google with the auth code
  const code = req.query.code;
  const {tokens} = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  // Here you would handle user creation/login with Google profile
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

    res.status(200).json({ message: "2FA verification successful" });
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

        // Token rotation: update the refresh token in the database
        tokenEntry.token = newRefreshToken;
        tokenEntry.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await tokenEntry.save();

        res.status(200).json({
          message: "Token refreshed",
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
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