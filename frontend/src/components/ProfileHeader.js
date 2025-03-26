// src/components/ProfileHeader.js
import React, { useState, useContext } from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Button, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  AccountCircle as AccountCircleIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ExitToApp as ExitToAppIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

const ProfileHeader = ({ user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { uploadProfilePicture, deleteProfilePicture, isLoading } = useContext(AuthContext);
  
  // State for the profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  
  // State for the photo dialog
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  
  // State for the temporary selected picture (before saving)
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  
  // State for error handling
  const [error, setError] = useState('');
  
  // State for selected file
  const [selectedFile, setSelectedFile] = useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
    setTempProfilePicture(user?.profilePicture || null);
    setError('');
    setSelectedFile(null);
  };
  
  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setTempProfilePicture(null);
    setError('');
    setSelectedFile(null);
  };
  
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      setError('');
      setSelectedFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempProfilePicture(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = () => {
    setTempProfilePicture(null);
    setSelectedFile(null);
  };
  
  const handleSavePhoto = async () => {
    try {
      setError('');
      
      if (selectedFile) {
        // Upload new profile picture
        await uploadProfilePicture(selectedFile);
      } else if (tempProfilePicture === null && user?.profilePicture) {
        // Delete existing profile picture
        await deleteProfilePicture();
      }
      
      setPhotoDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile picture');
    }
  };
  
  const displayName = user?.name || user?.email || 'User';
  
  return (
    <Paper 
      elevation={2}
      sx={{ 
        borderRadius: 0,
        mb: 3
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '1rem' : '1rem 2rem',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={user?.profilePicture || ''} 
            alt={displayName}
            sx={{ 
              width: 56, 
              height: 56,
              marginRight: '1rem',
              cursor: 'pointer',
              bgcolor: theme.palette.primary.main 
            }}
            onClick={handlePhotoDialogOpen}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{displayName}</Typography>
            <Button 
              size="small" 
              onClick={handlePhotoDialogOpen}
              startIcon={<PhotoCameraIcon />}
              sx={{ textTransform: 'none' }}
            >
              Change
            </Button>
          </Box>
        </Box>
        
        <Box>
          <Button
            endIcon={<ArrowDropDownIcon />}
            onClick={handleMenuOpen}
            startIcon={<AccountCircleIcon />}
            sx={{ textTransform: 'none' }}
          >
            {isMobile ? '' : 'Signed in as '} {displayName}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              onLogout();
            }}>
              <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Photo Upload Dialog */}
        <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose} maxWidth="xs" fullWidth>
          <DialogTitle>Profile Picture</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
              <Avatar 
                src={tempProfilePicture} 
                alt={displayName}
                sx={{ 
                  width: 100, 
                  height: 100,
                  mb: 2,
                  bgcolor: theme.palette.primary.main
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCameraIcon />}
                  disabled={isLoading}
                >
                  Add Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    hidden
                  />
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemovePhoto}
                  startIcon={<DeleteIcon />}
                  disabled={!tempProfilePicture || isLoading}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePhotoDialogClose} disabled={isLoading}>Cancel</Button>
            <Button 
              onClick={handleSavePhoto} 
              variant="contained" 
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Paper>
  );
};

export default ProfileHeader;