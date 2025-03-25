// src/pages/Dashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  CircularProgress, 
  Box, 
  Paper, 
  TextField,
  Button,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';

function Dashboard() {
  const { user, logout, fetchUserProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      try {
        const userData = await fetchUserProfile();
        // Only update state if we got valid data
        if (userData && (userData.name || userData.email)) {
          setProfileData(userData);
          setDisplayName(userData?.name || '');
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // If profile fetch fails, redirect to login
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
  
    loadUserProfile();
  }, [fetchUserProfile, navigate]);
  
  // Then update the userData variable creation:
   userData = profileData || user || {};
  // Check if we have meaningful user data
  const hasUserData = userData && (userData.name || userData.email);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startEditingName = () => {
    setIsEditingName(true);
    setError('');
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setError('');
    // Reset to original name
    setDisplayName(profileData?.name || '');
  };

  const saveDisplayName = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
  
    setSavingName(true);
    setError('');
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Not authenticated");
      }
      
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: displayName })
      });
      
      // Check content type before trying to parse JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an unexpected response format. Please try again later.");
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }
      
      // Update local state with new user data
      setProfileData(prevData => ({
        ...prevData,
        name: displayName
      }));
      
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update display name:', error);
      setError(error.message || 'Failed to update display name');
    } finally {
      setSavingName(false);
    }
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
        
        {/* Profile Section */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
              Display Name:
            </Typography>
            
            {isEditingName ? (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                <TextField
                  size="small"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  fullWidth
                  autoFocus
                  disabled={savingName}
                  placeholder="Enter your display name"
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={saveDisplayName}
                  disabled={savingName}
                >
                  {savingName ? <CircularProgress size={24} /> : 'Save'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={cancelEditingName}
                  disabled={savingName}
                >
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                <Typography variant="body1">
                  {userData.name || userData.email || 'User'}
                </Typography>
                <Button 
                  size="small"
                  onClick={startEditingName}
                  sx={{ ml: 2 }}
                >
                  Change
                </Button>
              </Stack>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ minWidth: '120px', fontWeight: 'bold' }}>
              Email:
            </Typography>
            <Typography variant="body1">
              {userData.email || 'No email available'}
            </Typography>
          </Box>
        </Paper>
        
        {/* Recent Activity Section - keeping this as requested */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Your synchronized data will appear here. Stay connected across all your devices.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;