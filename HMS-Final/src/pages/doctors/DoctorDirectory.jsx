import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, 
  TextField, InputAdornment, CircularProgress,
  Avatar, Chip, Divider, Button, Alert, Tab, Tabs, 
  Accordion, AccordionSummary, AccordionDetails,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon, MedicalServices, ExpandMore,
  LocalHospital, Star, Event as EventIcon
} from '@mui/icons-material';
import DoctorService from '../../services/doctorService';
import DashboardLayout from '../../components/DashboardLayout';

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    fetchDoctors();
  }, []);
  
  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, activeTab]);
  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await DoctorService.getAllDoctors();
      setDoctors(data);
      setFilteredDoctors(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };
  
  const filterDoctors = () => {
    let filtered = [...doctors];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply specialty category filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(doctor => getSpecialtyCategory(doctor.specialty) === activeTab);
    }
    
    setFilteredDoctors(filtered);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Group doctors by specialty
  const getDoctorsBySpecialty = () => {
    const specialtyGroups = {};
    
    filteredDoctors.forEach(doctor => {
      if (!specialtyGroups[doctor.specialty]) {
        specialtyGroups[doctor.specialty] = [];
      }
      specialtyGroups[doctor.specialty].push(doctor);
    });
    
    return Object.entries(specialtyGroups)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by specialty name
      .map(([specialty, doctors]) => ({
        specialty,
        doctors
      }));
  };
  
  // Define specialty categories
  const getSpecialtyCategory = (specialty) => {
    const categories = {
      'Cardiology': 'cardio',
      'Neurology': 'neuro',
      'Orthopedics': 'ortho',
      'Pediatrics': 'pediatric',
      'Dermatology': 'general',
      'Ophthalmology': 'general',
      'Gynecology': 'general',
      'Urology': 'general',
      'Psychiatry': 'mental',
      'Endocrinology': 'general',
      'Gastroenterology': 'general',
      'Oncology': 'cancer',
      'Pulmonology': 'cardio',
      'Nephrology': 'general',
      'General Surgery': 'surgical',
      'Plastic Surgery': 'surgical',
      'ENT Specialist': 'general',
      'Dental Surgery': 'dental',
      'Radiology': 'diag',
      'Anesthesiology': 'surgical'
    };
    
    return categories[specialty] || 'general';
  };
  
  // Get avatar color based on specialty category
  const getAvatarColor = (specialty) => {
    const categoryColors = {
      'cardio': '#ef5350', // red
      'neuro': '#7e57c2', // purple
      'ortho': '#29b6f6', // blue
      'pediatric': '#66bb6a', // green
      'mental': '#ffa726', // orange
      'cancer': '#ec407a', // pink
      'surgical': '#26a69a', // teal
      'dental': '#78909c', // blue-grey
      'diag': '#8d6e63', // brown
      'general': '#5c6bc0' // indigo
    };
    
    return categoryColors[getSpecialtyCategory(specialty)] || '#5c6bc0';
  };
  
  return (
    <DashboardLayout title="Doctor Directory">
      <Box>
        <Typography variant="h4" gutterBottom>
          Find a Doctor
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Browse our team of qualified medical professionals by specialty.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 4 }}>
          <TextField
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Specialties" value="all" />
            <Tab label="Cardiology & Respiratory" value="cardio" />
            <Tab label="Neurology" value="neuro" />
            <Tab label="Orthopedics" value="ortho" />
            <Tab label="Pediatrics" value="pediatric" />
            <Tab label="Surgery" value="surgical" />
            <Tab label="Oncology" value="cancer" />
            <Tab label="Mental Health" value="mental" />
            <Tab label="General Medicine" value="general" />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredDoctors.length === 0 ? (
              <Alert severity="info">
                No doctors match your search criteria. Please try a different search term or specialty.
              </Alert>
            ) : (
              <>
                {/* Display by specialty groups */}
                {getDoctorsBySpecialty().map(group => (
                  <Box key={group.specialty} sx={{ mb: 4 }}>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              backgroundColor: getAvatarColor(group.specialty),
                              mr: 2
                            }}
                          >
                            <MedicalServices />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {group.specialty}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {group.doctors.length} Doctor{group.doctors.length !== 1 && 's'}
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {group.doctors.map(doctor => (
                            <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                              <Card sx={{ 
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                                }
                              }}>
                                <CardContent>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                      sx={{ 
                                        width: 64, 
                                        height: 64, 
                                        bgcolor: getAvatarColor(doctor.specialty),
                                        fontSize: '1.5rem',
                                        mr: 2
                                      }}
                                    >
                                      {doctor.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="h6">
                                        Dr. {doctor.name.split(' ')[0]} {doctor.name.split(' ').slice(1).join(' ')}
                                      </Typography>
                                      <Chip 
                                        icon={<MedicalServices fontSize="small" />} 
                                        label={doctor.specialty} 
                                        size="small"
                                        sx={{
                                          bgcolor: `${getAvatarColor(doctor.specialty)}20`,
                                          color: getAvatarColor(doctor.specialty),
                                          borderColor: getAvatarColor(doctor.specialty)
                                        }}
                                        variant="outlined"
                                      />
                                    </Box>
                                  </Box>
                                  
                                  <Divider sx={{ my: 1.5 }} />
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Experience:</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                      {doctor.experience} {parseInt(doctor.experience) === 1 ? 'Year' : 'Years'}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Consultation Fee:</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                      ${parseFloat(doctor.consultation_fee).toFixed(2)}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Button
                                      variant="contained"
                                      startIcon={<EventIcon />}
                                      fullWidth
                                      sx={{
                                        bgcolor: getAvatarColor(doctor.specialty),
                                        '&:hover': {
                                          bgcolor: getAvatarColor(doctor.specialty),
                                          filter: 'brightness(0.9)'
                                        }
                                      }}
                                    >
                                      Book Appointment
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ))}
              </>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default DoctorDirectory; 