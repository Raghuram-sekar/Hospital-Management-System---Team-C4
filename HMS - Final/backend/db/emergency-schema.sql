-- Emergency Ward Schema

-- Add emergency_available column to doctor_availability if not exists
ALTER TABLE doctor_availability 
ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT FALSE;

-- Create emergency_patients table
CREATE TABLE IF NOT EXISTS emergency_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  arrival_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT NOT NULL,
  vital_signs JSON NULL,
  condition ENUM('critical', 'severe', 'moderate', 'stable') NOT NULL DEFAULT 'moderate',
  is_admitted BOOLEAN DEFAULT FALSE,
  discharge_time DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Update patients table to add emergency flag if not exists
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE;

-- Create wards table if not exists
CREATE TABLE IF NOT EXISTS wards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  ward_type ENUM('General', 'Emergency', 'ICU', 'Pediatric', 'Maternity', 'Surgery') NOT NULL,
  floor_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create beds table if not exists
CREATE TABLE IF NOT EXISTS beds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bed_number VARCHAR(20) NOT NULL,
  ward_id INT NOT NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  bed_type ENUM('Regular', 'ICU', 'Emergency', 'Recovery') NOT NULL DEFAULT 'Regular',
  current_patient_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ward_id) REFERENCES wards(id),
  FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- Create admissions table
CREATE TABLE IF NOT EXISTS admissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  bed_id INT NOT NULL,
  admission_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discharge_date DATETIME NULL,
  admission_reason TEXT NOT NULL,
  discharge_notes TEXT NULL,
  admitted_by INT NOT NULL,
  discharged_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (bed_id) REFERENCES beds(id),
  FOREIGN KEY (admitted_by) REFERENCES users(id),
  FOREIGN KEY (discharged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default emergency ward if it doesn't exist
INSERT INTO wards (name, capacity, ward_type, floor_number)
SELECT 'Emergency Ward', 15, 'Emergency', 1
WHERE NOT EXISTS (SELECT 1 FROM wards WHERE ward_type = 'Emergency');

-- Insert sample emergency beds
INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-101', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-101');

INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-102', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-102');

INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-103', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-103');

INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-104', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-104');

INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-105', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-105');

-- Sample emergency patients (for testing)
INSERT INTO emergency_patients (patient_id, arrival_time, chief_complaint, vital_signs, condition)
SELECT 
  1, 
  DATE_SUB(NOW(), INTERVAL 2 HOUR), 
  'Chest pain with shortness of breath', 
  '{"temperature": 37.8, "heart_rate": 110, "blood_pressure": "140/90", "respiratory_rate": 22, "oxygen_saturation": 94}',
  'severe'
WHERE EXISTS (SELECT 1 FROM patients WHERE id = 1) AND NOT EXISTS (SELECT 1 FROM emergency_patients WHERE patient_id = 1 AND discharge_time IS NULL);

-- Update doctor_availability to enable emergency for some doctors
UPDATE doctor_availability 
SET emergency_available = TRUE 
WHERE doctor_id IN (SELECT id FROM doctors LIMIT 3);

-- Create index for emergency queries
CREATE INDEX IF NOT EXISTS idx_emergency_condition ON emergency_patients (condition, arrival_time);
CREATE INDEX IF NOT EXISTS idx_emergency_discharge ON emergency_patients (discharge_time);
CREATE INDEX IF NOT EXISTS idx_bed_availability ON beds (is_occupied, bed_type); 