import api from './api';

const AvailabilityService = {
  // Get doctor's schedule
  getDoctorSchedule: async (doctorId) => {
    try {
      const response = await api.get(`/availability/schedule/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Update doctor's schedule
  updateDoctorSchedule: async (doctorId, schedules) => {
    try {
      const response = await api.post(`/availability/schedule/${doctorId}`, { schedules });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get doctor's unavailability periods
  getDoctorUnavailability: async (doctorId) => {
    try {
      const response = await api.get(`/availability/unavailability/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Add unavailability period
  addUnavailabilityPeriod: async (doctorId, unavailabilityData) => {
    try {
      const response = await api.post(`/availability/unavailability/${doctorId}`, unavailabilityData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Delete unavailability period
  deleteUnavailabilityPeriod: async (unavailabilityId) => {
    try {
      const response = await api.delete(`/availability/unavailability/${unavailabilityId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Update doctor's general availability
  updateDoctorAvailability: async (doctorId, availabilityData) => {
    try {
      const response = await api.put(`/availability/doctor/${doctorId}`, availabilityData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Check doctor's availability for a specific date and time
  checkDoctorAvailability: async (doctorId, date, time = null) => {
    try {
      let url = `/availability/check/${doctorId}?date=${date}`;
      if (time) {
        url += `&time=${time}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Get available time slots for a doctor on a specific date
  getDoctorTimeSlots: async (doctorId, date) => {
    try {
      const response = await api.get(`/availability/slots/${doctorId}?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }
};

export default AvailabilityService; 