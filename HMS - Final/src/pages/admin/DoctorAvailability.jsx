import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Tooltip, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControlLabel, Switch, Divider, Card, CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import DoctorService from '../../services/doctorService';
import AvailabilityService from '../../services/availabilityService';

const DoctorAvailability = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [unavailability, setUnavailability] = useState([]);
  const [openUnavailabilityDialog, setOpenUnavailabilityDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openGeneralDialog, setOpenGeneralDialog] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Form states for unavailability
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [reason, setReason] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  
  // Form states for general availability
  const [isAvailable, setIsAvailable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState('09:00');
  const [availableTo, setAvailableTo] = useState('17:00');
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [maxAppointments, setMaxAppointments] = useState(10);
  
  // Form states for schedule
  const [scheduleData, setScheduleData] = useState({
    Monday: { is_available: true, start_time: '09:00', end_time: '17:00' },
    Tuesday: { is_available: true, start_time: '09:00', end_time: '17:00' },
    Wednesday: { is_available: true, start_time: '09:00', end_time: '17:00' },
    Thursday: { is_available: true, start_time: '09:00', end_time: '17:00' },
    Friday: { is_available: true, start_time: '09:00', end_time: '17:00' },
    Saturday: { is_available: false, start_time: '09:00', end_time: '13:00' },
    Sunday: { is_available: false, start_time: '00:00', end_time: '00:00' }
  });
  
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await DoctorService.getAllDoctors();
        setDoctors(data);
        if (data.length > 0 && !selectedDoctor) {
          setSelectedDoctor(data[0]);
          fetchDoctorData(data[0].id);
        } else if (selectedDoctor) {
          fetchDoctorData(selectedDoctor.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [refreshTrigger]);
  
  const fetchDoctorData = async (doctorId) => {
    setLoading(true);
    try {
      // Fetch doctor's schedule
      const scheduleData = await AvailabilityService.getDoctorSchedule(doctorId);
      setSchedules(scheduleData);
      
      // Initialize schedule form data from fetched schedules
      const newScheduleData = { ...scheduleData };
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      // Initialize with default values
      daysOfWeek.forEach(day => {
        newScheduleData[day] = {
          is_available: false,
          start_time: '09:00',
          end_time: '17:00'
        };
      });
      
      // Update with actual values from database
      scheduleData.forEach(schedule => {
        newScheduleData[schedule.day_of_week] = {
          is_available: schedule.is_available,
          start_time: schedule.start_time.substring(0, 5),
          end_time: schedule.end_time.substring(0, 5)
        };
      });
      
      setScheduleData(newScheduleData);
      
      // Fetch doctor's unavailability periods
      const unavailabilityData = await AvailabilityService.getDoctorUnavailability(doctorId);
      setUnavailability(unavailabilityData);
      
      // Fetch doctor's general availability
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        setIsAvailable(doctor.is_available);
        setAvailableFrom(doctor.available_from ? doctor.available_from.substring(0, 5) : '09:00');
        setAvailableTo(doctor.available_to ? doctor.available_to.substring(0, 5) : '17:00');
        setEmergencyAvailable(doctor.emergency_available);
        setMaxAppointments(doctor.max_appointments_per_day || 10);
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDoctorChange = (event) => {
    const doctorId = event.target.value;
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor);
    fetchDoctorData(doctorId);
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Unavailability Dialog Handlers
  const handleOpenUnavailabilityDialog = () => {
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    setReason('');
    setIsFullDay(true);
    setFormError('');
    setOpenUnavailabilityDialog(true);
  };
  
  const handleCloseUnavailabilityDialog = () => {
    setOpenUnavailabilityDialog(false);
    setFormError('');
  };
  
  const handleUnavailabilitySubmit = async () => {
    // Validate form
    if (!startDate || !endDate) {
      setFormError('Start date and end date are required');
      return;
    }
    
    if (!isFullDay && (!startTime || !endTime)) {
      setFormError('Start time and end time are required for partial day unavailability');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      const unavailabilityData = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        reason: reason
      };
      
      if (!isFullDay) {
        unavailabilityData.start_time = format(startTime, 'HH:mm');
        unavailabilityData.end_time = format(endTime, 'HH:mm');
      }
      
      await AvailabilityService.addUnavailabilityPeriod(selectedDoctor.id, unavailabilityData);
      
      // Refresh data
      fetchDoctorData(selectedDoctor.id);
      handleCloseUnavailabilityDialog();
    } catch (error) {
      setFormError(error.message || 'Failed to add unavailability period');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteUnavailability = async (unavailabilityId) => {
    if (!window.confirm('Are you sure you want to delete this unavailability period?')) {
      return;
    }
    
    try {
      await AvailabilityService.deleteUnavailabilityPeriod(unavailabilityId);
      
      // Refresh data
      fetchDoctorData(selectedDoctor.id);
    } catch (error) {
      console.error('Error deleting unavailability period:', error);
      alert(error.message || 'Failed to delete unavailability period');
    }
  };
  
  // Schedule Dialog Handlers
  const handleOpenScheduleDialog = () => {
    setFormError('');
    setOpenScheduleDialog(true);
  };
  
  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
    setFormError('');
  };
  
  const handleScheduleChange = (day, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };
  
  const handleScheduleSubmit = async () => {
    setFormLoading(true);
    setFormError('');
    
    try {
      // Convert schedule data to array format expected by API
      const schedulesArray = Object.entries(scheduleData)
        .filter(([_, data]) => data.is_available) // Only include available days
        .map(([day, data]) => ({
          day_of_week: day,
          start_time: data.start_time,
          end_time: data.end_time,
          is_available: data.is_available
        }));
      
      await AvailabilityService.updateDoctorSchedule(selectedDoctor.id, schedulesArray);
      
      // Refresh data
      fetchDoctorData(selectedDoctor.id);
      handleCloseScheduleDialog();
    } catch (error) {
      setFormError(error.message || 'Failed to update schedule');
    } finally {
      setFormLoading(false);
    }
  };
  
  // General Availability Dialog Handlers
  const handleOpenGeneralDialog = () => {
    setFormError('');
    setOpenGeneralDialog(true);
  };
  
  const handleCloseGeneralDialog = () => {
    setOpenGeneralDialog(false);
    setFormError('');
  };
  
  const handleGeneralSubmit = async () => {
    setFormLoading(true);
    setFormError('');
    
    try {
      await AvailabilityService.updateDoctorAvailability(selectedDoctor.id, {
        is_available: isAvailable,
        available_from: availableFrom,
        available_to: availableTo,
        emergency_available: emergencyAvailable,
        max_appointments_per_day: maxAppointments
      });
      
      // Refresh data
      handleRefresh();
      handleCloseGeneralDialog();
    } catch (error) {
      setFormError(error.message || 'Failed to update general availability');
    } finally {
      setFormLoading(false);
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout title="Doctor Availability">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Doctor Availability">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Doctor Availability Management
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Select Doctor"
              value={selectedDoctor ? selectedDoctor.id : ''}
              onChange={handleDoctorChange}
              sx={{ mb: 3 }}
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialty})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {selectedDoctor && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<AccessTimeIcon />}
                  onClick={handleOpenGeneralDialog}
                >
                  General Availability
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<EventIcon />}
                  onClick={handleOpenScheduleDialog}
                >
                  Weekly Schedule
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenUnavailabilityDialog}
                >
                  Add Unavailability
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
        
        {selectedDoctor && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      General Availability
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Status:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Chip 
                            label={selectedDoctor.is_available ? 'Available' : 'Unavailable'} 
                            color={selectedDoctor.is_available ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Working Hours:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {selectedDoctor.available_from?.substring(0, 5) || '09:00'} - {selectedDoctor.available_to?.substring(0, 5) || '17:00'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Emergency Availability:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Chip 
                            label={selectedDoctor.emergency_available ? 'Available' : 'Unavailable'} 
                            color={selectedDoctor.emergency_available ? 'success' : 'error'}
                            size="small"
                          />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Max Appointments/Day:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {selectedDoctor.max_appointments_per_day || 10}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Weekly Schedule
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                            const daySchedule = schedules.find(s => s.day_of_week === day);
                            return (
                              <TableRow key={day}>
                                <TableCell>{day}</TableCell>
                                <TableCell>
                                  {daySchedule ? (
                                    <Chip 
                                      label={daySchedule.is_available ? 'Available' : 'Unavailable'} 
                                      color={daySchedule.is_available ? 'success' : 'error'}
                                      size="small"
                                    />
                                  ) : (
                                    <Chip label="Not Set" color="warning" size="small" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {daySchedule ? (
                                    `${daySchedule.start_time.substring(0, 5)} - ${daySchedule.end_time.substring(0, 5)}`
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Unavailability Periods
              </Typography>
              
              {unavailability.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No unavailability periods set.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Time (if applicable)</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unavailability.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell>{format(new Date(period.start_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(new Date(period.end_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {period.start_time && period.end_time ? (
                              `${period.start_time.substring(0, 5)} - ${period.end_time.substring(0, 5)}`
                            ) : (
                              'Full Day'
                            )}
                          </TableCell>
                          <TableCell>{period.reason || 'N/A'}</TableCell>
                          <TableCell>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteUnavailability(period.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </>
        )}
      </Paper>
      
      {/* Unavailability Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openUnavailabilityDialog} onClose={handleCloseUnavailabilityDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Unavailability Period</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  slotProps={{
                    textField: { fullWidth: true, margin: 'normal' }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  slotProps={{
                    textField: { fullWidth: true, margin: 'normal' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={isFullDay} 
                      onChange={(e) => setIsFullDay(e.target.checked)} 
                    />
                  }
                  label="Full Day"
                />
              </Grid>
              
              {!isFullDay && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Start Time"
                      value={startTime}
                      onChange={setStartTime}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      slotProps={{
                        textField: { fullWidth: true, margin: 'normal' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="End Time"
                      value={endTime}
                      onChange={setEndTime}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      slotProps={{
                        textField: { fullWidth: true, margin: 'normal' }
                      }}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField
                  label="Reason"
                  fullWidth
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUnavailabilityDialog}>Cancel</Button>
            <Button 
              onClick={handleUnavailabilitySubmit} 
              variant="contained" 
              color="primary"
              disabled={formLoading}
              startIcon={formLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      
      {/* Schedule Dialog */}
      <Dialog open={openScheduleDialog} onClose={handleCloseScheduleDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Weekly Schedule</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <TableRow key={day}>
                    <TableCell>{day}</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={scheduleData[day].is_available} 
                            onChange={(e) => handleScheduleChange(day, 'is_available', e.target.checked)} 
                          />
                        }
                        label={scheduleData[day].is_available ? 'Available' : 'Unavailable'}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        value={scheduleData[day].start_time}
                        onChange={(e) => handleScheduleChange(day, 'start_time', e.target.value)}
                        disabled={!scheduleData[day].is_available}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        inputProps={{
                          step: 300, // 5 min
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        value={scheduleData[day].end_time}
                        onChange={(e) => handleScheduleChange(day, 'end_time', e.target.value)}
                        disabled={!scheduleData[day].is_available}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        inputProps={{
                          step: 300, // 5 min
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog}>Cancel</Button>
          <Button 
            onClick={handleScheduleSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* General Availability Dialog */}
      <Dialog open={openGeneralDialog} onClose={handleCloseGeneralDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit General Availability</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={isAvailable} 
                    onChange={(e) => setIsAvailable(e.target.checked)} 
                  />
                }
                label={isAvailable ? 'Available for Appointments' : 'Not Available for Appointments'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available From"
                type="time"
                fullWidth
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                disabled={!isAvailable}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available To"
                type="time"
                fullWidth
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                disabled={!isAvailable}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={emergencyAvailable} 
                    onChange={(e) => setEmergencyAvailable(e.target.checked)} 
                  />
                }
                label={emergencyAvailable ? 'Available for Emergency' : 'Not Available for Emergency'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Maximum Appointments Per Day"
                type="number"
                fullWidth
                value={maxAppointments}
                onChange={(e) => setMaxAppointments(parseInt(e.target.value) || 10)}
                disabled={!isAvailable}
                InputProps={{
                  inputProps: { min: 1, max: 50 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGeneralDialog}>Cancel</Button>
          <Button 
            onClick={handleGeneralSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default DoctorAvailability; 