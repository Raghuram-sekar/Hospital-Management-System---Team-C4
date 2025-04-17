import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Card, CardContent, CardActions, Alert,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, Select, InputLabel,
  Stack, Avatar, Badge
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Bed as BedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
// Import format from date-fns (using ESM style for Vite)
import { format as dateFormat } from 'date-fns';

// Create a safe format function that won't break rendering if it fails
const format = (date, formatStr) => {
  try {
    return dateFormat(new Date(date), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback formatting
    const d = new Date(date);
    return formatStr === 'h:mm a' ? 
      `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}` : 
      d.toLocaleString();
  }
};
import DashboardLayout from '../../components/DashboardLayout';
import AuthService from '../../services/authService';
import api from '../../services/api';

// Enhanced console logs to track component loading and catch errors
console.log('EmergencyDashboard component is being imported');

// Add this simplified PriorityQueue class before the EmergencyDashboard component
class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.comparator = comparator;
    this.heap = [];
    this.items = []; // Separate array for rendering
    console.log('PriorityQueue initialized');
  }

  add(item) {
    this.heap.push(item);
    this.items.push(item);
    this.heap.sort(this.comparator);
  }

  // Helper method to check if queue has items
  isEmpty() {
    return this.items.length === 0;
  }
}

const EmergencyDashboard = () => {
  console.log('EmergencyDashboard component is rendering');
  
  // Add global error handler to catch any rendering errors
  React.useEffect(() => {
    console.log('EmergencyDashboard mounted');
    const originalError = console.error;
    console.error = (...args) => {
      console.log('Caught error in EmergencyDashboard:', args);
      originalError.apply(console, args);
    };
    
    return () => {
      console.log('EmergencyDashboard unmounted');
      console.error = originalError;
    };
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergencyPatients, setEmergencyPatients] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [emergencyDoctors, setEmergencyDoctors] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openAdmitDialog, setOpenAdmitDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedBed, setSelectedBed] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [priorityQueue, setPriorityQueue] = useState(new PriorityQueue());
  const [usingSampleData, setUsingSampleData] = useState(false);
  
  const user = AuthService.getCurrentUser();

  // Sample emergency patients data with realistic conditions
  const getSampleEmergencyPatients = () => {
    return [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-05-12',
        gender: 'Male',
        contact_number: '555-123-4567',
        emergency_contact: '555-987-6543',
        medical_history: 'Hypertension, Asthma',
        allergies: 'Penicillin',
        chief_complaint: 'Chest pain and shortness of breath',
        triage_level: 'emergency',
        condition: 'critical',
        arrival_time: new Date(new Date().getTime() - 45 * 60000).toISOString(),
        vital_signs: JSON.stringify({
          temperature: 38.2,
          heart_rate: 110,
          blood_pressure: '140/95',
          respiratory_rate: 22,
          oxygen_saturation: 92
        }),
        notes: 'Patient arrived with severe chest pain, possible cardiac event. ECG shows abnormalities.',
        is_admitted: false
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-07-22',
        gender: 'Female',
        contact_number: '555-222-3333',
        emergency_contact: '555-444-5555',
        medical_history: 'None significant',
        allergies: 'None',
        chief_complaint: 'Multiple injuries from car accident',
        triage_level: 'emergency',
        condition: 'severe',
        arrival_time: new Date(Date.now() - 20 * 60000).toISOString(),
        vital_signs: JSON.stringify({
          temperature: 37.2,
          heart_rate: 110,
          blood_pressure: '140/85',
          respiratory_rate: 20,
          oxygen_saturation: 94
        }),
        notes: 'Patient brought in by ambulance. Suspected fractures in left arm and leg. CT scan ordered.',
        is_admitted: false
      },
      {
        id: 3,
        first_name: 'Robert',
        last_name: 'Johnson',
        date_of_birth: '1975-11-03',
        gender: 'Male',
        contact_number: '555-987-1234',
        emergency_contact: '555-876-5432',
        medical_history: 'Gallstones, Hypertension',
        allergies: 'Sulfa drugs',
        chief_complaint: 'Severe abdominal pain and vomiting',
        triage_level: 'urgent',
        condition: 'moderate',
        arrival_time: new Date(Date.now() - 60 * 60000).toISOString(),
        vital_signs: JSON.stringify({
          temperature: 37.8,
          heart_rate: 95,
          blood_pressure: '130/85',
          respiratory_rate: 18,
          oxygen_saturation: 97
        }),
        notes: 'Patient with severe RUQ pain. Ultrasound ordered to check for gallstones or appendicitis.',
        is_admitted: false
      },
      {
        id: 4,
        first_name: 'Sarah',
        last_name: 'Williams',
        date_of_birth: '2015-02-14',
        gender: 'Female',
        contact_number: '555-765-4321',
        emergency_contact: '555-765-8765',
        medical_history: 'Febrile seizures',
        allergies: 'None known',
        chief_complaint: 'High fever and seizure',
        triage_level: 'emergency',
        condition: 'critical',
        arrival_time: new Date(Date.now() - 15 * 60000).toISOString(),
        vital_signs: JSON.stringify({
          temperature: 39.8,
          heart_rate: 135,
          blood_pressure: '110/70',
          respiratory_rate: 28,
          oxygen_saturation: 93
        }),
        notes: 'Pediatric patient with febrile seizure. IV fluids started, labs drawn, pediatric neurologist consulted.',
        is_admitted: false
      },
      {
        id: 5,
        first_name: 'Michael',
        last_name: 'Brown',
        date_of_birth: '1967-08-21',
        gender: 'Male',
        contact_number: '555-333-2222',
        emergency_contact: '555-333-1111',
        medical_history: 'Type 2 Diabetes, Obesity',
        allergies: 'Latex',
        chief_complaint: 'Dizziness and laceration on right arm',
        triage_level: 'non-urgent',
        condition: 'stable',
        arrival_time: new Date(Date.now() - 90 * 60000).toISOString(),
        vital_signs: JSON.stringify({
          temperature: 36.9,
          heart_rate: 85,
          blood_pressure: '125/80',
          respiratory_rate: 16,
          oxygen_saturation: 98
        }),
        notes: 'Patient slipped and cut arm on glass. Wound cleaned and sutured. Blood glucose elevated at 180 mg/dL.',
        is_admitted: false
      }
    ];
  };

  // Sample emergency beds data
  const getSampleEmergencyBeds = () => {
    return [
      {
        id: 1,
        bed_number: 'ER-101',
        ward_id: 1,
        ward_name: 'Emergency Ward',
        bed_type: 'Critical Care',
        is_occupied: false
      },
      {
        id: 2,
        bed_number: 'ER-102',
        ward_id: 1,
        ward_name: 'Emergency Ward',
        bed_type: 'Critical Care',
        is_occupied: false
      },
      {
        id: 3,
        bed_number: 'ER-103',
        ward_id: 1,
        ward_name: 'Emergency Ward',
        bed_type: 'Standard',
        is_occupied: false
      },
      {
        id: 4,
        bed_number: 'ER-104',
        ward_id: 1,
        ward_name: 'Emergency Ward',
        bed_type: 'Standard',
        is_occupied: false
      },
      {
        id: 5,
        bed_number: 'ER-105',
        ward_id: 1,
        ward_name: 'Emergency Ward',
        bed_type: 'Pediatric',
        is_occupied: false
      }
    ];
  };

  // Sample emergency doctors data
  const getSampleEmergencyDoctors = () => {
    return [
      {
        id: 1,
        first_name: 'Dr. James',
        last_name: 'Wilson',
        specialty: 'Emergency Medicine',
        current_patients: 1
      },
      {
        id: 2,
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        specialty: 'Trauma Surgery',
        current_patients: 0
      },
      {
        id: 3,
        first_name: 'Dr. Emily',
        last_name: 'Chen',
        specialty: 'Pediatric Emergency',
        current_patients: 1
      },
      {
        id: 4,
        first_name: 'Dr. David',
        last_name: 'Garcia',
        specialty: 'Emergency Medicine',
        current_patients: 2
      }
    ];
  };

  // Fetch emergency data
  // Force using sample data for development (set to false for production)
  const forceSampleData = true;

  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        setLoading(true);
        setUsingSampleData(false);
        
        // Log that we're entering the data fetch process
        console.log('EmergencyDashboard: Starting data fetch');
        
        let patients = [];
        let beds = [];
        let doctors = [];
        
        if (!forceSampleData) {
          try {
            // Fetch emergency patients
            console.log('Fetching emergency patients from:', '/api/emergency/patients');
            const patientsResponse = await api.get('/api/emergency/patients');
            console.log('Patient response:', patientsResponse.data);
            patients = patientsResponse.data || [];
            
            // Fetch available emergency beds
            console.log('Fetching emergency beds from:', '/api/emergency/beds/available');
            const bedsResponse = await api.get('/api/emergency/beds/available');
            console.log('Beds response:', bedsResponse.data);
            beds = bedsResponse.data || [];
            
            // Fetch doctors available for emergency
            console.log('Fetching emergency doctors from:', '/api/emergency/doctors');
            const doctorsResponse = await api.get('/api/emergency/doctors');
            console.log('Doctors response:', doctorsResponse.data);
            doctors = doctorsResponse.data || [];
          } catch (apiError) {
            console.error('API Error:', apiError);
            // Continue to use sample data
          }
        }
        
        // Check if we need to use sample data
        if (forceSampleData || !patients.length) {
          console.log('Using sample patient data');
          patients = getSampleEmergencyPatients();
          setUsingSampleData(true);
        } else {
          // Normalize field names for consistency
          patients = patients.map(patient => ({
            ...patient,
            patient_condition: patient.patient_condition || patient.condition
          }));
        }
        
        // Check if we need sample beds data
        if (forceSampleData || !beds.length) {
          console.log('Using sample bed data');
          beds = getSampleEmergencyBeds();
          setUsingSampleData(true);
        }
        
        // Check if we need sample doctors data
        if (forceSampleData || !doctors.length) {
          console.log('Using sample doctor data');
          doctors = getSampleEmergencyDoctors();
          setUsingSampleData(true);
        }
        
        console.log('Setting data to state:', { 
          patients: patients.length, 
          beds: beds.length, 
          doctors: doctors.length 
        });
        
        setEmergencyPatients(patients);
        setAvailableBeds(beds);
        setEmergencyDoctors(doctors);
        
        // Create priority queue for patients
        const queue = new PriorityQueue();
        console.log('Creating priority queue with', patients.length, 'patients');
        patients.forEach(patient => {
          // Calculate priority based on condition severity and arrival time
          const priority = calculatePatientPriority(patient);
          queue.add({ patient, priority });
        });
        
        console.log('Priority queue created with', queue.items.length, 'items');
        setPriorityQueue(queue);
        setError(null);
      } catch (err) {
        console.error('Error in emergency dashboard initialization:', err);
        setError('Unable to initialize emergency dashboard. Displaying sample data.');
        setUsingSampleData(true);
        
        // Add fallback sample data on error
        const samplePatients = getSampleEmergencyPatients();
        const sampleBeds = getSampleEmergencyBeds();
        const sampleDoctors = getSampleEmergencyDoctors();
        
        console.log('Setting sample data after error');
        setEmergencyPatients(samplePatients);
        setAvailableBeds(sampleBeds);
        setEmergencyDoctors(sampleDoctors);
        
        // Create priority queue with sample data
        const queue = new PriorityQueue();
        samplePatients.forEach(patient => {
          const priority = calculatePatientPriority(patient);
          queue.add({ patient, priority });
        });
        
        setPriorityQueue(queue);
      } finally {
        setLoading(false);
        console.log('Emergency data loading completed, loading state set to false');
      }
    };
    
    fetchEmergencyData();
    
    // Refresh data every 2 minutes
    const interval = setInterval(fetchEmergencyData, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate patient priority for triage
  const calculatePatientPriority = (patient) => {
    // Lower number = higher priority
    let priority = 100;
    
    // Critical conditions get highest priority
    if (patient.patient_condition === 'critical') {
      priority -= 50;
    } else if (patient.patient_condition === 'severe') {
      priority -= 30;
    } else if (patient.patient_condition === 'moderate') {
      priority -= 15;
    } else if (patient.patient_condition === 'stable') {
      priority -= 5;
    }
    
    // Try to parse vital signs if available
    let vitalSigns = {};
    try {
      if (patient.vital_signs && typeof patient.vital_signs === 'string') {
        vitalSigns = JSON.parse(patient.vital_signs);
      } else if (patient.vital_signs && typeof patient.vital_signs === 'object') {
        vitalSigns = patient.vital_signs;
      }
    } catch (err) {
      console.error('Error parsing vital signs:', err);
    }
    
    // Consider vital signs for priority (if available)
    if (vitalSigns) {
      // High heart rate
      if (vitalSigns.heart_rate > 110) {
        priority -= 10;
      }
      
      // Low oxygen saturation
      if (vitalSigns.oxygen_saturation && vitalSigns.oxygen_saturation < 94) {
        priority -= 15;
      }
      
      // High temperature
      if (vitalSigns.temperature && vitalSigns.temperature > 38.5) {
        priority -= 8;
      }
      
      // Abnormal respiratory rate
      if (vitalSigns.respiratory_rate && (vitalSigns.respiratory_rate > 24 || vitalSigns.respiratory_rate < 12)) {
        priority -= 12;
      }
    }
    
    // Consider age factors (elderly and children get higher priority)
    const age = calculateAge(patient.date_of_birth);
    if (age < 12) {
      priority -= 15; // Higher priority for children
    } else if (age > 65) {
      priority -= 10; // Higher priority for elderly
    }
    
    // Consider wait time - longer wait increases priority
    const waitTimeMinutes = (new Date() - new Date(patient.arrival_time)) / (1000 * 60);
    priority -= Math.min(20, waitTimeMinutes / 5); // Max 20 points for wait time
    
    return priority;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open admit dialog
  const handleOpenAdmitDialog = (patient) => {
    setSelectedPatient(patient);
    setOpenAdmitDialog(true);
  };

  // Close admit dialog
  const handleCloseAdmitDialog = () => {
    setOpenAdmitDialog(false);
    setSelectedPatient(null);
    setSelectedBed('');
    setSelectedDoctor('');
  };

  // Handle patient admission
  const handleAdmitPatient = async () => {
    try {
      if (!selectedBed || !selectedDoctor) {
        return;
      }
      
      if (!usingSampleData) {
        // Only make API call if not using sample data
        const response = await api.post('/api/emergency/admit', {
          patient_id: selectedPatient.id,
          bed_id: selectedBed,
          doctor_id: selectedDoctor
        });
      }
      
      // Update local state
      const updatedPatients = emergencyPatients.filter(p => p.id !== selectedPatient.id);
      setEmergencyPatients(updatedPatients);
      
      const updatedBeds = availableBeds.filter(b => b.id !== selectedBed);
      setAvailableBeds(updatedBeds);
      
      // Update priority queue
      const updatedQueue = new PriorityQueue();
      updatedPatients.forEach(patient => {
        const priority = calculatePatientPriority(patient);
        updatedQueue.add({ patient, priority });
      });
      setPriorityQueue(updatedQueue);
      
      handleCloseAdmitDialog();
    } catch (err) {
      console.error('Error admitting patient:', err);
      setError('Failed to admit patient. Please try again.');
    }
  };

  // Get condition chip
  const getConditionComponent = (condition) => {
    // Normalize condition - handle both object input and string input
    let normalizedCondition;
    
    if (typeof condition === 'object') {
      normalizedCondition = condition.patient_condition || condition.condition || 'moderate';
    } else {
      normalizedCondition = condition || 'moderate';
    }
    
    console.log('Condition for component:', condition, 'Normalized to:', normalizedCondition);
    
    const conditionConfig = {
      critical: { color: 'error', icon: <WarningIcon fontSize="small" /> },
      severe: { color: 'error', icon: <WarningIcon fontSize="small" /> },
      moderate: { color: 'warning', icon: <WarningIcon fontSize="small" /> },
      stable: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    };
    
    // Default to moderate if not found
    const config = conditionConfig[normalizedCondition.toLowerCase()] || conditionConfig.moderate;
    
    return (
      <Chip
        icon={config.icon}
        label={normalizedCondition.charAt(0).toUpperCase() + normalizedCondition.slice(1)}
        color={config.color}
        size="small"
      />
    );
  };

  // Emergency Statistics
  const getEmergencyStats = () => {
    return {
      total_patients: emergencyPatients.length,
      critical_patients: emergencyPatients.filter(p => p.condition === 'critical').length,
      severe_patients: emergencyPatients.filter(p => p.condition === 'severe').length,
      moderate_patients: emergencyPatients.filter(p => p.condition === 'moderate').length,
      stable_patients: emergencyPatients.filter(p => p.condition === 'stable').length,
      beds_available: availableBeds.length,
      beds_occupied: 15 - availableBeds.length, // Assuming total of 15 emergency beds
      doctors_available: emergencyDoctors.filter(d => d.current_patients < 3).length,
      doctors_busy: emergencyDoctors.filter(d => d.current_patients >= 3).length,
      average_wait_time: Math.round(emergencyPatients.reduce((sum, patient) => {
        const waitTimeMinutes = Math.round((new Date() - new Date(patient.arrival_time)) / (1000 * 60));
        return sum + waitTimeMinutes;
      }, 0) / (emergencyPatients.length || 1))
    };
  };
  
  const stats = getEmergencyStats();

  // For debugging purposes
  if (false) {
    console.log('Using simplified emergency dashboard for testing');
    return (
      <div style={{ padding: '20px' }}>
        <h1>Emergency Dashboard - Test Version</h1>
        <p>This is a simplified version to troubleshoot rendering issues.</p>
        <button onClick={() => console.log('Button clicked in simplified emergency dashboard')}>Test Button</button>
      </div>
    );
  }
  
  console.log('EmergencyDashboard about to render JSX');
  
  // Try wrapping the return in a try-catch to identify rendering errors
  try {
    return (
    <DashboardLayout title="Emergency Department">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Emergency Department Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="error" 
            size="medium"
            startIcon={<WarningIcon />}
          >
            Emergency Alert
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            size="medium"
            onClick={() => alert('Register new emergency patient functionality coming soon!')}
          >
            Register New Patient
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      
      {/* No data placeholder - show if not loading and no patients */}
      {!loading && emergencyPatients.length === 0 && !error && (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" gutterBottom color="textSecondary">
            No emergency data available
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Either there are no emergency patients currently or the system couldn't connect to the database.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setEmergencyPatients(getSampleEmergencyPatients());
              setAvailableBeds(getSampleEmergencyBeds());
              setEmergencyDoctors(getSampleEmergencyDoctors());
              setUsingSampleData(true);
              
              // Create priority queue with sample data
              const queue = new PriorityQueue();
              getSampleEmergencyPatients().forEach(patient => {
                const priority = calculatePatientPriority(patient);
                queue.add({ patient, priority });
              });
              setPriorityQueue(queue);
            }}
          >
            Load Sample Data
          </Button>
        </Paper>
      )}
      
      <Box sx={{ px: 3, pt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
          TabIndicatorProps={{
            style: { backgroundColor: '#1976d2' }
          }}
          variant="standard"
        >
          <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Patients" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Resources" icon={<MedicalIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      <Box sx={{ p: 3 }}>
        {/* Emergency Statistics - Modern Dashboard Design */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={4}>
            {/* Total Patients */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)',
                borderRadius: '12px',
                p: 2.5,
                height: '100%',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '14px', color: '#666', letterSpacing: '0.5px', mb: 0.5 }}>
                      TOTAL PATIENTS
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '32px', color: '#333' }}>
                      {stats.total_patients}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', width: 48, height: 48 }}>
                    <PersonIcon sx={{ color: '#1976d2' }} />
                  </Avatar>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#777', display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ mr: 0.5, color: stats.critical_patients > 0 ? '#f44336' : '#4caf50', fontWeight: 500 }}>
                    {stats.critical_patients}
                  </Box> 
                  critical patients requiring immediate attention
                </Typography>
              </Box>
            </Grid>

            {/* Available Beds */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)',
                borderRadius: '12px',
                p: 2.5,
                height: '100%',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '14px', color: '#666', letterSpacing: '0.5px', mb: 0.5 }}>
                      AVAILABLE BEDS
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '32px', color: '#333' }}>
                      {stats.beds_available}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', width: 48, height: 48 }}>
                    <BedIcon sx={{ color: '#4caf50' }} />
                  </Avatar>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#777', display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ mr: 0.5, color: stats.beds_occupied > 10 ? '#f44336' : '#4caf50', fontWeight: 500 }}>
                    {stats.beds_occupied}
                  </Box>
                  beds currently occupied
                </Typography>
              </Box>
            </Grid>

            {/* Doctors Available */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)',
                borderRadius: '12px',
                p: 2.5,
                height: '100%',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '14px', color: '#666', letterSpacing: '0.5px', mb: 0.5 }}>
                      DOCTORS AVAILABLE
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '32px', color: '#333' }}>
                      {stats.doctors_available}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(3, 169, 244, 0.1)', width: 48, height: 48 }}>
                    <MedicalIcon sx={{ color: '#03a9f4' }} />
                  </Avatar>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#777', display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ mr: 0.5, color: '#4caf50', fontWeight: 500 }}>
                    {emergencyDoctors.length}
                  </Box>
                  total doctors on emergency duty
                </Typography>
              </Box>
            </Grid>

            {/* Average Wait Time */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)',
                borderRadius: '12px',
                p: 2.5,
                height: '100%',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 5px 15px rgba(0,0,0,0.08)' }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '14px', color: '#666', letterSpacing: '0.5px', mb: 0.5 }}>
                      AVG. WAIT TIME
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '32px', color: '#333' }}>
                      {stats.average_wait_time} <Typography component="span" sx={{ fontSize: '16px' }}>min</Typography>
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', width: 48, height: 48 }}>
                    <WarningIcon sx={{ color: '#f44336' }} />
                  </Avatar>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#777', display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ mr: 0.5, color: stats.average_wait_time > 30 ? '#f44336' : '#4caf50', fontWeight: 500 }}>
                    {priorityQueue?.items?.length || 0}
                  </Box>
                  patients currently waiting
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Emergency Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Emergency Patients
              </Typography>
              <Typography component="p" variant="h3" color="primary">
                {loading ? <CircularProgress size={24} /> : stats.totalPatients}
              </Typography>
              <Typography variant="body2">
                Current emergency cases requiring attention
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Critical Patients
              </Typography>
              <Typography component="p" variant="h3" color="error">
                {loading ? <CircularProgress size={24} /> : stats.criticalPatients}
              </Typography>
              <Typography variant="body2">
                Patients in critical condition
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Available Beds
              </Typography>
              <Typography component="p" variant="h3" color="info.main">
                {loading ? <CircularProgress size={24} /> : availableBeds.length}
              </Typography>
              <Typography variant="body2">
                Emergency beds ready for new patients
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Occupancy Rate
              </Typography>
              <Typography component="p" variant="h3" color={stats.occupancyRate > 80 ? 'error' : 'primary'}>
                {loading ? <CircularProgress size={24} /> : `${stats.occupancyRate}%`}
              </Typography>
              <Typography variant="body2">
                Current emergency ward occupancy
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Triage Queue */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Triage Queue
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : emergencyPatients.length > 0 ? (
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Chief Complaint</TableCell>
                    <TableCell>Arrival Time</TableCell>
                    <TableCell>Wait Time</TableCell>
                    <TableCell>Vital Signs</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(priorityQueue?.items?.length > 0) ? priorityQueue.items.map((item, index) => {
                    const patient = item.patient;
                    const waitTimeMinutes = Math.round((new Date() - new Date(patient.arrival_time)) / (1000 * 60));
                    const age = calculateAge(patient.date_of_birth);
                    
                    // Parse vital signs
                    let vitalSigns = {};
                    try {
                      if (patient.vital_signs && typeof patient.vital_signs === 'string') {
                        vitalSigns = JSON.parse(patient.vital_signs);
                      } else if (patient.vital_signs && typeof patient.vital_signs === 'object') {
                        vitalSigns = patient.vital_signs;
                      }
                    } catch (err) {
                      console.error('Error parsing vital signs:', err);
                    }
                    
                    return (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <Chip 
                            label={`P${index + 1}`} 
                            color={index < 2 ? 'error' : index < 5 ? 'warning' : 'primary'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{`${patient.first_name} ${patient.last_name}`}</TableCell>
                        <TableCell>{age}</TableCell>
                        <TableCell>{getConditionComponent(patient)}</TableCell>
                        <TableCell>{patient.chief_complaint}</TableCell>
                        <TableCell>{format(new Date(patient.arrival_time), 'h:mm a')}</TableCell>
                        <TableCell>
                          <Typography 
                            color={waitTimeMinutes > 30 ? 'error.main' : waitTimeMinutes > 15 ? 'warning.main' : 'text.primary'}
                          >
                            {`${waitTimeMinutes} min`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {vitalSigns.temperature && (
                              <Typography variant="body2" component="div">
                                Temp: <b>{vitalSigns.temperature}°C</b>
                              </Typography>
                            )}
                            {vitalSigns.heart_rate && (
                              <Typography variant="body2" component="div">
                                HR: <b>{vitalSigns.heart_rate} bpm</b>
                              </Typography>
                            )}
                            {vitalSigns.blood_pressure && (
                              <Typography variant="body2" component="div">
                                BP: <b>{vitalSigns.blood_pressure}</b>
                              </Typography>
                            )}
                            {vitalSigns.oxygen_saturation && (
                              <Typography variant="body2" component="div">
                                O₂: <b>{vitalSigns.oxygen_saturation}%</b>
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleOpenAdmitDialog(patient)}
                            disabled={availableBeds.length === 0 || emergencyDoctors.length === 0}
                          >
                            Admit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : []}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No patients in the emergency queue.</Alert>
          )}
        </Paper>
        
        {/* Available Resources */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Emergency Beds
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : availableBeds.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Bed Number</TableCell>
                        <TableCell>Ward</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableBeds.map((bed) => (
                        <TableRow key={bed.id}>
                          <TableCell>{bed.bed_number}</TableCell>
                          <TableCell>{bed.ward_name}</TableCell>
                          <TableCell>{bed.bed_type}</TableCell>
                          <TableCell>
                            <Chip
                              icon={<BedIcon fontSize="small" />}
                              label="Available"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning">No emergency beds available.</Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Doctors on Duty
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : emergencyDoctors.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Doctor Name</TableCell>
                        <TableCell>Specialty</TableCell>
                        <TableCell>Current Patients</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {emergencyDoctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell>{`${doctor.first_name} ${doctor.last_name}`}</TableCell>
                          <TableCell>{doctor.specialty}</TableCell>
                          <TableCell>{doctor.current_patients}</TableCell>
                          <TableCell>
                            <Chip
                              icon={<PersonIcon fontSize="small" />}
                              label={doctor.current_patients < 3 ? "Available" : "Busy"}
                              color={doctor.current_patients < 3 ? "success" : "warning"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning">No emergency doctors available.</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Admit Patient Dialog */}
      <Dialog open={openAdmitDialog} onClose={handleCloseAdmitDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Admit Emergency Patient
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  {`${calculateAge(selectedPatient.date_of_birth)} years old • ${selectedPatient.gender}`}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Chief Complaint:</strong> {selectedPatient.chief_complaint}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    <strong>Condition:</strong>
                  </Typography>
                  {getConditionComponent(selectedPatient)}
                </Box>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="bed-select-label">Assign Bed</InputLabel>
                <Select
                  labelId="bed-select-label"
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(e.target.value)}
                  label="Assign Bed"
                  required
                >
                  {availableBeds.map((bed) => (
                    <MenuItem key={bed.id} value={bed.id}>
                      {`${bed.bed_number} (${bed.bed_type})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="doctor-select-label">Assign Doctor</InputLabel>
                <Select
                  labelId="doctor-select-label"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  label="Assign Doctor"
                  required
                >
                  {emergencyDoctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {`${doctor.first_name} ${doctor.last_name} (${doctor.specialty})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Additional Notes"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdmitDialog}>Cancel</Button>
          <Button 
            onClick={handleAdmitPatient} 
            variant="contained" 
            color="primary"
            disabled={!selectedBed || !selectedDoctor}
          >
            Admit Patient
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
    );
  } catch (error) {
    console.error('Error rendering EmergencyDashboard:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error rendering Emergency Dashboard</h1>
        <p>{error.message}</p>
      </div>
    );
  }
};

export default EmergencyDashboard; 