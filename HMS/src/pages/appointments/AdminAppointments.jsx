import { useState } from 'react';
import { Box, Button, Fab, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import AppointmentList from './AppointmentList';
import DashboardLayout from '../../components/DashboardLayout';
import CreateAppointmentDialog from './CreateAppointmentDialog';

const AdminAppointments = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

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
        onClick={() => setOpenCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      />
    </DashboardLayout>
  );
};

export default AdminAppointments; 