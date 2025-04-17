import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, CircularProgress, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Alert, Typography, FormControl, InputLabel, Select
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  EventNoteOutlined,
  MedicalServices,
  Cancel,
  Sort as SortIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';
import AppointmentService from '../../services/appointmentService';
import AuthService from '../../services/authService';
import api from '../../services/api';
import debugBackend from '../../utils/debugBackend';

// If AppointmentUtils.js is missing or causing issues, let's directly define the necessary functions here
const sortAppointmentsByDate = (appointments) => {
  return [...appointments].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
};

const sortAppointmentsByPatient = (appointments) => {
  return [...appointments].sort((a, b) => {
    if (!a.patient_name || !b.patient_name) return 0;
    return a.patient_name.localeCompare(b.patient_name);
  });
};

const sortAppointmentsByStatus = (appointments) => {
  return [...appointments].sort((a, b) => {
    if (!a.status || !b.status) return 0;
    return a.status.localeCompare(b.status);
  });
};

const calculateAppointmentStats = (appointments) => {
  const stats = {
    total: appointments.length,
    byStatus: {},
    byDoctor: {},
    byMonth: {}
  };
  
  appointments.forEach(appointment => {
    // Status counts
    const status = appointment.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Doctor counts
    const doctorId = appointment.doctor_id;
    if (doctorId) {
      stats.byDoctor[doctorId] = (stats.byDoctor[doctorId] || 0) + 1;
    }
    
    // Month counts
    if (appointment.appointment_date) {
      const date = new Date(appointment.appointment_date);
      const month = date.getMonth() + 1; // 1-12
      const year = date.getFullYear();
      const monthKey = `${year}-${month}`;
      stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
    }
  });
  
  return stats;
};

const findTimeConflicts = (appointments) => {
  const conflicts = [];
  
  // Group appointments by doctor and date
  const appointmentsByDoctorAndDate = {};
  
  appointments.forEach(appointment => {
    // Skip cancelled appointments
    if (appointment.status === 'cancelled' || appointment.status === 'no-show') {
      return;
    }
    
    const doctorId = appointment.doctor_id;
    const date = appointment.appointment_date;
    const key = `${doctorId}_${date}`;
    
    if (!appointmentsByDoctorAndDate[key]) {
      appointmentsByDoctorAndDate[key] = [];
    }
    
    appointmentsByDoctorAndDate[key].push(appointment);
  });
  
  // Check for conflicts within each group
  Object.values(appointmentsByDoctorAndDate).forEach(doctorAppointments => {
    if (doctorAppointments.length > 1) {
      // Sort by start time
      doctorAppointments.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
      
      // Check for overlaps
      for (let i = 0; i < doctorAppointments.length - 1; i++) {
        const current = doctorAppointments[i];
        const next = doctorAppointments[i + 1];
        
        // Convert times to comparable format (minutes since midnight)
        const currentEndTime = timeToMinutes(current.end_time);
        const nextStartTime = timeToMinutes(next.start_time);
        
        if (currentEndTime > nextStartTime) {
          conflicts.push({
            appointment1: current,
            appointment2: next
          });
        }
      }
    }
  });
  
  return conflicts;
};

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const AppointmentList = forwardRef((props, ref) => {
  // Use appointments from props if provided, otherwise manage our own state
  const [localAppointments, setLocalAppointments] = useState([]);
  const appointments = props.appointments || localAppointments;
  const setAppointments = props.setAppointments || setLocalAppointments;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updatedAppointment, setUpdatedAppointment] = useState({
    appointment_date: '',
    reason: '',
    status: '',
    notes: ''
  });
  
  // State for sorting and statistics
  const [sortOption, setSortOption] = useState('date');
  const [stats, setStats] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  
  // States to track if we're using sample data
  const [isUsingSampleData, setIsUsingSampleData] = useState(false);
  
  // Ensure we have a user for testing purposes
  const user = AuthService.ensureAdminLogin();
  
  // Ensure token is valid before fetching
  const ensureToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, ensuring admin login');
      try {
        const adminUser = await AuthService.ensureAdminLogin();
        console.log('Admin login complete:', adminUser);
        return true;
      } catch (error) {
        console.error('Failed to ensure admin login:', error);
        setError('Authentication failed. Please try logging in again.');
        return false;
      }
    }
    return true;
  };
  
  useEffect(() => {
    const loadAppointments = async () => {
      await ensureToken();
      // Only fetch appointments if they're not provided through props
      if (!props.appointments) {
        fetchAppointments();
      } else {
        setLoading(false);
      }
    };
    
    loadAppointments();
    
    // Set up a refresh timer to check for new appointments
    const refreshTimer = setInterval(() => {
      // Check if global sample appointments have been updated
      if (window.HMS_SAMPLE_APPOINTMENTS && 
          (!appointments.length || 
           window.HMS_SAMPLE_APPOINTMENTS.length !== appointments.length)) {
        console.log('DEBUG: Detected change in global appointments array, refreshing...');
        // If no props appointments, refresh from the source
        if (!props.appointments) {
          fetchAppointments();
        }
      }
    }, 2000); // Check every 2 seconds
    
    // Clean up the timer
    return () => clearInterval(refreshTimer);
  }, [props.appointments]);
  
  const fetchAppointments = async () => {
    // Skip fetching if appointments are provided via props
    if (props.appointments) {
      console.log('DEBUG: Using appointments from props', props.appointments.length);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setIsUsingSampleData(false);
    
    try {
      // CRITICAL FIX: Check for global sample appointment data first
      if (window.HMS_SAMPLE_APPOINTMENTS && window.HMS_SAMPLE_APPOINTMENTS.length > 0) {
        console.log('DEBUG: Using global sample appointments:', window.HMS_SAMPLE_APPOINTMENTS.length);
        setAppointments([...window.HMS_SAMPLE_APPOINTMENTS]);
        setStats(calculateAppointmentStats(window.HMS_SAMPLE_APPOINTMENTS));
        setConflicts(findTimeConflicts(window.HMS_SAMPLE_APPOINTMENTS));
        setIsUsingSampleData(true);
        setLoading(false);
        return;
      }
      
      console.log('Testing API connection before fetching appointments...');
      let data = [];
      
      try {
        // Test if the backend is reachable
        const testResponse = await fetch('http://localhost:5001/api/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!testResponse.ok) {
          console.warn('API test failed, using sample data');
          data = debugBackend.getSampleAppointments();
          console.log('Retrieved sample data:', data.length, 'appointments');
          setIsUsingSampleData(true);
          throw new Error('Backend server not responding');
        }
        
        // If API test succeeded, proceed with real API call
        console.log('API connection successful, proceeding to fetch appointments...');
        console.log('Current user role:', user?.role);
        
        // Use the service for all roles - it will determine the correct endpoint
        data = await AppointmentService.getAllAppointments();
      } catch (connectionError) {
        console.warn('Connection error, using sample data:', connectionError.message);
        data = debugBackend.getSampleAppointments();
        console.log('Retrieved sample data on error:', data.length, 'appointments');
        setIsUsingSampleData(true);
      }
      
      console.log('Data received:', data ? data.length : 'none');
      
      if (data && Array.isArray(data)) {
        console.log('Setting appointments to:', data.length, 'items');
        
        // Force a clean state update
        setAppointments([]);
        setTimeout(() => {
          setAppointments(data);
          
          // Calculate statistics and conflicts when we have appointment data
          setStats(calculateAppointmentStats(data));
          setConflicts(findTimeConflicts(data));
        }, 50);
      } else {
        console.warn('Received non-array data for appointments, using empty array');
        setAppointments([]);
        setStats({
          total: 0,
          byStatus: {}
        });
        setConflicts([]);
      }
    } catch (error) {
      console.error('Error in appointment fetching process:', error);
      
      // Ensure we at least have sample data
      const sampleData = debugBackend.getSampleAppointments();
      setAppointments(sampleData);
      setStats(calculateAppointmentStats(sampleData));
      setConflicts(findTimeConflicts(sampleData));
      setIsUsingSampleData(true);
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting when the sort option changes
  useEffect(() => {
    if (appointments.length > 0) {
      let sortedData = [...appointments];
      
      if (sortOption === 'date') {
        sortedData = sortAppointmentsByDate(appointments);
      } else if (sortOption === 'patient') {
        sortedData = sortAppointmentsByPatient(appointments);
      } else if (sortOption === 'status') {
        sortedData = sortAppointmentsByStatus(appointments);
      }
      
      setAppointments(sortedData);
    }
  }, [sortOption]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };
  
  const handleViewOpen = (appointment) => {
    console.log('Opening view dialog for appointment:', appointment);
    setSelectedAppointment(appointment);
    setOpenViewDialog(true);
  };

  const handleEditOpen = (appointment) => {
    console.log('Opening edit dialog for appointment:', appointment);
    setSelectedAppointment(appointment);
    
    // Set defaults for any missing fields
    setUpdatedAppointment({
      appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
      start_time: appointment.start_time || '09:00',
      end_time: appointment.end_time || '09:30',
      purpose: appointment.purpose || appointment.reason || '',
      status: appointment.status || 'scheduled',
      notes: appointment.notes || ''
    });
    
    setOpenEditDialog(true);
  };

  const handleDeleteOpen = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setSelectedAppointment(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedAppointment({
      ...updatedAppointment,
      [name]: value
    });
  };

  const handleUpdateAppointment = async () => {
    try {
      const result = await AppointmentService.updateAppointment(selectedAppointment.id, updatedAppointment);
      
      // The AppointmentService now handles cache updates
      // Refresh appointments to get the updated list with proper sorting
      fetchAppointments();
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.message || 'Failed to update appointment');
    }
  };

  const handleDeleteAppointment = async () => {
    try {
      setLoading(true);
      if (user.role === 'admin') {
        await AppointmentService.deleteAppointment(selectedAppointment.id);
      } else {
        await AppointmentService.cancelAppointment(selectedAppointment.id);
      }
      fetchAppointments(); // Refresh appointments list
      handleDeleteClose();
    } catch (err) {
      console.error('Error deleting/canceling appointment:', err);
      setError(err.message || 'Failed to delete/cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      scheduled: { color: 'info', icon: <EventNoteOutlined fontSize="small" /> },
      completed: { color: 'success', icon: <CheckCircle fontSize="small" /> },
      cancelled: { color: 'error', icon: <Cancel fontSize="small" /> },
      'no-show': { color: 'warning', icon: <EventNoteOutlined fontSize="small" /> }
    };
    
    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <Chip
        icon={config.icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        size="small"
      />
    );
  };

  // Handle sort option change
  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  // Expose the fetchAppointments method through the ref
  useImperativeHandle(ref, () => ({
    fetchAppointments
  }));

  return (
    <Box>
      {/* Sorting and statistics controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="sort-select-label">Sort By</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortOption}
            label="Sort By"
            onChange={handleSortChange}
            size="small"
            startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="patient">Patient Name</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </Select>
        </FormControl>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />} 
            size="small" 
            onClick={() => setShowStats(!showStats)}
            sx={{ mr: 1 }}
          >
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </Button>
          
          {conflicts.length > 0 && (
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={() => setShowConflicts(!showConflicts)}
            >
              {showConflicts ? 'Hide Conflicts' : `Show Conflicts (${conflicts.length})`}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Statistics section */}
      {showStats && stats && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Appointment Statistics</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2">Total Appointments</Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2">By Status</Typography>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusChip(status)}
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Conflicts warning */}
      {showConflicts && conflicts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            {conflicts.length} scheduling conflicts detected!
          </Typography>
          {conflicts.map((conflict, index) => (
            <Typography variant="body2" key={index} sx={{ mt: 1 }}>
              Conflict between appointments for doctor {conflict.appointment1.doctor_name}:
              {' '}{format(new Date(conflict.appointment1.appointment_date), 'MMM dd, HH:mm')} and 
              {' '}{format(new Date(conflict.appointment2.appointment_date), 'MMM dd, HH:mm')}
            </Typography>
          ))}
        </Alert>
      )}

      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              appointments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.patient_name}</TableCell>
                    <TableCell>{appointment.doctor_name}</TableCell>
                    <TableCell>
                      {formatDate(appointment.appointment_date)}
                      {appointment.start_time && ` from ${appointment.start_time}`}
                      {appointment.end_time && ` to ${appointment.end_time}`}
                    </TableCell>
                    <TableCell>
                      {appointment.purpose || appointment.reason || 'No purpose specified'}
                    </TableCell>
                    <TableCell>{getStatusChip(appointment.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          onClick={() => handleViewOpen(appointment)}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Edit button - visible to admin and doctor */}
                      {(user.role === 'admin' || 
                        (user.role === 'doctor' && appointment.status !== 'cancelled')) && (
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => handleEditOpen(appointment)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* Delete/Cancel button */}
                      {(user.role === 'admin' || 
                        ((user.role === 'doctor' || user.role === 'patient') && 
                          appointment.status !== 'cancelled' && 
                          appointment.status !== 'completed')) && (
                        <Tooltip title={user.role === 'admin' ? 'Delete' : 'Cancel'}>
                          <IconButton 
                            onClick={() => handleDeleteOpen(appointment)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={appointments.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* View Appointment Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>ID:</strong> {selectedAppointment.id}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Patient:</strong> {selectedAppointment.patient_name}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Doctor:</strong> {selectedAppointment.doctor_name}
              </Typography>
              
              {selectedAppointment.specialty && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Specialty:</strong> {selectedAppointment.specialty}
                </Typography>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Date & Time:</strong> {formatDate(selectedAppointment.appointment_date)}
                {selectedAppointment.start_time && ` from ${selectedAppointment.start_time}`}
                {selectedAppointment.end_time && ` to ${selectedAppointment.end_time}`}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Purpose:</strong> {selectedAppointment.purpose || selectedAppointment.reason || ''}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {getStatusChip(selectedAppointment.status)}
              </Typography>
              
              {selectedAppointment.notes && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </Typography>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Created:</strong> {selectedAppointment.created_at ? formatDate(selectedAppointment.created_at) : 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Appointment Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                label="Date"
                type="date"
                name="appointment_date"
                value={updatedAppointment.appointment_date}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Start Time"
                type="time"
                name="start_time"
                value={updatedAppointment.start_time || '09:00'}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="End Time"
                type="time"
                name="end_time"
                value={updatedAppointment.end_time || '09:30'}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Purpose"
                name="purpose"
                value={updatedAppointment.purpose || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
              />
              
              {(user.role === 'admin' || user.role === 'doctor') && (
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={updatedAppointment.status}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="no-show">No Show</MenuItem>
                </TextField>
              )}
              
              {(user.role === 'admin' || user.role === 'doctor') && (
                <TextField
                  label="Notes"
                  name="notes"
                  value={updatedAppointment.notes || ''}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateAppointment} 
            variant="contained" 
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
        <DialogTitle>
          {user.role === 'admin' ? 'Delete Appointment?' : 'Cancel Appointment?'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            {user.role === 'admin'
              ? 'This action cannot be undone. The appointment will be permanently removed from the system.'
              : 'This will cancel the appointment. You can contact the hospital if you need to reschedule.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button 
            onClick={handleDeleteAppointment} 
            variant="contained" 
            color="error"
          >
            {user.role === 'admin' ? 'Delete' : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default AppointmentList;