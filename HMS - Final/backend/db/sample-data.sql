-- Insert a doctor user (if not already exists)
INSERT INTO users (name, email, password, role) 
VALUES ('Dr. John Smith', 'doctor@example.com', '$2a$10$NYFZ/8WaQ3Qb5GgfXT.WAeXRfzoFzYpRQbLY4rhxGDTQPStZLK6AS', 'doctor')
ON DUPLICATE KEY UPDATE id=id;

-- Get doctor ID
SET @doctor_id = (SELECT id FROM users WHERE email = 'doctor@example.com');

-- Add doctor to doctors table
INSERT INTO doctors (user_id, specialty, license_number, years_of_experience)
VALUES (@doctor_id, 'Emergency Medicine', 'MD12345', 10)
ON DUPLICATE KEY UPDATE id=id;

-- Add another doctor for emergency
INSERT INTO users (name, email, password, role)
VALUES ('Dr. Sarah Johnson', 'sarah@example.com', '$2a$10$NYFZ/8WaQ3Qb5GgfXT.WAeXRfzoFzYpRQbLY4rhxGDTQPStZLK6AS', 'doctor')
ON DUPLICATE KEY UPDATE id=id;

SET @doctor2_id = (SELECT id FROM users WHERE email = 'sarah@example.com');

INSERT INTO doctors (user_id, specialty, license_number, years_of_experience)
VALUES (@doctor2_id, 'Trauma Surgery', 'MD54321', 8)
ON DUPLICATE KEY UPDATE id=id;

-- Assign some existing patients to the doctor
INSERT IGNORE INTO doctor_patient_assignments (doctor_id, patient_id)
SELECT @doctor_id, id FROM patients LIMIT 10;

-- Insert some appointments for the doctor
INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status)
SELECT 
    p.id,
    @doctor_id,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY) as appointment_date,
    MAKETIME(9 + FLOOR(RAND() * 8), FLOOR(RAND() * 4) * 15, 0) as start_time,
    MAKETIME(9 + FLOOR(RAND() * 8) + 1, FLOOR(RAND() * 4) * 15, 0) as end_time,
    'Regular checkup',
    ELT(FLOOR(1 + RAND() * 3), 'scheduled', 'completed', 'cancelled')
FROM 
    patients p
JOIN 
    doctor_patient_assignments dpa ON p.id = dpa.patient_id
WHERE 
    dpa.doctor_id = @doctor_id
LIMIT 15;

-- Add some completed appointments in the past
INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, end_time, purpose, status)
SELECT 
    p.id,
    @doctor_id,
    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY) as appointment_date,
    MAKETIME(9 + FLOOR(RAND() * 8), FLOOR(RAND() * 4) * 15, 0) as start_time,
    MAKETIME(9 + FLOOR(RAND() * 8) + 1, FLOOR(RAND() * 4) * 15, 0) as end_time,
    'Regular checkup',
    'completed'
FROM 
    patients p
JOIN 
    doctor_patient_assignments dpa ON p.id = dpa.patient_id
WHERE 
    dpa.doctor_id = @doctor_id
LIMIT 10;

-- Insert patient notes
INSERT INTO patient_notes (patient_id, content, created_by, doctor_id)
SELECT 
    p.id,
    'Patient is showing good recovery from recent treatment.',
    'Dr. John Smith',
    @doctor_id
FROM 
    patients p
JOIN 
    doctor_patient_assignments dpa ON p.id = dpa.patient_id
WHERE 
    dpa.doctor_id = @doctor_id
LIMIT 8;

-- Insert patient medical records
INSERT INTO patient_medical_records (patient_id, title, description, created_by, doctor_id)
SELECT 
    p.id,
    'Initial Assessment',
    'Patient presented with symptoms of fatigue and headaches. Recommended rest and hydration.',
    'Dr. John Smith',
    @doctor_id
FROM 
    patients p
JOIN 
    doctor_patient_assignments dpa ON p.id = dpa.patient_id
WHERE 
    dpa.doctor_id = @doctor_id
LIMIT 5;

-- Insert patient medications
INSERT INTO patient_medications (patient_id, medication_name, dosage, frequency, start_date, end_date, prescribed_by, doctor_id)
SELECT 
    p.id,
    'Acetaminophen',
    '500mg',
    'Twice daily',
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 14 DAY),
    'Dr. John Smith',
    @doctor_id
FROM 
    patients p
JOIN 
    doctor_patient_assignments dpa ON p.id = dpa.patient_id
WHERE 
    dpa.doctor_id = @doctor_id
LIMIT 6;

-- Add sample emergency patients
INSERT INTO emergency_patients (patient_id, arrival_time, chief_complaint, vital_signs, patient_condition, is_admitted)
VALUES 
(1, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Severe chest pain and difficulty breathing', 
  '{"temperature": 38.5, "heart_rate": 120, "blood_pressure": "150/95", "respiratory_rate": 24, "oxygen_saturation": 91}', 
  'critical', false),
(2, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Traumatic injury from car accident', 
  '{"temperature": 37.2, "heart_rate": 110, "blood_pressure": "140/85", "respiratory_rate": 20, "oxygen_saturation": 94}', 
  'severe', false),
(3, DATE_SUB(NOW(), INTERVAL 4 HOUR), 'Severe abdominal pain and vomiting', 
  '{"temperature": 37.8, "heart_rate": 95, "blood_pressure": "130/85", "respiratory_rate": 18, "oxygen_saturation": 97}', 
  'moderate', false),
(4, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'High fever and seizure', 
  '{"temperature": 39.8, "heart_rate": 135, "blood_pressure": "110/70", "respiratory_rate": 28, "oxygen_saturation": 93}', 
  'critical', false),
(5, DATE_SUB(NOW(), INTERVAL 5 HOUR), 'Laceration on right arm', 
  '{"temperature": 36.9, "heart_rate": 85, "blood_pressure": "125/80", "respiratory_rate": 16, "oxygen_saturation": 98}', 
  'stable', false);

-- Add doctor availability records for emergency doctors
INSERT INTO doctor_availability (doctor_id, day_of_week, available_from, available_to, is_available, emergency_available)
VALUES
(@doctor_id, 1, '08:00:00', '18:00:00', true, true),
(@doctor_id, 2, '08:00:00', '18:00:00', true, true),
(@doctor_id, 3, '08:00:00', '18:00:00', true, true),
(@doctor_id, 4, '08:00:00', '18:00:00', true, true),
(@doctor_id, 5, '08:00:00', '18:00:00', true, true); 