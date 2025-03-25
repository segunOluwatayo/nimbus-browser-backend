// src/pages/Dashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { Container, Typography, Button, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  if (loading) {
    return (
      <Container maxWidth="sm" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" style={{ marginTop: '1rem' }}>
          Loading your profile...
        </Typography>
      </Container>
    );
  }

  // Use profileData if available, otherwise fall back to user from context
  const displayName = profileData?.name || user?.name || user?.email || 'User';

  return (
    <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, {displayName}!
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        Logout
      </Button>
    </Container>
  );
}

export default Dashboard;