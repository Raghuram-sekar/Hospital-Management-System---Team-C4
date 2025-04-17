```mermaid
classDiagram
    class PriorityQueue {
        -items: Array
        +constructor()
        +enqueue(element, priority)
        +dequeue()
        +isEmpty()
        +peek()
    }

    class EmergencyService {
        -patientQueue: PriorityQueue
        -triageLevels: Object
        +constructor()
        +triagePatient(patient)
        +getNextPatient()
        +getQueuePosition(patientId)
        +getAllPatients()
    }

    class EmergencyPatient {
        +id: String
        +name: String
        +age: Number
        +condition: String
        +chiefComplaint: String
        +arrivalTime: Date
        +vitalSigns: Object
    }

    PriorityQueue <-- EmergencyService : uses
    EmergencyPatient <-- EmergencyService : manages
```

# Emergency Priority Queue UML Diagram

This UML diagram illustrates the implementation of the **Priority Queue** data structure in the Emergency module of the Hospital Management System.

## Components

### PriorityQueue Class
A custom priority queue implementation that ensures patients with higher priority (more critical conditions) are treated first.

### EmergencyService Class
Manages emergency patients using the priority queue for proper triage based on severity, age, and other factors.

### EmergencyPatient Class
Represents a patient in the emergency department with relevant medical information.

## Relationships

- EmergencyService uses PriorityQueue to manage patients based on their severity.
- EmergencyService processes and manages EmergencyPatient objects.

## Implementation Details

- The priority queue sorts patients by condition severity (critical, severe, moderate, mild, stable).
- Age modifiers give higher priority to children and elderly patients.
- The implementation ensures O(n) time complexity for enqueue and O(1) for dequeue operations.
