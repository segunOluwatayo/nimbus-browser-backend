import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Login function with secure credentials
  const login = async ({ email, password }) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      // Fetch user profile after login (token is stored in a secure, HttpOnly cookie)
      await fetchUserProfile();
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Signup function with secure credentials
  const signup = async ({ email, password }) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      // Fetch user profile after signup
      await fetchUserProfile();
      return data;
    } catch (error) {
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
    <AuthContext.Provider value={{ user, login, signup, logout, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
