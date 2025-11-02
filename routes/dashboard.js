const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentPayments,
  getUpcomingDues,
  getCollectionTrends,
  getClassSummary,
  getAlerts
} = require('../controllers/dashboardController');
const {
  authenticateToken,
  authorizeAccountant
} = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All routes require accountant or admin access
router.use(authorizeAccountant);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/recent-payments', getRecentPayments);
router.get('/upcoming-dues', getUpcomingDues);
router.get('/collection-trends', getCollectionTrends);
router.get('/class-summary', getClassSummary);
router.get('/alerts', getAlerts);

module.exports = router;

