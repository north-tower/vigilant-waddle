const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFees,
  getStudentPayments,
  getStudentBalance,
  getStudentsByClass,
  getStudentStats
} = require('../controllers/studentController');
const {
  validateStudentCreation,
  validateId,
  validatePagination
} = require('../middleware/validation');
const {
  authenticateToken,
  authorizeAccountant,
  canAccessStudent
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin and Accountant routes
router.get('/', authorizeAccountant, validatePagination, getStudents);
router.post('/', authorizeAccountant, validateStudentCreation, createStudent);
router.get('/class/:class', authorizeAccountant, getStudentsByClass);

// Routes that require student access check
router.get('/:id', canAccessStudent, validateId, getStudentById);
router.put('/:id', authorizeAccountant, validateId, updateStudent);
router.delete('/:id', authorizeAccountant, validateId, deleteStudent);
router.get('/:id/fees', canAccessStudent, validateId, getStudentFees);
router.get('/:id/payments', canAccessStudent, validateId, getStudentPayments);
router.get('/:id/balance', canAccessStudent, validateId, getStudentBalance);
router.get('/:id/stats', canAccessStudent, validateId, getStudentStats);

module.exports = router;

