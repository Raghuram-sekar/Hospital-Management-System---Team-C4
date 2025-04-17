// Using named export instead of default export
export function EmergencyTest() {
  // For debugging
  if (typeof window !== 'undefined') {
    console.log('EmergencyTest rendering in browser');
    document.title = 'Emergency Test';
  }

  // The absolute simplest component possible
  return <h1>Emergency Test Page Works!</h1>;
}

// Also include a default export for compatibility
export default EmergencyTest;
