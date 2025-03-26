import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const TwoFactorAuth = ({ onVerify, onCancel, email, resendCode, isLoading }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(120); // 2 minutes countdown
  const timerRef = useRef(null);

  useEffect(() => {
    // Start countdown timer when component mounts
    timerRef.current = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code || code.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message || 'Failed to verify code. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setError('');
    try {
      await resendCode(email);
      // Reset the countdown
      setCountdown(120);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: { xs: '1.5rem', sm: '2.5rem' },
          borderRadius: '12px',
          maxWidth: '450px',
          margin: '0 auto'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            Verification Required
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            We've sent a verification code to <strong>{email}</strong>. 
            Please enter the code below to complete your sign-in.
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ marginBottom: 2, width: '100%' }}
            >
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              label="Verification Code"
              type="text"
              fullWidth
              margin="normal"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              variant="outlined"
              autoFocus
              placeholder="Enter 6-digit code"
              inputProps={{
                maxLength: 6,
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              sx={{ 
                marginBottom: '1.5rem',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px'
                }
              }}
              disabled={isLoading || countdown === 0}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Typography variant="body2" color={countdown === 0 ? "error.main" : "text.secondary"}>
                {countdown > 0 ? `Code expires in: ${formatTime(countdown)}` : "Code expired"}
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleResendCode}
                disabled={isLoading || countdown > 90} // Allow resend after 30 seconds
                sx={{ textTransform: 'none' }}
              >
                Resend Code
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={onCancel}
                disabled={isLoading}
                sx={{ 
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                disabled={isLoading || countdown === 0 || !code}
                sx={{ 
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Verify'
                )}
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default TwoFactorAuth;