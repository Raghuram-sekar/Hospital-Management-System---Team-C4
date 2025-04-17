import express from 'express';
import auth from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import { pool } from '../server.js';

const router = express.Router();

// Get all emergency patients
router.get('/patients', auth, authorize(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        p.date_of_birth, 
        p.gender, 
        p.blood_group,
        e.arrival_time, 
        e.chief_complaint, 
        e.vital_signs, 
        e.patient_condition, 
        e.is_admitted
      FROM patients p
      JOIN emergency_patients e ON p.id = e.patient_id
      WHERE e.discharge_time IS NULL
      ORDER BY 
        CASE 
          WHEN e.patient_condition = 'critical' THEN 1
          WHEN e.patient_condition = 'severe' THEN 2
          WHEN e.patient_condition = 'moderate' THEN 3
          WHEN e.patient_condition = 'stable' THEN 4
          ELSE 5
        END, 
        e.arrival_time ASC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching emergency patients:', error);
    res.status(500).json({ message: 'Failed to fetch emergency patients' });
  }
});

// Get available emergency beds
router.get('/beds/available', auth, authorize(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id, b.bed_number, b.bed_type, w.name as ward_name, w.id as ward_id
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      WHERE b.is_occupied = FALSE 
        AND (b.bed_type = 'Emergency' OR w.ward_type = 'Emergency')
      ORDER BY b.bed_number
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching available emergency beds:', error);
    res.status(500).json({ message: 'Failed to fetch available beds' });
  }
});

// Get doctors available for emergency
router.get('/doctors', auth, authorize(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.id, 
        u.first_name, 
        u.last_name, 
        d.specialty,
        (SELECT COUNT(*) FROM doctor_patient_assignments WHERE doctor_id = d.id AND is_active = TRUE) as current_patients
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN doctor_availability da ON d.id = da.doctor_id
      WHERE da.emergency_available = TRUE 
        AND (NOW() BETWEEN da.available_from AND da.available_to OR da.is_available = TRUE)
      ORDER BY current_patients ASC, specialty
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching emergency doctors:', error);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

// Register a new emergency patient
router.post('/register', auth, authorize(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      chief_complaint, 
      condition, 
      vital_signs = null,
      contact_info = null
    } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !chief_complaint || !condition) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await pool.query('START TRANSACTION');
    
    // First, check if patient already exists
    let patientId;
    if (date_of_birth) {
      const [existingPatients] = await pool.query(
        'SELECT id FROM patients WHERE first_name = ? AND last_name = ? AND date_of_birth = ?',
        [first_name, last_name, date_of_birth]
      );
      
      if (existingPatients.length > 0) {
        patientId = existingPatients[0].id;
      }
    }
    
    // If patient doesn't exist, create a new patient record
    if (!patientId) {
      const [patientResult] = await pool.query(
        'INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone_number, is_emergency) VALUES (?, ?, ?, ?, ?, TRUE)',
        [first_name, last_name, date_of_birth || null, gender || null, contact_info || null]
      );
      
      patientId = patientResult.insertId;
    }
    
    // Create emergency patient record
    const [emergencyResult] = await pool.query(
      'INSERT INTO emergency_patients (patient_id, arrival_time, chief_complaint, patient_condition, vital_signs) VALUES (?, NOW(), ?, ?, ?)',
      [patientId, chief_complaint, condition, vital_signs]
    );
    
    await pool.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Emergency patient registered successfully',
      patient_id: patientId,
      emergency_id: emergencyResult.insertId
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error registering emergency patient:', error);
    res.status(500).json({ message: 'Failed to register emergency patient' });
  }
});

// Admit emergency patient to hospital bed
router.post('/admit', auth, authorize(['admin', 'doctor']), async (req, res) => {
  try {
    const { patient_id, bed_id, doctor_id, notes = null } = req.body;
    
    // Validate required fields
    if (!patient_id || !bed_id || !doctor_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await pool.query('START TRANSACTION');
    
    // Update emergency patient record
    await pool.query(
      'UPDATE emergency_patients SET is_admitted = TRUE WHERE patient_id = ? AND discharge_time IS NULL',
      [patient_id]
    );
    
    // Assign patient to bed
    await pool.query(
      'UPDATE beds SET is_occupied = TRUE, current_patient_id = ? WHERE id = ?',
      [patient_id, bed_id]
    );
    
    // Create admission record
    const [admissionResult] = await pool.query(
      'INSERT INTO admissions (patient_id, bed_id, admission_date, admission_reason, admitted_by) VALUES (?, ?, NOW(), ?, ?)',
      [patient_id, bed_id, 'Emergency admission', req.user.id]
    );
    
    // Assign doctor to patient
    await pool.query(
      'INSERT INTO doctor_patient_assignments (doctor_id, patient_id, assigned_date, is_active, notes) VALUES (?, ?, NOW(), TRUE, ?)',
      [doctor_id, patient_id, notes]
    );
    
    await pool.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Patient admitted successfully',
      admission_id: admissionResult.insertId
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error admitting emergency patient:', error);
    res.status(500).json({ message: 'Failed to admit patient' });
  }
});

// Update emergency patient condition
router.patch('/patients/:id/condition', auth, authorize(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, vital_signs = null, notes = null } = req.body;
    
    // Validate required fields
    if (!condition) {
      return res.status(400).json({ message: 'Condition is required' });
    }
    
    // Update emergency patient record
    await pool.query(
      'UPDATE emergency_patients SET patient_condition = ?, vital_signs = COALESCE(?, vital_signs) WHERE patient_id = ? AND discharge_time IS NULL',
      [condition, vital_signs, id]
    );
    
    res.status(200).json({ message: 'Patient condition updated successfully' });
  } catch (error) {
    console.error('Error updating patient condition:', error);
    res.status(500).json({ message: 'Failed to update patient condition' });
  }
});

// Discharge emergency patient
router.post('/patients/:id/discharge', auth, authorize(['admin', 'doctor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { discharge_notes, discharge_type } = req.body;
    
    await pool.query('START TRANSACTION');
    
    // Update emergency patient record
    await pool.query(
      'UPDATE emergency_patients SET discharge_time = NOW(), discharge_notes = ? WHERE patient_id = ? AND discharge_time IS NULL',
      [discharge_notes, id]
    );
    
    // Get bed information and free it if patient was admitted
    const [bedInfo] = await pool.query(
      'SELECT id FROM beds WHERE current_patient_id = ?',
      [id]
    );
    
    if (bedInfo.length > 0) {
      // Update bed status
      await pool.query(
        'UPDATE beds SET is_occupied = FALSE, current_patient_id = NULL WHERE current_patient_id = ?',
        [id]
      );
      
      // Update admission record
      await pool.query(
        'UPDATE admissions SET discharge_date = NOW(), discharge_notes = ? WHERE patient_id = ? AND discharge_date IS NULL',
        [discharge_notes, id]
      );
    }
    
    await pool.query('COMMIT');
    
    res.status(200).json({ message: 'Patient discharged successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error discharging patient:', error);
    res.status(500).json({ message: 'Failed to discharge patient' });
  }
});

// Get emergency ward statistics
router.get('/stats', auth, authorize(['admin', 'doctor']), async (req, res) => {
  try {
    // Get current emergency patients count
    const [patientCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_patients,
        SUM(CASE WHEN patient_condition = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN patient_condition = 'severe' THEN 1 ELSE 0 END) as severe,
        SUM(CASE WHEN patient_condition = 'moderate' THEN 1 ELSE 0 END) as moderate,
        SUM(CASE WHEN patient_condition = 'stable' THEN 1 ELSE 0 END) as stable,
        SUM(CASE WHEN is_admitted = TRUE THEN 1 ELSE 0 END) as admitted
      FROM emergency_patients
      WHERE discharge_time IS NULL
    `);
    
    // Get emergency bed statistics
    const [bedStats] = await pool.query(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN is_occupied = TRUE THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN is_occupied = FALSE THEN 1 ELSE 0 END) as available_beds
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      WHERE b.bed_type = 'Emergency' OR w.ward_type = 'Emergency'
    `);
    
    // Get today's statistics
    const [todayStats] = await pool.query(`
      SELECT
        COUNT(*) as today_arrivals,
        SUM(CASE WHEN discharge_time IS NOT NULL THEN 1 ELSE 0 END) as today_discharges
      FROM emergency_patients
      WHERE DATE(arrival_time) = CURDATE()
    `);
    
    res.json({
      patients: patientCounts[0],
      beds: bedStats[0],
      today: todayStats[0]
    });
  } catch (error) {
    console.error('Error fetching emergency statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

export default router; 