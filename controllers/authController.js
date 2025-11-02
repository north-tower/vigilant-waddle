const { User } = require('../models/associations');
const { generateToken } = require('../config/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email or username already exists'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password_hash: password, // Will be hashed by model hook
    role: role || 'student'
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Validate password
  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await user.update({ last_login: new Date() });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] }
  });

  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update basic fields
  if (username) user.username = username;
  if (email) user.email = email;

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to change password'
      });
    }

    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password_hash = newPassword; // Will be hashed by model hook
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toJSON() }
  });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. This endpoint can be used for logging purposes.
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Validate current password
  const isCurrentPasswordValid = await user.validatePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password_hash = newPassword; // Will be hashed by model hook
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Deactivate user account
// @route   PUT /api/auth/deactivate
// @access  Private (Admin only)
const deactivateAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByPk(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await user.update({ is_active: false });

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  changePassword,
  deactivateAccount
};

