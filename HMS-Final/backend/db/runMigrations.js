import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function runMigrations() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hms_db'}`);
    console.log(`Database ${process.env.DB_NAME || 'hms_db'} created or already exists`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'hms_db'}`);
    
    // Read and execute schema.sql
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schemaSQL);
    console.log('Schema created successfully');
    
    // Read and execute sample-data.sql if it exists
    try {
      const sampleDataSQL = fs.readFileSync(path.join(__dirname, 'sample-data.sql'), 'utf8');
      await connection.query(sampleDataSQL);
      console.log('Sample data inserted successfully');
    } catch (error) {
      console.log('No sample data file found or error inserting sample data');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runMigrations().catch(console.error); 