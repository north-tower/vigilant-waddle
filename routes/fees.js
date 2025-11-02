const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  assignFeeStructure,
  getFeeAssignments,
  waiveFeeAssignment,
  getFeeStructureStats
} = require('../controllers/feeController');
const {
  validateFeeStructureCreation,
  validateId,
  validatePagination
} = require('../middleware/validation');
const {
  authenticateToken,
  authorizeAccountant,
  authorizeAdmin
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin and Accountant routes
router.get('/', authorizeAccountant, validatePagination, getFeeStructures);
router.post('/', authorizeAccountant, validateFeeStructureCreation, createFeeStructure);
router.get('/assignments', authorizeAccountant, validatePagination, getFeeAssignments);

// Routes with ID parameter
router.get('/:id', authorizeAccountant, validateId, getFeeStructureById);
router.put('/:id', authorizeAccountant, validateId, updateFeeStructure);
router.delete('/:id', authorizeAdmin, validateId, deleteFeeStructure);
router.get('/:id/stats', authorizeAccountant, validateId, getFeeStructureStats);

// Fee assignment routes
router.post('/:id/assign', authorizeAccountant, validateId, assignFeeStructure);

// Fee assignment management routes
router.put('/assignments/:id/waive', authorizeAdmin, validateId, waiveFeeAssignment);

module.exports = router;

