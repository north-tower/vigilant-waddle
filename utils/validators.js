const Joi = require('joi');

// User validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 50 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('admin', 'accountant', 'student', 'parent')
    .default('student')
    .messages({
      'any.only': 'Role must be one of: admin, accountant, student, parent'
    })
});

const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const userUpdateSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 50 characters'
    }),
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  currentPassword: Joi.string()
    .when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  newPassword: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

// Student validation schemas
const studentCreationSchema = Joi.object({
  student_id: Joi.string()
    .max(20)
    .required()
    .messages({
      'string.max': 'Student ID must not exceed 20 characters',
      'any.required': 'Student ID is required'
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must not exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces',
      'any.required': 'First name is required'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must not exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    }),
  class: Joi.string()
    .max(20)
    .required()
    .messages({
      'string.max': 'Class must not exceed 20 characters',
      'any.required': 'Class is required'
    }),
  section: Joi.string()
    .max(10)
    .required()
    .messages({
      'string.max': 'Section must not exceed 10 characters',
      'any.required': 'Section is required'
    }),
  roll_number: Joi.string()
    .max(20)
    .required()
    .messages({
      'string.max': 'Roll number must not exceed 20 characters',
      'any.required': 'Roll number is required'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  parent_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Parent ID must be a number',
      'number.integer': 'Parent ID must be an integer',
      'number.positive': 'Parent ID must be positive'
    }),
  admission_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Admission date must be a valid date in ISO format'
    }),
  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Date of birth must be a valid date in ISO format',
      'date.max': 'Date of birth cannot be in the future'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Gender must be one of: male, female, other'
    }),
  blood_group: Joi.string()
    .max(5)
    .optional()
    .messages({
      'string.max': 'Blood group must not exceed 5 characters'
    }),
  emergency_contact: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid emergency contact number'
    }),
  emergency_contact_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Emergency contact name must not exceed 100 characters'
    })
});

// Fee structure validation schemas
const feeStructureCreationSchema = Joi.object({
  class: Joi.string()
    .max(20)
    .required()
    .messages({
      'string.max': 'Class must not exceed 20 characters',
      'any.required': 'Class is required'
    }),
  fee_type: Joi.string()
    .valid('tuition', 'transport', 'library', 'exam', 'sports', 'lab', 'other')
    .required()
    .messages({
      'any.only': 'Fee type must be one of: tuition, transport, library, exam, sports, lab, other',
      'any.required': 'Fee type is required'
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    }),
  academic_year: Joi.string()
    .pattern(/^\d{4}-\d{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Academic year must be in format YYYY-YYYY',
      'any.required': 'Academic year is required'
    }),
  due_date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.format': 'Due date must be a valid date in ISO format',
      'date.min': 'Due date cannot be in the past',
      'any.required': 'Due date is required'
    }),
  late_fee_amount: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Late fee amount must be a number',
      'number.min': 'Late fee amount must be 0 or greater'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  is_mandatory: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Is mandatory must be a boolean value'
    })
});

// Payment validation schemas
const paymentCreationSchema = Joi.object({
  student_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Student ID must be a number',
      'number.integer': 'Student ID must be an integer',
      'number.positive': 'Student ID must be positive',
      'any.required': 'Student ID is required'
    }),
  fee_structure_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Fee structure ID must be a number',
      'number.integer': 'Fee structure ID must be an integer',
      'number.positive': 'Fee structure ID must be positive',
      'any.required': 'Fee structure ID is required'
    }),
  amount_paid: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount paid must be a number',
      'number.positive': 'Amount paid must be greater than 0',
      'any.required': 'Amount paid is required'
    }),
  payment_date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Payment date must be a valid date in ISO format',
      'date.max': 'Payment date cannot be in the future'
    }),
  payment_method: Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'online', 'cheque', 'other')
    .default('cash')
    .messages({
      'any.only': 'Payment method must be one of: cash, card, bank_transfer, online, cheque, other'
    }),
  transaction_id: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Transaction ID must not exceed 100 characters'
    }),
  late_fee_paid: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Late fee paid must be a number',
      'number.min': 'Late fee paid must be 0 or greater'
    }),
  discount_applied: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'Discount applied must be a number',
      'number.min': 'Discount applied must be 0 or greater'
    }),
  discount_reason: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Discount reason must not exceed 255 characters'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 500 characters'
    }),
  bank_reference: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Bank reference must not exceed 100 characters'
    }),
  cheque_number: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Cheque number must not exceed 50 characters'
    }),
  cheque_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Cheque date must be a valid date in ISO format'
    }),
  bank_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Bank name must not exceed 100 characters'
    })
});

// Query parameter validation schemas
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

const dateRangeSchema = Joi.object({
  start_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be a valid date in ISO format'
    }),
  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.format': 'End date must be a valid date in ISO format',
      'date.min': 'End date must be after start date'
    })
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: errorMessages
      });
    }
    
    req.query = value;
    next();
  };
};

module.exports = {
  // Schemas
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  studentCreationSchema,
  feeStructureCreationSchema,
  paymentCreationSchema,
  paginationSchema,
  dateRangeSchema,
  
  // Middleware
  validate,
  validateQuery
};

