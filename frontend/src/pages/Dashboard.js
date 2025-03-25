// src/pages/Dashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box, Paper } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';

function Dashboard() {
  const { user, logout, fetchUserProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userData = await fetchUserProfile();
        setProfileData(userData);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [fetchUserProfile]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  // Use profileData if available, otherwise fall back to user from context
  const userData = profileData || user || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ProfileHeader 
        user={userData} 
        onLogout={handleLogout} 
      />
      <Container maxWidth="lg" sx={{ flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to your Nimbus Browser synchronization dashboard. 
          Here you can manage all your synchronized data across devices.
        </Typography>
        
        {/* Dashboard content goes here */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your synchronized data will appear here. Stay connected across all your devices.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;