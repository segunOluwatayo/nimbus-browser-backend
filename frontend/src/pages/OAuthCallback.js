import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

function OAuthCallback() {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    
    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user authenticated
      setUser({ isAuthenticated: true });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      // Handle error
      navigate('/login?error=auth_failed');
    }
  }, [location, navigate, setUser]);
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing authentication...
      </Typography>
    </Box>
  );
}

export default OAuthCallback;