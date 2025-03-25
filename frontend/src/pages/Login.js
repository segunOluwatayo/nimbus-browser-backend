// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { Container, Typography, TextField, Button, Link } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Simulate signup (replace with actual API call)
      await signup({ email, password });
    } else {
      // Simulate login (replace with actual API call)
      await login({ email, password });
    }
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '4rem', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Continue to your Nimbus account
      </Typography>
      <Typography variant="body1" gutterBottom>
        Sync your passwords, tabs, history, and bookmarks everywhere you use.
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
        <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: '1rem' }}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>
      <Typography variant="body2" style={{ marginTop: '1rem' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link
          component="button"
          variant="body2"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </Link>
      </Typography>
    </Container>
  );
}

export default Login;
