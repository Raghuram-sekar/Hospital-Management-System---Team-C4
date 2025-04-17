```mermaid
classDiagram
    class DoctorSchedulingService {
        -doctors: Map
        -specialtyDoctors: Map
        -doctorAppointments: Map
        -doctorAvailability: Map
        +constructor()
        +addDoctor(doctorData)
        +getDoctorsBySpecialty(specialty)
        +addAppointment(doctorId, appointment)
        +getAppointmentsForDoctor(doctorId, date)
        +setDoctorAvailability(doctorId, availabilityData)
        +findAvailableDoctors(specialty, date, startTime, endTime)
        +getDoctorWorkloadStats()
    }

    class Doctor {
        +id: String
        +name: String
        +specialties: Array
        +yearsExperience: Number
        +department: String
        +contactInfo: Object
    }

    class Appointment {
        +id: String
        +patientId: String
        +doctorId: String
        +date: Date
        +startTime: String
        +endTime: String
        +status: String
        +notes: String
    }

    class Availability {
        +doctorId: String
        +dayOfWeek: Number
        +startTime: String
        +endTime: String
        +isAvailable: Boolean
    }

    DoctorSchedulingService "1" --o "*" Doctor : manages
    DoctorSchedulingService "1" --o "*" Appointment : schedules
    DoctorSchedulingService "1" --o "*" Availability : tracks
```

# Doctor Scheduling Service UML Diagram

This UML diagram illustrates the implementation of **Hash Maps/Tables** in the Doctor Scheduling Service of the Hospital Management System.

## Components

### DoctorSchedulingService Class
Implements doctor scheduling using multiple hash maps for efficient lookups and operations.

### Doctor Class
Represents a doctor with their medical specialties and contact information.

### Appointment Class
Represents a scheduled appointment between a doctor and a patient.

### Availability Class
Represents a doctor's availability during a specific time slot.

## Relationships

- DoctorSchedulingService manages Doctors, Appointments, and Availability records.

## Hash Map Implementation Details

- Multiple hash maps provide O(1) time complexity for key-based lookups:
  - doctors: Maps doctorId to doctor data
  - specialtyDoctors: Maps specialty to set of doctorIds
  - doctorAppointments: Maps doctorId to map of days to appointments
  - doctorAvailability: Maps doctorId to availability schedule

- This structure enables efficient queries like:
  - Finding doctors by specialty
  - Checking a doctor's schedule for a specific day
  - Finding available doctors for a given time slot
