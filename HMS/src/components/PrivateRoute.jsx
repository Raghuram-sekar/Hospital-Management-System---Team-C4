import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/authService';

const PrivateRoute = ({ children, requiredRole }) => {
  // Check if user is logged in
  const isAuthenticated = AuthService.isAuthenticated();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If role is required, check if user has the required role
  if (requiredRole) {
    const currentUser = AuthService.getCurrentUser();
    
    if (currentUser && currentUser.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (currentUser.role === 'admin') {
        return <Navigate to="/admin/dashboard" />;
      } else {
        return <Navigate to="/dashboard" />;
      }
    }
  }
  
  // If authenticated and has the right role, render the protected component
  return children;
};

export default PrivateRoute; 