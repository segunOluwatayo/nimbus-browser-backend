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
      
      // Fetch user profile
      fetchUserProfile()
        .then((userProfile) => {
          if (isFromMobileApp) {
            // For mobile app - construct a deep link to return to the app
            const deepLinkUrl = `mobilebrowser://auth?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${userProfile._id || userProfile.id}&displayName=${encodeURIComponent(userProfile.name || userProfile.email)}&email=${encodeURIComponent(userProfile.email)}`;
            
            // Redirect to the deep link and close window after a short delay
            setTimeout(() => {
              window.location.href = deepLinkUrl;
              // Optional: attempt to close the window after redirection
              setTimeout(() => window.close(), 1000);
            }, 500);
          } else {
            // For desktop - navigate to dashboard
            navigate('/dashboard');
          }
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          // Even if profile fetch fails, try to return to app for mobile
          if (isFromMobileApp) {
            const deepLinkUrl = `mobilebrowser://auth?accessToken=${accessToken}&refreshToken=${refreshToken}`;
            window.location.href = deepLinkUrl;
          } else {
            navigate('/dashboard');
          }
        });
    } else {
      // Handle error
      if (isFromMobileApp) {
        window.location.href = 'mobilebrowser://auth?error=auth_failed';
      } else {
        navigate('/login?error=auth_failed');
      }
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