import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/authService';

const PrivateRoute = ({ children, requiredRole, requiredRoles }) => {
  // Check if user is logged in
  const isAuthenticated = AuthService.isAuthenticated();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const currentUser = AuthService.getCurrentUser();
  
  // Check if user has one of the required roles (if requiredRoles array is provided)
  if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    if (!currentUser || !requiredRoles.includes(currentUser.role)) {
      // Redirect to appropriate dashboard based on role
      if (currentUser.role === 'admin') {
        return <Navigate to="/admin/dashboard" />;
      } else {
        return <Navigate to="/dashboard" />;
      }
    }
  }
  // If single requiredRole is provided, check that
  else if (requiredRole) {
    if (!currentUser || currentUser.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (currentUser.role === 'admin') {
        return <Navigate to="/admin/dashboard" />;
      } else {
        return <Navigate to="/dashboard" />;
      }
    }
  }
  
  // If authenticated and has the right role(s), render the protected component
  return children;
};

export default PrivateRoute; 