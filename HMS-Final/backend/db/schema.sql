-- Add doctor_patient_assignments table
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  UNIQUE KEY unique_doctor_patient (doctor_id, patient_id)
);

-- Add patient_notes table
CREATE TABLE IF NOT EXISTS patient_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  content TEXT NOT NULL,
  created_by VARCHAR(255),
  doctor_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add patient_medical_records table
CREATE TABLE IF NOT EXISTS patient_medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(255),
  doctor_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add patient_medications table
CREATE TABLE IF NOT EXISTS patient_medications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by VARCHAR(255),
  doctor_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update appointments table with new fields
DROP TABLE IF EXISTS appointments;
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  license_number VARCHAR(50),
  years_of_experience INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add emergency_patients table
CREATE TABLE IF NOT EXISTS emergency_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  discharge_time DATETIME NULL,
  chief_complaint TEXT NOT NULL,
  vital_signs JSON NULL,
  patient_condition ENUM('critical', 'severe', 'moderate', 'stable') NOT NULL DEFAULT 'moderate',
  is_admitted BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Create doctor_availability table if not exists
CREATE TABLE IF NOT EXISTS doctor_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  available_from TIME NOT NULL,
  available_to TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  emergency_available BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add emergency doctor availability (now only needed if upgrading existing installations)
-- ALTER TABLE doctor_availability ADD COLUMN emergency_available BOOLEAN DEFAULT FALSE; 