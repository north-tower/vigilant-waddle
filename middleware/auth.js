const { verifyToken } = require('../config/auth');
const { User, Student } = require('../models/associations');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const authorizeAdmin = authorizeRoles('admin');
const authorizeAccountant = authorizeRoles('admin', 'accountant');
const authorizeStudent = authorizeRoles('student', 'parent');
const authorizeParent = authorizeRoles('parent');

// Middleware to check if user can access student data
const canAccessStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin and accountant can access all students
    if (['admin', 'accountant'].includes(userRole)) {
      return next();
    }

    // Students and parents can only access their own data
    if (['student', 'parent'].includes(userRole)) {
      const student = await Student.findByPk(id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if this is the student's own record or their parent's record
      if (student.id === userId || student.parent_id === userId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this student record'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking student access',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeAdmin,
  authorizeAccountant,
  authorizeStudent,
  authorizeParent,
  canAccessStudent
};
