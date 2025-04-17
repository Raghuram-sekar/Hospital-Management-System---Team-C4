-- Sample Users (patients)
INSERT INTO users (name, email, password, role) VALUES 
('Sarah Johnson', 'sarah@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient'),
('Michael Brown', 'michael@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient'),
('Jessica Davis', 'jessica@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient'),
('David Wilson', 'david@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient'),
('Emma Miller', 'emma@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient');

-- Sample Users (doctors)
INSERT INTO users (name, email, password, role) VALUES 
('Dr. Emily Johnson', 'emilydr@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor'),
('Dr. Robert Smith', 'robertdr@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor'),
('Dr. Jennifer Lee', 'jenniferdr@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor');

-- Get the IDs of the inserted users for reference
SELECT @patient1_id := id FROM users WHERE email = 'sarah@example.com';
SELECT @patient2_id := id FROM users WHERE email = 'michael@example.com';
SELECT @patient3_id := id FROM users WHERE email = 'jessica@example.com';
SELECT @patient4_id := id FROM users WHERE email = 'david@example.com';
SELECT @patient5_id := id FROM users WHERE email = 'emma@example.com';

SELECT @doctor1_id := id FROM users WHERE email = 'emilydr@example.com';
SELECT @doctor2_id := id FROM users WHERE email = 'robertdr@example.com';
SELECT @doctor3_id := id FROM users WHERE email = 'jenniferdr@example.com';

-- Insert doctor profiles
INSERT INTO doctors (user_id, specialty, experience, consultation_fee) VALUES 
(@doctor1_id, 'Neurologist', 8, 1800.00),
(@doctor2_id, 'Pediatrician', 12, 1200.00),
(@doctor3_id, 'Dermatologist', 6, 1500.00);

-- Get the doctor profile IDs
SELECT @doctor1_profile_id := id FROM doctors WHERE user_id = @doctor1_id;
SELECT @doctor2_profile_id := id FROM doctors WHERE user_id = @doctor2_id;
SELECT @doctor3_profile_id := id FROM doctors WHERE user_id = @doctor3_id;

-- Insert patient profiles
INSERT INTO patients (user_id, date_of_birth, blood_group, medical_history) VALUES 
(@patient1_id, '1985-03-12', 'A+', 'Allergic to penicillin. History of asthma.'),
(@patient2_id, '1978-07-22', 'O-', 'High blood pressure. Takes daily medication.'),
(@patient3_id, '1992-11-05', 'B+', 'No major medical issues. Occasional migraines.'),
(@patient4_id, '1965-01-18', 'AB+', 'Type 2 diabetes. Heart bypass surgery in 2015.'),
(@patient5_id, '2000-09-30', 'A-', 'Eczema and seasonal allergies.');

-- Get the patient profile IDs
SELECT @patient1_profile_id := id FROM patients WHERE user_id = @patient1_id;
SELECT @patient2_profile_id := id FROM patients WHERE user_id = @patient2_id;
SELECT @patient3_profile_id := id FROM patients WHERE user_id = @patient3_id;
SELECT @patient4_profile_id := id FROM patients WHERE user_id = @patient4_id;
SELECT @patient5_profile_id := id FROM patients WHERE user_id = @patient5_id;

-- Insert sample appointments
INSERT INTO appointments (doctor_id, patient_id, appointment_date, reason, status, notes) VALUES
(@doctor1_profile_id, @patient1_profile_id, NOW() + INTERVAL 2 DAY, 'Recurring headaches and dizziness', 'confirmed', 'Patient reports headaches increasing in frequency. Schedule MRI.'),
(@doctor2_profile_id, @patient3_profile_id, NOW() + INTERVAL 3 DAY, 'Annual check-up', 'pending', NULL),
(@doctor3_profile_id, @patient2_profile_id, NOW() + INTERVAL 1 DAY, 'Skin rash on arms and neck', 'confirmed', 'Possible allergic reaction or eczema flare-up.'),
(@doctor1_profile_id, @patient4_profile_id, NOW() + INTERVAL 5 DAY, 'Follow-up after medication change', 'pending', NULL),
(@doctor2_profile_id, @patient5_profile_id, NOW() + INTERVAL 7 DAY, 'Fever and sore throat', 'pending', NULL),
(@doctor3_profile_id, @patient1_profile_id, NOW() - INTERVAL 10 DAY, 'Acne treatment consultation', 'completed', 'Prescribed topical treatment and antibiotics for severe acne.'),
(@doctor1_profile_id, @patient3_profile_id, NOW() - INTERVAL 5 DAY, 'Migraine assessment', 'completed', 'Recommended lifestyle changes and prescribed preventative medication.'),
(@doctor2_profile_id, @patient2_profile_id, NOW() - INTERVAL 2 DAY, 'Flu symptoms', 'cancelled', 'Patient cancelled due to feeling better.'),
(@doctor3_profile_id, @patient5_profile_id, NOW() - INTERVAL 15 DAY, 'Eczema flare-up', 'completed', 'Prescribed stronger steroid cream and recommended moisturizing regimen.');

-- Display the results to confirm insertion
SELECT 'Added sample patients, doctors, and appointments successfully!' AS Result;