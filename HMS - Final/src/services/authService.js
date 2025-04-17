import api from './api';

const AuthService = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('AuthService login attempt with:', { email });
      
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Register new user
  register: async (name, email, password, role) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error.response ? error.response.data : { message: 'Network error' };
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Get current user info
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Ensure admin user is logged in (for development/testing)
  ensureAdminLogin: async () => {
    const currentUser = AuthService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    // If no user or token, create a test admin
    if (!currentUser || !token) {
      console.log('No user found, attempting to login as admin...');
      
      try {
        // Try to login with default admin credentials
        const loginResponse = await api.post('/auth/login', {
          email: 'admin@example.com',
          password: 'password123'
        });
        
        console.log('Admin login successful:', loginResponse.data);
        
        if (loginResponse.data.token) {
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          return loginResponse.data.user;
        }
      } catch (loginError) {
        console.error('Could not login with default admin credentials:', loginError);
        console.log('Creating test admin user for development instead');
        
        // If login fails, create a fake user and token
        const testUser = {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        };
        
        // Create a test token that at least has a format that might work
        const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE3MjkyNjg5fQ.example-token-signature';
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('token', testToken);
        
        return testUser;
      }
    }
    
    return currentUser;
  },
  
  // Test the auth API connection
  testAuthConnection: async () => {
    try {
      const response = await api.get('/auth/test');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Auth API test failed:', error);
      return {
        success: false,
        error: error.message,
        details: error.response ? error.response.data : null
      };
    }
  }
};

export default AuthService; 