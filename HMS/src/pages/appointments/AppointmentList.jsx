import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, CircularProgress, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Alert
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  EventNoteOutlined,
  MedicalServices,
  Cancel
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';
import AppointmentService from '../../services/appointmentService';
import AuthService from '../../services/authService';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
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
  
  const user = AuthService.getCurrentUser();
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await AppointmentService.getAllAppointments();
      setAppointments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOpen = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenViewDialog(true);
  };

  const handleEditOpen = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdatedAppointment({
      appointment_date: appointment.appointment_date,
      reason: appointment.reason,
      status: appointment.status,
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
      
      // Update the appointments list with the updated appointment
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === selectedAppointment.id 
        ? { ...appointment, ...updatedAppointment } 
          : appointment
      );
      
      setAppointments(updatedAppointments);
      setOpenEditDialog(false);
      // Show success message or notification
    } catch (error) {
      console.error('Error updating appointment:', error);
      // Show error message
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
      pending: { color: 'warning', icon: <EventNoteOutlined fontSize="small" /> },
      confirmed: { color: 'info', icon: <CheckCircle fontSize="small" /> },
      completed: { color: 'success', icon: <MedicalServices fontSize="small" /> },
      cancelled: { color: 'error', icon: <Cancel fontSize="small" /> }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Chip
        icon={config.icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={config.color}
        size="small"
      />
    );
  };

  return (
    <Box>
      <TableContainer>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Reason</TableCell>
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
                      {format(new Date(appointment.appointment_date), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {appointment.reason.length > 30
                        ? `${appointment.reason.substring(0, 30)}...`
                        : appointment.reason}
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
                <strong>Date & Time:</strong> {format(new Date(selectedAppointment.appointment_date), 'MMM dd, yyyy HH:mm')}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Reason:</strong> {selectedAppointment.reason}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {selectedAppointment.status}
              </Typography>
              
              {selectedAppointment.notes && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Notes:</strong> {selectedAppointment.notes}
                </Typography>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                <strong>Created:</strong> {format(new Date(selectedAppointment.created_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
              
              <Typography variant="subtitle1">
                <strong>Updated:</strong> {format(new Date(selectedAppointment.updated_at), 'MMM dd, yyyy HH:mm')}
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
                label="Date & Time"
                type="datetime-local"
                name="appointment_date"
                value={updatedAppointment.appointment_date}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Reason"
                name="reason"
                value={updatedAppointment.reason}
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
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
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
};

export default AppointmentList;