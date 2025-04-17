USE hms_db;

-- Create wards/departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS wards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  ward_type ENUM('General', 'Emergency', 'ICU', 'Pediatric', 'Maternity', 'Surgery') NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create hospital beds table if it doesn't exist
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

-- Add assigned_bed_id to patients table if not already exists
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS assigned_bed_id INT NULL,
ADD CONSTRAINT fk_patient_bed FOREIGN KEY (assigned_bed_id) REFERENCES beds(id) ON DELETE SET NULL;

-- Insert sample wards if they don't exist
INSERT IGNORE INTO wards (name, capacity, ward_type, floor) VALUES
('Emergency Ward', 15, 'Emergency', 1),
('General Ward A', 30, 'General', 2),
('General Ward B', 30, 'General', 2),
('ICU', 10, 'ICU', 1),
('Pediatric Ward', 20, 'Pediatric', 3),
('Maternity Ward', 15, 'Maternity', 3),
('Surgery Ward', 20, 'Surgery', 4);

-- Insert sample beds for Emergency Ward
INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'ER-101', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' LIMIT 1;

INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'ER-102', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' LIMIT 1;

INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'ER-103', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' LIMIT 1;

-- Insert sample beds for General Ward A
INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'GA-101', id, FALSE, 'Regular' FROM wards WHERE name = 'General Ward A' LIMIT 1;

INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'GA-102', id, FALSE, 'Regular' FROM wards WHERE name = 'General Ward A' LIMIT 1;

INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'GA-103', id, FALSE, 'Regular' FROM wards WHERE name = 'General Ward A' LIMIT 1;

-- Insert sample beds for ICU
INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'ICU-101', id, FALSE, 'ICU' FROM wards WHERE name = 'ICU' LIMIT 1;

INSERT IGNORE INTO beds (bed_number, ward_id, is_occupied, bed_type) 
SELECT 'ICU-102', id, FALSE, 'ICU' FROM wards WHERE name = 'ICU' LIMIT 1; 