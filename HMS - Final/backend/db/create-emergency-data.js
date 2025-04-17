import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hms_db',
      multipleStatements: true
    });
    
    console.log('Connected to database');
    
    // Get the emergency ward ID
    console.log('Getting emergency ward ID...');
    const [wardRows] = await connection.query(`
      SELECT id FROM wards WHERE ward_type = 'Emergency' LIMIT 1;
    `);
    
    let wardId = wardRows[0]?.id;
    if (!wardId) {
      console.log('Emergency ward not found, creating one...');
      await connection.query(`
        INSERT INTO wards (name, capacity, ward_type, floor)
        VALUES ('Emergency Ward', 15, 'Emergency', 1);
      `);
      const [newWardRows] = await connection.query(`
        SELECT id FROM wards WHERE ward_type = 'Emergency' LIMIT 1;
      `);
      wardId = newWardRows[0]?.id;
    }
    
    // Create sample emergency beds if they don't exist
    console.log('Creating emergency beds if not exist...');
    const bedNumbers = ['ER-101', 'ER-102', 'ER-103', 'ER-104', 'ER-105'];
    
    for (const bedNumber of bedNumbers) {
      await connection.query(`
        INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
        SELECT ?, ?, FALSE, 'Emergency'
        FROM dual
        WHERE NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = ?);
      `, [bedNumber, wardId, bedNumber]);
    }
    
    // Adding sample data for doctors
    console.log('Checking if we have doctors...');
    const [doctorCount] = await connection.query(`
      SELECT COUNT(*) as count FROM doctors;
    `);
    
    // Make sure we have patient records
    console.log('Checking if we have patients...');
    const [patientCount] = await connection.query(`
      SELECT COUNT(*) as count FROM patients;
    `);
    
    if (patientCount[0].count < 6) {
      console.log('Creating some sample patients...');
      await connection.query(`
        INSERT INTO patients (name, email, phone, date_of_birth, gender, address, medical_history)
        VALUES 
          ('Alex Johnson', 'alex.johnson@example.com', '555-1234', '1985-04-15', 'Male', '123 Main St', 'No known allergies'),
          ('Sarah Williams', 'sarah.williams@example.com', '555-2345', '1990-07-22', 'Female', '456 Oak Ave', 'Asthma'),
          ('Michael Brown', 'michael.brown@example.com', '555-3456', '1978-11-30', 'Male', '789 Pine St', 'Hypertension'),
          ('Emily Davis', 'emily.davis@example.com', '555-4567', '1982-02-10', 'Female', '101 Maple Dr', 'Diabetes type 2'),
          ('David Wilson', 'david.wilson@example.com', '555-5678', '1995-09-05', 'Male', '202 Elm St', 'No significant history')
        ON DUPLICATE KEY UPDATE id = id;
      `);
    }
    
    // Insert sample emergency patients
    console.log('Creating sample emergency patients...');
    try {
      await connection.query(`
        INSERT INTO emergency_patients (patient_id, arrival_time, chief_complaint, vital_signs, patient_condition, is_admitted)
        VALUES 
          (2, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Severe abdominal pain with vomiting', 
           '{"temperature": 38.2, "heart_rate": 105, "blood_pressure": "135/85", "respiratory_rate": 18, "oxygen_saturation": 98}',
           'severe', false),
           
          (3, DATE_SUB(NOW(), INTERVAL 45 MINUTE), 'Traumatic head injury from car accident', 
           '{"temperature": 36.8, "heart_rate": 120, "blood_pressure": "160/95", "respiratory_rate": 24, "oxygen_saturation": 92}',
           'critical', true),
           
          (4, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Allergic reaction with facial swelling', 
           '{"temperature": 37.0, "heart_rate": 100, "blood_pressure": "125/80", "respiratory_rate": 20, "oxygen_saturation": 96}',
           'moderate', false),
           
          (5, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'Chest pain and difficulty breathing', 
           '{"temperature": 37.5, "heart_rate": 115, "blood_pressure": "150/90", "respiratory_rate": 22, "oxygen_saturation": 91}',
           'critical', false),
           
          (6, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Fainting episode with brief loss of consciousness', 
           '{"temperature": 36.5, "heart_rate": 88, "blood_pressure": "110/70", "respiratory_rate": 16, "oxygen_saturation": 98}',
           'stable', false);
      `);
      console.log('Emergency patients created successfully');
    } catch (err) {
      console.log('Error creating emergency patients:', err.message);
      // Try creating them one by one
      console.log('Trying to create emergency patients individually...');
      
      const emergencyPatients = [
        {
          patient_id: 2,
          time_offset: '1 HOUR',
          complaint: 'Severe abdominal pain with vomiting',
          vitals: '{"temperature": 38.2, "heart_rate": 105, "blood_pressure": "135/85", "respiratory_rate": 18, "oxygen_saturation": 98}',
          condition: 'severe',
          admitted: false
        },
        {
          patient_id: 3,
          time_offset: '45 MINUTE',
          complaint: 'Traumatic head injury from car accident',
          vitals: '{"temperature": 36.8, "heart_rate": 120, "blood_pressure": "160/95", "respiratory_rate": 24, "oxygen_saturation": 92}',
          condition: 'critical',
          admitted: true
        },
        {
          patient_id: 4,
          time_offset: '2 HOUR',
          complaint: 'Allergic reaction with facial swelling',
          vitals: '{"temperature": 37.0, "heart_rate": 100, "blood_pressure": "125/80", "respiratory_rate": 20, "oxygen_saturation": 96}',
          condition: 'moderate',
          admitted: false
        },
        {
          patient_id: 5,
          time_offset: '30 MINUTE',
          complaint: 'Chest pain and difficulty breathing',
          vitals: '{"temperature": 37.5, "heart_rate": 115, "blood_pressure": "150/90", "respiratory_rate": 22, "oxygen_saturation": 91}',
          condition: 'critical',
          admitted: false
        },
        {
          patient_id: 6,
          time_offset: '3 HOUR',
          complaint: 'Fainting episode with brief loss of consciousness',
          vitals: '{"temperature": 36.5, "heart_rate": 88, "blood_pressure": "110/70", "respiratory_rate": 16, "oxygen_saturation": 98}',
          condition: 'stable',
          admitted: false
        }
      ];
      
      for (const patient of emergencyPatients) {
        try {
          await connection.query(`
            INSERT INTO emergency_patients 
            (patient_id, arrival_time, chief_complaint, vital_signs, patient_condition, is_admitted)
            VALUES (?, DATE_SUB(NOW(), INTERVAL ?), ?, ?, ?, ?)
          `, [
            patient.patient_id,
            patient.time_offset,
            patient.complaint,
            patient.vitals,
            patient.condition,
            patient.admitted
          ]);
          console.log(`Created emergency patient for patient ${patient.patient_id}`);
        } catch (patientErr) {
          console.log(`Failed to create emergency patient ${patient.patient_id}:`, patientErr.message);
        }
      }
    }
    
    // Mark one patient as admitted to a bed
    console.log('Setting up admitted patient...');
    const [bedRows] = await connection.query(`
      SELECT id FROM beds WHERE bed_number = 'ER-101' LIMIT 1;
    `);
    
    const bedId = bedRows[0]?.id;
    if (bedId) {
      await connection.query(`
        UPDATE beds SET is_occupied = TRUE, patient_id = 3 WHERE id = ?;
      `, [bedId]);
      
      try {
        await connection.query(`
          INSERT INTO admissions (patient_id, bed_id, admission_date, admission_reason, admitted_by)
          VALUES (3, ?, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'Emergency admission for traumatic head injury', 1);
        `, [bedId]);
        console.log('Created admission record for patient 3');
      } catch (err) {
        console.log('Error creating admission record:', err.message);
      }
    }
    
    // Update patients table to mark emergency patients
    console.log('Marking patients as emergency patients...');
    await connection.query(`
      UPDATE patients SET is_emergency = TRUE WHERE id IN (2, 3, 4, 5, 6);
    `);
    
    console.log('Checking emergency patient data...');
    const [emergencyPatients] = await connection.query(`
      SELECT * FROM emergency_patients;
    `);
    console.log(`Total emergency patients: ${emergencyPatients.length}`);
    
    console.log('Emergency data created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run(); 