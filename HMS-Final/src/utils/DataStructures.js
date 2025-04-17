/**
 * Data Structures and Algorithms Implementations
 * This file contains implementations of useful data structures and algorithms 
 * that can be used throughout the hospital management system.
 */

/**
 * PriorityQueue class - Used for managing appointments based on priority
 * Implements min-heap data structure for efficient priority-based operations
 */
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

  // Look at the highest priority element
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

  // Add an element to the queue with its priority
  add(item) {
    this.heap.push(item);
    this.heapifyUp();
    return this;
  }

  // Restore heap property upward
  heapifyUp() {
    let index = this.heap.length - 1;
    
    // While we have a parent and parent's priority is higher (worse) than current item
    while (this.hasParent(index) && 
           this.parent(index).priority > this.heap[index].priority) {
      const parentIndex = this.getParentIndex(index);
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  // Restore heap property downward
  heapifyDown() {
    let index = 0;
    
    while (this.hasLeftChild(index)) {
      let smallerChildIndex = this.getLeftChildIndex(index);
      
      // If right child exists and has higher priority (lower value)
      if (this.hasRightChild(index) && 
          this.rightChild(index).priority < this.leftChild(index).priority) {
        smallerChildIndex = this.getRightChildIndex(index);
      }
      
      // If current item has higher priority than children, heap property is restored
      if (this.heap[index].priority < this.heap[smallerChildIndex].priority) {
        break;
      } else {
        this.swap(index, smallerChildIndex);
      }
      
      index = smallerChildIndex;
    }
  }

  // Get all items in the queue
  getItems() {
    return [...this.heap];
  }

  // Get the size of the queue
  size() {
    return this.heap.length;
  }

  // Check if queue is empty
  isEmpty() {
    return this.heap.length === 0;
  }
}

/**
 * PatientRecord - Base class using OOP inheritance concept
 * This serves as the base class for different types of patient records
 */
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
  }

  // Abstract method to be implemented by child classes
  getRecordType() {
    throw new Error('Method getRecordType() must be implemented by subclasses');
  }
}

/**
 * MedicalRecord - Extends PatientRecord (Inheritance)
 */
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
    this.update();
  }

  getTreatment() {
    return this.treatment;
  }

  setTreatment(treatment) {
    this.treatment = treatment;
    this.update();
  }

  getNotes() {
    return this.notes;
  }

  setNotes(notes) {
    this.notes = notes;
    this.update();
  }

  getDoctorId() {
    return this.doctorId;
  }

  getRecordType() {
    return 'MEDICAL';
  }
}

/**
 * AppointmentRecord - Extends PatientRecord (Inheritance)
 */
class AppointmentRecord extends PatientRecord {
  constructor(patientId, doctorId, appointmentDate, reason, status = 'pending') {
    super(patientId);
    this.doctorId = doctorId;
    this.appointmentDate = appointmentDate;
    this.reason = reason;
    this.status = status;
  }

  getDoctorId() {
    return this.doctorId;
  }

  getAppointmentDate() {
    return this.appointmentDate;
  }

  setAppointmentDate(date) {
    this.appointmentDate = date;
    this.update();
  }

  getReason() {
    return this.reason;
  }

  setReason(reason) {
    this.reason = reason;
    this.update();
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    this.status = status;
    this.update();
  }

  isCompleted() {
    return this.status === 'completed';
  }

  isCancelled() {
    return this.status === 'cancelled';
  }

  getRecordType() {
    return 'APPOINTMENT';
  }
}

// Binary Search Algorithm for finding patients by ID (efficient searching)
const binarySearch = (sortedArray, targetId) => {
  let left = 0;
  let right = sortedArray.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (sortedArray[mid].id === targetId) {
      return mid; // Found the patient
    }
    
    if (sortedArray[mid].id < targetId) {
      left = mid + 1; // Search the right half
    } else {
      right = mid - 1; // Search the left half
    }
  }
  
  return -1; // Patient not found
};

// Quick Sort Algorithm for sorting patients by name (efficient sorting)
const quickSort = (arr, compareFunction) => {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  
  for (let i = 0; i < arr.length - 1; i++) {
    if (compareFunction(arr[i], pivot) < 0) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  
  return [...quickSort(left, compareFunction), pivot, ...quickSort(right, compareFunction)];
};

// Export all data structures and algorithms
export {
  PriorityQueue,
  PatientRecord,
  MedicalRecord,
  AppointmentRecord,
  binarySearch,
  quickSort
}; 