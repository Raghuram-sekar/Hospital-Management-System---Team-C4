import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Tabs, Tab, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Chip, Tooltip,
  Alert, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import DashboardLayout from '../../components/DashboardLayout';
import BedService from '../../services/bedService';
import PatientService from '../../services/patientService';

const BedManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [openBedDialog, setOpenBedDialog] = useState(false);
  const [openWardDialog, setOpenWardDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states for creating/editing beds
  const [bedNumber, setBedNumber] = useState('');
  const [bedType, setBedType] = useState('Regular');
  const [wardId, setWardId] = useState('');
  const [patientId, setPatientId] = useState('');

  // Form states for creating/editing wards
  const [wardName, setWardName] = useState('');
  const [wardType, setWardType] = useState('General');
  const [capacity, setCapacity] = useState(10);
  const [floor, setFloor] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bedsData, wardsData, patientsData] = await Promise.all([
          BedService.getAllBeds(),
          BedService.getAllWards(),
          PatientService.getAllPatients()
        ]);
        
        console.log('Fetched patients:', patientsData);
        setBeds(bedsData);
        setWards(wardsData);
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Bed Dialog Handlers
  const handleOpenBedDialog = (bed = null) => {
    if (bed) {
      setSelectedBed(bed);
      setBedNumber(bed.bed_number);
      setBedType(bed.bed_type);
      setWardId(bed.ward_id);
    } else {
      setSelectedBed(null);
      setBedNumber('');
      setBedType('Regular');
      setWardId('');
    }
    setFormError('');
    setOpenBedDialog(true);
  };

  const handleCloseBedDialog = () => {
    setOpenBedDialog(false);
    setSelectedBed(null);
    setFormError('');
  };

  const handleBedSubmit = async () => {
    // Validate form
    if (!bedNumber || !wardId) {
      setFormError('Bed number and ward are required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (selectedBed) {
        // Update existing bed
        await BedService.updateBed(selectedBed.id, {
          bed_number: bedNumber,
          bed_type: bedType
        });
      } else {
        // Create new bed
        await BedService.createBed({
          bed_number: bedNumber,
          ward_id: wardId,
          bed_type: bedType
        });
      }
      
      // Refresh data
      handleRefresh();
      handleCloseBedDialog();
    } catch (error) {
      setFormError(error.message || 'Failed to save bed');
    } finally {
      setFormLoading(false);
    }
  };

  // Ward Dialog Handlers
  const handleOpenWardDialog = (ward = null) => {
    if (ward) {
      setSelectedWard(ward);
      setWardName(ward.name);
      setWardType(ward.ward_type);
      setCapacity(ward.capacity);
      setFloor(ward.floor);
    } else {
      setSelectedWard(null);
      setWardName('');
      setWardType('General');
      setCapacity(10);
      setFloor(1);
    }
    setFormError('');
    setOpenWardDialog(true);
  };

  const handleCloseWardDialog = () => {
    setOpenWardDialog(false);
    setSelectedWard(null);
    setFormError('');
  };

  const handleWardSubmit = async () => {
    // Validate form
    if (!wardName || !wardType) {
      setFormError('Ward name and type are required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (selectedWard) {
        // Update existing ward
        await BedService.updateWard(selectedWard.id, {
          name: wardName,
          ward_type: wardType,
          capacity: capacity,
          floor: floor
        });
      } else {
        // Create new ward
        await BedService.createWard({
          name: wardName,
          ward_type: wardType,
          capacity: capacity,
          floor: floor
        });
      }
      
      // Refresh data
      handleRefresh();
      handleCloseWardDialog();
    } catch (error) {
      setFormError(error.message || 'Failed to save ward');
    } finally {
      setFormLoading(false);
    }
  };

  // Assign Bed Dialog Handlers
  const handleOpenAssignDialog = (bed) => {
    setSelectedBed(bed);
    setPatientId('');
    setFormError('');
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedBed(null);
    setFormError('');
  };

  const handleAssignBed = async () => {
    if (!patientId) {
      setFormError('Please select a patient');
      return;
    }

    setFormLoading(true);
    setFormError('');

    // Log the selected values for debugging
    console.log('Assignment attempt with:', {
      bedId: selectedBed.id,
      bedNumber: selectedBed.bed_number,
      patientId: patientId,
      selectedPatient: patients.find(p => p.id.toString() === patientId.toString())
    });

    try {
      // First try the direct assignment endpoint
      const directResponse = await fetch(`http://localhost:5000/api/beds/direct-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bedId: selectedBed.id, 
          patientId: patientId 
        })
      });
      
      console.log('Direct assign response status:', directResponse.status);
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log('Direct assignment successful:', data);
        handleRefresh();
        handleCloseAssignDialog();
        return;
      }
      
      const directErrorData = await directResponse.json();
      console.error('Direct assign failed:', directErrorData);
      
      // If we get an 'already occupied' error, try force-assign
      if (directErrorData.message && directErrorData.message.includes('occupied')) {
        console.log('Bed appears to be occupied, trying force-assign...');
        
        if (!window.confirm('This bed appears to be occupied in the database even though it shows as available. Would you like to force-assign this patient to the bed?')) {
          setFormError('Assignment cancelled. The bed is marked as occupied in the database.');
          setFormLoading(false);
          return;
        }
        
        // Try force-assign
        const forceResponse = await fetch(`http://localhost:5000/api/beds/force-assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            bedId: selectedBed.id, 
            patientId: patientId 
          })
        });
        
        console.log('Force assign response status:', forceResponse.status);
        
        if (forceResponse.ok) {
          const data = await forceResponse.json();
          console.log('Force assignment successful:', data);
          handleRefresh();
          handleCloseAssignDialog();
          return;
        }
        
        const forceErrorData = await forceResponse.json();
        console.error('Force assign failed:', forceErrorData);
        throw new Error(forceErrorData.message || 'Force assignment failed');
      }
      
      // If other errors, try the legacy methods
      try {
        console.log('Trying regular assignment...');
        const response = await fetch(`http://localhost:5000/api/beds/${selectedBed.id}/assign`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ patient_id: patientId })
        });
        
        console.log('Regular assign response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Regular assignment successful:', data);
          handleRefresh();
          handleCloseAssignDialog();
          return;
        }
        
        const errorData = await response.json();
        console.error('Regular assignment failed:', errorData);
        
        // Also check if the regular endpoint gives 'already occupied' error
        if (errorData.message && errorData.message.includes('occupied')) {
          console.log('Regular endpoint confirms bed is occupied, trying force-assign...');
          
          if (!window.confirm('This bed is occupied according to the database. Would you like to force-assign this patient to the bed?')) {
            setFormError('Assignment cancelled. The bed is marked as occupied in the database.');
            setFormLoading(false);
            return;
          }
          
          // Try force-assign
          const forceResponse = await fetch(`http://localhost:5000/api/beds/force-assign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              bedId: selectedBed.id, 
              patientId: patientId 
            })
          });
          
          if (forceResponse.ok) {
            const data = await forceResponse.json();
            console.log('Force assignment successful:', data);
            handleRefresh();
            handleCloseAssignDialog();
            return;
          }
          
          const forceErrorData = await forceResponse.json();
          throw new Error(forceErrorData.message || 'Force assignment failed');
        }
        
        // Last attempt with the test endpoint
        console.log('Trying test assignment endpoint...');
        const testResponse = await fetch(`http://localhost:5000/api/beds/test-assign/${selectedBed.id}/${patientId}`);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Test assignment successful:', testData);
          handleRefresh();
          handleCloseAssignDialog();
          return;
        }
        
        const testErrorData = await testResponse.json();
        throw new Error(testErrorData.message || 'All assignment methods failed');
        
      } catch (error) {
        console.error('All assignment methods failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error assigning bed:', error);
      setFormError(error.message || 'Failed to assign bed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReleaseBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to release this bed?')) {
      return;
    }

    try {
      await BedService.releaseBed(bedId);
      handleRefresh();
    } catch (error) {
      console.error('Error releasing bed:', error);
      alert(error.message || 'Failed to release bed');
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) {
      return;
    }

    try {
      await BedService.deleteBed(bedId);
      handleRefresh();
    } catch (error) {
      console.error('Error deleting bed:', error);
      alert(error.message || 'Failed to delete bed');
    }
  };

  const handleDeleteWard = async (wardId) => {
    if (!window.confirm('Are you sure you want to delete this ward?')) {
      return;
    }

    try {
      await BedService.deleteWard(wardId);
      handleRefresh();
    } catch (error) {
      console.error('Error deleting ward:', error);
      alert(error.message || 'Failed to delete ward');
    }
  };

  // Add a function to repair database
  const handleRepairDatabase = async () => {
    if (!window.confirm("This will attempt to fix database inconsistencies with bed assignments. Continue?")) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/beds/repair', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Repair completed: Fixed ${data.repairs.beds_fixed} beds and ${data.repairs.patients_fixed} patient records.`);
        handleRefresh();
      } else {
        const errorData = await response.json();
        alert(`Repair failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Repair error:', error);
      alert(`Error during repair: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Columns for Beds DataGrid
  const bedColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'bed_number', headerName: 'Bed Number', width: 130 },
    { field: 'ward_name', headerName: 'Ward', width: 150 },
    { field: 'ward_type', headerName: 'Ward Type', width: 130 },
    { field: 'bed_type', headerName: 'Bed Type', width: 130 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.row.is_occupied ? 'Occupied' : 'Available'}
          color={params.row.is_occupied ? 'error' : 'success'}
          size="small"
        />
      ) 
    },
    { 
      field: 'patient_name', 
      headerName: 'Patient', 
      width: 150,
      renderCell: (params) => (
        params.row.patient_name ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
            {params.row.patient_name}
          </Box>
        ) : ''
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.row.is_occupied ? (
            <Tooltip title="Release Bed">
              <IconButton onClick={() => handleReleaseBed(params.row.id)} color="primary">
                <PersonOffIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Assign Patient">
              <IconButton onClick={() => handleOpenAssignDialog(params.row)} color="primary">
                <PersonIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton onClick={() => handleOpenBedDialog(params.row)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              onClick={() => handleDeleteBed(params.row.id)} 
              color="error"
              disabled={params.row.is_occupied}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Columns for Wards DataGrid
  const wardColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Ward Name', width: 200 },
    { field: 'ward_type', headerName: 'Type', width: 130 },
    { field: 'capacity', headerName: 'Capacity', width: 100 },
    { field: 'floor', headerName: 'Floor', width: 100 },
    { 
      field: 'total_beds', 
      headerName: 'Total Beds', 
      width: 110, 
      valueGetter: (params) => params.row.total_beds || 0
    },
    { 
      field: 'occupancy', 
      headerName: 'Occupancy', 
      width: 130,
      renderCell: (params) => {
        const totalBeds = params.row.total_beds || 0;
        const occupiedBeds = params.row.occupied_beds || 0;
        const percentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
        let color = 'success';
        if (percentage > 90) color = 'error';
        else if (percentage > 70) color = 'warning';
        
        return (
          <Chip 
            label={`${occupiedBeds}/${totalBeds} (${percentage}%)`}
            color={color}
            size="small"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleOpenWardDialog(params.row)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              onClick={() => handleDeleteWard(params.row.id)} 
              color="error"
              disabled={(params.row.total_beds || 0) > 0}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Bed Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bed Management">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Hospital Bed Management
          </Typography>
          <Box>
            <Tooltip title="Repair Database">
              <Button 
                variant="outlined" 
                color="warning" 
                onClick={handleRepairDatabase}
                sx={{ mr: 1 }}
              >
                Repair Database
              </Button>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {tabValue === 0 ? (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenBedDialog()}
              >
                Add Bed
              </Button>
            ) : (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenWardDialog()}
              >
                Add Ward
              </Button>
            )}
          </Box>
        </Box>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Beds" />
          <Tab label="Wards" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={beds}
              columns={bedColumns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              getRowClassName={(params) => params.row.is_occupied ? 'occupied-row' : ''}
              sx={{
                '& .occupied-row': {
                  backgroundColor: 'rgba(255, 0, 0, 0.04)',
                }
              }}
            />
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box sx={{ height: 500 }}>
            <DataGrid
              rows={wards}
              columns={wardColumns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
            />
          </Box>
        )}
      </Paper>
      
      {/* Bed Dialog */}
      <Dialog open={openBedDialog} onClose={handleCloseBedDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBed ? 'Edit Bed' : 'Add New Bed'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <TextField
            margin="dense"
            label="Bed Number"
            fullWidth
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            select
            margin="dense"
            label="Bed Type"
            fullWidth
            value={bedType}
            onChange={(e) => setBedType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Regular">Regular</MenuItem>
            <MenuItem value="ICU">ICU</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
            <MenuItem value="Recovery">Recovery</MenuItem>
          </TextField>
          
          {!selectedBed && (
            <TextField
              select
              margin="dense"
              label="Ward"
              fullWidth
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              sx={{ mb: 2 }}
            >
              {wards.map((ward) => (
                <MenuItem key={ward.id} value={ward.id}>
                  {ward.name} ({ward.ward_type})
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBedDialog}>Cancel</Button>
          <Button 
            onClick={handleBedSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Ward Dialog */}
      <Dialog open={openWardDialog} onClose={handleCloseWardDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedWard ? 'Edit Ward' : 'Add New Ward'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          <TextField
            margin="dense"
            label="Ward Name"
            fullWidth
            value={wardName}
            onChange={(e) => setWardName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            select
            margin="dense"
            label="Ward Type"
            fullWidth
            value={wardType}
            onChange={(e) => setWardType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="General">General</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
            <MenuItem value="ICU">ICU</MenuItem>
            <MenuItem value="Pediatric">Pediatric</MenuItem>
            <MenuItem value="Maternity">Maternity</MenuItem>
            <MenuItem value="Surgery">Surgery</MenuItem>
          </TextField>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="number"
                margin="dense"
                label="Capacity"
                fullWidth
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 10)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="number"
                margin="dense"
                label="Floor"
                fullWidth
                value={floor}
                onChange={(e) => setFloor(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWardDialog}>Cancel</Button>
          <Button 
            onClick={handleWardSubmit} 
            variant="contained" 
            color="primary"
            disabled={formLoading}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Assign Bed Dialog */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Patient to Bed</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          
          {selectedBed && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Assigning patient to bed: <strong>{selectedBed.bed_number}</strong> in ward <strong>{selectedBed.ward_name}</strong>
            </Typography>
          )}
          
          {patients.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No patients available. Please add patients first.
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please select a patient to assign to this bed. If you don't see any patients, please add them from the Patient Management page.
              </Alert>
              <TextField
                select
                margin="dense"
                label="Select Patient"
                fullWidth
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                error={!patientId && formError}
                helperText={!patientId && formError ? "Patient selection is required" : ""}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id.toString()}>
                    {patient.name ? `${patient.name} (ID: ${patient.id})` : `Patient #${patient.id}`}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Selected Patient ID: {patientId || 'None'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button 
            onClick={handleAssignBed} 
            variant="contained" 
            color="primary"
            disabled={formLoading || patients.length === 0}
          >
            {formLoading ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default BedManagement; 