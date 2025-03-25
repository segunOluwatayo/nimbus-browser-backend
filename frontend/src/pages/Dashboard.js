// src/pages/Dashboard.js
import React, { useContext } from 'react';
import { Container, Typography, Button } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome, {user?.email || 'User'}!
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
