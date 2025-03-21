import express from 'express';
import { pool } from '../server.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT d.*, u.name, u.email 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `);
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT d.*, u.name, u.email 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctors[0]);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new doctor (protected route)
router.post('/', auth, async (req, res) => {
  try {
    const { user_id, specialty, experience, consultation_fee } = req.body;
    
    // Validate input
    if (!user_id || !specialty) {
      return res.status(400).json({ message: 'User ID and specialty are required' });
    }
    
    // Check if user exists and is a doctor
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "doctor"',
      [user_id]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found or not a doctor' });
    }
    
    // Check if doctor profile already exists
    const [existingDoctor] = await pool.query(
      'SELECT * FROM doctors WHERE user_id = ?',
      [user_id]
    );
    
    if (existingDoctor.length > 0) {
      return res.status(400).json({ message: 'Doctor profile already exists' });
    }
    
    // Insert doctor into database
    const [result] = await pool.query(
      'INSERT INTO doctors (user_id, specialty, experience, consultation_fee) VALUES (?, ?, ?, ?)',
      [user_id, specialty, experience || 0, consultation_fee || 0]
    );
    
    res.status(201).json({
      message: 'Doctor profile created successfully',
      doctor: {
        id: result.insertId,
        user_id,
        specialty,
        experience,
        consultation_fee
      }
    });
    
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a doctor (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const { specialty, experience, consultation_fee } = req.body;
    
    // Validate input
    if (!specialty) {
      return res.status(400).json({ message: 'Specialty is required' });
    }
    
    // Check if doctor exists
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.id]
    );
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Update doctor in database
    await pool.query(
      'UPDATE doctors SET specialty = ?, experience = ?, consultation_fee = ? WHERE id = ?',
      [specialty, experience || doctors[0].experience, consultation_fee || doctors[0].consultation_fee, req.params.id]
    );
    
    res.json({
      message: 'Doctor profile updated successfully',
      doctor: {
        id: req.params.id,
        specialty,
        experience,
        consultation_fee
      }
    });
    
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a doctor (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if doctor exists
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [req.params.id]
    );
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Delete doctor from database
    await pool.query(
      'DELETE FROM doctors WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Doctor profile deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 