import { useState, useEffect, useRef } from 'react';
import { Box, Button, Fab, Typography, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import AppointmentList from './AppointmentList';
import DashboardLayout from '../../components/DashboardLayout';
import CreateAppointmentDialog from './CreateAppointmentDialog';
import AuthService from '../../services/authService';
import AppointmentService from '../../services/appointmentService';
import api from '../../services/api';
import debugBackend from '../../utils/debugBackend';

const AdminAppointments = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const appointmentListRef = useRef(null);
  // Add state for appointments
  const [appointments, setAppointments] = useState([]);
  
  // Load appointments on mount
  useEffect(() => {
    loadInitialAppointments();
    
    // Also ensure we have an admin user for testing
    AuthService.ensureAdminLogin().catch(error => {
      console.error('Failed to ensure admin login:', error);
    });
  }, []);
  
  // Function to load initial appointments
  const loadInitialAppointments = async () => {
    try {
      // Check if we have global sample appointments first
      if (window.HMS_SAMPLE_APPOINTMENTS && window.HMS_SAMPLE_APPOINTMENTS.length > 0) {
        console.log('DEBUG AdminAppointments: Using global sample appointments:', 
                    window.HMS_SAMPLE_APPOINTMENTS.length);
        
        // Create a fresh copy to avoid reference issues
        const freshSampleData = [...window.HMS_SAMPLE_APPOINTMENTS];
        console.log('DEBUG AdminAppointments: Fresh sample data:', freshSampleData.length);
        
        setAppointments(freshSampleData);
        return;
      }
      
      // Try to get appointments from service or fallback to sample data
      let data = [];
      try {
        data = await AppointmentService.getAllAppointments();
      } catch (error) {
        console.warn('Failed to load appointments from API, using sample data');
        data = debugBackend.getSampleAppointments();
      }
      
      console.log('Initial appointments loaded:', data.length);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Fallback to sample data
      const sampleData = debugBackend.getSampleAppointments();
      setAppointments(sampleData);
    }
  };

  // Function to refresh appointments - will be passed to the AppointmentList
  const refreshAppointments = () => {
    console.log('Refreshing appointments list after creation');
    loadInitialAppointments();
  };
  
  // Function to handle new appointment creation
  const handleAppointmentCreated = async (newAppointment) => {
    console.log('New appointment created:', newAppointment);
    
    // Safety check - ensure we have valid appointment data
    if (!newAppointment || typeof newAppointment !== 'object') {
      console.error('Invalid appointment data received:', newAppointment);
      // Still refresh appointments to ensure we display the most recent data
      refreshAppointments();
      return;
    }
    
    // Force a refresh to ensure global sample data is used
    refreshAppointments();
    
    // Set a timer to refresh again after a short delay to ensure updates are visible
    setTimeout(() => {
      console.log('DEBUG: Performing delayed refresh after appointment creation');
      refreshAppointments();
    }, 1000);
    
    // And another refresh after a longer delay just to be certain
    setTimeout(() => {
      console.log('DEBUG: Performing final refresh after appointment creation');
      refreshAppointments();
    }, 3000);
  };

  return (
    <DashboardLayout title="Appointment Management">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage all appointments in the hospital system.
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ mb: 3 }}
        >
          Create New Appointment
        </Button>
      </Box>

      <AppointmentList 
        ref={appointmentListRef} 
        appointments={appointments}
        setAppointments={setAppointments}
      />
      
      {/* Floating action button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setOpenCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </DashboardLayout>
  );
};

export default AdminAppointments; 