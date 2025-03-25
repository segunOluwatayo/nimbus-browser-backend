import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserEmail, setTempUserEmail] = useState(null); // Store email temporarily for 2FA flow
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

  // Fetch user profile using a secure cookie (HttpOnly cookie is sent automatically)
  const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("No access token found");
      }
      
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file) => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("No access token found");
      }
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch(`${apiUrl}/api/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload profile picture");
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  // Delete profile picture
  const deleteProfilePicture = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("No access token found");
      }
      
      const response = await fetch(`${apiUrl}/api/users/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete profile picture");
      }
      
      const data = await response.json();
      setUser(data.user);
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      console.error("Error deleting profile picture:", error);
      throw error;
    }
  };

  // Login function with secure credentials
  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again later.");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Instead of immediately setting tokens and user, we need to trigger 2FA
      setTempUserEmail(email);
      setRequires2FA(true);
      setIsLoading(false);
      
      // Initiate 2FA process
      await send2FACode(email);
      
      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Send 2FA code to user's email
  const send2FACode = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/2fa/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send 2FA code');
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      console.error("Error sending 2FA code:", error);
      throw error;
    }
  };

  // Verify 2FA code
  const verify2FACode = async (token) => {
    setIsLoading(true);
    try {
      if (!tempUserEmail) {
        throw new Error("No user email found for 2FA verification");
      }
      
      const response = await fetch(`${apiUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempUserEmail, token }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid 2FA code');
      }
      
      // Now complete the login/signup process
      const authResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempUserEmail, password: localStorage.getItem('tempPassword') }),
      });
      
      const authData = await authResponse.json();
      if (!authResponse.ok) {
        throw new Error(authData.message || 'Authentication failed after 2FA');
      }
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      
      // Remove temporary password
      localStorage.removeItem('tempPassword');
      
      // Set user based on decoded token or fetch profile
      setUser({ email: tempUserEmail });
      setRequires2FA(false);
      setTempUserEmail(null);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Signup function with secure credentials
  const signup = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again later.");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      // Store password temporarily for after 2FA verification
      localStorage.setItem('tempPassword', password);
      
      // Instead of immediately setting tokens and user, we need to trigger 2FA
      setTempUserEmail(email);
      setRequires2FA(true);
      setIsLoading(false);
      
      // Initiate 2FA process
      await send2FACode(email);
      
      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Reset 2FA state (for cancellation or timeout)
  const reset2FAState = () => {
    setRequires2FA(false);
    setTempUserEmail(null);
    localStorage.removeItem('tempPassword');
  };

  // Logout: Invalidate the session on the backend and clear the user state.
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      // Clear local storage tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tempPassword');
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setRequires2FA(false);
    setTempUserEmail(null);
  };

  // On mount, check if we have tokens in localStorage and set the user
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      // We have tokens, let's fetch the user profile or at least set a basic user state
      fetchUserProfile().catch(() => {
        // If fetching profile fails, we can try to decode the JWT token locally
        // For simplicity, just set a placeholder user object for now
        setUser({ isAuthenticated: true });
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      fetchUserProfile,
      uploadProfilePicture,
      deleteProfilePicture, 
      isLoading,
      requires2FA,
      send2FACode,
      verify2FACode,
      reset2FAState,
      tempUserEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};