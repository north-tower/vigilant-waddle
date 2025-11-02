const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  changePassword,
  deactivateAccount
} = require('../controllers/authController');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate
} = require('../middleware/validation');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', validateUserUpdate, updateProfile);
router.post('/logout', logout);
router.put('/change-password', changePassword);

// Admin only routes
router.put('/deactivate/:userId', authorizeAdmin, deactivateAccount);

module.exports = router;

