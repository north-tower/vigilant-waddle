const express = require('express');
const router = express.Router();
const {
  getMyChildren,
  getChildren,
  getChildProfile,
  getChildFees,
  getChildPayments,
  getChildBalance,
  getChildStats,
  getSummary,
  getChildReceipt
} = require('../controllers/parentPortalController');
const {
  authenticateToken,
  authorizeParent
} = require('../middleware/auth');
const {
  validatePagination
} = require('../middleware/validation');

// All routes require authentication and parent role
router.use(authenticateToken);
router.use(authorizeParent);

// Routes that need children list
router.get('/children', getMyChildren, getChildren);
router.get('/summary', getMyChildren, getSummary);

// Routes for specific child (parent access is verified in controller)
router.get('/children/:childId', getChildProfile);
router.get('/children/:childId/fees', getChildFees);
router.get('/children/:childId/payments', validatePagination, getChildPayments);
router.get('/children/:childId/balance', getChildBalance);
router.get('/children/:childId/stats', getChildStats);
router.get('/children/:childId/receipt/:paymentId', getChildReceipt);

module.exports = router;

