# Hospital Management System - Actual OOP & DSA Implementation

This document provides an accurate overview of the Object-Oriented Programming (OOP) concepts and Data Structures & Algorithms (DSA) that are **actually implemented** in the current Hospital Management System (HMS) codebase.

## Object-Oriented Programming (OOP) Concepts

### 1. Class and Encapsulation

**Description:**  
Encapsulation bundles data (properties) and methods that operate on that data within a single unit (class), hiding the internal state and requiring all interaction to occur through well-defined interfaces.

**Actual Implementation:**  
The `PatientRecord` class in DataStructures.js encapsulates patient record data and operations.

**Code Example:**
```javascript
// src/utils/DataStructures.js
class PatientRecord {
  constructor(patientId, timestamp) {
    this.patientId = patientId;
    this.timestamp = timestamp || new Date();
    this.lastUpdated = this.timestamp;
  }

  getPatientId() {
    return this.patientId;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  update() {
    this.lastUpdated = new Date();
    return this;
  }

  // Abstract method to be implemented by child classes
  getRecordType() {
    throw new Error('getRecordType method must be implemented by child classes');
  }
}
```

**HMS Relevance:**  
This implementation ensures that patient record data and operations are centralized, providing a clean API for other parts of the application. The encapsulation prevents direct manipulation of record data, enforcing data integrity.

### 2. Inheritance

**Description:**  
Inheritance allows a class to inherit properties and methods from another class, establishing a parent-child relationship.

**Actual Implementation:**  
The `MedicalRecord` and `AppointmentRecord` classes inherit from the `PatientRecord` base class.

**Code Example:**
```javascript
// src/utils/DataStructures.js
class MedicalRecord extends PatientRecord {
  constructor(patientId, diagnosis, treatment, notes, doctorId) {
    super(patientId);
    this.diagnosis = diagnosis;
    this.treatment = treatment;
    this.notes = notes;
    this.doctorId = doctorId;
  }

  getDiagnosis() {
    return this.diagnosis;
  }

  setDiagnosis(diagnosis) {
    this.diagnosis = diagnosis;
    return this.update();
  }

  getTreatment() {
    return this.treatment;
  }

  setTreatment(treatment) {
    this.treatment = treatment;
    return this.update();
  }

  getNotes() {
    return this.notes;
  }

  setNotes(notes) {
    this.notes = notes;
    return this.update();
  }

  getDoctorId() {
    return this.doctorId;
  }

  getRecordType() {
    return 'MEDICAL';
  }
}

class AppointmentRecord extends PatientRecord {
  constructor(patientId, doctorId, appointmentDate, reason, status = 'pending') {
    super(patientId);
    this.doctorId = doctorId;
    this.appointmentDate = appointmentDate;
    this.reason = reason;
    this.status = status;
  }

  // Implementation of methods...

  getRecordType() {
    return 'APPOINTMENT';
  }
}
```

**HMS Relevance:**  
This inheritance pattern promotes code reuse by sharing common functionality from the `PatientRecord` base class while allowing specialized behavior in derived classes. Each record type defines its own specialized properties and methods while inheriting common functionality.

### 3. Component Composition in React

**Description:**  
Component composition is a pattern in React where complex UIs are built by combining simpler, reusable components.

**Actual Implementation:**  
The `EmergencyDashboard` component uses composition by incorporating other components and custom hooks.

**Code Example:**
```jsx
// src/pages/emergency/EmergencyDashboard.jsx (simplified)
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Button, Chip, 
  CircularProgress, Card, CardContent, Avatar
} from '@mui/material';
import DashboardLayout from '../../components/DashboardLayout';

const EmergencyDashboard = () => {
  // Component state
  const [loading, setLoading] = useState(true);
  const [emergencyPatients, setEmergencyPatients] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  
  // Methods and event handlers
  
  return (
    <DashboardLayout title="Emergency Department">
      {/* UI composition using Material-UI components */}
      <Box sx={{ padding: 2 }}>
        <Typography variant="h4">Emergency Department Dashboard</Typography>
        
        <Grid container spacing={3}>
          {/* Statistics cards */}
          <Grid item xs={12} md={6} lg={3}>
            <StatCard 
              title="Total Patients" 
              value={emergencyPatients.length} 
              icon={<PersonIcon />} 
            />
          </Grid>
          {/* More grid items... */}
        </Grid>
        
        {/* Patient list */}
        <PatientList patients={emergencyPatients} />
      </Box>
    </DashboardLayout>
  );
};

// Helper component used in composition
const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ /* styles */ }}>
    <CardContent>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h3">{value}</Typography>
      <Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar>
    </CardContent>
  </Card>
);
```

**HMS Relevance:**  
Component composition keeps the UI code modular and reusable across the application. It creates a clean separation of concerns and makes testing and maintenance easier.

## Data Structures & Algorithms (DSA)

### 1. Priority Queue for Emergency Triage

**Description:**  
A Priority Queue is an abstract data type similar to a regular queue, but where each element has a "priority" associated with it. Elements with higher priorities are served before elements with lower priorities.

**Actual Implementation:**  
The Priority Queue is implemented in two places:

#### 1.1 Emergency Dashboard Implementation
```javascript
// src/pages/emergency/EmergencyDashboard.jsx
class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.comparator = comparator;
    this.heap = [];
    this.items = []; // Separate array for rendering
  }

  add(item) {
    this.heap.push(item);
    this.items.push(item);
    this.heap.sort(this.comparator);
  }

  // Helper method to check if queue has items
  isEmpty() {
    return this.items.length === 0;
  }
}
```

#### 1.2 Utility Implementation with Heap Operations
```javascript
// src/utils/DataStructures.js
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Helper methods for navigating the heap
  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  // Check if parent exists
  hasParent(index) {
    return this.getParentIndex(index) >= 0;
  }

  // Check if left child exists
  hasLeftChild(index) {
    return this.getLeftChildIndex(index) < this.heap.length;
  }

  // Check if right child exists
  hasRightChild(index) {
    return this.getRightChildIndex(index) < this.heap.length;
  }

  // Get parent value
  parent(index) {
    return this.heap[this.getParentIndex(index)];
  }

  // Get left child value
  leftChild(index) {
    return this.heap[this.getLeftChildIndex(index)];
  }

  // Get right child value
  rightChild(index) {
    return this.heap[this.getRightChildIndex(index)];
  }

  // Swap two elements in the heap
  swap(indexOne, indexTwo) {
    const temp = this.heap[indexOne];
    this.heap[indexOne] = this.heap[indexTwo];
    this.heap[indexTwo] = temp;
  }

  // Get the highest priority element
  peek() {
    if (this.heap.length === 0) {
      return null;
    }
    return this.heap[0];
  }

  // Remove and return the highest priority element
  poll() {
    if (this.heap.length === 0) {
      return null;
    }
    
    const item = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.heapifyDown();
    return item;
  }

  // Add an element to the queue with a priority
  add(item, priority) {
    this.heap.push({ item, priority });
    this.heapifyUp();
    return this;
  }

  // Restore heap property upward from bottom
  heapifyUp() {
    let index = this.heap.length - 1;
    
    while (this.hasParent(index) && this.parent(index).priority > this.heap[index].priority) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  // Restore heap property downward from top
  heapifyDown() {
    let index = 0;
    
    while (this.hasLeftChild(index)) {
      let smallerChildIndex = this.getLeftChildIndex(index);
      
      if (this.hasRightChild(index) && this.rightChild(index).priority < this.leftChild(index).priority) {
        smallerChildIndex = this.getRightChildIndex(index);
      }
      
      if (this.heap[index].priority < this.heap[smallerChildIndex].priority) {
        break;
      } else {
        this.swap(index, smallerChildIndex);
      }
      
      index = smallerChildIndex;
    }
  }
  
  // Check if queue is empty
  isEmpty() {
    return this.heap.length === 0;
  }
}
```

**HMS Relevance:**  
The Priority Queue is used in the emergency department to manage patients based on their condition severity. The EmergencyDashboard implementation offers a simplified version for direct UI integration, while the utility implementation provides more efficient heap operations for deeper algorithmic needs.

### 2. Searching and Sorting Algorithms

**Description:**  
Efficient search and sort algorithms are essential for managing and retrieving patient data quickly.

**Actual Implementation:**  

#### 2.1 Binary Search
```javascript
// src/utils/DataStructures.js
function binarySearch(sortedArray, targetId) {
  let left = 0;
  let right = sortedArray.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const currentId = sortedArray[mid].patientId || sortedArray[mid].id;
    
    // Found the target
    if (currentId === targetId) {
      return mid;
    }
    
    // Continue searching in the right half
    if (currentId < targetId) {
      left = mid + 1;
    } 
    // Continue searching in the left half
    else {
      right = mid - 1;
    }
  }
  
  // Target not found
  return -1;
}
```

#### 2.2 Quick Sort
```javascript
// src/utils/DataStructures.js
function quickSort(arr, compareFunction = (a, b) => a - b) {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const equal = [];
  const right = [];
  
  for (const element of arr) {
    const comparisonResult = compareFunction(element, pivot);
    
    if (comparisonResult < 0) {
      left.push(element);
    } else if (comparisonResult === 0) {
      equal.push(element);
    } else {
      right.push(element);
    }
  }
  
  return [...quickSort(left, compareFunction), ...equal, ...quickSort(right, compareFunction)];
}
```

**HMS Relevance:**  
These algorithms are crucial for efficient data operations in the HMS:
- Binary Search enables O(log n) patient lookup by ID in sorted arrays
- QuickSort provides efficient O(n log n) sorting capabilities for patient lists, appointment schedules, and other data

## Planned But Not Yet Implemented Features

The following OOP and DSA concepts are described in the design documents but are not yet implemented in the current codebase:

1. **Bed Management System using Graph Theory** - Planned to optimize bed assignments based on proximity to nursing stations using graph algorithms

2. **Patient Record BST (Binary Search Tree)** - Planned for efficient patient record management using a binary search tree data structure

3. **Doctor Scheduling Service with Hash Maps** - Planned for efficient doctor scheduling operations using hash tables

4. **Full Emergency Service with Triage System** - A comprehensive implementation of emergency triage beyond the current simplified version

5. **Emergency Analytics Service** - Planned for analyzing emergency department data and generating insights

## Conclusion

While the existing HMS implementation demonstrates several OOP and DSA concepts, many advanced features described in the design documents are still in the planning phase. The current implementation focuses on:

- **OOP**: Basic class hierarchy for patient records and React component composition
- **DSA**: Priority Queue implementation and basic searching/sorting algorithms

Future development will incorporate more advanced data structures like graphs and binary search trees, as well as more complex OOP patterns and algorithms.
