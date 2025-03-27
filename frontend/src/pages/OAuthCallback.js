import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

function OAuthCallback() {
  const { fetchUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const deviceId = params.get('deviceId');
    const isFromMobileApp = params.get('mobile') === 'true';
    
    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (deviceId) {
        localStorage.setItem('deviceId', deviceId);
      }
      
      // For mobile app, redirect immediately without fetching profile
      if (isFromMobileApp) {
        // Construct mobile deep link URL
        const deepLinkUrl = `mobilebrowser://auth?accessToken=${accessToken}&refreshToken=${refreshToken}`;
        
        // Redirect to the mobile app
        window.location.href = deepLinkUrl;
        return;
      }
      
      // For web app, fetch profile and navigate to dashboard
      fetchUserProfile()
        .then(() => {
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          navigate('/dashboard');
        });
    } else {
      // Handle error
      const redirectUrl = isFromMobileApp 
        ? 'mobilebrowser://auth?error=auth_failed'
        : '/login?error=auth_failed';
        
      window.location.href = isFromMobileApp ? redirectUrl : navigate(redirectUrl);
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