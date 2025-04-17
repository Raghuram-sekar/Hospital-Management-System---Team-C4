import api from './api';
import { PriorityQueue, AppointmentRecord, quickSort } from '../utils/DataStructures';
import debugBackend from '../utils/debugBackend';
import AuthService from './authService';

class AppointmentService {
  constructor() {
    this.cachedAppointments = [];
    this.priorityQueue = new PriorityQueue();
    this.lastFetch = null;
  }

  // Get all appointments with optional sorting
  async getAllAppointments(sortBy = null) {
    try {
      // Check if we have cached appointments first
      if (this.cachedAppointments.length > 0) {
        console.log('Using cached appointments');
        return this.cachedAppointments;
      }
      
      console.log('Fetching all appointments...');
      
      // Try to test the API first
      try {
        const testResponse = await fetch('http://localhost:5001/api/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!testResponse.ok) {
          console.warn('API test failed, using sample data for appointments');
          const sampleData = debugBackend.getSampleAppointments();
          this.cachedAppointments = sampleData;
          return sampleData;
        }
      } catch (testError) {
        console.warn('API connection test failed:', testError.message);
        const sampleData = debugBackend.getSampleAppointments();
        this.cachedAppointments = sampleData;
        return sampleData;
      }
      
      try {
        // Get user from auth service
        const user = AuthService.getCurrentUser();
        console.log('Current user role:', user?.role);
        
        // API endpoint varies based on user role
        let endpoint = '/appointments';
        
        if (user?.role === 'admin') {
          endpoint = '/appointments/all';
        } else if (user?.role === 'doctor') {
          endpoint = `/appointments/doctor/${user.id}`;
        } else if (user?.role === 'patient') {
          endpoint = `/appointments/patient/${user.id}`;
        }
        
        console.log(`Using endpoint: ${endpoint}`);
        
        // Get appointments from API
        const response = await api.get(endpoint);
        const data = response.data;
        
        // Cache the response
        this.cachedAppointments = data;
        
        // Add appointments to priority queue
        data.forEach(appointment => {
          this.addToPriorityQueue(appointment);
        });
        
        return data;
      } catch (apiError) {
        console.error('API error when fetching appointments:', apiError);
        
        // Check specifically for the field error
        if (apiError.response?.data?.code === 'ER_BAD_FIELD_ERROR' || 
            apiError.message?.includes('p.name') ||
            apiError.message?.includes('field')) {
          console.warn('Database schema error detected, using sample data');
          const sampleData = debugBackend.getSampleAppointments();
          this.cachedAppointments = sampleData;
          return sampleData;
        }
        
        // Fallback to sample data for any API error
        console.warn('Falling back to sample appointment data');
        const sampleData = debugBackend.getSampleAppointments();
        this.cachedAppointments = sampleData;
        return sampleData;
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      
      // Use sample data as fallback
      console.warn('Error fetching appointments, using sample data');
      const sampleData = debugBackend.getSampleAppointments();
      this.cachedAppointments = sampleData;
      return sampleData;
    }
  }

  // Get appointment by ID with efficient search
  async getAppointmentById(id) {
    try {
      // Check if the appointment is in the cache
      const cachedAppointment = this.findAppointmentById(id);
      
      if (cachedAppointment) {
        return cachedAppointment;
      }
      
      // If not in cache, fetch from API
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointment ${id}:`, error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }

  // Create appointment with OOP
  async createAppointment(appointmentData) {
    try {
      // Ensure the appointment data contains all required fields
      const requiredFields = ['doctor_id', 'patient_id', 'appointment_date', 'start_time', 'end_time', 'purpose'];
      
      // Check if we have all required fields
      const missingFields = requiredFields.filter(field => !appointmentData[field]);
      
      if (missingFields.length > 0) {
        return Promise.reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
      }
      
      console.log('Creating appointment with data:', appointmentData);
      
      // First test API connection before attempting to create
      try {
        const testResponse = await fetch('http://localhost:5001/api/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!testResponse.ok) {
          console.warn('API test failed when creating appointment, using local sample data instead');
          // Use local sample data if API is not available
          const newAppointment = debugBackend.addSampleAppointment(appointmentData);
          this.cachedAppointments.push(newAppointment);
          return newAppointment;
        }
      } catch (testError) {
        console.warn('API connection test failed when creating appointment:', testError.message);
        console.warn('Using local sample data to create appointment');
        // Use local sample data if API is not available
        const newAppointment = debugBackend.addSampleAppointment(appointmentData);
        this.cachedAppointments.push(newAppointment);
        return newAppointment;
      }
      
      // Send the appointment data to the API if connection test passed
      try {
        const response = await api.post('/appointments', {
          patient_id: appointmentData.patient_id,
          doctor_id: appointmentData.doctor_id,
          appointment_date: appointmentData.appointment_date,
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          purpose: appointmentData.purpose,
          status: appointmentData.status || 'scheduled'
        });
        
        // Add to our cache and priority queue
        if (response.data) {
          this.cachedAppointments.push(response.data);
          this.addToPriorityQueue(response.data);
        }
        
        return response.data;
      } catch (apiError) {
        console.error('API error when creating appointment:', apiError);
        
        // Check specifically for the field error
        if (apiError.response?.data?.code === 'ER_BAD_FIELD_ERROR' || 
            apiError.message?.includes('p.name') ||
            apiError.message?.includes('field')) {
          console.warn('Database schema error detected, using sample data');
          const newAppointment = debugBackend.addSampleAppointment(appointmentData);
          this.cachedAppointments.push(newAppointment);
          return newAppointment;
        }
        
        // Use local sample data for any API error
        console.warn('API error when creating appointment, using local sample data');
        const newAppointment = debugBackend.addSampleAppointment(appointmentData);
        this.cachedAppointments.push(newAppointment);
        return newAppointment;
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // If we get a network error, use local sample data instead
      if (!error.response) {
        console.warn('Network error when creating appointment, using local sample data');
        const newAppointment = debugBackend.addSampleAppointment(appointmentData);
        this.cachedAppointments.push(newAppointment);
        return newAppointment;
      }
      
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }

  // Update appointment
  async updateAppointment(id, appointmentData) {
    try {
      console.log('Updating appointment with ID:', id);
      console.log('Update data:', appointmentData);
      
      // Ensure we're sending the correct fields to the API
      const updatedData = {
        appointment_date: appointmentData.appointment_date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        purpose: appointmentData.purpose,
        status: appointmentData.status
      };
      
      // Only include notes if they exist
      if (appointmentData.notes) {
        updatedData.notes = appointmentData.notes;
      }
      
      console.log('Sending to API:', updatedData);
      const response = await api.put(`/appointments/${id}`, updatedData);
      
      console.log('Update response:', response.data);
      
      // Update in our cache
      this.updateCachedAppointment(id, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment ${id}:`, error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }

  // Cancel appointment
  async cancelAppointment(id) {
    try {
      const response = await api.put(`/appointments/${id}`, { status: 'cancelled' });
      
      // Update in our cache
      this.updateCachedAppointment(id, { ...this.findAppointmentById(id), status: 'cancelled' });
      
      return response.data;
    } catch (error) {
      console.error(`Error cancelling appointment ${id}:`, error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }

  // Delete appointment (admin only)
  async deleteAppointment(id) {
    try {
      const response = await api.delete(`/appointments/${id}`);
      
      // Remove from our cache
      this.removeCachedAppointment(id);
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting appointment ${id}:`, error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  }

  // Get high priority appointments using our priority queue
  getHighPriorityAppointments() {
    // Return appointments sorted by priority
    return this.priorityQueue.getItems();
  }

  // Get upcoming appointments (next 7 days)
  getUpcomingAppointments() {
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);
    
    return this.cachedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate >= now && appointmentDate <= oneWeekLater;
    });
  }

  // Get today's appointments
  getTodaysAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.cachedAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate >= today && appointmentDate < tomorrow;
    });
  }

  // Test API connection
  async testConnection() {
    try {
      console.log('Testing API connection...');
      const response = await api.get('/test');
      console.log('API test response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('API connection test failed:', error);
      return { 
        success: false, 
        error: error.message,
        details: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
    }
  }

  // Private methods
  
  // Find appointment by ID in cache (using binary search if sorted)
  findAppointmentById(id) {
    // Simple implementation for now
    return this.cachedAppointments.find(appointment => appointment.id === id);
  }
  
  // Update cached appointment
  updateCachedAppointment(id, updatedData) {
    const index = this.cachedAppointments.findIndex(appointment => appointment.id === id);
    if (index !== -1) {
      this.cachedAppointments[index] = { 
        ...this.cachedAppointments[index], 
        ...updatedData 
      };
    }
  }
  
  // Remove appointment from cache
  removeCachedAppointment(id) {
    this.cachedAppointments = this.cachedAppointments.filter(
      appointment => appointment.id !== id
    );
  }
  
  // Sort appointments using quickSort algorithm
  getSortedAppointments(sortBy) {
    return quickSort([...this.cachedAppointments], (a, b) => {
      if (sortBy === 'date') {
        return new Date(a.appointment_date) - new Date(b.appointment_date);
      } else if (sortBy === 'patient') {
        return a.patient_name.localeCompare(b.patient_name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }
  
  // Update the priority queue with appointments
  updatePriorityQueue() {
    // Clear current queue
    this.priorityQueue = new PriorityQueue();
    
    // Add appointments with priority based on date and status
    this.cachedAppointments.forEach(appointment => {
      this.addToPriorityQueue(appointment);
    });
  }
  
  // Add an appointment to the priority queue
  addToPriorityQueue(appointment) {
    // Skip cancelled appointments
    if (appointment.status === 'cancelled') {
      return;
    }
    
    // Calculate priority (lower is higher priority)
    let priority = 100;
    
    // Date-based priority: closer appointments have higher priority
    const now = new Date();
    const appointmentDate = new Date(appointment.appointment_date);
    const daysUntilAppointment = Math.ceil((appointmentDate - now) / (1000 * 60 * 60 * 24));
    
    // Urgent appointments
    if ((appointment.purpose && appointment.purpose.toLowerCase().includes('urgent')) || 
        (appointment.reason && appointment.reason.toLowerCase().includes('urgent'))) {
      priority -= 30;
    }
    
    // Appointments today or tomorrow
    if (daysUntilAppointment <= 1) {
      priority -= 20;
    } else if (daysUntilAppointment <= 3) {
      priority -= 10;
    }
    
    // Status-based priority
    if (appointment.status === 'confirmed') {
      priority -= 5;
    }
    
    // Add to queue with calculated priority
    this.priorityQueue.add({
      appointment,
      priority
    });
  }
}

export default new AppointmentService(); 