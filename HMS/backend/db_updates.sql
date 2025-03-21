USE hms_db;

-- Add more details to doctors table
ALTER TABLE doctors 
ADD COLUMN is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN specialization_details TEXT,
ADD COLUMN available_from TIME DEFAULT '09:00:00',
ADD COLUMN available_to TIME DEFAULT '17:00:00',
ADD COLUMN emergency_available BOOLEAN DEFAULT FALSE;

-- Create wards/departments table
CREATE TABLE IF NOT EXISTS wards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  ward_type ENUM('General', 'Emergency', 'ICU', 'Pediatric', 'Maternity', 'Surgery') NOT NULL,
  floor INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create hospital beds table
CREATE TABLE IF NOT EXISTS beds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bed_number VARCHAR(20) NOT NULL,
  ward_id INT NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  patient_id INT NULL,
  reserved_until DATETIME NULL,
  bed_type ENUM('Regular', 'ICU', 'Emergency', 'Recovery') NOT NULL DEFAULT 'Regular',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- Add medical history to patients
ALTER TABLE patients
ADD COLUMN emergency_contact VARCHAR(100),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN allergies TEXT,
ADD COLUMN current_medication TEXT,
ADD COLUMN assigned_bed_id INT NULL,
FOREIGN KEY (assigned_bed_id) REFERENCES beds(id) ON DELETE SET NULL;

-- Expand appointments table
ALTER TABLE appointments
ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE,
ADD COLUMN check_in_time DATETIME NULL,
ADD COLUMN check_out_time DATETIME NULL,
ADD COLUMN treatment_notes TEXT,
ADD COLUMN follow_up_date DATE NULL;

-- Insert sample wards
INSERT INTO wards (name, capacity, ward_type, floor) VALUES
('Emergency Ward', 15, 'Emergency', 1),
('General Ward A', 30, 'General', 2),
('General Ward B', 30, 'General', 2),
('ICU', 10, 'ICU', 1),
('Pediatric Ward', 20, 'Pediatric', 3),
('Maternity Ward', 15, 'Maternity', 3),
('Surgery Ward', 20, 'Surgery', 4);

-- Insert sample beds for Emergency Ward
INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type) VALUES
('ER-101', 1, FALSE, 'Emergency'),
('ER-102', 1, FALSE, 'Emergency'),
('ER-103', 1, FALSE, 'Emergency'),
('ER-104', 1, FALSE, 'Emergency'),
('ER-105', 1, FALSE, 'Emergency');

-- Insert sample beds for General Ward A
INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type) VALUES
('GA-101', 2, FALSE, 'Regular'),
('GA-102', 2, FALSE, 'Regular'),
('GA-103', 2, FALSE, 'Regular'),
('GA-104', 2, FALSE, 'Regular'),
('GA-105', 2, FALSE, 'Regular');

-- Insert sample beds for ICU
INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type) VALUES
('ICU-101', 4, FALSE, 'ICU'),
('ICU-102', 4, FALSE, 'ICU'),
('ICU-103', 4, FALSE, 'ICU');