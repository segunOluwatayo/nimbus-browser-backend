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

    // Log token values for debugging
    console.log('OAuthCallback: accessToken:', accessToken);
    console.log('OAuthCallback: refreshToken:', refreshToken);
    console.log('OAuthCallback: deviceId:', deviceId);
    console.log('OAuthCallback: isFromMobileApp:', isFromMobileApp);

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (deviceId) {
        localStorage.setItem('deviceId', deviceId);
      }

      // Fetch user profile and log the response
      fetchUserProfile()
        .then((userProfile) => {
          console.log('Fetched user profile:', userProfile);
          if (isFromMobileApp) {
            // Construct deep link URL for mobile app
            const deepLinkUrl = `mobilebrowser://auth?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${userProfile._id || userProfile.id}&displayName=${encodeURIComponent(userProfile.name || userProfile.email)}&email=${encodeURIComponent(userProfile.email)}`;
            
            // Log the deep link URL to verify it
            console.log('Constructed deepLinkUrl:', deepLinkUrl);
            
            // Redirect to deep link URL
            setTimeout(() => {
              window.location.href = deepLinkUrl;
              // Optionally, try closing the window after redirection
              setTimeout(() => window.close(), 1000);
            }, 500);
          } else {
            // For desktop, navigate to the dashboard
            navigate('/dashboard');
          }
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          if (isFromMobileApp) {
            const deepLinkUrl = `mobilebrowser://auth?accessToken=${accessToken}&refreshToken=${refreshToken}`;
            console.log('Redirecting to deepLinkUrl due to error:', deepLinkUrl);
            window.location.href = deepLinkUrl;
          } else {
            navigate('/dashboard');
          }
        });
    } else {
      // Log error condition when tokens are missing
      console.error('Missing tokens in OAuthCallback. Redirecting with error.');
      if (isFromMobileApp) {
        window.location.href = 'mobilebrowser://auth?error=auth_failed';
      } else {
        navigate('/login?error=auth_failed');
      }
    }
  }, [location, navigate, fetchUserProfile]);

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completing authentication...
      </Typography>
    </Box>
  );
}

export default OAuthCallback;
