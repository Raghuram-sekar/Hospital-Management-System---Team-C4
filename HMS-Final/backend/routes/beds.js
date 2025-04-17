import express from 'express';
import { pool } from '../server.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all beds with ward info
router.get('/', auth, async (req, res) => {
  try {
    const [beds] = await pool.query(`
      SELECT b.*, w.name as ward_name, w.ward_type,
        p.id as patient_id, u.name as patient_name
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY w.id, b.bed_number
    `);
    
    res.json(beds);
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bed by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const [beds] = await pool.query(`
      SELECT b.*, w.name as ward_name, w.ward_type,
        p.id as patient_id, u.name as patient_name
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    res.json(beds[0]);
  } catch (error) {
    console.error('Error fetching bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available beds
router.get('/status/available', auth, async (req, res) => {
  try {
    const { ward_type } = req.query;
    
    let query = `
      SELECT b.*, w.name as ward_name, w.ward_type
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      WHERE b.is_occupied = FALSE
    `;
    
    if (ward_type) {
      query += ` AND w.ward_type = ?`;
    }
    
    query += ` ORDER BY w.id, b.bed_number`;
    
    const [beds] = await pool.query(query, ward_type ? [ward_type] : []);
    
    res.json(beds);
  } catch (error) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get occupied beds
router.get('/status/occupied', auth, async (req, res) => {
  try {
    const [beds] = await pool.query(`
      SELECT b.*, w.name as ward_name, w.ward_type,
        p.id as patient_id, u.name as patient_name
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE b.is_occupied = TRUE
      ORDER BY w.id, b.bed_number
    `);
    
    res.json(beds);
  } catch (error) {
    console.error('Error fetching occupied beds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new bed
router.post('/', auth, async (req, res) => {
  try {
    const { bed_number, ward_id, bed_type } = req.body;
    
    // Validate input
    if (!bed_number || !ward_id) {
      return res.status(400).json({ message: 'Bed number and ward ID are required' });
    }
    
    // Check if ward exists
    const [wards] = await pool.query('SELECT * FROM wards WHERE id = ?', [ward_id]);
    
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found' });
    }
    
    // Check if bed number already exists in the ward
    const [existingBeds] = await pool.query(
      'SELECT * FROM beds WHERE bed_number = ? AND ward_id = ?',
      [bed_number, ward_id]
    );
    
    if (existingBeds.length > 0) {
      return res.status(400).json({ message: 'Bed number already exists in this ward' });
    }
    
    // Insert bed into database
    const [result] = await pool.query(
      'INSERT INTO beds (bed_number, ward_id, bed_type) VALUES (?, ?, ?)',
      [bed_number, ward_id, bed_type || 'Regular']
    );
    
    res.status(201).json({
      message: 'Bed created successfully',
      bed: {
        id: result.insertId,
        bed_number,
        ward_id,
        bed_type: bed_type || 'Regular',
        is_occupied: false
      }
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign bed to patient - no auth required for testing
router.put('/:id/assign', async (req, res) => {
  try {
    console.log('Assign bed API called:', { bed_id: req.params.id, req_body: req.body });
    const { patient_id } = req.body;
    
    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // Check if bed exists and is available
    const [beds] = await pool.query(
      'SELECT b.*, w.name as ward_name FROM beds b JOIN wards w ON b.ward_id = w.id WHERE b.id = ?',
      [req.params.id]
    );
    
    console.log('Bed query result:', beds);
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    // Now check if it's occupied in a separate step for better error messages
    if (beds[0].is_occupied) {
      return res.status(400).json({ message: 'Bed is already occupied' });
    }
    
    // Check if patient exists
    const [patients] = await pool.query(
      'SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [patient_id]
    );
    
    console.log('Patient query result:', patients);
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if patient is already assigned to another bed
    const [patientBeds] = await pool.query(
      'SELECT * FROM beds WHERE patient_id = ?',
      [patient_id]
    );
    
    console.log('Patient beds query result:', patientBeds);
    
    if (patientBeds.length > 0) {
      return res.status(400).json({ 
        message: 'Patient is already assigned to another bed',
        assigned_bed: patientBeds[0].bed_number
      });
    }
    
    // Start transaction
    await pool.query('START TRANSACTION');
    
    try {
      // Update bed to occupied
      const updateBedResult = await pool.query(
        'UPDATE beds SET is_occupied = TRUE, patient_id = ? WHERE id = ?',
        [patient_id, req.params.id]
      );
      
      console.log('Update bed result:', updateBedResult);
      
      // Update patient's assigned bed
      const updatePatientResult = await pool.query(
        'UPDATE patients SET assigned_bed_id = ? WHERE id = ?',
        [req.params.id, patient_id]
      );
      
      console.log('Update patient result:', updatePatientResult);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ 
        message: 'Bed assigned successfully',
        bed_id: req.params.id,
        patient_id: patient_id,
        bed_number: beds[0].bed_number,
        ward_name: beds[0].ward_name,
        patient_name: patients[0].name
      });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error assigning bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Release bed
router.put('/:id/release', auth, async (req, res) => {
  try {
    // Check if bed exists and is occupied
    const [beds] = await pool.query(
      'SELECT * FROM beds WHERE id = ? AND is_occupied = TRUE',
      [req.params.id]
    );
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found or not occupied' });
    }
    
    const bed = beds[0];
    
    // Start transaction
    await pool.query('START TRANSACTION');
    
    try {
      // If patient is assigned, update patient record
      if (bed.patient_id) {
        await pool.query(
          'UPDATE patients SET assigned_bed_id = NULL WHERE id = ?',
          [bed.patient_id]
        );
      }
      
      // Update bed to available
      await pool.query(
        'UPDATE beds SET is_occupied = FALSE, patient_id = NULL WHERE id = ?',
        [req.params.id]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Bed released successfully' });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error releasing bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bed
router.put('/:id', auth, async (req, res) => {
  try {
    const { bed_number, bed_type } = req.body;
    
    // Check if bed exists
    const [beds] = await pool.query(
      'SELECT * FROM beds WHERE id = ?',
      [req.params.id]
    );
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    const bed = beds[0];
    
    // Update bed
    await pool.query(
      'UPDATE beds SET bed_number = ?, bed_type = ? WHERE id = ?',
      [
        bed_number || bed.bed_number,
        bed_type || bed.bed_type,
        req.params.id
      ]
    );
    
    res.json({ 
      message: 'Bed updated successfully',
      bed: {
        id: req.params.id,
        bed_number: bed_number || bed.bed_number,
        bed_type: bed_type || bed.bed_type
      }
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete bed
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if bed exists
    const [beds] = await pool.query(
      'SELECT * FROM beds WHERE id = ?',
      [req.params.id]
    );
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    // Check if bed is occupied
    if (beds[0].is_occupied) {
      return res.status(400).json({ message: 'Cannot delete an occupied bed' });
    }
    
    // Delete bed
    await pool.query(
      'DELETE FROM beds WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Bed deleted successfully' });
  } catch (error) {
    console.error('Error deleting bed:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Diagnostic route for debugging - no auth required
router.get('/diagnostic', async (req, res) => {
  try {
    console.log('Running bed assignment diagnostic checks');
    const diagnosticResults = {
      database_connection: false,
      beds_table: false,
      beds_count: 0,
      available_beds: 0,
      patients_table: false,
      patients_count: 0,
      users_table: false,
      wards_table: false
    };
    
    // Test database connection
    try {
      const [testConnection] = await pool.query('SELECT 1 as test');
      diagnosticResults.database_connection = true;
    } catch (error) {
      console.error('Database connection error:', error);
    }
    
    // Check beds table
    try {
      const [beds] = await pool.query('SELECT COUNT(*) as count FROM beds');
      diagnosticResults.beds_table = true;
      diagnosticResults.beds_count = beds[0].count;
      
      // Check available beds
      const [availableBeds] = await pool.query('SELECT COUNT(*) as count FROM beds WHERE is_occupied = FALSE');
      diagnosticResults.available_beds = availableBeds[0].count;
    } catch (error) {
      console.error('Beds table error:', error);
    }
    
    // Check patients table
    try {
      const [patients] = await pool.query('SELECT COUNT(*) as count FROM patients');
      diagnosticResults.patients_table = true;
      diagnosticResults.patients_count = patients[0].count;
    } catch (error) {
      console.error('Patients table error:', error);
    }
    
    // Check users table
    try {
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
      diagnosticResults.users_table = true;
      diagnosticResults.users_count = users[0].count;
    } catch (error) {
      console.error('Users table error:', error);
    }
    
    // Check wards table
    try {
      const [wards] = await pool.query('SELECT COUNT(*) as count FROM wards');
      diagnosticResults.wards_table = true;
      diagnosticResults.wards_count = wards[0].count;
    } catch (error) {
      console.error('Wards table error:', error);
    }
    
    // If all tables exist, get sample data
    if (diagnosticResults.beds_table && diagnosticResults.patients_table) {
      try {
        const [sampleBed] = await pool.query('SELECT * FROM beds LIMIT 1');
        if (sampleBed.length > 0) {
          diagnosticResults.sample_bed = sampleBed[0];
        }
        
        const [samplePatient] = await pool.query(`
          SELECT p.*, u.name, u.email 
          FROM patients p
          JOIN users u ON p.user_id = u.id
          LIMIT 1
        `);
        if (samplePatient.length > 0) {
          diagnosticResults.sample_patient = samplePatient[0];
        }
      } catch (error) {
        console.error('Sample data error:', error);
      }
    }
    
    res.json({ 
      message: 'Diagnostic completed',
      results: diagnosticResults
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ message: 'Diagnostic error', error: error.message });
  }
});

// Direct SQL query route for debugging - no auth required
router.get('/schema', async (req, res) => {
  try {
    console.log('Checking database schema');
    const tables = {};
    
    // Get list of tables
    const [tableList] = await pool.query(`
      SHOW TABLES
    `);
    
    // For each table, get its schema
    for (const tableRow of tableList) {
      const tableName = Object.values(tableRow)[0];
      const [columns] = await pool.query(`
        DESCRIBE ${tableName}
      `);
      tables[tableName] = columns;
    }
    
    res.json({
      message: 'Database schema retrieved',
      tables
    });
  } catch (error) {
    console.error('Schema retrieval error:', error);
    res.status(500).json({ message: 'Schema retrieval error', error: error.message });
  }
});

// Direct test route for assigning a bed - no auth required
router.get('/test-assign/:bedId/:patientId', async (req, res) => {
  try {
    const { bedId, patientId } = req.params;
    console.log(`Test assign bed ${bedId} to patient ${patientId}`);
    
    // Check if bed exists
    const [beds] = await pool.query(
      'SELECT b.*, w.name as ward_name FROM beds b JOIN wards w ON b.ward_id = w.id WHERE b.id = ?',
      [bedId]
    );
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    const bed = beds[0];
    
    // Check if bed is occupied
    if (bed.is_occupied) {
      return res.status(400).json({ message: 'Bed is already occupied' });
    }
    
    // Check if patient exists
    const [patients] = await pool.query(
      'SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [patientId]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const patient = patients[0];
    
    // Check if patient is already assigned to another bed
    const [patientBeds] = await pool.query(
      'SELECT * FROM beds WHERE patient_id = ?',
      [patientId]
    );
    
    if (patientBeds.length > 0) {
      return res.status(400).json({ 
        message: 'Patient is already assigned to another bed',
        assigned_bed: patientBeds[0].bed_number
      });
    }
    
    // Start transaction
    await pool.query('START TRANSACTION');
    
    try {
      // Update bed to occupied
      await pool.query(
        'UPDATE beds SET is_occupied = TRUE, patient_id = ? WHERE id = ?',
        [patientId, bedId]
      );
      
      // Update patient's assigned bed
      await pool.query(
        'UPDATE patients SET assigned_bed_id = ? WHERE id = ?',
        [bedId, patientId]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ 
        message: 'Bed assigned successfully',
        bed_id: bedId,
        patient_id: patientId,
        bed_number: bed.bed_number,
        ward_name: bed.ward_name,
        patient_name: patient.name
      });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Test assign error:', error);
    res.status(500).json({ message: 'Test assign error', error: error.message });
  }
});

// Direct simple assignment - no transaction, just direct updates
router.post('/direct-assign', async (req, res) => {
  try {
    const { bedId, patientId } = req.body;
    console.log(`Direct assign request: bed=${bedId}, patient=${patientId}`);
    
    if (!bedId || !patientId) {
      return res.status(400).json({ message: 'Bed ID and Patient ID are required' });
    }
    
    // Simple direct update of the bed
    await pool.query(
      'UPDATE beds SET is_occupied = TRUE, patient_id = ? WHERE id = ?',
      [patientId, bedId]
    );
    
    // Simple direct update of the patient
    await pool.query(
      'UPDATE patients SET assigned_bed_id = ? WHERE id = ?',
      [bedId, patientId]
    );
    
    console.log('Direct assignment completed successfully');
    
    res.json({ 
      message: 'Bed assigned successfully via direct method',
      bed_id: bedId,
      patient_id: patientId
    });
  } catch (error) {
    console.error('Direct assign error:', error);
    res.status(500).json({ message: 'Direct assign error', error: error.message });
  }
});

// Database status check endpoint
router.get('/db-status', async (req, res) => {
  try {
    console.log('Running database status check');
    const result = {
      status: 'ok',
      connection: 'ok',
      tables: {},
      sample_queries: {}
    };
    
    // Check database connection
    try {
      const [testConnection] = await pool.query('SELECT 1 as connection_test');
      result.connection_test = testConnection[0].connection_test === 1;
    } catch (error) {
      result.status = 'error';
      result.connection = 'failed';
      result.connection_error = error.message;
      console.error('Database connection test failed:', error);
    }
    
    if (result.connection === 'ok') {
      // Check basic table counts
      const tables = ['beds', 'patients', 'users', 'wards'];
      for (const table of tables) {
        try {
          const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          result.tables[table] = {
            exists: true,
            count: rows[0].count
          };
        } catch (error) {
          result.tables[table] = {
            exists: false,
            error: error.message
          };
          console.error(`Error checking ${table} table:`, error);
        }
      }
      
      // Check sample beds
      try {
        const [beds] = await pool.query('SELECT * FROM beds LIMIT 3');
        result.sample_queries.beds = beds;
      } catch (error) {
        result.sample_queries.beds_error = error.message;
        console.error('Error fetching sample beds:', error);
      }
      
      // Check sample patients
      try {
        const [patients] = await pool.query('SELECT * FROM patients LIMIT 3');
        result.sample_queries.patients = patients;
      } catch (error) {
        result.sample_queries.patients_error = error.message;
        console.error('Error fetching sample patients:', error);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Database status check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check database status',
      error: error.message
    });
  }
});

// Force assign bed to patient - ignores occupied status
router.post('/force-assign', async (req, res) => {
  try {
    const { bedId, patientId } = req.body;
    console.log(`Force assign request: bed=${bedId}, patient=${patientId}`);
    
    if (!bedId || !patientId) {
      return res.status(400).json({ message: 'Bed ID and Patient ID are required' });
    }
    
    // Check if bed exists
    const [beds] = await pool.query(
      'SELECT b.*, w.name as ward_name FROM beds b JOIN wards w ON b.ward_id = w.id WHERE b.id = ?',
      [bedId]
    );
    
    if (beds.length === 0) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    
    const bed = beds[0];
    
    // Check if patient exists
    const [patients] = await pool.query(
      'SELECT p.*, u.name, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [patientId]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const patient = patients[0];
    
    // Start transaction
    await pool.query('START TRANSACTION');
    
    try {
      // If bed is already occupied, release current patient
      if (bed.is_occupied && bed.patient_id) {
        console.log(`Bed ${bedId} is already occupied by patient ${bed.patient_id}, releasing...`);
        await pool.query(
          'UPDATE patients SET assigned_bed_id = NULL WHERE id = ?',
          [bed.patient_id]
        );
      }
      
      // Check if patient is already assigned to another bed
      if (patient.assigned_bed_id) {
        console.log(`Patient ${patientId} is already assigned to bed ${patient.assigned_bed_id}, releasing...`);
        await pool.query(
          'UPDATE beds SET is_occupied = FALSE, patient_id = NULL WHERE id = ?',
          [patient.assigned_bed_id]
        );
      }
      
      // Update bed to occupied with new patient
      await pool.query(
        'UPDATE beds SET is_occupied = TRUE, patient_id = ? WHERE id = ?',
        [patientId, bedId]
      );
      
      // Update patient's assigned bed
      await pool.query(
        'UPDATE patients SET assigned_bed_id = ? WHERE id = ?',
        [bedId, patientId]
      );
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ 
        message: 'Bed force-assigned successfully',
        bed_id: bedId,
        patient_id: patientId,
        bed_number: bed.bed_number,
        ward_name: bed.ward_name,
        patient_name: patient.name
      });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      console.error('Force assign transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Force assign error:', error);
    res.status(500).json({ message: 'Force assign error', error: error.message });
  }
});

// Repair database inconsistencies
router.post('/repair', async (req, res) => {
  try {
    console.log('Starting database repair for bed assignments');
    const repairs = {
      beds_fixed: 0,
      patients_fixed: 0,
      errors: []
    };
    
    // Start a transaction
    await pool.query('START TRANSACTION');
    
    try {
      // 1. Fix beds that show occupied but have no patient
      const [inconsistentBeds] = await pool.query(
        'SELECT * FROM beds WHERE is_occupied = TRUE AND patient_id IS NULL'
      );
      
      console.log(`Found ${inconsistentBeds.length} beds marked as occupied with no patient`);
      
      for (const bed of inconsistentBeds) {
        await pool.query(
          'UPDATE beds SET is_occupied = FALSE WHERE id = ?',
          [bed.id]
        );
        repairs.beds_fixed++;
      }
      
      // 2. Fix beds that show available but have a patient
      const [inconsistentBeds2] = await pool.query(
        'SELECT * FROM beds WHERE is_occupied = FALSE AND patient_id IS NOT NULL'
      );
      
      console.log(`Found ${inconsistentBeds2.length} beds marked as available but assigned to a patient`);
      
      for (const bed of inconsistentBeds2) {
        await pool.query(
          'UPDATE beds SET is_occupied = TRUE WHERE id = ?',
          [bed.id]
        );
        repairs.beds_fixed++;
      }
      
      // 3. Fix patients assigned to beds that don't exist or don't have them
      const [patientsWithBeds] = await pool.query(`
        SELECT p.*, b.id as actual_bed_id, b.patient_id as bed_patient_id, b.is_occupied 
        FROM patients p 
        LEFT JOIN beds b ON p.assigned_bed_id = b.id 
        WHERE p.assigned_bed_id IS NOT NULL
      `);
      
      for (const patient of patientsWithBeds) {
        // If bed doesn't exist or doesn't have this patient
        if (!patient.actual_bed_id || patient.bed_patient_id !== patient.id) {
          await pool.query(
            'UPDATE patients SET assigned_bed_id = NULL WHERE id = ?',
            [patient.id]
          );
          repairs.patients_fixed++;
        }
      }
      
      // 4. Fix beds with patients that don't exist or aren't assigned to them
      const [bedsWithPatients] = await pool.query(`
        SELECT b.*, p.id as actual_patient_id, p.assigned_bed_id as patient_bed_id 
        FROM beds b 
        LEFT JOIN patients p ON b.patient_id = p.id 
        WHERE b.patient_id IS NOT NULL
      `);
      
      for (const bed of bedsWithPatients) {
        // If patient doesn't exist or isn't assigned to this bed
        if (!bed.actual_patient_id || bed.patient_bed_id !== bed.id) {
          await pool.query(
            'UPDATE beds SET patient_id = NULL, is_occupied = FALSE WHERE id = ?',
            [bed.id]
          );
          repairs.beds_fixed++;
        }
      }
      
      // Commit all changes
      await pool.query('COMMIT');
      
      res.json({
        message: 'Database repair completed successfully',
        repairs: repairs
      });
    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      console.error('Repair transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Database repair error:', error);
    res.status(500).json({ message: 'Database repair error', error: error.message });
  }
});

export default router; 