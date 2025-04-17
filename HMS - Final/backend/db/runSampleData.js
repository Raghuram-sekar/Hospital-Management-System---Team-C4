import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

console.log('Starting sample data import script');

// Load environment variables
dotenv.config();
console.log('Environment variables loaded', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

// ... rest of the file remains the same 