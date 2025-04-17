import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Create MySQL connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 as test');
    res.json({ message: 'Database connection successful', data: result });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Import routes
import authRouter from './routes/auth.js';
import doctorsRouter from './routes/doctors.js';
import patientsRouter from './routes/patients.js';
import appointmentsRoutes from './routes/appointments.js';
import bedsRouter from './routes/beds.js';
import wardsRouter from './routes/wards.js';
import availabilityRouter from './routes/availability.js';
import emergencyRouter from './routes/emergency.js';

// Routes
app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/beds', bedsRouter);
app.use('/api/wards', wardsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/emergency', emergencyRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 