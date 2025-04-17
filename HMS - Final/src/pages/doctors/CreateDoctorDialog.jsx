import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress, Alert, Box,
  Typography, Divider, InputAdornment
} from '@mui/material';
import DoctorService from '../../services/doctorService';
import AuthService from '../../services/authService';

const specialties = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Psychiatry',
  'Endocrinology',
  'Gastroenterology',
  'Oncology',
  'Pulmonology',
  'Nephrology',
  'General Surgery',
  'Plastic Surgery',
  'ENT Specialist',
  'Dental Surgery',
  'Radiology',
  'Anesthesiology'
];

const CreateDoctorDialog = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCreated, setUserCreated] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'doctor'
  });
  const [doctorData, setDoctorData] = useState({
    user_id: '',
    specialty: '',
    experience: '',
    consultation_fee: ''
  });
  
  const resetForm = () => {
    setStep(1);
    setUserData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'doctor'
    });
    setDoctorData({
      user_id: '',
      specialty: '',
      experience: '',
      consultation_fee: ''
    });
    setUserCreated(false);
    setError(null);
  };
  
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };
  
  const handleDoctorInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorData({
      ...doctorData,
      [name]: value
    });
  };
  
  const handleCreateUser = async () => {
    // Validate form
    if (!userData.name || !userData.email || !userData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create user API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Save the user ID for doctor profile creation
      setDoctorData({
        ...doctorData,
        user_id: data.user.id
      });
      
      setUserCreated(true);
      setStep(2);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDoctorProfile = async () => {
    // Validate form
    if (!doctorData.specialty) {
      setError('Specialty is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create doctor profile
      await DoctorService.createDoctorProfile(doctorData);
      
      // Success! Call the onSuccess callback
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
      resetForm();
    } catch (err) {
      console.error('Error creating doctor profile:', err);
      setError(err.message || 'Failed to create doctor profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {step === 1 ? "Add New Doctor - User Account" : "Add New Doctor - Professional Details"}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {step === 1 && (
          <Box component="form" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              First, create a user account for the doctor. The doctor will use these credentials to log in.
            </Typography>
            
            <TextField
              label="Full Name"
              name="name"
              value={userData.name}
              onChange={handleUserInputChange}
              fullWidth
              margin="normal"
              required
            />
            
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleUserInputChange}
              fullWidth
              margin="normal"
              required
            />
            
            <TextField
              label="Password"
              name="password"
              type="password"
              value={userData.password}
              onChange={handleUserInputChange}
              fullWidth
              margin="normal"
              required
            />
            
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={userData.confirmPassword}
              onChange={handleUserInputChange}
              fullWidth
              margin="normal"
              required
            />
          </Box>
        )}
        
        {step === 2 && (
          <Box component="form" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Now, add the professional details for Dr. {userData.name}.
            </Typography>
            
            <TextField
              select
              label="Specialty *"
              name="specialty"
              value={doctorData.specialty}
              onChange={handleDoctorInputChange}
              fullWidth
              margin="normal"
              required
            >
              {specialties.map(specialty => (
                <MenuItem key={specialty} value={specialty}>{specialty}</MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Experience (Years)"
              name="experience"
              type="number"
              value={doctorData.experience}
              onChange={handleDoctorInputChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 0 }}
            />
            
            <TextField
              label="Consultation Fee"
              name="consultation_fee"
              type="number"
              value={doctorData.consultation_fee}
              onChange={handleDoctorInputChange}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ step: "0.01", min: 0 }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {step === 1 && (
          <Button 
            onClick={handleCreateUser} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Next"}
          </Button>
        )}
        
        {step === 2 && (
          <>
            <Button 
              onClick={() => setStep(1)} 
              disabled={loading}
            >
              Back
            </Button>
            <Button 
              onClick={handleCreateDoctorProfile} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Create Doctor"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateDoctorDialog; 