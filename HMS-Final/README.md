# Hospital Management System (HMS)

## Overview
The Hospital Management System (HMS) is a comprehensive web application designed to efficiently manage hospital operations, patient records, appointments, and administrative tasks. The system streamlines healthcare workflows, reduces paperwork, and enhances the quality of patient care by providing a centralized platform for various stakeholders including doctors, patients, and administrative staff.

## Technologies Used

### Frontend
- **React.js**: A JavaScript library for building user interfaces
- **Material-UI**: React component library that implements Google's Material Design
- **React Router**: For navigation and routing within the application
- **Axios**: HTTP client for making API requests
- **date-fns**: Library for date manipulation and formatting

### Backend
- **Node.js**: JavaScript runtime environment for server-side code
- **Express.js**: Web application framework for Node.js
- **MySQL**: Relational database for storing application data
- **JWT (JSON Web Tokens)**: For secure authentication and authorization
- **Bcrypt**: For password hashing and security

### Development Tools
- **npm**: Package manager for JavaScript
- **ESLint**: Code linting tool to enforce code quality
- **Prettier**: Code formatter to maintain consistent code style

## System Architecture
The HMS follows a modern client-server architecture:
1. **Frontend**: Single Page Application (SPA) built with React
2. **API Layer**: RESTful API endpoints developed with Express.js
3. **Database Layer**: MySQL database for data persistence

## Key Features

### 1. User Management
- Multi-role authentication system (Admin, Doctor, Patient)
- Secure login/logout with JWT authentication
- Profile management for all users

### 2. Patient Management
- Comprehensive patient records
- Medical history tracking
- Contact information and demographics
- Blood group and allergy information

### 3. Doctor Management
- Doctor profiles with specialties
- Schedule management
- Doctor-patient assignments

### 4. Appointment System
- Appointment scheduling and management
- Multiple appointment status tracking (pending, confirmed, completed, cancelled)
- Conflict detection using advanced algorithms
- Appointment sorting and filtering

### 5. Emergency Ward Management
- Real-time triage system with priority queue
- Patient condition tracking (critical, severe, moderate, stable)
- Emergency bed management
- Quick patient admission process
- Doctor availability for emergency cases
- Vital signs monitoring
- Emergency statistics and reporting

### 6. Medical Records
- Electronic health records (EHR)
- Treatment plans
- Prescription management
- Patient notes and history

### 7. Administrative Functions
- Dashboard with key metrics
- User management
- System settings

### 8. Advanced Data Structures & Algorithms
- Priority Queue implementation for appointment prioritization
- Binary Search for efficient record lookup
- QuickSort algorithm for sorting large datasets
- Hash Maps for efficient data grouping and statistics

### 9. Object-Oriented Programming Concepts
- Class hierarchy with inheritance
- Encapsulation through getters and setters
- Polymorphism with method overriding
- Singleton pattern for services

## System Workflow

### Authentication Flow
1. User navigates to the login page
2. User enters credentials (email/password)
3. System validates credentials and generates JWT token
4. User is redirected to their role-specific dashboard
5. JWT token is used for all subsequent API requests
6. Token expiry is checked for each protected route

### Patient Registration Process
1. Admin/receptionist selects "Add New Patient"
2. System displays patient registration form
3. Staff enters patient details (personal info, medical history, etc.)
4. System validates input data
5. New patient record is created in the database
6. Patient receives account credentials (if applicable)

### Appointment Scheduling Flow
1. User (admin, doctor, or patient) navigates to appointment section
2. User selects "Create Appointment" option
3. System displays available time slots based on doctor schedules
4. User selects patient, doctor, date, time, and purpose
5. System checks for conflicts using sorting algorithms
6. Appointment is created and stored in the database
7. Notification is displayed to confirm creation
8. Appointments can be viewed, sorted, and filtered by various criteria

### Medical Record Management
1. Doctor logs in and accesses patient list
2. Doctor selects a patient to view their records
3. System retrieves and displays patient's medical history
4. Doctor can add new notes, prescriptions, or update records
5. Changes are saved to the database
6. Patient can view their medical records (read-only)

### Emergency Patient Workflow
1. Patient arrives at emergency department
2. Staff registers patient in emergency system with basic information
3. System assigns priority based on condition, age, and other factors
4. Patient appears in triage queue based on priority
5. Medical staff evaluates patient and updates condition as needed
6. Doctor decides whether to treat and discharge or admit to hospital
7. If admitted, system assigns bed and doctor from available resources
8. Patient's emergency record is linked to their main hospital record
9. Staff can monitor patient's condition and update status in real-time
10. Upon discharge, beds are automatically marked as available again

## Data Models

### User
- id, email, password, role, first_name, last_name, created_at, updated_at

### Patient
- id, user_id, date_of_birth, gender, address, phone_number, emergency_contact, blood_group, allergies, medical_conditions, created_at, updated_at

### Doctor
- id, user_id, specialty, license_number, education, experience, department, created_at, updated_at

### Appointment
- id, patient_id, doctor_id, appointment_date, reason/purpose, status, notes, created_at, updated_at

### Medical Record
- id, patient_id, doctor_id, diagnosis, treatment, prescription, notes, created_at, updated_at

### Emergency Patient
- patient_id, arrival_time, chief_complaint, vital_signs, condition, is_admitted, discharge_time

### Ward
- id, name, capacity, ward_type, floor_number

### Bed
- id, bed_number, ward_id, is_occupied, bed_type, current_patient_id

## Security Measures
1. Password hashing using Bcrypt
2. JWT-based authentication
3. Role-based access control
4. Input validation on both client and server
5. Protection against common web vulnerabilities (XSS, CSRF)
6. Secure HTTP headers

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (v6 or higher)

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd hospital-management-system

# Install dependencies
npm install

# Start the development server
npm start
```

### Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Run database migrations
node db/runMigrations.js

# Start the server
npm start
```

### Database Configuration
1. Create a MySQL database
2. Update `.env` file with database credentials
3. Run migrations to set up schema and tables
4. Optionally, run seed scripts to populate with sample data

## Deployment
The application can be deployed using various hosting services:
- Frontend: Vercel, Netlify, or AWS S3
- Backend: Heroku, DigitalOcean, AWS EC2, or Azure
- Database: AWS RDS, DigitalOcean Managed Databases, or self-hosted MySQL

## Project Structure
```
hospital-management-system/
├── public/                 # Static files
├── src/                    # Source code
│   ├── components/         # Reusable React components
│   │   ├── appointments/   # Appointment-related pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── patients/       # Patient-related pages
│   │   └── ...
│   ├── services/           # API services
│   ├── utils/              # Utility functions and data structures
│   ├── App.js              # Main app component
│   └── index.js            # Entry point
├── backend/                # Backend code
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── db/                 # Database scripts
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Seed data
│   ├── middleware/         # Express middleware
│   └── server.js           # Entry point
└── README.md               # Project documentation
```

