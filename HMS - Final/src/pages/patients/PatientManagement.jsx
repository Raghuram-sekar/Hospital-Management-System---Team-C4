// src/pages/patients/PatientManagement.jsx
import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Alert, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Edit, Delete, Visibility, Search as SearchIcon,
  Person, LocalHospital
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Use the api service instead of fetch directly
      const response = await api.get('/patients');
      setPatients(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to fetch patients. Please try again later.');
      // Show empty patients list instead of failing
      setPatients([]);
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
  
  return (
    <DashboardLayout title="Patient Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          Patient Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage patient records in the hospital system.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <TextField
            placeholder="Search patients..."
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Add Patient
          </Button>
        </Box>
        
        <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
          <TableContainer>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Date of Birth</strong></TableCell>
                    <TableCell><strong>Blood Group</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>{patient.id}</TableCell>
                          <TableCell>{patient.name}</TableCell>
                          <TableCell>{patient.email}</TableCell>
                          <TableCell>
                            {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {patient.blood_group ? (
                              <Chip 
                                icon={<LocalHospital fontSize="small" />} 
                                label={patient.blood_group} 
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary">
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error">
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={patients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default PatientManagement;