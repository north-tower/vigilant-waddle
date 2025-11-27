const express = require('express');
const router = express.Router();
const {
  getCurrentStudent,
  getMyProfile,
  getMyFees,
  getMyPayments,
  getMyBalance,
  getMyStats,
  getMyReceipt
} = require('../controllers/studentPortalController');
const {
  authenticateToken,
  authorizeStudent
} = require('../middleware/auth');
const {
  validatePagination,
  validateId
} = require('../middleware/validation');

// All routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeStudent);

// All routes use getCurrentStudent middleware to get the logged-in student's record
router.use(getCurrentStudent);

// Student portal routes
router.get('/profile', getMyProfile);
router.get('/my-fees', getMyFees);
router.get('/my-payments', validatePagination, getMyPayments);
router.get('/my-balance', getMyBalance);
router.get('/my-stats', getMyStats);
router.get('/receipt/:paymentId', getMyReceipt);

module.exports = router;

