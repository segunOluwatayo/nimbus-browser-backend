// frontend/src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  CircularProgress, 
  Box, 
  Paper,
  InputAdornment,
  IconButton,
  LinearProgress,
  Alert
} from '@mui/material';
import { 
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

function getPasswordStrength(password) {
  if (password.length < 8) return { strength: 'Weak', score: 1 };
  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (hasLetters && hasNumbers && hasSpecial) return { strength: 'Strong', score: 3 };
  if (hasLetters && hasNumbers) return { strength: 'Medium', score: 2 };
  return { strength: 'Weak', score: 1 };
}

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ strength: '', score: 0 });
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.strength === 'Weak') {
      setError('Password strength is weak. Please choose a stronger password with at least 8 characters including letters, numbers, and special characters.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      setResetSuccess(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch(passwordStrength.strength) {
      case 'Strong': return 'success.main';
      case 'Medium': return 'warning.main';
      case 'Weak': return 'error.main';
      default: return 'grey.500';
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  if (resetSuccess) {
    return (
      <Container maxWidth="sm" sx={{ marginTop: '4rem', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ padding: '2.5rem', borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Password Reset Successful
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleBackToLogin}
                sx={{ 
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Sign In
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ marginTop: '4rem', padding: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ padding: '2.5rem', borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Nimbus
            </Typography>
            
            <Typography variant="h5" gutterBottom sx={{ marginBottom: '0.5rem', textAlign: 'center' }}>
              Reset Your Password
            </Typography>
            
            <Typography variant="body1" sx={{ marginBottom: '2rem', textAlign: 'center', color: 'text.secondary' }}>
              Enter your new password below.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="outlined"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  marginBottom: '0.5rem',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
                disabled={isLoading}
              />
              
              {password && (
                <Box sx={{ width: '100%', marginBottom: '1rem' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ color: getStrengthColor() }}
                    >
                      Password Strength: {passwordStrength.strength}
                    </Typography>
                    <Typography variant="caption">
                      {password.length}/8+ characters
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={passwordStrength.score * 33.3} 
                    sx={{ 
                      marginTop: '0.5rem',
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStrengthColor()
                      }
                    }}
                  />
                </Box>
              )}
              
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                variant="outlined"
                error={confirmPassword && password !== confirmPassword}
                helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  marginBottom: '2rem',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                disabled={isLoading || !token}
                sx={{ 
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Remember your password?{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={handleBackToLogin}
                  sx={{ 
                    fontWeight: 'bold',
                    textDecoration: 'none'
                  }}
                  disabled={isLoading}
                >
                  Back to Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}

export default ResetPassword;