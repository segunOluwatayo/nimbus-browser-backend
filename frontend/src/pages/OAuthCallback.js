import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

function OAuthCallback() {
  // Instead of destructuring setUser, we'll use the available methods
  const { fetchUserProfile } = useContext(AuthContext);
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
      
      // Instead of directly setting the user object, use fetchUserProfile
      // or simply set a basic authenticated state that matches your app's needs
      fetchUserProfile()
        .then(() => {
          // Redirect to dashboard after successfully fetching the profile
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          // If fetching profile fails, we can still proceed to dashboard
          // since we have valid tokens
          navigate('/dashboard');
        });
    } else {
      // Handle error
      navigate('/login?error=auth_failed');
    }
  }, [location, navigate, fetchUserProfile]);
  
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