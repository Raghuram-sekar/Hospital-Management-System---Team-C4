import { useState } from 'react';
import { Box, Button, Typography, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import AppointmentList from './AppointmentList';
import DashboardLayout from '../../components/DashboardLayout';
import CreateAppointmentDialog from './CreateAppointmentDialog';

const PatientAppointments = () => {
  const [openBookDialog, setOpenBookDialog] = useState(false);
  
  return (
    <DashboardLayout title="My Appointments">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View your upcoming and past appointments with doctors.
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenBookDialog(true)}
          sx={{ mb: 3 }}
        >
          Book New Appointment
        </Button>
      </Box>
      
      <AppointmentList />
      
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
        onClick={() => setOpenBookDialog(true)}
      >
        <AddIcon />
      </Fab>
      
      {/* Book Appointment Dialog */}
      <CreateAppointmentDialog
        open={openBookDialog}
        onClose={() => setOpenBookDialog(false)}
        isPatient={true}
      />
    </DashboardLayout>
  );
};

export default PatientAppointments; 