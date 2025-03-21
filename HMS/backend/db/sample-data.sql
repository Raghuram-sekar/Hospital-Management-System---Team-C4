-- Insert a doctor user (if not already exists)
INSERT INTO users (name, email, password, role) 
VALUES ('Dr. John Smith', 'doctor@example.com', '$2a$10$NYFZ/8WaQ3Qb5GgfXT.WAeXRfzoFzYpRQbLY4rhxGDTQPStZLK6AS', 'doctor')
ON DUPLICATE KEY UPDATE id=id;

-- Get doctor ID
SET @doctor_id = (SELECT id FROM users WHERE email = 'doctor@example.com');

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