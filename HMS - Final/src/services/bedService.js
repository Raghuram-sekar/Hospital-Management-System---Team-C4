import api from './api';

const BedService = {
  // Get all beds
  getAllBeds: async () => {
    try {
      const response = await api.get('/beds');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get bed by ID
  getBedById: async (id) => {
    try {
      const response = await api.get(`/beds/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get all available beds
  getAvailableBeds: async (wardType = null) => {
    try {
      const url = wardType 
        ? `/beds/status/available?ward_type=${wardType}`
        : '/beds/status/available';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get all occupied beds
  getOccupiedBeds: async () => {
    try {
      const response = await api.get('/beds/status/occupied');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Create new bed
  createBed: async (bedData) => {
    try {
      const response = await api.post('/beds', bedData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Assign bed to patient
  assignBed: async (bedId, patientId) => {
    try {
      console.log(`Calling API to assign bed ${bedId} to patient ${patientId}`);
      const response = await api.put(`/beds/${bedId}/assign`, { patient_id: patientId });
      console.log('Bed assignment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in assignBed API call:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Release bed
  releaseBed: async (bedId) => {
    try {
      const response = await api.put(`/beds/${bedId}/release`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Update bed
  updateBed: async (bedId, bedData) => {
    try {
      const response = await api.put(`/beds/${bedId}`, bedData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Delete bed
  deleteBed: async (bedId) => {
    try {
      const response = await api.delete(`/beds/${bedId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get all wards
  getAllWards: async () => {
    try {
      const response = await api.get('/wards');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get ward by ID
  getWardById: async (id) => {
    try {
      const response = await api.get(`/wards/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get beds in a ward
  getBedsInWard: async (wardId) => {
    try {
      const response = await api.get(`/wards/${wardId}/beds`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Create new ward
  createWard: async (wardData) => {
    try {
      const response = await api.post('/wards', wardData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Update ward
  updateWard: async (wardId, wardData) => {
    try {
      const response = await api.put(`/wards/${wardId}`, wardData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Delete ward
  deleteWard: async (wardId) => {
    try {
      const response = await api.delete(`/wards/${wardId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }
};

export default BedService; 