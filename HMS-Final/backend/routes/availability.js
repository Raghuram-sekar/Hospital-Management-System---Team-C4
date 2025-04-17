import express from 'express';
import { pool } from '../server.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get doctor's schedule
router.get('/schedule/:doctorId', auth, async (req, res) => {
  try {
    const [schedules] = await pool.query(
      `SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY 
        CASE 
          WHEN day_of_week = 'Monday' THEN 1
          WHEN day_of_week = 'Tuesday' THEN 2
          WHEN day_of_week = 'Wednesday' THEN 3
          WHEN day_of_week = 'Thursday' THEN 4
          WHEN day_of_week = 'Friday' THEN 5
          WHEN day_of_week = 'Saturday' THEN 6
          WHEN day_of_week = 'Sunday' THEN 7
        END`,
      [req.params.doctorId]
    );
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor's schedule
router.post('/schedule/:doctorId', auth, async (req, res) => {
  try {
    const { schedules } = req.body;
    
    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ message: 'Invalid schedule data' });
    }
    
    // Start transaction
    await pool.query('START TRANSACTION');
    
    try {
      // Delete existing schedules
      await pool.query(
        'DELETE FROM doctor_schedules WHERE doctor_id = ?',
        [req.params.doctorId]
      );
      
      // Insert new schedules
      for (const schedule of schedules) {
        await pool.query(
          `INSERT INTO doctor_schedules 
            (doctor_id, day_of_week, start_time, end_time, is_available) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            req.params.doctorId,
            schedule.day_of_week,
            schedule.start_time,
            schedule.end_time,
            schedule.is_available !== false // Default to true if not specified
          ]
        );
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating doctor schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor's unavailability periods
router.get('/unavailability/:doctorId', auth, async (req, res) => {
  try {
    const [unavailability] = await pool.query(
      'SELECT * FROM doctor_unavailability WHERE doctor_id = ? ORDER BY start_date',
      [req.params.doctorId]
    );
    
    res.json(unavailability);
  } catch (error) {
    console.error('Error fetching doctor unavailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add unavailability period
router.post('/unavailability/:doctorId', auth, async (req, res) => {
  try {
    const { start_date, end_date, start_time, end_time, reason } = req.body;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO doctor_unavailability 
        (doctor_id, start_date, end_date, start_time, end_time, reason) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.doctorId,
        start_date,
        end_date,
        start_time || null,
        end_time || null,
        reason || null
      ]
    );
    
    res.status(201).json({
      message: 'Unavailability period added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding unavailability period:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete unavailability period
router.delete('/unavailability/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM doctor_unavailability WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Unavailability period not found' });
    }
    
    res.json({ message: 'Unavailability period deleted successfully' });
  } catch (error) {
    console.error('Error deleting unavailability period:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor's general availability
router.put('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const { is_available, available_from, available_to, emergency_available, max_appointments_per_day } = req.body;
    
    // Check if doctor exists
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.doctorId]
    );
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Update doctor's availability
    await pool.query(
      `UPDATE doctors SET 
        is_available = ?,
        available_from = ?,
        available_to = ?,
        emergency_available = ?,
        max_appointments_per_day = ?
       WHERE id = ?`,
      [
        is_available !== undefined ? is_available : doctors[0].is_available,
        available_from || doctors[0].available_from,
        available_to || doctors[0].available_to,
        emergency_available !== undefined ? emergency_available : doctors[0].emergency_available,
        max_appointments_per_day || doctors[0].max_appointments_per_day,
        req.params.doctorId
      ]
    );
    
    res.json({ message: 'Doctor availability updated successfully' });
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check doctor's availability for a specific date and time
router.get('/check/:doctorId', auth, async (req, res) => {
  try {
    const { date, time } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    // Get the day of week from the date
    const dateObj = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    
    // Check if doctor exists and is generally available
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.doctorId]
    );
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const doctor = doctors[0];
    
    if (!doctor.is_available) {
      return res.json({ available: false, reason: 'Doctor is not available for appointments' });
    }
    
    // Check if doctor has schedule for this day
    const [schedules] = await pool.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?',
      [req.params.doctorId, dayOfWeek]
    );
    
    if (schedules.length === 0 || !schedules[0].is_available) {
      return res.json({ available: false, reason: `Doctor does not work on ${dayOfWeek}` });
    }
    
    // Check if doctor has unavailability for this date
    const [unavailability] = await pool.query(
      'SELECT * FROM doctor_unavailability WHERE doctor_id = ? AND ? BETWEEN start_date AND end_date',
      [req.params.doctorId, date]
    );
    
    if (unavailability.length > 0) {
      // If time is specified, check if it falls within unavailability period
      if (time && unavailability[0].start_time && unavailability[0].end_time) {
        if (time >= unavailability[0].start_time && time <= unavailability[0].end_time) {
          return res.json({ 
            available: false, 
            reason: unavailability[0].reason || 'Doctor is unavailable during this time' 
          });
        }
      } else {
        // If no specific time or the unavailability is for the whole day
        return res.json({ 
          available: false, 
          reason: unavailability[0].reason || 'Doctor is unavailable on this date' 
        });
      }
    }
    
    // Check if the time is within doctor's working hours for this day
    if (time) {
      const schedule = schedules[0];
      if (time < schedule.start_time || time > schedule.end_time) {
        return res.json({ 
          available: false, 
          reason: `Doctor only works from ${schedule.start_time} to ${schedule.end_time} on ${dayOfWeek}` 
        });
      }
    }
    
    // Check if doctor has reached maximum appointments for this date
    const [appointments] = await pool.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status != 'cancelled'`,
      [req.params.doctorId, date]
    );
    
    if (appointments[0].count >= doctor.max_appointments_per_day) {
      return res.json({ 
        available: false, 
        reason: 'Doctor has reached maximum appointments for this date' 
      });
    }
    
    // If all checks pass, doctor is available
    return res.json({ 
      available: true,
      schedule: schedules[0],
      max_appointments: doctor.max_appointments_per_day,
      current_appointments: appointments[0].count
    });
  } catch (error) {
    console.error('Error checking doctor availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/slots/:doctorId', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    // Get the day of week from the date
    const dateObj = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    
    // Check if doctor exists and is generally available
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.doctorId]
    );
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const doctor = doctors[0];
    
    if (!doctor.is_available) {
      return res.json({ available: false, reason: 'Doctor is not available for appointments', slots: [] });
    }
    
    // Check if doctor has schedule for this day
    const [schedules] = await pool.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?',
      [req.params.doctorId, dayOfWeek]
    );
    
    if (schedules.length === 0 || !schedules[0].is_available) {
      return res.json({ available: false, reason: `Doctor does not work on ${dayOfWeek}`, slots: [] });
    }
    
    const schedule = schedules[0];
    
    // Check if doctor has unavailability for this date
    const [unavailability] = await pool.query(
      'SELECT * FROM doctor_unavailability WHERE doctor_id = ? AND ? BETWEEN start_date AND end_date',
      [req.params.doctorId, date]
    );
    
    if (unavailability.length > 0 && !unavailability[0].start_time) {
      // If unavailability is for the whole day
      return res.json({ 
        available: false, 
        reason: unavailability[0].reason || 'Doctor is unavailable on this date',
        slots: []
      });
    }
    
    // Get existing appointments for this date
    const [appointments] = await pool.query(
      `SELECT TIME(appointment_date) as time FROM appointments 
       WHERE doctor_id = ? AND DATE(appointment_date) = ? AND status != 'cancelled'`,
      [req.params.doctorId, date]
    );
    
    const bookedTimes = appointments.map(a => a.time);
    
    // Generate time slots (assuming 30-minute appointments)
    const slots = [];
    const slotDuration = 30; // minutes
    const startTime = new Date(`${date}T${schedule.start_time}`);
    const endTime = new Date(`${date}T${schedule.end_time}`);
    
    // Subtract 30 minutes from end time to ensure last appointment ends by doctor's end time
    endTime.setMinutes(endTime.getMinutes() - slotDuration);
    
    for (let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const timeString = time.toTimeString().substring(0, 5);
      
      // Check if this time is booked
      const isBooked = bookedTimes.some(bookedTime => {
        return bookedTime.substring(0, 5) === timeString;
      });
      
      // Check if this time is within unavailability period
      let isUnavailable = false;
      if (unavailability.length > 0 && unavailability[0].start_time) {
        const unavailStart = unavailability[0].start_time.substring(0, 5);
        const unavailEnd = unavailability[0].end_time.substring(0, 5);
        if (timeString >= unavailStart && timeString <= unavailEnd) {
          isUnavailable = true;
        }
      }
      
      if (!isBooked && !isUnavailable) {
        slots.push(timeString);
      }
    }
    
    return res.json({
      available: slots.length > 0,
      slots,
      schedule: {
        day: dayOfWeek,
        start: schedule.start_time,
        end: schedule.end_time
      }
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 