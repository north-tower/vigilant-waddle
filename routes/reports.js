const express = require('express');
const router = express.Router();
const {
  getFeeCollectionReport,
  getOutstandingFeesReport,
  getPaymentHistoryReport,
  getClassWiseCollectionReport,
  getMonthlyCollectionReport,
  getDefaultersReport,
  generateCustomReport
} = require('../controllers/reportController');
const {
  validatePagination,
  validateDateRange
} = require('../middleware/validation');
const {
  authenticateToken,
  authorizeAccountant
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All routes require accountant or admin access
router.use(authorizeAccountant);

// Report routes
router.get('/fee-collection', validateDateRange, getFeeCollectionReport);
router.get('/outstanding-fees', getOutstandingFeesReport);
router.get('/payment-history', validatePagination, validateDateRange, getPaymentHistoryReport);
router.get('/class-wise-collection', validateDateRange, getClassWiseCollectionReport);
router.get('/monthly-collection', getMonthlyCollectionReport);
router.get('/defaulters', getDefaultersReport);
router.post('/custom', generateCustomReport);

module.exports = router;

