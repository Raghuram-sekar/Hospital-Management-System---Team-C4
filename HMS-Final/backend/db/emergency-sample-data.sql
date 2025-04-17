-- Emergency Sample Data

-- Insert sample emergency patients 
INSERT INTO emergency_patients (patient_id, arrival_time, chief_complaint, vital_signs, condition, is_admitted)
VALUES 
  (2, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Severe abdominal pain with vomiting', 
   '{"temperature": 38.2, "heart_rate": 105, "blood_pressure": "135/85", "respiratory_rate": 18, "oxygen_saturation": 98}',
   'severe', false),
   
  (3, DATE_SUB(NOW(), INTERVAL 45 MINUTE), 'Traumatic head injury from car accident', 
   '{"temperature": 36.8, "heart_rate": 120, "blood_pressure": "160/95", "respiratory_rate": 24, "oxygen_saturation": 92}',
   'critical', true),
   
  (4, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'Allergic reaction with facial swelling', 
   '{"temperature": 37.0, "heart_rate": 100, "blood_pressure": "125/80", "respiratory_rate": 20, "oxygen_saturation": 96}',
   'moderate', false),
   
  (5, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'Chest pain and difficulty breathing', 
   '{"temperature": 37.5, "heart_rate": 115, "blood_pressure": "150/90", "respiratory_rate": 22, "oxygen_saturation": 91}',
   'critical', false),
   
  (6, DATE_SUB(NOW(), INTERVAL 3 HOUR), 'Fainting episode with brief loss of consciousness', 
   '{"temperature": 36.5, "heart_rate": 88, "blood_pressure": "110/70", "respiratory_rate": 16, "oxygen_saturation": 98}',
   'stable', false);

-- Mark one patient as admitted to a bed
UPDATE beds SET is_occupied = TRUE, current_patient_id = 3 WHERE bed_number = 'ER-101';

-- Create admission record for the admitted patient
INSERT INTO admissions (patient_id, bed_id, admission_date, admission_reason, admitted_by)
SELECT 3, id, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'Emergency admission for traumatic head injury', 1 
FROM beds WHERE bed_number = 'ER-101';

-- Ensure doctors are available for emergency
INSERT INTO doctor_availability (doctor_id, day_of_week, available_from, available_to, is_available, emergency_available)
VALUES 
  (1, 'Monday', '08:00:00', '17:00:00', true, true),
  (2, 'Monday', '08:00:00', '17:00:00', true, true),
  (3, 'Monday', '09:00:00', '18:00:00', true, true),
  (1, 'Tuesday', '08:00:00', '17:00:00', true, true),
  (2, 'Tuesday', '08:00:00', '17:00:00', true, true),
  (3, 'Tuesday', '09:00:00', '18:00:00', true, true),
  (1, 'Wednesday', '08:00:00', '17:00:00', true, true),
  (2, 'Wednesday', '08:00:00', '17:00:00', true, true),
  (3, 'Wednesday', '09:00:00', '18:00:00', true, true),
  (1, 'Thursday', '08:00:00', '17:00:00', true, true),
  (2, 'Thursday', '08:00:00', '17:00:00', true, true),
  (3, 'Thursday', '09:00:00', '18:00:00', true, true),
  (1, 'Friday', '08:00:00', '17:00:00', true, true),
  (2, 'Friday', '08:00:00', '17:00:00', true, true),
  (3, 'Friday', '09:00:00', '18:00:00', true, true)
ON DUPLICATE KEY UPDATE emergency_available = true;

-- Add more beds to emergency ward
INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-106', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-106');

INSERT INTO beds (bed_number, ward_id, is_occupied, bed_type)
SELECT 'ER-107', id, FALSE, 'Emergency' FROM wards WHERE name = 'Emergency Ward' AND NOT EXISTS (SELECT 1 FROM beds WHERE bed_number = 'ER-107');

-- Update patients table to mark emergency patients
UPDATE patients SET is_emergency = TRUE WHERE id IN (2, 3, 4, 5, 6); 