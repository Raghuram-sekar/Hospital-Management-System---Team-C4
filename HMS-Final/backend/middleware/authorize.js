/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of permitted roles
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Get user from previous middleware
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - No user authenticated' });
    }
    
    // Check if user's role is in the permitted roles
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ 
        message: `Forbidden - Requires ${roles.join(' or ')} role` 
      });
    }
    
    // User has required role, proceed
    next();
  };
};

export default authorize; 