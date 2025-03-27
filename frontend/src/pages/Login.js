import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  CircularProgress, 
  Box, 
  Paper, 
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TwoFactorAuth from '../components/TwoFactorAuth';

function getPasswordStrength(password) {
  if (password.length < 8) return { strength: 'Weak', score: 1 };
  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (hasLetters && hasNumbers && hasSpecial) return { strength: 'Strong', score: 3 };
  if (hasLetters && hasNumbers) return { strength: 'Medium', score: 2 };
  return { strength: 'Weak', score: 1 };
}

function Login() {
  const { 
    login, 
    signup, 
    isLoading, 
    requires2FA, 
    verify2FACode, 
    reset2FAState, 
    send2FACode,
    tempUserEmail 
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ strength: '', score: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [searchParams] = useSearchParams();
  const isMobileFromUrl = searchParams.get('mobile') === 'true';

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  // If we need to cancel 2FA flow
  const handleCancel2FA = () => {
    reset2FAState();
  };

  // Handle 2FA verification
  const handle2FAVerify = async (code) => {
    try {
      await verify2FACode(code);
      // If verification is successful, navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      throw err; // Let the TwoFactorAuth component handle the error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Store password temporarily for 2FA verification process
      localStorage.setItem('tempPassword', password);
      
      if (isSignUp) {
        // Validate password strength during sign up
        if (passwordStrength.strength === 'Weak') {
          throw new Error('Password strength is weak. Please choose a stronger password with at least 8 characters including letters, numbers, and special characters.');
        }
        
        await signup({ email, password });
        // Don't navigate yet - we'll wait for 2FA verification
      } else {
        await login({ email, password, isMobileFromUrl });
        // Don't navigate yet - we'll wait for 2FA verification
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleSignIn = () => {
    // Use a fallback URL if the environment variable isn't defined
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const getStrengthColor = () => {
    switch(passwordStrength.strength) {
      case 'Strong': return theme.palette.success.main;
      case 'Medium': return theme.palette.warning.main;
      case 'Weak': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // If 2FA is required, show the 2FA component
  if (requires2FA) {
    return (
      <Container maxWidth="sm" sx={{ 
        marginTop: isMobile ? '2rem' : '4rem', 
        padding: isMobile ? '1rem' : '2rem' 
      }}>
        <TwoFactorAuth 
          onVerify={handle2FAVerify}
          onCancel={handleCancel2FA}
          email={tempUserEmail}
          resendCode={send2FACode}
          isLoading={isLoading}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ 
      marginTop: isMobile ? '2rem' : '4rem', 
      padding: isMobile ? '1rem' : '2rem' 
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            padding: isMobile ? '1.5rem' : '2.5rem',
            borderRadius: '12px'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* You can add your logo here */}
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}
            >
              Nimbus
            </Typography>
            
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}
            >
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                marginBottom: '1.5rem',
                textAlign: 'center',
                color: theme.palette.text.secondary
              }}
            >
              Sync your passwords, tabs, history, and bookmarks everywhere you use.
            </Typography>

            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleGoogleSignIn}
              startIcon={<GoogleIcon />}
              sx={{ 
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Sign in with Google
            </Button>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%', 
                margin: '1.5rem 0' 
              }}
            >
              <Divider sx={{ flexGrow: 1 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  margin: '0 1rem',
                  color: theme.palette.text.secondary
                }}
              >
                OR
              </Typography>
              <Divider sx={{ flexGrow: 1 }} />
            </Box>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  marginBottom: '1rem',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
                disabled={isLoading}
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                variant="outlined"
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
                        onClick={togglePasswordVisibility}
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
              
              {isSignUp && password && (
                <Box sx={{ width: '100%', marginBottom: '1rem' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: getStrengthColor()
                      }}
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
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getStrengthColor()
                      }
                    }}
                  />
                </Box>
              )}
              
              {!isSignUp && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                        color="primary"
                        size="small"
                        disabled={isLoading}
                      />
                    }
                    label={<Typography variant="body2">Remember me</Typography>}
                  />
                  <Link 
                    component="button" 
                    variant="body2" 
                    type="button"
                    onClick={() => console.log('Forgot password clicked')}
                    sx={{ textDecoration: 'none' }}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}
              
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ marginY: 2 }}
                >
                  {error}
                </Alert>
              )}
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                disabled={isLoading}
                sx={{ 
                  marginTop: '1rem',
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
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>
            
            <Box sx={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  sx={{ 
                    fontWeight: 'bold',
                    textDecoration: 'none'
                  }}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}

export default Login;