import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BedManagement from './pages/admin/BedManagement';
import DoctorAvailability from './pages/admin/DoctorAvailability';
import AdminAppointments from './pages/appointments/AdminAppointments';
import DoctorAppointments from './pages/appointments/DoctorAppointments';
import PatientAppointments from './pages/appointments/PatientAppointments';
import PatientManagement from './pages/patients/PatientManagement';
import DoctorManagement from './pages/doctors/DoctorManagement';
import DoctorDirectory from './pages/doctors/DoctorDirectory';
import './App.css';
import AuthService from './services/authService';
import { Box } from '@mui/material';

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: string }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const currentUser = AuthService.getCurrentUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/beds" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <BedManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/doctor-availability" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DoctorAvailability />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/appointments" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAppointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/doctors" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DoctorManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/patients" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <PatientManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Doctor Routes */}
            <Route 
              path="/doctor/appointments" 
              element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorAppointments />
                </ProtectedRoute>
              } 
            />
            
            {/* Patient Routes */}
            <Route 
              path="/patient/appointments" 
              element={
                <ProtectedRoute requiredRole="patient">
                  <PatientAppointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/doctors" 
              element={
                <ProtectedRoute requiredRole="patient">
                  <DoctorDirectory />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;