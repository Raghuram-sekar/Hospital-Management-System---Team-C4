/**
 * Debug utility for testing backend connection
 */
import api from '../services/api';

// IMPORTANT: Use a global array that persists between imports/modules
// This ensures appointments created are visible across the application
window.HMS_SAMPLE_APPOINTMENTS = window.HMS_SAMPLE_APPOINTMENTS || [
  {
    id: 1,
    patient_id: 1,
    patient_name: 'Jane Doe',
    doctor_id: 2,
    doctor_name: 'Dr. John Smith',
    appointment_date: '2025-04-15',
    start_time: '09:00:00',
    end_time: '09:30:00',
    purpose: 'Annual physical examination',
    status: 'scheduled',
    created_at: '2025-04-12T10:00:00'
  },
  {
    id: 2,
    patient_id: 2,
    patient_name: 'Robert Johnson',
    doctor_id: 2,
    doctor_name: 'Dr. John Smith',
    appointment_date: '2025-04-16',
    start_time: '10:00:00',
    end_time: '10:30:00',
    purpose: 'Headache and fever',
    status: 'scheduled',
    created_at: '2025-04-12T11:00:00'
  },
  {
    id: 3,
    patient_id: 1,
    patient_name: 'Jane Doe',
    doctor_id: 4,
    doctor_name: 'Dr. Michael Carter',
    appointment_date: '2025-04-17',
    start_time: '11:00:00',
    end_time: '11:30:00',
    purpose: 'Follow-up on medication',
    status: 'scheduled',
    created_at: '2025-04-12T12:00:00'
  },
  {
    id: 4,
    patient_id: 3,
    patient_name: 'Emily Williams',
    doctor_id: 4,
    doctor_name: 'Dr. Michael Carter',
    appointment_date: '2025-04-15',
    start_time: '13:00:00',
    end_time: '13:30:00',
    purpose: 'Back pain consultation',
    status: 'scheduled',
    created_at: '2025-04-12T13:00:00'
  },
  {
    id: 5,
    patient_id: 4,
    patient_name: 'Thomas Brown',
    doctor_id: 5,
    doctor_name: 'Dr. Sophia Chen',
    appointment_date: '2025-04-18',
    start_time: '14:00:00',
    end_time: '14:30:00',
    purpose: 'Skin rash checkup',
    status: 'scheduled',
    created_at: '2025-04-12T14:00:00'
  }
];

console.log('DEBUG: debugBackend.js loaded, sample appointments count:', window.HMS_SAMPLE_APPOINTMENTS.length);

const debugBackend = {
  /**
   * Test the backend server connection
   */
  testConnection: async () => {
    try {
      console.log('Testing backend connection...');
      
      // Try direct fetch without the API service
      const directResponse = await fetch('http://localhost:5001/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Direct API fetch response:', directResponse.ok 
        ? 'OK' 
        : `Failed with status ${directResponse.status}`);
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log('Direct response data:', data);
      }
      
      // Try using the API service
      const apiResponse = await api.get('/test');
      console.log('API service response:', apiResponse.data);
      
      return {
        success: true,
        directResponse: directResponse.ok,
        apiResponse: true
      };
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Check database connection
   */
  testDatabase: async () => {
    try {
      const response = await api.get('/test');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Database test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Manual appointment data
   */
  getSampleAppointments: () => {
    console.log('DEBUG: Getting sample appointments:', window.HMS_SAMPLE_APPOINTMENTS.length);
    return [...window.HMS_SAMPLE_APPOINTMENTS]; // Return a copy
  },
  
  /**
   * Add a new appointment to sample data
   */
  addSampleAppointment: (appointmentData) => {
    // Generate a new ID
    const newId = Math.max(...window.HMS_SAMPLE_APPOINTMENTS.map(a => a.id), 0) + 1;
    console.log('DEBUG: Creating sample appointment with new ID:', newId);
    
    // Hard-coded doctor and patient names for sample data
    const doctorNames = {
      2: 'Dr. John Smith',
      4: 'Dr. Michael Carter',
      5: 'Dr. Sophia Chen'
    };
    
    const patientNames = {
      1: 'Jane Doe',
      2: 'Robert Johnson',
      3: 'Emily Williams',
      4: 'Thomas Brown'
    };
    
    // Create the new appointment object
    const newAppointment = {
      id: newId,
      patient_id: appointmentData.patient_id,
      patient_name: patientNames[appointmentData.patient_id] || 'New Patient',
      doctor_id: appointmentData.doctor_id,
      doctor_name: doctorNames[appointmentData.doctor_id] || 'New Doctor',
      appointment_date: appointmentData.appointment_date,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      purpose: appointmentData.purpose,
      status: appointmentData.status || 'scheduled',
      created_at: new Date().toISOString()
    };
    
    console.log('DEBUG: Adding new sample appointment:', newAppointment);
    
    // Add to the sample appointments array
    window.HMS_SAMPLE_APPOINTMENTS.push(newAppointment);
    console.log('DEBUG: Sample appointments count now:', window.HMS_SAMPLE_APPOINTMENTS.length);
    console.log('DEBUG: All sample appointments:', window.HMS_SAMPLE_APPOINTMENTS);
    
    return newAppointment;
  }
};

export default debugBackend; 