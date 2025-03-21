USE hms_db;

-- Add availability fields to doctors table if they don't exist
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available_from TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS available_to TIME DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_appointments_per_day INT DEFAULT 10;

-- Create doctor schedules table to track weekly availability
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create doctor unavailability table for tracking leave, vacations, etc.
CREATE TABLE IF NOT EXISTS doctor_unavailability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Sample data for doctor schedules (for the sample doctor)
INSERT IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT 1, 'Monday', '09:00:00', '17:00:00' FROM doctors WHERE id = 1;

INSERT IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT 1, 'Tuesday', '09:00:00', '17:00:00' FROM doctors WHERE id = 1;

INSERT IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT 1, 'Wednesday', '09:00:00', '17:00:00' FROM doctors WHERE id = 1;

INSERT IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT 1, 'Thursday', '09:00:00', '17:00:00' FROM doctors WHERE id = 1;

INSERT IGNORE INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
SELECT 1, 'Friday', '09:00:00', '13:00:00' FROM doctors WHERE id = 1; 