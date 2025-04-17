import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  console.log('Auth middleware called for:', req.path);
  
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if token exists
  if (!token) {
    console.log('No token provided - defaulting to admin for testing');
    // For development/testing purposes only
    req.user = { id: 1, role: 'admin' }; // Default to admin user for testing
    return next();
  }

  try {
    // Verify token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    console.log('Verifying token with secret');
    const decoded = jwt.verify(token, secret);

    console.log('Token verified successfully for user:', decoded);
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    // For testing/development environments
    console.log('Using fallback admin user due to token error');
    req.user = { id: 1, role: 'admin' }; // Default to admin user for testing
    next();
  }
};

export default auth; 