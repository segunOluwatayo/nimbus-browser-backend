
import React, { useState } from 'react';
import { 
  Box, 
  Avatar, 
  Typography, 
  Button, 
  Menu, 
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';
import { 
  AccountCircle as AccountCircleIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ExitToApp as ExitToAppIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ProfileHeader = ({ user, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for the profile menu
  const [anchorEl, setAnchorEl] = useState(null);
  
  // State for the photo dialog
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  
  // State for the profile picture
  const [profilePicture, setProfilePicture] = useState(null);
  
  // State for the temporary selected picture (before saving)
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
    setTempProfilePicture(profilePicture);
  };
  
  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setTempProfilePicture(null);
  };
  
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempProfilePicture(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = () => {
    setTempProfilePicture(null);
  };
  
  const handleSavePhoto = () => {
    setProfilePicture(tempProfilePicture);
    setPhotoDialogOpen(false);
    // Here you would typically upload the photo to the server
    // and update the user profile
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
            src={profilePicture} 
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
            <MenuItem onClick={onLogout}>
              <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Photo Upload Dialog */}
        <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose} maxWidth="xs" fullWidth>
          <DialogTitle>Profile Picture</DialogTitle>
          <DialogContent>
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
                  disabled={!tempProfilePicture}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePhotoDialogClose}>Cancel</Button>
            <Button onClick={handleSavePhoto} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Paper>
  );
};

export default ProfileHeader;