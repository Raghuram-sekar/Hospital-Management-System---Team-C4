import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PrivateRoute from './components/PrivateRoute';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import PatientManagement from './pages/patients/PatientManagement';
import BedManagement from './pages/admin/BedManagement';
import WardManagement from './pages/admin/WardManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminAppointments from './pages/appointments/AdminAppointments';
import EmergencyDashboard from './pages/emergency/EmergencyDashboard';
import EmergencyTest from './pages/emergency/EmergencyTest';

// Other components
import NotFound from './components/NotFound';
import AuthService from './services/authService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336', // For critical conditions in emergency
    },
    warning: {
      main: '#ff9800', // For moderate conditions in emergency
    },
    success: {
      main: '#4caf50', // For stable conditions in emergency
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Redirect root to dashboard based on role */}
          <Route path="/" element={
            AuthService.isAuthenticated() ? 
              (AuthService.getCurrentUser().role === 'admin' ? 
                <Navigate to="/admin/dashboard" /> : 
                <Navigate to="/dashboard" />
              ) : 
              <Navigate to="/login" />
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute requiredRole="admin">
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/patients" element={
            <PrivateRoute requiredRole="admin">
              <PatientManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/beds" element={
            <PrivateRoute requiredRole="admin">
              <BedManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/wards" element={
            <PrivateRoute requiredRole="admin">
              <WardManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute requiredRole="admin">
              <UserManagement />
            </PrivateRoute>
          } />
          <Route path="/admin/appointments" element={
            <PrivateRoute requiredRole="admin">
              <AdminAppointments />
            </PrivateRoute>
          } />
          
          {/* Emergency Routes - available to admin and doctors */}
          <Route path="/emergency" element={
            <PrivateRoute requiredRoles={['admin', 'doctor']}>
              <EmergencyDashboard />
            </PrivateRoute>
          } />
          {/* Alternative emergency route without the leading slash in case of path matching issues */}
          <Route path="emergency" element={
            <PrivateRoute requiredRoles={['admin', 'doctor']}>
              <EmergencyDashboard />
            </PrivateRoute>
          } />
          
          {/* Test Emergency Route without authentication */}
          <Route path="/emergency-test" element={<EmergencyTest />} />
          
          {/* New Test Route with a different path */}
          <Route path="/test-page" element={<h1>Simple Test Page (No Component)</h1>} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;