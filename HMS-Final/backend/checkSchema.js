import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hms_db'
    });
    
    console.log('Connected to database');
    
    const [columns] = await connection.query('DESCRIBE appointments');
    console.log('Appointments table structure:');
    console.log(columns);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

run(); 