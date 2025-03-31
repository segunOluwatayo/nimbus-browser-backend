import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserEmail, setTempUserEmail] = useState(null); // Store email temporarily for 2FA flow
  // const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
  // const isProduction = process.env.NODE_ENV === 'production';
  // const apiUrl = isProduction ? '' : (process.env.REACT_APP_API_URL || "http://localhost:3000");
  const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = isProduction
  ? 'https://nimbus-browser-backend-production.up.railway.app'  
  : (process.env.REACT_APP_API_URL || "http://localhost:3000");

  // Add state for the device ID
const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId') || '');


  // Token refresh function
  const refreshAccessToken = useCallback(async () => {
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
  }, [apiUrl]);
  
  // Fetch user profile using a secure cookie (HttpOnly cookie is sent automatically)
  const fetchUserProfile = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error("fetchUserProfile: No access token found");
        throw new Error("No access token found");
      }
      
      console.log(`fetchUserProfile: Fetching with token: ${accessToken.substring(0, 10)}...`);
      
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log(`fetchUserProfile: Response status: ${response.status}`);
      
      // If unauthorized, try to refresh the token and fetch again
      if (response.status === 401) {
        console.log("fetchUserProfile: Unauthorized response, attempting token refresh");
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          console.log("fetchUserProfile: Token refresh successful, retrying profile fetch");
          // Try again with the new token
          const newAccessToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${apiUrl}/api/users/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newAccessToken}`
            }
          });
          
          console.log(`fetchUserProfile: Retry response status: ${retryResponse.status}`);
          
          if (retryResponse.ok) {
            try {
              const userData = await retryResponse.json();
              console.log("fetchUserProfile: Successfully retrieved user data after token refresh");
              setUser(userData);
              return userData;
            } catch (parseError) {
              console.error("fetchUserProfile: Error parsing JSON from retry response:", parseError);
              throw new Error("Failed to parse user profile data");
            }
          } else {
            console.error(`fetchUserProfile: Retry failed with status ${retryResponse.status}`);
            throw new Error(`Profile fetch retry failed: ${retryResponse.statusText}`);
          }
        } else {
          console.error("fetchUserProfile: Token refresh failed");
          throw new Error("Session expired. Token refresh failed.");
        }
      }
      
      if (!response.ok) {
        console.error(`fetchUserProfile: Error response ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      
      try {
        const userData = await response.json();
        
        if (!userData || typeof userData !== 'object') {
          console.error("fetchUserProfile: Invalid user data format:", userData);
          throw new Error("Invalid user data format");
        }
        
        console.log("fetchUserProfile: User profile fetched successfully:", JSON.stringify(userData).substring(0, 100));
        
        // Important: Only update state if we have valid user data
        if (userData && (userData._id || userData.id)) {
          setUser(userData);
        }
        
        return userData;
      } catch (parseError) {
        console.error("fetchUserProfile: Error parsing response:", parseError);
        throw new Error("Failed to process user profile response");
      }
    } catch (error) {
      console.error("fetchUserProfile: Error:", error);
      
      throw error;
    }
  }, [apiUrl, refreshAccessToken]);

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
  const login = async ({ email, password }, isMobile = false) => {
    setIsLoading(true);
    try {
      const url = isMobile
        ? `${apiUrl}/api/auth/login?mobile=true`
        : `${apiUrl}/api/auth/login`;
  
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      // For both mobile and regular flows, handle JSON response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again later.");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      // Store deviceId if provided
      if (data.deviceId) {
        localStorage.setItem('deviceId', data.deviceId);
        setDeviceId(data.deviceId);
      }
  
      // Set up 2FA flow regardless of mobile or web
      setTempUserEmail(email);
      setRequires2FA(true);
      setIsLoading(false);
      
      // Store the mobile flag for later use after 2FA
      localStorage.setItem('isMobileLogin', isMobile ? 'true' : 'false');
  
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
    
    let data;
    try {
      const text = await response.text();
      console.log("2FA verification raw response:", text);
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing 2FA verification response:", parseError);
      throw new Error("Invalid server response during 2FA verification");
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Invalid 2FA code');
    }
    
    console.log("2FA verification successful, completing login");
    
    const tempPassword = localStorage.getItem('tempPassword');
    if (!tempPassword) {
      console.error("Temporary password not found in localStorage");
      throw new Error("Authentication failed: Missing temporary credentials");
    }
    
    // Check if this is a mobile login
    const isMobileLogin = localStorage.getItem('isMobileLogin') === 'true';
    
    // Make a final login call with the tempPassword (same as before).
    const loginUrl = `${apiUrl}/api/auth/login`;
    const authResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: tempUserEmail, password: tempPassword }),
    });
    
    console.log(`Final login response status: ${authResponse.status}`);
    
    let authData;
    try {
      const authText = await authResponse.text();
      console.log("Login response raw text:", authText);
      authData = JSON.parse(authText);
    } catch (parseError) {
      console.error("Error parsing login response:", parseError);
      throw new Error("Invalid server response during login");
    }
    
    if (!authResponse.ok) {
      console.error("Authentication failed after 2FA:", authData);
      throw new Error(authData.message || 'Authentication failed after 2FA');
    }
    
    if (!authData.accessToken || !authData.refreshToken) {
      console.error("Missing tokens in login response:", authData);
      throw new Error("Server did not return required authentication tokens");
    }
    
    console.log("Login successful after 2FA, storing tokens");
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.removeItem('tempPassword');
    localStorage.removeItem('isMobileLogin');
    
    //If it's a mobile login, fetch the user profile, then build a URL with displayName/email
    if (isMobileLogin) {
      console.log("Redirecting to mobile app after 2FA verification");
      
      // Fetch user profile using the new accessToken
      const userProfile = await fetchUserProfile(); // Will setUser internally as well
      if (!userProfile) {
        console.error("Failed to fetch user profile before mobile redirect");
        throw new Error("Failed to fetch user profile");
      }
      
      // Build final mobile callback with name/email
      const userId = userProfile._id || userProfile.id || "";
      const displayName = userProfile.name || userProfile.email || "";
      const userEmail = userProfile.email || "";
      
      const redirectUrl = `https://nimbus-browser-backend-production.up.railway.app/oauth-callback?` +
        `accessToken=${authData.accessToken}` +
        `&refreshToken=${authData.refreshToken}` +
        `&userId=${userId}` +
        `&displayName=${encodeURIComponent(displayName)}` +
        `&email=${encodeURIComponent(userEmail)}` +
        `&mobile=true`;
      
      console.log("Final mobile redirect URL:", redirectUrl);
      // Redirect to a regular URL that your GeckoView can intercept
      window.location.href = redirectUrl;
      
      setIsLoading(false);
      return true;
    }
    
    // 3) Otherwise (web flow), just finish up
    await fetchUserProfile(); // setUser, etc.
    
    setRequires2FA(false);
    setTempUserEmail(null);
    setIsLoading(false);
    
    // If your server returned a deviceId, store it as well
    if (data.deviceId) {
      localStorage.setItem('deviceId', data.deviceId);
      setDeviceId(data.deviceId);
    }
    
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

  const getConnectedDevices = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const currentDeviceId = localStorage.getItem('deviceId');
      
      if (!accessToken || !currentDeviceId) {
        throw new Error("Not authenticated or missing device information");
      }
      
      const response = await fetch(`${apiUrl}/api/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-Id': currentDeviceId
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch devices");
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching connected devices:", error);
      throw error;
    }
  };
  
  // Add function to register the current device
  const registerDevice = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const currentDeviceId = localStorage.getItem('deviceId');
      
      if (!accessToken || !currentDeviceId) {
        throw new Error("Not authenticated or missing device information");
      }
      
      const response = await fetch(`${apiUrl}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Device-Id': currentDeviceId
        },
        body: JSON.stringify({ deviceId: currentDeviceId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register device");
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  }, [apiUrl]);
  
  // Add function to remove a device
  const removeConnectedDevice = async (deviceId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const currentDeviceId = localStorage.getItem('deviceId');
      
      if (!accessToken || !currentDeviceId) {
        throw new Error("Not authenticated or missing device information");
      }
      
      const response = await fetch(`${apiUrl}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-Id': currentDeviceId
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove device");
      }
      
      return true;
    } catch (error) {
      console.error("Error removing connected device:", error);
      throw error;
    }
  };
  
  // Add function to update device last active time
  const updateDeviceActivity = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const currentDeviceId = localStorage.getItem('deviceId');
      
      if (!accessToken || !currentDeviceId) {
        return false; // Silently fail if not authenticated
      }
      
      const response = await fetch(`${apiUrl}/api/devices/active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-Id': currentDeviceId
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error updating device activity:", error);
      return false;
    }
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

const deleteAccount = async () => {
  try {
    setIsLoading(true);
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch(`${apiUrl}/api/users/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete account");
    }
    
    // Clear user data
    setUser(null);
    setIsLoading(false);
    return true;
  } catch (error) {
    setIsLoading(false);
    console.error("Error deleting account:", error);
    throw error;
  }
};

  // On mount, check if we have tokens in localStorage and fetch user profile
  // Update the useEffect in AuthContext.js
  useEffect(() => {
    console.log('AuthContext initialized. Checking for existing session...');
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const deviceId = localStorage.getItem('deviceId');

    if (accessToken && refreshToken) {
      console.log('Auth tokens found. Attempting to restore session...');
      setIsLoading(true);
      
      // Using a self-executing async function
      (async () => {
        try {
          console.log('Fetching user profile...');
          const userData = await fetchUserProfile();
          console.log('User session restored successfully:', userData);

           // Register this device if we have a device ID
          if (deviceId) {
            try {
              await registerDevice();
              console.log('Device registered successfully');
            } catch (deviceError) {
              console.error('Error registering device:', deviceError);
              // Continue anyway - this isn't critical
            }
          }

          setIsLoading(false);
        } catch (err) {
          console.error('Error restoring session:', err);
          
          // Try token refresh exactly once
          try {
            console.log('Attempting token refresh...');
            const refreshSuccessful = await refreshAccessToken();
            
            if (refreshSuccessful) {
              console.log('Token refresh successful, fetching profile again...');
              const userData = await fetchUserProfile();
              console.log('User session restored after token refresh:', userData);
            } else {
              console.error('Token refresh failed. User will need to login again.');
              // Clear invalid tokens but DON'T trigger automatic redirect
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } catch (refreshError) {
            console.error('Error during token refresh:', refreshError);
            // Clear invalid tokens but DON'T trigger automatic redirect
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          
          setIsLoading(false);
        }
      })();
    } else {
      console.log('No auth tokens found. User needs to log in.');
    }
  }, [fetchUserProfile, refreshAccessToken, registerDevice]);

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
      deviceId,
    getConnectedDevices,
    registerDevice,
    removeConnectedDevice,
    updateDeviceActivity,
    deleteAccount,
      tempUserEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};