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
    
    // Find admin user
    const [adminRows] = await connection.query(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1;
    `);
    
    let adminId = adminRows[0]?.id;
    
    if (!adminId) {
      console.log('Admin user not found, creating one...');
      // Hash for password "admin123"
      const hashedPassword = '$2a$10$NYFZ/8WaQ3Qb5GgfXT.WAeXRfzoFzYpRQbLY4rhxGDTQPStZLK6AS'; 
      
      await connection.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@hospital.com', ?, 'admin');
      `, [hashedPassword]);
      
      const [newAdminRows] = await connection.query(`
        SELECT id FROM users WHERE role = 'admin' LIMIT 1;
      `);
      
      adminId = newAdminRows[0]?.id;
    }
    
    // Find or create a doctor
    const [doctorRows] = await connection.query(`
      SELECT id FROM users WHERE role = 'doctor' LIMIT 1;
    `);
    
    let doctorId = doctorRows[0]?.id;
    
    if (!doctorId) {
      console.log('Doctor user not found, creating one...');
      // Hash for password "doctor123"
      const hashedPassword = '$2a$10$NYFZ/8WaQ3Qb5GgfXT.WAeXRfzoFzYpRQbLY4rhxGDTQPStZLK6AS';
      
      await connection.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Dr. John Smith', 'doctor@hospital.com', ?, 'doctor');
      `, [hashedPassword]);
      
      const [newDoctorRows] = await connection.query(`
        SELECT id FROM users WHERE role = 'doctor' LIMIT 1;
      `);
      
      doctorId = newDoctorRows[0]?.id;
    }
    
    // Get patients, create if none
    const [patientRows] = await connection.query(`
      SELECT id FROM patients LIMIT 5;
    `);
    
    if (patientRows.length === 0) {
      console.log('No patients found, creating sample patients...');
      
      await connection.query(`
        INSERT INTO patients (name, email, phone, date_of_birth, gender, address, medical_history)
        VALUES 
          ('John Doe', 'john@example.com', '555-1234', '1985-05-15', 'Male', '123 Main St', 'No known conditions'),
          ('Jane Smith', 'jane@example.com', '555-5678', '1990-08-22', 'Female', '456 Oak Ave', 'Asthma'),
          ('Michael Johnson', 'michael@example.com', '555-9012', '1978-11-30', 'Male', '789 Pine Blvd', 'Hypertension'),
          ('Sarah Williams', 'sarah@example.com', '555-3456', '1982-03-10', 'Female', '101 Maple Dr', 'Diabetes'),
          ('Robert Brown', 'robert@example.com', '555-7890', '1995-12-05', 'Male', '202 Elm St', 'No allergies');
      `);
    }
    
    // Get patients for appointments
    const [patients] = await connection.query(`
      SELECT id FROM patients LIMIT 5;
    `);
    
    // Clear existing appointments for clean slate
    console.log('Clearing existing appointments...');
    await connection.query('DELETE FROM appointments');
    
    // Create appointments
    console.log('Creating sample appointments...');
    
    // Create some appointments for today
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < patients.length; i++) {
      const patientId = patients[i].id;
      const hour = 9 + i; // 9 AM, 10 AM, etc.
      const startTime = `${hour}:00`;
      const endTime = `${hour}:30`;
      const status = i === 0 ? 'completed' : i === 1 ? 'cancelled' : 'scheduled';
      
      await connection.query(`
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [
        patientId,
        doctorId,
        today,
        startTime,
        endTime,
        `Regular checkup ${i + 1}`,
        status
      ]);
      
      console.log(`Created appointment for patient ${patientId} at ${startTime}`);
    }
    
    // Create some appointments for future days
    for (let day = 1; day <= 5; day++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + day);
      const appointmentDate = futureDate.toISOString().split('T')[0];
      
      for (let i = 0; i < 2; i++) {
        const patientId = patients[i % patients.length].id;
        const hour = 10 + i; // 10 AM, 11 AM
        const startTime = `${hour}:00`;
        const endTime = `${hour}:30`;
        
        await connection.query(`
          INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `, [
          patientId,
          doctorId,
          appointmentDate,
          startTime,
          endTime,
          `Future checkup for day ${day}`,
          'scheduled'
        ]);
        
        console.log(`Created future appointment for patient ${patientId} on ${appointmentDate}`);
      }
    }
    
    // Count appointments to verify
    const [appointmentCount] = await connection.query('SELECT COUNT(*) as count FROM appointments');
    console.log(`Total appointments created: ${appointmentCount[0].count}`);
    
    console.log('Sample appointment data created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run(); 