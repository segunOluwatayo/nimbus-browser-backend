const speakeasy = require('speakeasy');

const generateTOTP = (secret) => {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
};

const verifyTOTP = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // allows a margin of error (1 time step before/after)
  });
};

module.exports = {
  generateTOTP,
  verifyTOTP,
};
