import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserEmail, setTempUserEmail] = useState(null); // Store email temporarily for 2FA flow
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }
      
      const response = await fetch(`${apiUrl}/api/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  // Fetch user profile using a secure cookie (HttpOnly cookie is sent automatically)
 // Updated fetchUserProfile function
 const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error("No access token found in localStorage");
        throw new Error("No access token found");
      }
      
      console.log(`Fetching user profile with token: ${accessToken.substring(0, 20)}...`);
      
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log(`Profile fetch response status: ${response.status}`);
      
      // If unauthorized, try to refresh the token and fetch again
      if (response.status === 401) {
        console.log("Unauthorized response, attempting token refresh");
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          console.log("Token refresh successful, retrying profile fetch");
          // Try again with the new token
          const newAccessToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${apiUrl}/api/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          });
          
          console.log(`Retry response status: ${retryResponse.status}`);
          
          if (retryResponse.ok) {
            const userData = await retryResponse.json();
            console.log("Successfully retrieved user data after token refresh");
            setUser(userData);
            return userData;
          } else {
            const errorText = await retryResponse.text();
            console.error(`Retry response error: ${errorText}`);
          }
        } else {
          console.error("Token refresh failed");
        }
        // If refresh failed or retry failed, log out user
        logout();
        throw new Error("Session expired. Please login again.");
      }
      
      if (!response.ok) {
        // Try to get more error details from the response
        let errorMessage = "Failed to fetch user profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error response from server:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", await response.text());
        }
        throw new Error(errorMessage);
      }
      
      const userData = await response.json();
      console.log("User profile fetched successfully:", JSON.stringify(userData).substring(0, 100));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Important: throw the error instead of returning null
      // This ensures the calling code properly handles the failure
      throw error;
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
      
      if (response.status === 401) {
        // Try refreshing the token if unauthorized
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newResponse = await fetch(`${apiUrl}/api/users/profile-picture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: formData
          });
          
          if (newResponse.ok) {
            const data = await newResponse.json();
            setUser(data.user);
            setIsLoading(false);
            return data.user;
          }
        }
        // If refresh failed, throw error
        throw new Error("Session expired. Please login again.");
      }
      
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
      
      if (response.status === 401) {
        // Try refreshing the token if unauthorized
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newResponse = await fetch(`${apiUrl}/api/users/profile-picture`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
          
          if (newResponse.ok) {
            const data = await newResponse.json();
            setUser(data.user);
            setIsLoading(false);
            return data.user;
          }
        }
        // If refresh failed, throw error
        throw new Error("Session expired. Please login again.");
      }
      
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
    
    console.log(`Verifying 2FA code for email: ${tempUserEmail}`);
    
    const response = await fetch(`${apiUrl}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: tempUserEmail, token }),
    });
    
    console.log(`2FA verification response status: ${response.status}`);
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid 2FA code');
    }
    
    console.log("2FA verification successful, completing login");
    
    // Get the temporary password from localStorage
    const tempPassword = localStorage.getItem('tempPassword');
    if (!tempPassword) {
      console.error("Temporary password not found in localStorage");
      throw new Error("Authentication failed: Missing temporary credentials");
    }
    
    // Now complete the login/signup process
    const authResponse = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: tempUserEmail, password: tempPassword }),
    });
    
    console.log(`Final login response status: ${authResponse.status}`);
    
    const authData = await authResponse.json();
    if (!authResponse.ok) {
      console.error("Authentication failed after 2FA:", authData);
      throw new Error(authData.message || 'Authentication failed after 2FA');
    }
    
    console.log("Login successful after 2FA, storing tokens");
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    
    // Remove temporary password
    localStorage.removeItem('tempPassword');
    
    // Fetch the complete user profile
    await fetchUserProfile();
    
    setRequires2FA(false);
    setTempUserEmail(null);
    setIsLoading(false);
    
    return true;
  } catch (error) {
    console.error("2FA verification error:", error);
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
      
      // Store password temporarily for 2FA verification process
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

  // On mount, check if we have tokens in localStorage and fetch user profile
  // Update the useEffect in AuthContext.js
useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      // Set loading state while fetching profile
      setIsLoading(true);
      
      fetchUserProfile()
        .then(userData => {
          // Successfully fetched user data
          setIsLoading(false);
        })
        .catch(async (err) => {
          console.error("Error fetching user profile:", err);
          
          // If fetching profile fails, try to refresh the token once
          if (await refreshAccessToken()) {
            // If token refresh succeeds, try fetching profile again
            try {
              await fetchUserProfile();
            } catch (secondErr) {
              // If it still fails, logout instead of setting incomplete user state
              console.error("Failed to fetch profile after token refresh:", secondErr);
              logout();
            }
          } else {
            // If token refresh fails, log user out
            logout();
          }
          
          setIsLoading(false);
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