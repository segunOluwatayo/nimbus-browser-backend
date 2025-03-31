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
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import { 
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Language as WebIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/ProfileHeader';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

function Dashboard() {
  const { 
    user, 
    logout, 
    fetchUserProfile, 
    getConnectedDevices, 
    removeConnectedDevice,
    updateDeviceActivity,
    deleteAccount 
  } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState('');
  const [connectedDevices, setConnectedDevices] = useState([]);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

  // Check for auth tokens on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('Dashboard mounted. Checking auth tokens...');
    console.log(`Access token exists: ${!!accessToken}`);
    console.log(`Refresh token exists: ${!!refreshToken}`);
    
    // Only redirect if both tokens are missing
    if (!accessToken && !refreshToken) {
      console.log('No auth tokens found. Redirecting to login...');
      navigate('/');
    }
  }, [navigate]);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (loading) {
        console.log('Loading user profile...');
        setError('');
        
        try {
          // Log token info for debugging
          const accessToken = localStorage.getItem('accessToken');
          console.log(`Using access token: ${accessToken ? accessToken.substring(0, 10) + '...' : 'not found'}`);
          
          if (!accessToken) {
            console.error('No access token available. Cannot fetch profile.');
            setError('Authentication required. Please sign in again.');
            setLoading(false);
            return;
          }
          
          const userData = await fetchUserProfile();
          console.log('User profile data received:', userData);
          
          if (userData && (userData._id || userData.id)) {
            console.log('Setting profile data with valid user data');
            setProfileData(userData);
            setDisplayName(userData?.name || '');
          } else {
            console.error('Invalid user data received:', userData);
            setError('Unable to load profile data correctly.');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setError(`Failed to load profile: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUserProfile();
  }, [fetchUserProfile, loading]);

  // Load connected devices
  useEffect(() => {
    const loadConnectedDevices = async () => {
      if (!loading && (profileData || user)) {
        setDeviceLoading(true);
        try {
          // Update device activity
          await updateDeviceActivity();
          
          // Get connected devices
          const devices = await getConnectedDevices();
          console.log('Connected devices:', devices);
          setConnectedDevices(devices || []);
        } catch (error) {
          console.error('Error fetching connected devices:', error);
          // Don't set an error message for this - it's not critical
        } finally {
          setDeviceLoading(false);
        }
      }
    };
    
    loadConnectedDevices();
  }, [getConnectedDevices, loading, profileData, user, updateDeviceActivity]);

  const handleLogout = () => {
     // Check if this request originated from a mobile app
  const urlParams = new URLSearchParams(window.location.search);
  const fromMobile = urlParams.get('fromMobile') === 'true';
  
  // Call logout with the fromMobile parameter
    logout(fromMobile);
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

  const handleRemoveDevice = async (deviceId) => {
    try {
      await removeConnectedDevice(deviceId);
      // Update the UI by removing the device
      setConnectedDevices(prevDevices => 
        prevDevices.filter(device => device.deviceId !== deviceId)
      );
    } catch (error) {
      console.error('Error removing device:', error);
      setError(error.message || 'Failed to remove device');
    }
  };
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Helper function to get the appropriate icon for device type
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop':
        return <ComputerIcon />;
      case 'mobile':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <WebIcon />;
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

  // Use both user contexts to ensure we have data
  const userData = profileData || user || {};
  const hasUserData = userData && (userData.name || userData.email);

  // If we still don't have user data after loading and there's an error, show error screen
  if (!hasUserData && error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          Return to Login
        </Button>
      </Box>
    );
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'delete my account') {
      setDeleteError('Please type "delete my account" to confirm');
      return;
    }
  
    setDeletingAccount(true);
    setDeleteError('');
    
    try {
      // Call a function that will be added to the AuthContext
      await deleteAccount();
      
      // Clear local storage and redirect to login page
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('deviceId');
      
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {hasUserData && (
        <ProfileHeader 
          user={userData} 
          onLogout={handleLogout} 
        />
      )}
      
      <Container maxWidth="lg" sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
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
        
        {/* Connected Services Section */}
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Connected Services
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body1" paragraph>
            View and manage all devices signed into your Nimbus account. Your data is automatically synced across these devices, including bookmarks, tabs, browsing history, and saved passwords.
          </Typography>
          
          {deviceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : connectedDevices.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No devices are currently connected to your account besides this one.
            </Alert>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {connectedDevices.map((device) => (
                <ListItem key={device.deviceId} alignItems="flex-start" divider>
                  <ListItemIcon>
                    {getDeviceIcon(device.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {device.name}
                        {device.isCurrentDevice && (
                          <Chip 
                            label="Current Device" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          Last active: {formatDate(device.lastActive)}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          Location: {device.location}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="remove device" 
                      disabled={device.isCurrentDevice}
                      onClick={() => handleRemoveDevice(device.deviceId)}
                    >
                      <DeleteIcon color={device.isCurrentDevice ? "disabled" : "error"} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Removing a device will sign out the account on that device and stop synchronization.
            </Typography>
          </Box>
        </Paper>
        
        {/* Recent Activity Section */}
        <Paper sx={{ p: 3, mt: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Your synchronized data will appear here. Stay connected across all your devices.
          </Typography>
        </Paper>

        {/* Delete Account Section */}
        <Paper sx={{ p: 3, mt: 2, mb: 3, bgcolor: 'error.light' }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Box>
      <Typography variant="h6" gutterBottom color="error.contrastText">
        Delete Account
      </Typography>
      <Typography variant="body2" color="error.contrastText">
        Permanently delete your account and all associated data including bookmarks, tabs, history, and saved passwords.
      </Typography>
    </Box>
    <Button 
      variant="contained" 
      color="error" 
      startIcon={<DeleteForeverIcon />}
      onClick={() => setDeleteDialogOpen(true)}
    >
      Delete Account
    </Button>
  </Box>
</Paper>

{/* Delete Account Confirmation Dialog */}
<Dialog
  open={deleteDialogOpen}
  onClose={() => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText('');
    setDeleteError('');
  }}
>
  <DialogTitle>Delete Account Permanently?</DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>
      This action <strong>cannot be undone</strong>. Deleting your account will:
    </DialogContentText>
    <Box component="ul" sx={{ pl: 2 }}>
      <Typography component="li" variant="body2">
        Permanently delete all your bookmarks
      </Typography>
      <Typography component="li" variant="body2">
        Remove all saved passwords
      </Typography>
      <Typography component="li" variant="body2">
        Delete your browsing history
      </Typography>
      <Typography component="li" variant="body2">
        Remove all synchronized tabs
      </Typography>
      <Typography component="li" variant="body2">
        Sign you out from all connected devices
      </Typography>
    </Box>
    <DialogContentText sx={{ mt: 2, mb: 3 }}>
      To confirm, please type <strong>delete my account</strong> below:
    </DialogContentText>
    <TextField
      autoFocus
      fullWidth
      value={deleteConfirmText}
      onChange={(e) => setDeleteConfirmText(e.target.value)}
      error={!!deleteError}
      helperText={deleteError}
      disabled={deletingAccount}
      placeholder="delete my account"
    />
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => {
        setDeleteDialogOpen(false);
        setDeleteConfirmText('');
        setDeleteError('');
      }} 
      disabled={deletingAccount}
    >
      Cancel
    </Button>
    <Button 
      variant="contained" 
      color="error" 
      disabled={deleteConfirmText !== 'delete my account' || deletingAccount}
      onClick={handleDeleteAccount}
    >
      {deletingAccount ? <CircularProgress size={24} color="inherit" /> : 'Delete Account'}
    </Button>
  </DialogActions>
</Dialog>
      </Container>
    </Box>
  );
}

export default Dashboard;