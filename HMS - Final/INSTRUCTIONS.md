# Hospital Management System - Setup and Run Instructions

This is a Hospital Management System with both frontend and backend components. The system allows for doctor, patient, and appointment management with authentication.

## Prerequisites

- Node.js and npm installed
- MySQL installed and running
- Git (optional)

## Database Setup

1. Start your MySQL server
2. Create a new database named `hms_db` or use the provided SQL script

```sql
CREATE DATABASE IF NOT EXISTS hms_db;
```

3. Set up the database tables using the provided SQL script:

```
cd backend
mysql -u root -p < database.sql
```

Or open MySQL Workbench / MySQL Command Line and run the contents of `backend/database.sql`.

## Backend Setup

1. Navigate to the backend directory:

```
cd backend
```

2. Install dependencies:

```
npm install
```

3. Configure environment variables (if needed):
   - Check the `.env` file
   - Update database credentials if your MySQL setup differs

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hms_db
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

4. Start the backend server:

```
npm run dev
```

The backend will run on http://localhost:5000

## Frontend Setup

1. Navigate to the root directory:

```
cd ..
```

2. Install dependencies:

```
npm install
```

3. Start the frontend development server:

```
npm run dev
```

The frontend will run on http://localhost:5173 or another port specified in the console.

## Login Credentials

The database is seeded with these sample users:

1. Admin:
   - Email: admin@hms.com
   - Password: admin123

2. Doctor:
   - Email: doctor@hms.com
   - Password: doctor123

3. Patient:
   - Email: patient@hms.com  
   - Password: patient123

## Features

- User authentication (login/signup)
- Role-based access control (Admin, Doctor, Patient)
- Doctor management
- Patient management
- Appointment scheduling and management

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Doctors
- GET /api/doctors - Get all doctors
- GET /api/doctors/:id - Get doctor by ID
- POST /api/doctors - Create doctor profile
- PUT /api/doctors/:id - Update doctor profile
- DELETE /api/doctors/:id - Delete doctor profile

### Patients
- GET /api/patients - Get all patients
- GET /api/patients/:id - Get patient by ID
- POST /api/patients - Create patient profile
- PUT /api/patients/:id - Update patient profile
- DELETE /api/patients/:id - Delete patient profile

### Appointments
- GET /api/appointments - Get appointments (filtered by user role)
- GET /api/appointments/:id - Get appointment by ID
- POST /api/appointments - Create appointment
- PUT /api/appointments/:id - Update appointment
- DELETE /api/appointments/:id - Delete appointment (admin only) 