# Hospital-Management-System---Team-C4

This is Team 4 from Batch AIE C
We have presented our Hospital Management System Project for DSA and OOPS project.

# Hospital Management System (HMS)

## Overview

The Hospital Management System (HMS) is a Flask-based web application that provides a centralized platform for managing patients, doctors, appointments, and nurses. It uses SQLite for data persistence and features dynamic, real-time views via streaming responses.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Database Models](#database-models)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Patient Management**: Create, read, update, and delete patient records, including demographics and medical history.
- **Doctor Management**: CRUD operations for doctors, including specialty and contact details.
- **Appointment Scheduling**: Book, view, update, and cancel appointments with priority sorting.
- **Emergency Search Visualization**: Animated pathfinding search for doctors in a generated hospital layout.
- **Random Data Generation**: Quickly populate the database with random patients and doctors.
- **Nurse Management**: Display and manage nurse assignments.
- **Streaming Frontend**: Real-time rendering using Flask's `stream_with_context`.

## Prerequisites

- Python 3.7 or higher
- `virtualenv` package
- Git (to clone/download repository)

## Installation

1. **Clone the repository or download the ZIP**:

   ```bash
   https://github.com/Raghuram-sekar/Hospital-Management-System---Team-C4.git
   cd hms
   ```

   Or download the `zip` from GitHub, extract it, and `cd` into the project folder.

2. **Create a virtual environment**:

   ```bash
   virtualenv env
   ```

3. **Activate the virtual environment**:

   - **Windows (PowerShell)**:
     ```powershell
     .\env\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\env\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     source env/bin/activate
     ```

4. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Ensure your virtual environment is activated (see [Environment Setup](#environment-setup)).
2. Run the main application script:
   ```bash
   python App.py
   ```
3. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```
4. Explore the dashboard to manage patients, doctors, appointments, nurses, or use the randomized data generators.

## Project Structure

```
├── App.py             # Main Flask application
├── templates/         # HTML templates for each view
│   ├── index.html
│   ├── PatientEntry.html
│   ├── PatientShow.html
│   ├── PatientUpdate.html
│   ├── DoctorEntry.html
│   ├── DoctorShow.html
│   ├── DoctorUpdate.html
│   ├── AppointmentEntry.html
│   ├── AppointmentShow.html
│   ├── AppointmentUpdate.html
│   ├── ShowNurses.html
│   └── DoctorSearcher.html
├── patient.db         # SQLite DB for patients (auto-created)
├── doctor.db          # SQLite DB for doctors (auto-created)
├── appointment.db     # SQLite DB for appointments (auto-created)
├── nurse.db           # SQLite DB for nurses (auto-created)
├── requirements.txt   # Python dependencies
└── README.md          # Project documentation
```

## Usage

- **Home Dashboard**: Lists all patients, doctors, and appointments with sorted views.
- **Patient CRUD**: Navigate to Add/Show/Update/Delete through respective routes.
- **Doctor CRUD**: Use the Doctor sections for managing doctor profiles.
- **Appointment Management**: Schedule new appointments, update details, and delete by priority.
- **Emergency Pathfinding**: Use the "Doctor Searcher" to visualize search animation in a generated hospital layout.
- **Random Generators**: Quickly add multiple patients or doctors via RandomPatient and RandomDoctor.

## Database Models

| Model           | Description                         | Fields (Key)                               |
| --------------- | ----------------------------------- | ------------------------------------------ |
| **Patient**     | Stores patient demographics/history | `id`, `firstname`, `lastname`, `dob`, ...  |
| **Doctor**      | Doctor profiles & availability      | `id`, `firstname`, `lastname`, `spec`, ... |
| **Appointment** | Booking records with priority       | `AppId`, `DocId`, `PatId`, `priority`, ... |
| **Nurse**       | Nurse assignments                   | `id`, `name`, `did`, `status`              |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: \`git commit -m "Add new feature"
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request.
