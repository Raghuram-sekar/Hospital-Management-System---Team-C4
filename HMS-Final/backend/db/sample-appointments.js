import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function insertSampleAppointments() {
  try {
    console.log('Connecting to database to insert sample appointments...');
    
    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hms_db'
    });
    
    console.log('Connected to database successfully');
    
    // First, get existing patients and doctors to ensure we use valid IDs
    const [patients] = await connection.query('SELECT id FROM patients LIMIT 5');
    const [doctors] = await connection.query('SELECT id FROM users WHERE role = "doctor" LIMIT 5');
    
    console.log(`Found ${patients.length} patients and ${doctors.length} doctors`);
    
    if (patients.length === 0 || doctors.length === 0) {
      console.error('No patients or doctors found in the database. Please add them first.');
      await connection.end();
      return;
    }
    
    // Check if we already have appointments
    const [existingAppointments] = await connection.query('SELECT COUNT(*) as count FROM appointments');
    
    if (existingAppointments[0].count > 0) {
      console.log(`Found ${existingAppointments[0].count} existing appointments. Clearing them first...`);
      await connection.query('TRUNCATE TABLE appointments');
      console.log('Existing appointments cleared.');
    }
    
    // Sample appointment data
    const sampleAppointments = [
      {
        patient_id: patients[0].id,
        doctor_id: doctors[0].id,
        appointment_date: '2025-04-15',
        start_time: '09:00:00',
        end_time: '09:30:00',
        purpose: 'Annual physical examination',
        status: 'scheduled'
      },
      {
        patient_id: patients[1].id,
        doctor_id: doctors[0].id,
        appointment_date: '2025-04-16',
        start_time: '10:00:00',
        end_time: '10:30:00',
        purpose: 'Headache and fever',
        status: 'scheduled'
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctors[1].id,
        appointment_date: '2025-04-17',
        start_time: '11:00:00',
        end_time: '11:30:00',
        purpose: 'Follow-up on medication',
        status: 'scheduled'
      },
      {
        patient_id: patients[2].id,
        doctor_id: doctors[1].id,
        appointment_date: '2025-04-15',
        start_time: '13:00:00',
        end_time: '13:30:00',
        purpose: 'Back pain consultation',
        status: 'scheduled'
      },
      {
        patient_id: patients[3].id,
        doctor_id: doctors[2].id,
        appointment_date: '2025-04-18',
        start_time: '14:00:00',
        end_time: '14:30:00',
        purpose: 'Skin rash checkup',
        status: 'scheduled'
      }
    ];
    
    console.log('Inserting sample appointments...');
    
    // Insert each appointment
    for (const appointment of sampleAppointments) {
      await connection.query(
        `INSERT INTO appointments 
        (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.patient_id,
          appointment.doctor_id,
          appointment.appointment_date,
          appointment.start_time,
          appointment.end_time,
          appointment.purpose,
          appointment.status
        ]
      );
    }
    
    console.log(`Successfully inserted ${sampleAppointments.length} sample appointments`);
    
    // Verify the insertions
    const [insertedAppointments] = await connection.query(`
      SELECT 
        a.id, 
        a.patient_id, 
        p_user.name as patient_name,
        a.doctor_id,
        d_user.name as doctor_name,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.purpose,
        a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      JOIN users d_user ON a.doctor_id = d_user.id
    `);
    
    console.log('Inserted appointments:');
    console.table(insertedAppointments);
    
    await connection.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error inserting sample appointments:', error);
  }
}

// Run the function
insertSampleAppointments(); 