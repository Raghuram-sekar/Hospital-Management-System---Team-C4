import express from 'express';
import { pool } from '../server.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all wards with bed counts
router.get('/', auth, async (req, res) => {
  try {
    const [wards] = await pool.query(`
      SELECT w.*, 
        COUNT(b.id) as total_beds,
        SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as occupied_beds,
        COUNT(b.id) - SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as available_beds
      FROM wards w
      LEFT JOIN beds b ON w.id = b.ward_id
      GROUP BY w.id
      ORDER BY w.id
    `);
    
    res.json(wards);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ward by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const [wards] = await pool.query(`
      SELECT w.*, 
        COUNT(b.id) as total_beds,
        SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as occupied_beds,
        COUNT(b.id) - SUM(CASE WHEN b.is_occupied THEN 1 ELSE 0 END) as available_beds
      FROM wards w
      LEFT JOIN beds b ON w.id = b.ward_id
      WHERE w.id = ?
      GROUP BY w.id
    `, [req.params.id]);
    
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }
    
    res.json(wards[0]);
  } catch (error) {
    console.error('Error fetching ward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get beds for a specific ward
router.get('/:id/beds', auth, async (req, res) => {
  try {
    const [beds] = await pool.query(`
      SELECT b.*, p.id as patient_id, u.name as patient_name
      FROM beds b
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE b.ward_id = ?
      ORDER BY b.bed_number
    `, [req.params.id]);
    
    res.json(beds);
  } catch (error) {
    console.error('Error fetching ward beds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new ward
router.post('/', auth, async (req, res) => {
  try {
    const { name, capacity, ward_type, floor } = req.body;
    
    // Validate input
    if (!name || !ward_type) {
      return res.status(400).json({ message: 'Ward name and type are required' });
    }
    
    // Check if ward name already exists
    const [existingWards] = await pool.query(
      'SELECT * FROM wards WHERE name = ?',
      [name]
    );
    
    if (existingWards.length > 0) {
      return res.status(400).json({ message: 'Ward with this name already exists' });
    }
    
    // Insert ward into database
    const [result] = await pool.query(
      'INSERT INTO wards (name, capacity, ward_type, floor) VALUES (?, ?, ?, ?)',
      [name, capacity || 10, ward_type, floor || 1]
    );
    
    res.status(201).json({
      message: 'Ward created successfully',
      ward: {
        id: result.insertId,
        name,
        capacity: capacity || 10,
        ward_type,
        floor: floor || 1
      }
    });
  } catch (error) {
    console.error('Error creating ward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ward
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, capacity, ward_type, floor } = req.body;
    
    // Check if ward exists
    const [wards] = await pool.query(
      'SELECT * FROM wards WHERE id = ?',
      [req.params.id]
    );
    
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }
    
    const ward = wards[0];
    
    // Check if new name already exists (if name is being changed)
    if (name && name !== ward.name) {
      const [existingWards] = await pool.query(
        'SELECT * FROM wards WHERE name = ? AND id != ?',
        [name, req.params.id]
      );
      
      if (existingWards.length > 0) {
        return res.status(400).json({ message: 'Ward with this name already exists' });
      }
    }
    
    // Update ward
    await pool.query(
      'UPDATE wards SET name = ?, capacity = ?, ward_type = ?, floor = ? WHERE id = ?',
      [
        name || ward.name,
        capacity || ward.capacity,
        ward_type || ward.ward_type,
        floor || ward.floor,
        req.params.id
      ]
    );
    
    res.json({
      message: 'Ward updated successfully',
      ward: {
        id: req.params.id,
        name: name || ward.name,
        capacity: capacity || ward.capacity,
        ward_type: ward_type || ward.ward_type,
        floor: floor || ward.floor
      }
    });
  } catch (error) {
    console.error('Error updating ward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete ward
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if ward exists
    const [wards] = await pool.query(
      'SELECT * FROM wards WHERE id = ?',
      [req.params.id]
    );
    
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }
    
    // Check if ward has beds
    const [beds] = await pool.query(
      'SELECT * FROM beds WHERE ward_id = ?',
      [req.params.id]
    );
    
    if (beds.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete ward with beds. Delete all beds in this ward first.',
        beds_count: beds.length
      });
    }
    
    // Delete ward
    await pool.query(
      'DELETE FROM wards WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Ward deleted successfully' });
  } catch (error) {
    console.error('Error deleting ward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 