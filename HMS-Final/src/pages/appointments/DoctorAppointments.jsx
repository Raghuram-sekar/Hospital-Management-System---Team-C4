import { Box, Typography } from '@mui/material';
import AppointmentList from './AppointmentList';
import DashboardLayout from '../../components/DashboardLayout';

const DoctorAppointments = () => {
  return (
    <DashboardLayout title="My Appointments">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage your scheduled appointments with patients.
        </Typography>
      </Box>
      
      <AppointmentList />
    </DashboardLayout>
  );
};

export default DoctorAppointments; 