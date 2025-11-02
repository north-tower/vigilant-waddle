const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  voidPayment,
  createBulkPayments,
  generateReceipt,
  getPaymentStats
} = require('../controllers/paymentController');
const {
  validatePaymentCreation,
  validateId,
  validatePagination
} = require('../middleware/validation');
const {
  authenticateToken,
  authorizeAccountant,
  authorizeAdmin,
  canAccessStudent
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin and Accountant routes
router.get('/', authorizeAccountant, validatePagination, getPayments);
router.post('/', authorizeAccountant, validatePaymentCreation, createPayment);
router.post('/bulk', authorizeAccountant, createBulkPayments);
router.get('/stats', authorizeAccountant, getPaymentStats);

// Routes with ID parameter
router.get('/:id', canAccessStudent, validateId, getPaymentById);
router.put('/:id', authorizeAccountant, validateId, updatePayment);
router.put('/:id/void', authorizeAdmin, validateId, voidPayment);
router.get('/receipt/:id', canAccessStudent, validateId, generateReceipt);

module.exports = router;

