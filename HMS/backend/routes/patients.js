import express from 'express';
import { pool } from '../server.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {  // Temporarily remove auth middleware for testing
  try {
    console.log('GET /patients API called');
    
    // Add debugging to check database connection
    try {
      const [testConnection] = await pool.query('SELECT 1 as test');
      console.log('Database connection test:', testConnection);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ message: 'Database connection error', error: dbError.message });
    }
    
    const [patients] = await pool.query(`
      SELECT p.*, u.name, u.email 
      FROM patients p
      JOIN users u ON p.user_id = u.id
    `);
    
    console.log(`Found ${patients.length} patients`);
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const [patients] = await pool.query(`
      SELECT p.*, u.name, u.email 
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json(patients[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new patient (protected route)
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, date_of_birth, blood_group, medical_history } = req.body;
    
    // Validate input
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user exists and is a patient
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "patient"',
      [user_id]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found or not a patient' });
    }
    
    // Check if patient profile already exists
    const [existingPatient] = await pool.query(
      'SELECT * FROM patients WHERE user_id = ?',
      [user_id]
    );
    
    if (existingPatient.length > 0) {
      return res.status(400).json({ message: 'Patient profile already exists' });
    }
    
    // Insert patient into database
    const [result] = await pool.query(
      'INSERT INTO patients (user_id, date_of_birth, blood_group, medical_history) VALUES (?, ?, ?, ?)',
      [user_id, date_of_birth || null, blood_group || null, medical_history || null]
    );
    
    res.status(201).json({
      message: 'Patient profile created successfully',
      patient: {
        id: result.insertId,
        user_id,
        date_of_birth,
        blood_group,
        medical_history
      }
    });
    
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a patient (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const { date_of_birth, blood_group, medical_history } = req.body;
    
    // Check if patient exists
    const [patients] = await pool.query(
      'SELECT * FROM patients WHERE id = ?',
      [req.params.id]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Update patient in database
    await pool.query(
      'UPDATE patients SET date_of_birth = ?, blood_group = ?, medical_history = ? WHERE id = ?',
      [
        date_of_birth || patients[0].date_of_birth, 
        blood_group || patients[0].blood_group, 
        medical_history || patients[0].medical_history, 
        req.params.id
      ]
    );
    
    res.json({
      message: 'Patient profile updated successfully',
      patient: {
        id: req.params.id,
        date_of_birth,
        blood_group,
        medical_history
      }
    });
    
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a patient (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if patient exists
    const [patients] = await pool.query(
      'SELECT * FROM patients WHERE id = ?',
      [req.params.id]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Delete patient from database
    await pool.query(
      'DELETE FROM patients WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Patient profile deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get patients assigned to the logged-in doctor
router.get('/doctor', auth, async (req, res) => {
  try {
    // Get doctor_id from the authenticated user
    const doctorId = req.user.id;
    
    // Check if the user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can view their patients.' });
    }
    
    // Query to get all patients assigned to this doctor
    const query = `
      SELECT 
        p.id, 
        p.patient_id, 
        p.name, 
        p.age, 
        p.gender, 
        p.blood_type,
        p.phone,
        p.address,
        p.dob,
        p.allergies,
        p.emergency_contact,
        b.id as bed_id,
        b.bed_number,
        w.name as ward_name
      FROM 
        patients p
      LEFT JOIN 
        doctor_patient_assignments dpa ON p.id = dpa.patient_id
      LEFT JOIN
        beds b ON p.assigned_bed_id = b.id
      LEFT JOIN
        wards w ON b.ward_id = w.id
      WHERE 
        dpa.doctor_id = ?
      ORDER BY 
        p.name ASC
    `;
    
    const [patients] = await pool.query(query, [doctorId]);
    
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching doctor\'s patients:', error);
    res.status(500).json({ message: 'Error fetching patients', error: error.message });
  }
});

// Get patient records (medical, medications, notes)
router.get('/:patientId/records', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;
    
    // Check if user has permission to access this patient's records
    // (either admin or the assigned doctor)
    if (req.user.role !== 'admin') {
      const [doctorAssignment] = await pool.query(
        'SELECT * FROM doctor_patient_assignments WHERE doctor_id = ? AND patient_id = ?',
        [userId, patientId]
      );
      
      if (doctorAssignment.length === 0) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this patient.' });
      }
    }
    
    // Get medical records
    const [medicalRecords] = await pool.query(
      'SELECT id, title, description, created_at, created_by, "medical" as type FROM patient_medical_records WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    
    // Get medications
    const [medications] = await pool.query(
      `SELECT 
        id, 
        medication_name, 
        dosage, 
        frequency, 
        start_date, 
        end_date, 
        prescribed_by, 
        created_at,
        "medication" as type 
      FROM 
        patient_medications 
      WHERE 
        patient_id = ? 
      ORDER BY 
        start_date DESC`,
      [patientId]
    );
    
    // Get doctor notes
    const [notes] = await pool.query(
      'SELECT id, content, created_at, created_by, "note" as type FROM patient_notes WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    
    // Combine all records
    const allRecords = [...medicalRecords, ...medications, ...notes];
    
    res.status(200).json(allRecords);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ message: 'Error fetching patient records', error: error.message });
  }
});

// Add a doctor note for a patient
router.post('/:patientId/notes', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { note } = req.body;
    const doctorId = req.user.id;
    const doctorName = req.user.name;
    
    // Validate input
    if (!note || note.trim() === '') {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    // Check if user is a doctor
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only doctors can add notes.' });
    }
    
    // Check if doctor is assigned to this patient (skip for admin)
    if (req.user.role === 'doctor') {
      const [doctorAssignment] = await pool.query(
        'SELECT * FROM doctor_patient_assignments WHERE doctor_id = ? AND patient_id = ?',
        [doctorId, patientId]
      );
      
      if (doctorAssignment.length === 0) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this patient.' });
      }
    }
    
    // Add the note
    const [result] = await pool.query(
      'INSERT INTO patient_notes (patient_id, content, created_by, doctor_id) VALUES (?, ?, ?, ?)',
      [patientId, note, doctorName, doctorId]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding patient note:', error);
    res.status(500).json({ message: 'Error adding patient note', error: error.message });
  }
});

export default router;