import { useEffect, useState } from 'react';
import AuthService from '../services/authService';
import { 
  Box, Typography, Container, Button, Paper, Grid, Card, CardContent, 
  Divider, Avatar, CircularProgress, useTheme
} from '@mui/material';
import {
  PeopleOutlined, LocalHospitalOutlined, EventNoteOutlined,
  HotelOutlined, MedicalServicesOutlined, TrendingUpOutlined, AccessTimeOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

// Stat card component for dashboard metrics
const StatCard = ({ title, value, icon, color, isLoading, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
        } : {}
      }} 
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              backgroundColor: `${color}15`,
              color: color,
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {isLoading ? <CircularProgress size={24} /> : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Action card component for quick actions
const ActionCard = ({ title, description, icon, color, buttonText, onClick }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              backgroundColor: `${color}15`,
              color: color,
              width: 40,
              height: 40,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onClick}
          sx={{ textTransform: 'none' }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  // Mock data for demonstration
  const stats = {
    doctors: 12,
    patients: 145,
    appointments: 48,
    beds: 23
  };

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setUser(currentUser);
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Define role-specific actions
  const getFeatureCards = () => {
    if (user.role === 'admin') {
      return [
        {
          title: 'Doctor Availability',
          description: 'Manage doctor schedules and their availability slots.',
          icon: <AccessTimeOutlined />,
          color: theme.palette.primary.main,
          buttonText: 'Manage Availability',
          onClick: () => navigate('/admin/doctor-availability')
        },
        {
          title: 'Manage Doctors',
          description: 'Add, edit, or delete doctor profiles and specialties.',
          icon: <LocalHospitalOutlined />,
          color: theme.palette.info.main,
          buttonText: 'Manage Doctors',
          onClick: () => navigate('/admin/doctors')
        },
        {
          title: 'Manage Patients',
          description: 'View and manage patient records and information.',
          icon: <PeopleOutlined />,
          color: theme.palette.secondary.main,
          buttonText: 'Manage Patients',
          onClick: () => navigate('/admin/patients')
        },
        {
          title: 'Bed Management',
          description: 'Manage hospital beds, wards and patient assignments.',
          icon: <HotelOutlined />,
          color: theme.palette.success.main,
          buttonText: 'Manage Beds',
          onClick: () => navigate('/admin/beds')
        },
        {
          title: 'Appointments',
          description: 'Schedule and manage appointments for patients.',
          icon: <EventNoteOutlined />,
          color: theme.palette.warning.main,
          buttonText: 'View Appointments',
          onClick: () => navigate('/admin/appointments')
        }
      ];
    } else if (user.role === 'doctor') {
      return [
        {
          title: 'My Appointments',
          description: 'View and manage your upcoming appointments.',
          icon: <EventNoteOutlined />,
          color: theme.palette.primary.main,
          buttonText: 'View Appointments',
          onClick: () => navigate('/doctor/appointments')
        },
        {
          title: 'Patient Records',
          description: 'Access medical records for your patients.',
          icon: <PeopleOutlined />,
          color: theme.palette.secondary.main,
          buttonText: 'View Patients',
          onClick: () => navigate('/doctor/patients')
        }
      ];
    } else {
      // Patient role
      return [
        {
          title: 'Book Appointment',
          description: 'Schedule a new appointment with a doctor.',
          icon: <EventNoteOutlined />,
          color: theme.palette.primary.main,
          buttonText: 'Book Now',
          onClick: () => navigate('/patient/book-appointment')
        },
        {
          title: 'My Appointments',
          description: 'View your upcoming and past appointments.',
          icon: <EventNoteOutlined />,
          color: theme.palette.secondary.main,
          buttonText: 'View Appointments',
          onClick: () => navigate('/patient/appointments')
        },
        {
          title: 'Find a Doctor',
          description: 'Browse our directory of doctors by specialty.',
          icon: <LocalHospitalOutlined />,
          color: theme.palette.info.main,
          buttonText: 'Browse Doctors',
          onClick: () => navigate('/patient/doctors')
        },
        {
          title: 'Medical History',
          description: 'Access your medical records and history.',
          icon: <MedicalServicesOutlined />,
          color: theme.palette.warning.main,
          buttonText: 'View History',
          onClick: () => navigate('/patient/medical-history')
        }
      ];
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundImage: 'linear-gradient(to right, #1976d2, #64b5f6)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user.name}!
        </Typography>
        <Typography variant="body1">
          {user.role === 'admin' && "Manage your hospital system and monitor key metrics."}
          {user.role === 'doctor' && "View your appointments and manage patient records."}
          {user.role === 'patient' && "Book appointments and access your medical information."}
        </Typography>
      </Paper>

      {/* Stats Section - Only visible to admin and doctors */}
      {(user.role === 'admin' || user.role === 'doctor') && (
        <>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Hospital Overview
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Doctors" 
                value={stats.doctors} 
                icon={<LocalHospitalOutlined />} 
                color={theme.palette.primary.main}
                isLoading={loading}
                onClick={user.role === 'admin' ? () => navigate('/admin/doctors') : null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Patients" 
                value={stats.patients} 
                icon={<PeopleOutlined />} 
                color={theme.palette.secondary.main}
                isLoading={loading}
                onClick={user.role === 'admin' ? () => navigate('/admin/patients') : null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Appointments" 
                value={stats.appointments} 
                icon={<EventNoteOutlined />} 
                color={theme.palette.warning.main}
                isLoading={loading}
                onClick={() => navigate(user.role === 'admin' ? '/admin/appointments' : '/doctor/appointments')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Available Beds" 
                value={stats.beds} 
                icon={<HotelOutlined />} 
                color={theme.palette.success.main}
                isLoading={loading}
                onClick={user.role === 'admin' ? () => navigate('/admin/beds') : null}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Quick Actions Section */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {getFeatureCards().map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ActionCard {...action} />
          </Grid>
        ))}
      </Grid>

      {/* Emergency Section - Only visible to admin and doctors */}
      {(user.role === 'admin' || user.role === 'doctor') && (
        <Box mt={4}>
          <Paper 
            sx={{ 
              p: 3, 
              mt: 3, 
              bgcolor: '#fff5f5', 
              border: '1px solid #ffcdd2',
              borderRadius: 2
            }}
          >
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  backgroundColor: '#ffebee',
                  color: '#f44336',
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <MedicalServicesOutlined />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="#d32f2f">
                  Emergency Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quickly allocate resources for emergency cases and critical patients.
                </Typography>
              </Box>
              <Box ml="auto">
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => navigate('/emergency')}
                  sx={{ textTransform: 'none' }}
                >
                  Manage Emergency
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </DashboardLayout>
  );
};

export default Dashboard; 