import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { 
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      setMessage(data.message);
      setEmailSent(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  if (emailSent) {
    return (
      <Container maxWidth="sm" sx={{ marginTop: '4rem', padding: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ padding: '2.5rem', borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <SendIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Check Your Email
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                {message}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                The reset link will expire in 10 minutes. Check your spam folder if you don't see the email.
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={handleBackToLogin}
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 2 }}
              >
                Back to Sign In
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
              Forgot Your Password?
            </Typography>
            
            <Typography variant="body1" sx={{ marginBottom: '2rem', textAlign: 'center', color: 'text.secondary' }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                {message}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="outlined"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
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
                disabled={isLoading}
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
                  'Send Reset Link'
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

export default ForgotPassword;