import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Tooltip, Alert, Grid, Card, CardContent, Divider, 
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Edit, Delete, Visibility, Search as SearchIcon,
  FilterList as FilterIcon, MedicalServices
} from '@mui/icons-material';
import DoctorService from '../../services/doctorService';
import DashboardLayout from '../../components/DashboardLayout';
import CreateDoctorDialog from './CreateDoctorDialog';

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

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [updatedDoctor, setUpdatedDoctor] = useState({
    specialty: '',
    experience: '',
    consultation_fee: ''
  });
  
  useEffect(() => {
    fetchDoctors();
  }, []);
  
  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, specialtyFilter]);
  
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
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply specialty filter
    if (specialtyFilter) {
      filtered = filtered.filter(doctor => 
        doctor.specialty === specialtyFilter
      );
    }
    
    setFilteredDoctors(filtered);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenViewDialog(true);
  };
  
  const handleEditOpen = (doctor) => {
    setSelectedDoctor(doctor);
    setUpdatedDoctor({
      specialty: doctor.specialty,
      experience: doctor.experience,
      consultation_fee: doctor.consultation_fee
    });
    setOpenEditDialog(true);
  };
  
  const handleEditClose = () => {
    setOpenEditDialog(false);
  };
  
  const handleDeleteOpen = (doctor) => {
    setSelectedDoctor(doctor);
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedDoctor({
      ...updatedDoctor,
      [name]: value
    });
  };
  
  const handleUpdateDoctor = async () => {
    try {
      setLoading(true);
      await DoctorService.updateDoctorProfile(selectedDoctor.id, updatedDoctor);
      fetchDoctors(); // Refresh doctors list
      handleEditClose();
    } catch (err) {
      console.error('Error updating doctor:', err);
      setError(err.message || 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDoctor = async () => {
    try {
      setLoading(true);
      await DoctorService.deleteDoctorProfile(selectedDoctor.id);
      fetchDoctors(); // Refresh doctors list
      handleDeleteClose();
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setError(err.message || 'Failed to delete doctor');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };
  
  const handleSpecialtyFilterChange = (e) => {
    setSpecialtyFilter(e.target.value);
    setPage(0);
  };
  
  const handleCreateSuccess = () => {
    fetchDoctors();
    setOpenCreateDialog(false);
  };
  
  const countDoctorsBySpecialty = (specialty) => {
    return doctors.filter(doctor => doctor.specialty === specialty).length;
  };
  
  // Group doctors by specialty for the summary cards
  const getDoctorsBySpecialty = () => {
    const specialtyCounts = {};
    
    doctors.forEach(doctor => {
      if (!specialtyCounts[doctor.specialty]) {
        specialtyCounts[doctor.specialty] = 0;
      }
      specialtyCounts[doctor.specialty]++;
    });
    
    return Object.entries(specialtyCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
      .map(([specialty, count]) => ({
        specialty,
        count
      }));
  };
  
  return (
    <DashboardLayout title="Doctor Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          Doctor Management
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doctor Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    <strong>Total Doctors:</strong> {doctors.length}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Specialties Available:</strong> {new Set(doctors.map(d => d.specialty)).size}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Specialties
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    {getDoctorsBySpecialty().slice(0, 4).map(item => (
                      <Grid item xs={6} key={item.specialty}>
                        <Typography variant="body2">
                          <strong>{item.specialty}:</strong> {item.count} doctors
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: { xs: '100%', sm: '70%' } }}>
            <TextField
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              select
              label="Filter by Specialty"
              value={specialtyFilter}
              onChange={handleSpecialtyFilterChange}
              sx={{ minWidth: 200 }}
              SelectProps={{
                displayEmpty: true,
              }}
            >
              <MenuItem value="">All Specialties</MenuItem>
              {specialties.map(specialty => (
                <MenuItem 
                  key={specialty} 
                  value={specialty}
                  disabled={countDoctorsBySpecialty(specialty) === 0}
                >
                  {specialty} ({countDoctorsBySpecialty(specialty)})
                </MenuItem>
              ))}
            </TextField>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Add Doctor
          </Button>
        </Box>
        
        <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
          <TableContainer>
            {loading && doctors.length === 0 ? (
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
                    <TableCell><strong>Specialty</strong></TableCell>
                    <TableCell><strong>Experience</strong></TableCell>
                    <TableCell><strong>Consultation Fee</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDoctors
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>{doctor.id}</TableCell>
                        <TableCell>{doctor.name}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={<MedicalServices fontSize="small" />} 
                            label={doctor.specialty} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{doctor.experience} Years</TableCell>
                        <TableCell>${parseFloat(doctor.consultation_fee).toFixed(2)}</TableCell>
                        <TableCell>
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton onClick={() => handleViewDetails(doctor)} size="small">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton 
                                onClick={() => handleEditOpen(doctor)} 
                                size="small"
                                color="primary"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                onClick={() => handleDeleteOpen(doctor)} 
                                size="small" 
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {filteredDoctors.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {searchTerm || specialtyFilter ? "No doctors match your search criteria." : "No doctors found in the system."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDoctors.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
        
        {/* View Doctor Details Dialog */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Doctor Details</DialogTitle>
          <DialogContent>
            {selectedDoctor && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedDoctor.name}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {selectedDoctor.email}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>ID:</strong> {selectedDoctor.id}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Specialty:</strong> {selectedDoctor.specialty}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Experience:</strong> {selectedDoctor.experience} Years
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Consultation Fee:</strong> ${parseFloat(selectedDoctor.consultation_fee).toFixed(2)}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Created:</strong> {new Date(selectedDoctor.created_at).toLocaleString()}
                </Typography>
                
                <Typography variant="subtitle1">
                  <strong>Last Updated:</strong> {new Date(selectedDoctor.updated_at).toLocaleString()}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Doctor Dialog */}
        <Dialog open={openEditDialog} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogContent>
            {selectedDoctor && (
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  select
                  label="Specialty"
                  name="specialty"
                  value={updatedDoctor.specialty}
                  onChange={handleInputChange}
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
                  value={updatedDoctor.experience}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
                
                <TextField
                  label="Consultation Fee"
                  name="consultation_fee"
                  type="number"
                  value={updatedDoctor.consultation_fee}
                  onChange={handleInputChange}
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
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button 
              onClick={handleUpdateDoctor} 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Doctor Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
          <DialogTitle>Delete Doctor</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the doctor profile for <strong>{selectedDoctor?.name}</strong>?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteClose}>Cancel</Button>
            <Button 
              onClick={handleDeleteDoctor} 
              variant="contained" 
              color="error"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Create Doctor Dialog */}
        <CreateDoctorDialog
          open={openCreateDialog}
          onClose={() => setOpenCreateDialog(false)}
          onSuccess={handleCreateSuccess}
        />
      </Box>
    </DashboardLayout>
  );
};

export default DoctorManagement; 