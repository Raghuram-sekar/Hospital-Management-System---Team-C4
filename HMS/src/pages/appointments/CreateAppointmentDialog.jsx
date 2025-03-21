import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, 
  CircularProgress, Alert, Box
} from '@mui/material';
import AppointmentService from '../../services/appointmentService';
import AuthService from '../../services/authService';

const CreateAppointmentDialog = ({ open, onClose, isPatient = false }) => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    patient_id: '',
    appointment_date: '',
    reason: '',
    status: 'pending'
  });
  
  const user = AuthService.getCurrentUser();
  
  useEffect(() => {
    if (open) {
      fetchDropdownData();
      resetForm();
    }
  }, [open]);
  
  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      
      // Fetch doctors for dropdown
      const response = await fetch('/api/doctors');
      const doctorsData = await response.json();
      setDoctors(doctorsData);
      
      // If admin, also fetch patients
      if (user.role === 'admin') {
        const patientsResponse = await fetch('/api/patients');
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError('Failed to load doctors and patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    // If patient is creating, pre-fill patient_id with their own ID
    if (isPatient) {
      setFormData({
        doctor_id: '',
        patient_id: user.patientId, // Assuming user object has patientId
        appointment_date: '',
        reason: '',
        status: 'pending'
      });
    } else {
      setFormData({
        doctor_id: '',
        patient_id: '',
        appointment_date: '',
        reason: '',
        status: 'pending'
      });
    }
    setSuccess(false);
    setError(null);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.doctor_id || 
        (!isPatient && !formData.patient_id) || 
        !formData.appointment_date || 
        !formData.reason) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create appointment
      await AppointmentService.createAppointment(formData);
      
      setSuccess(true);
      setTimeout(() => {
        onClose(); // Close dialog after success message is shown
      }, 1500);
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isPatient ? "Book an Appointment" : "Create New Appointment"}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Appointment created successfully!
          </Alert>
        )}
        
        <Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit}>
          {/* Doctor Selection */}
          <TextField
            select
            label="Select Doctor"
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          >
            {doctors.map((doctor) => (
              <MenuItem key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialty}
              </MenuItem>
            ))}
            {doctors.length === 0 && !loading && (
              <MenuItem disabled>No doctors available</MenuItem>
            )}
          </TextField>
          
          {/* Patient Selection (Admin only) */}
          {!isPatient && (
            <TextField
              select
              label="Select Patient"
              name="patient_id"
              value={formData.patient_id}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            >
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name}
                </MenuItem>
              ))}
              {patients.length === 0 && !loading && (
                <MenuItem disabled>No patients available</MenuItem>
              )}
            </TextField>
          )}
          
          {/* Appointment Date & Time */}
          <TextField
            label="Appointment Date & Time"
            type="datetime-local"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
          
          {/* Reason */}
          <TextField
            label="Reason for Visit"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            multiline
            rows={3}
            disabled={loading}
            placeholder="Please describe your symptoms or reason for the appointment"
          />
          
          {/* Status (Admin only) */}
          {user.role === 'admin' && (
            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              disabled={loading}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
            </TextField>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || success}
        >
          {loading ? <CircularProgress size={24} /> : "Create Appointment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAppointmentDialog; 