const { body, param, query, validationResult } = require('express-validator');
const { Student, FeeStructure, Payment, User } = require('../models/associations');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .isIn(['admin', 'accountant', 'student', 'parent'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required when updating password'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// Student validation rules
const validateStudentCreation = [
  body('student_id')
    .notEmpty()
    .withMessage('Student ID is required')
    .isLength({ max: 20 })
    .withMessage('Student ID must not exceed 20 characters'),
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('class')
    .notEmpty()
    .withMessage('Class is required')
    .isLength({ max: 20 })
    .withMessage('Class must not exceed 20 characters'),
  body('section')
    .notEmpty()
    .withMessage('Section is required')
    .isLength({ max: 10 })
    .withMessage('Section must not exceed 10 characters'),
  body('roll_number')
    .notEmpty()
    .withMessage('Roll number is required')
    .isLength({ max: 20 })
    .withMessage('Roll number must not exceed 20 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a positive integer'),
  body('admission_date')
    .optional()
    .isISO8601()
    .withMessage('Admission date must be a valid date'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender specified'),
  handleValidationErrors
];

// Fee structure validation rules
const validateFeeStructureCreation = [
  body('class')
    .notEmpty()
    .withMessage('Class is required')
    .isLength({ max: 20 })
    .withMessage('Class must not exceed 20 characters'),
  body('fee_type')
    .isIn(['tuition', 'transport', 'library', 'exam', 'sports', 'lab', 'other'])
    .withMessage('Invalid fee type specified'),
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('academic_year')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  body('due_date')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('late_fee_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Late fee amount must be a valid decimal number')
    .isFloat({ min: 0 })
    .withMessage('Late fee amount must be 0 or greater'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Payment validation rules
const validatePaymentCreation = [
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  body('fee_structure_id')
    .isInt({ min: 1 })
    .withMessage('Fee structure ID must be a positive integer'),
  body('amount_paid')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount paid must be a valid decimal number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount paid must be greater than 0'),
  body('payment_method')
    .isIn(['cash', 'card', 'bank_transfer', 'online', 'cheque', 'other'])
    .withMessage('Invalid payment method specified'),
  body('transaction_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must not exceed 100 characters'),
  body('late_fee_paid')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Late fee paid must be a valid decimal number')
    .isFloat({ min: 0 })
    .withMessage('Late fee paid must be 0 or greater'),
  body('discount_applied')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Discount applied must be a valid decimal number')
    .isFloat({ min: 0 })
    .withMessage('Discount applied must be 0 or greater'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('bank_reference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bank reference must not exceed 100 characters'),
  body('cheque_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Cheque number must not exceed 50 characters'),
  body('cheque_date')
    .optional()
    .isISO8601()
    .withMessage('Cheque date must be a valid date'),
  body('bank_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Bank name must not exceed 100 characters'),
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid date'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid date'),
  handleValidationErrors
];

// Custom validators
const validateStudentExists = async (req, res, next) => {
  try {
    const { student_id } = req.body;
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating student',
      error: error.message
    });
  }
};

const validateFeeStructureExists = async (req, res, next) => {
  try {
    const { fee_structure_id } = req.body;
    const feeStructure = await FeeStructure.findByPk(fee_structure_id);

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    req.feeStructure = feeStructure;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating fee structure',
      error: error.message
    });
  }
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateStudentCreation,
  validateFeeStructureCreation,
  validatePaymentCreation,
  validateId,
  validatePagination,
  validateDateRange,
  validateStudentExists,
  validateFeeStructureExists
};
