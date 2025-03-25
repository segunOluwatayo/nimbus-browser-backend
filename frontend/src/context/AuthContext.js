import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Fetch user profile using a secure cookie (HttpOnly cookie is sent automatically)
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'GET',
        credentials: 'include', // Ensure cookies are included
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const data = await response.json();
      setUser(data);
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Login function with secure credentials
  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      });
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please try again later.");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Fetch user profile after login
      const userProfile = await fetchUserProfile();
      setIsLoading(false);
      return { ...data, user: userProfile };
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
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      });
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. Please check your connection and try again.");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      // After successful signup, automatically log the user in
      const loginResponse = await login({ email, password });
      setIsLoading(false);
      return loginResponse;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Logout: Invalidate the session on the backend and clear the user state.
  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  // On mount, attempt to fetch the user profile to determine if already logged in.
  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, fetchUserProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};