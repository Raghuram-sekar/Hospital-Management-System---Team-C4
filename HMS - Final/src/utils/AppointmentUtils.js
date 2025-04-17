/**
 * Appointment Utilities
 * Functions to process and manage appointments using OOP and DSA concepts
 */

import { AppointmentRecord, quickSort, binarySearch } from './DataStructures';

// Convert raw appointment data to AppointmentRecord objects
export const convertToAppointmentRecords = (appointments) => {
  return appointments.map(appointment => {
    return new AppointmentRecord(
      appointment.patient_id,
      appointment.doctor_id,
      appointment.appointment_date,
      appointment.reason,
      appointment.status
    );
  });
};

// Sort appointments by date using quickSort algorithm
export const sortAppointmentsByDate = (appointments) => {
  return quickSort(appointments, (a, b) => {
    return new Date(a.appointment_date) - new Date(b.appointment_date);
  });
};

// Sort appointments by patient name
export const sortAppointmentsByPatient = (appointments) => {
  return quickSort(appointments, (a, b) => {
    return a.patient_name.localeCompare(b.patient_name);
  });
};

// Sort appointments by status
export const sortAppointmentsByStatus = (appointments) => {
  return quickSort(appointments, (a, b) => {
    return a.status.localeCompare(b.status);
  });
};

// Find appointments for a specific patient
export const findAppointmentsForPatient = (appointments, patientId) => {
  // First sort by patient_id to optimize binary search
  const sortedByPatient = quickSort([...appointments], (a, b) => {
    return a.patient_id - b.patient_id;
  });
  
  // Find first occurrence of patientId
  const firstIndex = findFirstOccurrence(sortedByPatient, patientId);
  
  if (firstIndex === -1) {
    return [];
  }
  
  // Collect all appointments for this patient
  const patientAppointments = [];
  let currentIndex = firstIndex;
  
  while (
    currentIndex < sortedByPatient.length && 
    sortedByPatient[currentIndex].patient_id === patientId
  ) {
    patientAppointments.push(sortedByPatient[currentIndex]);
    currentIndex++;
  }
  
  return patientAppointments;
};

// Find first occurrence using modified binary search
const findFirstOccurrence = (sortedArray, patientId) => {
  let left = 0;
  let right = sortedArray.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (sortedArray[mid].patient_id === patientId) {
      result = mid; // Found a match
      right = mid - 1; // Look for earlier occurrences
    } else if (sortedArray[mid].patient_id < patientId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return result;
};

// Group appointments by status (Hash Map implementation)
export const groupAppointmentsByStatus = (appointments) => {
  const statusGroups = {};
  
  appointments.forEach(appointment => {
    const status = appointment.status;
    
    if (!statusGroups[status]) {
      statusGroups[status] = [];
    }
    
    statusGroups[status].push(appointment);
  });
  
  return statusGroups;
};

// Calculate appointment statistics
export const calculateAppointmentStats = (appointments) => {
  const stats = {
    total: appointments.length,
    byStatus: {},
    byDoctor: {},
    byMonth: {},
    averageDuration: 0
  };
  
  // Count by status - using hash map for O(n) time complexity
  appointments.forEach(appointment => {
    // Status counts
    const status = appointment.status;
    if (!stats.byStatus[status]) {
      stats.byStatus[status] = 0;
    }
    stats.byStatus[status]++;
    
    // Doctor counts
    const doctorId = appointment.doctor_id;
    if (!stats.byDoctor[doctorId]) {
      stats.byDoctor[doctorId] = 0;
    }
    stats.byDoctor[doctorId]++;
    
    // Month counts
    const date = new Date(appointment.appointment_date);
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const monthKey = `${year}-${month}`;
    
    if (!stats.byMonth[monthKey]) {
      stats.byMonth[monthKey] = 0;
    }
    stats.byMonth[monthKey]++;
  });
  
  return stats;
};

// Find time conflicts in appointments
export const findTimeConflicts = (appointments) => {
  if (!appointments.length) return [];
  
  // Sort appointments by date for efficient conflict detection
  const sorted = sortAppointmentsByDate(appointments);
  const conflicts = [];
  
  // Check for overlapping time slots - O(n) time complexity
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    const currentStart = new Date(current.appointment_date);
    const currentEnd = new Date(currentStart);
    currentEnd.setMinutes(currentEnd.getMinutes() + 30); // Assuming 30-minute appointments
    
    const nextStart = new Date(next.appointment_date);
    
    // Check if appointments overlap
    if (currentEnd > nextStart && current.doctor_id === next.doctor_id) {
      conflicts.push({
        appointment1: current,
        appointment2: next,
        message: `Time conflict between appointments ${current.id} and ${next.id}`
      });
    }
  }
  
  return conflicts;
}; 