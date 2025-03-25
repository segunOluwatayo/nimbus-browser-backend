import React, { useState, useContext, useEffect } from 'react';
import { Container, Typography, TextField, Button, Link, CircularProgress, Box } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function getPasswordStrength(password) {
  if (password.length < 8) return 'Weak';
  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  if (hasLetters && hasNumbers && hasSpecial) return 'Strong';
  if (hasLetters && hasNumbers) return 'Medium';
  return 'Weak';
}

function Login() {
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        // Validate password strength during sign up
        if (passwordStrength === 'Weak') {
          throw new Error('Password strength is weak. Please choose a stronger password.');
        }
        await signup({ email, password });
      } else {
        await login({ email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to the backend endpoint for Google OAuth.
    window.location.href = process.env.REACT_APP_API_URL + '/api/auth/google';
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '4rem', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Continue to your Nimbus account
      </Typography>
      <Typography variant="body1" gutterBottom>
        Sync your passwords, tabs, history, and bookmarks everywhere you use.
      </Typography>
      <Box mt={2}>
        <Button variant="outlined" color="primary" fullWidth onClick={handleGoogleSignIn}>
          Sign in with Google
        </Button>
      </Box>
      <Typography variant="body2" style={{ margin: '1rem 0' }}>
        Or use your email
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isSignUp && (
          <Typography variant="caption" display="block" style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            Password Strength: {passwordStrength}
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error" style={{ marginTop: '0.5rem' }}>
            {error}
          </Typography>
        )}
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </Box>
      </form>
      <Typography variant="body2" style={{ marginTop: '1rem' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link component="button" variant="body2" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </Link>
      </Typography>
    </Container>
  );
}

export default Login;
