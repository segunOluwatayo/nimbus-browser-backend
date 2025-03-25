const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const signAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const signRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '14d' });
};

const verifyAccessToken = (token, callback) => {
  jwt.verify(token, process.env.JWT_SECRET, callback);
};

const verifyRefreshToken = (token, callback) => {
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, callback);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
