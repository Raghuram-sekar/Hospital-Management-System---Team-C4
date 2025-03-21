import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import { pool } from '../server.js';

const router = express.Router();

// Get all appointments for logged-in doctor
router.get('/doctor', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access their appointments.' });
    }
    
    const query = `
      SELECT 
        a.id,
        a.patient_id,
        p.name as patient_name,
        a.doctor_id,
        u.name as doctor_name,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.purpose,
        a.status,
        a.created_at
      FROM 
        appointments a
      JOIN 
        patients p ON a.patient_id = p.id
      JOIN 
        users u ON a.doctor_id = u.id
      WHERE 
        a.doctor_id = ?
      ORDER BY 
        a.appointment_date DESC, 
        a.start_time ASC
    `;
    
    const [appointments] = await pool.query(query, [doctorId]);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Get all appointments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can access all appointments.' });
    }
    
    const query = `
      SELECT 
        a.id,
        a.patient_id,
        p.name as patient_name,
        a.doctor_id,
        u.name as doctor_name,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.purpose,
        a.status,
        a.created_at
      FROM 
        appointments a
      JOIN 
        patients p ON a.patient_id = p.id
      JOIN 
        users u ON a.doctor_id = u.id
      ORDER BY 
        a.appointment_date DESC, 
        a.start_time ASC
    `;
    
    const [appointments] = await pool.query(query);
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Create a new appointment
router.post('/', 
  auth,
  [
    body('patient_id').notEmpty().withMessage('Patient ID is required'),
    body('appointment_date').isDate().withMessage('Valid appointment date is required'),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('status').isIn(['scheduled', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { 
        patient_id, 
        doctor_id,
        appointment_date, 
        start_time, 
        end_time, 
        purpose, 
        status 
      } = req.body;
      
      // If doctor_id is not provided, use the logged-in user's ID (if they are a doctor)
      let finalDoctorId = doctor_id;
      if (!finalDoctorId) {
        if (req.user.role === 'doctor') {
          finalDoctorId = req.user.id;
        } else if (req.user.role !== 'admin') {
          return res.status(400).json({ message: 'Doctor ID is required' });
        }
      }
      
      // For non-admin users, check if they are the doctor creating the appointment
      if (req.user.role !== 'admin' && req.user.id !== finalDoctorId) {
        return res.status(403).json({ message: 'You can only create appointments for yourself as a doctor' });
      }
      
      // Check for scheduling conflicts
      const [conflicts] = await pool.query(
        `SELECT * FROM appointments 
         WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))
         AND status = 'scheduled'`,
        [
          finalDoctorId, 
          appointment_date, 
          start_time, start_time, 
          end_time, end_time, 
          start_time, end_time
        ]
      );
      
      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'Scheduling conflict detected. Please choose another time.' });
      }
      
      // Check if patient exists
      const [patientCheck] = await pool.query('SELECT id FROM patients WHERE id = ?', [patient_id]);
      if (patientCheck.length === 0) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      // Create appointment
      const [result] = await pool.query(
        `INSERT INTO appointments 
         (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [patient_id, finalDoctorId, appointment_date, start_time, end_time, purpose, status]
      );
      
      res.status(201).json({
        id: result.insertId,
        message: 'Appointment created successfully'
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Error creating appointment', error: error.message });
    }
  }
);

// Update an appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      patient_id, 
      doctor_id,
      appointment_date, 
      start_time, 
      end_time, 
      purpose, 
      status 
    } = req.body;
    
    // Check if appointment exists and get current details
    const [appointmentCheck] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointmentCheck.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointmentCheck[0];
    
    // Check permissions: Admin can update any appointment, doctors can only update their own
    if (req.user.role !== 'admin' && req.user.id !== appointment.doctor_id) {
      return res.status(403).json({ message: 'You can only update your own appointments' });
    }
    
    // Prepare update data
    const updates = {};
    if (patient_id) updates.patient_id = patient_id;
    if (doctor_id) updates.doctor_id = doctor_id;
    if (appointment_date) updates.appointment_date = appointment_date;
    if (start_time) updates.start_time = start_time;
    if (end_time) updates.end_time = end_time;
    if (purpose) updates.purpose = purpose;
    if (status) updates.status = status;
    
    // Check for scheduling conflicts if date or time is changed
    if (appointment_date || start_time || end_time) {
      const checkDate = appointment_date || appointment.appointment_date;
      const checkStart = start_time || appointment.start_time;
      const checkEnd = end_time || appointment.end_time;
      const checkDoctor = doctor_id || appointment.doctor_id;
      
      const [conflicts] = await pool.query(
        `SELECT * FROM appointments 
         WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))
         AND status = 'scheduled'
         AND id != ?`,
        [
          checkDoctor, 
          checkDate, 
          checkStart, checkStart, 
          checkEnd, checkEnd, 
          checkStart, checkEnd,
          id
        ]
      );
      
      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'Scheduling conflict detected. Please choose another time.' });
      }
    }
    
    // Build update query
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updates);
    
    // Add appointment ID to values array
    updateValues.push(id);
    
    // Execute update
    await pool.query(
      `UPDATE appointments SET ${updateFields} WHERE id = ?`,
      updateValues
    );
    
    res.status(200).json({
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// Update appointment status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Check if appointment exists
    const [appointmentCheck] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointmentCheck.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointmentCheck[0];
    
    // Check permissions: Admin can update any appointment, doctors can only update their own
    if (req.user.role !== 'admin' && req.user.id !== appointment.doctor_id) {
      return res.status(403).json({ message: 'You can only update the status of your own appointments' });
    }
    
    // Update appointment status
    await pool.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.status(200).json({
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Error updating appointment status', error: error.message });
  }
});

// Delete an appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if appointment exists
    const [appointmentCheck] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointmentCheck.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointmentCheck[0];
    
    // Check permissions: Admin can delete any appointment, doctors can only delete their own
    if (req.user.role !== 'admin' && req.user.id !== appointment.doctor_id) {
      return res.status(403).json({ message: 'You can only delete your own appointments' });
    }
    
    // Delete appointment
    await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    
    res.status(200).json({
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
});

export default router; 