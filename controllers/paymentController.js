const { Payment, Student, FeeStructure, FeeBalance, FeeAssignment, User } = require('../models/associations');
const { Op, Sequelize } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');
const { generateReceiptNumber } = require('../utils/helpers');

// @desc    Get all payments with filtering and pagination
// @route   GET /api/payments
// @access  Private (Admin, Accountant)
const getPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    student_id,
    fee_structure_id,
    payment_method,
    start_date,
    end_date,
    is_void,
    sortBy = 'payment_date',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  if (student_id) whereClause.student_id = student_id;
  if (fee_structure_id) whereClause.fee_structure_id = fee_structure_id;
  if (payment_method) whereClause.payment_method = payment_method;
  if (is_void !== undefined) whereClause.is_void = is_void === 'true';

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year']
      },
      {
        model: User,
        as: 'receivedBy',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get specific payment
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number', 'phone', 'email']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount']
      },
      {
        model: User,
        as: 'receivedBy',
        attributes: ['id', 'username', 'email']
      },
      {
        model: User,
        as: 'voidedBy',
        attributes: ['id', 'username', 'email']
      }
    ]
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// @desc    Record new payment
// @route   POST /api/payments
// @access  Private (Admin, Accountant)
const createPayment = asyncHandler(async (req, res) => {
  const paymentData = {
    ...req.body,
    received_by: req.user.id
  };

  // Validate student exists
  const student = await Student.findByPk(paymentData.student_id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Validate fee structure exists
  const feeStructure = await FeeStructure.findByPk(paymentData.fee_structure_id);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Check if fee is assigned to student
  const feeAssignment = await FeeAssignment.findOne({
    where: {
      student_id: paymentData.student_id,
      fee_structure_id: paymentData.fee_structure_id,
      status: 'assigned'
    }
  });

  if (!feeAssignment) {
    return res.status(400).json({
      success: false,
      message: 'Fee is not assigned to this student'
    });
  }

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber();

  // Calculate late fee if applicable
  const dueDate = new Date(feeStructure.due_date);
  const paymentDate = new Date(paymentData.payment_date || new Date());
  const isOverdue = paymentDate > dueDate;
  
  let lateFeeAmount = 0;
  if (isOverdue && feeStructure.late_fee_amount > 0) {
    lateFeeAmount = parseFloat(feeStructure.late_fee_amount);
  }

  // Create payment record
  const payment = await Payment.create({
    ...paymentData,
    receipt_number: receiptNumber,
    late_fee_paid: lateFeeAmount
  });

  // Update fee balance
  await updateFeeBalance(paymentData.student_id, paymentData.fee_structure_id);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: { payment }
  });
});

// @desc    Update payment (limited updates allowed)
// @route   PUT /api/payments/:id
// @access  Private (Admin, Accountant)
const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.is_void) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update voided payment'
    });
  }

  // Only allow certain fields to be updated
  const allowedFields = ['notes', 'bank_reference', 'cheque_number', 'cheque_date', 'bank_name'];
  const filteredData = {};
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  await payment.update(filteredData);

  res.json({
    success: true,
    message: 'Payment updated successfully',
    data: { payment }
  });
});

// @desc    Void payment (admin only)
// @route   PUT /api/payments/:id/void
// @access  Private (Admin only)
const voidPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.is_void) {
    return res.status(400).json({
      success: false,
      message: 'Payment is already voided'
    });
  }

  await payment.update({
    is_void: true,
    void_reason: reason,
    voided_by: req.user.id,
    voided_at: new Date()
  });

  // Update fee balance after voiding
  await updateFeeBalance(payment.student_id, payment.fee_structure_id);

  res.json({
    success: true,
    message: 'Payment voided successfully',
    data: { payment }
  });
});

// @desc    Record bulk payments
// @route   POST /api/payments/bulk
// @access  Private (Admin, Accountant)
const createBulkPayments = asyncHandler(async (req, res) => {
  const { payments } = req.body;

  if (!Array.isArray(payments) || payments.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Payments array is required'
    });
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < payments.length; i++) {
    try {
      const paymentData = {
        ...payments[i],
        received_by: req.user.id
      };

      // Validate student exists
      const student = await Student.findByPk(paymentData.student_id);
      if (!student) {
        errors.push({ index: i, error: 'Student not found' });
        continue;
      }

      // Validate fee structure exists
      const feeStructure = await FeeStructure.findByPk(paymentData.fee_structure_id);
      if (!feeStructure) {
        errors.push({ index: i, error: 'Fee structure not found' });
        continue;
      }

      // Generate receipt number
      const receiptNumber = await generateReceiptNumber();

      // Calculate late fee
      const dueDate = new Date(feeStructure.due_date);
      const paymentDate = new Date(paymentData.payment_date || new Date());
      const isOverdue = paymentDate > dueDate;
      
      let lateFeeAmount = 0;
      if (isOverdue && feeStructure.late_fee_amount > 0) {
        lateFeeAmount = parseFloat(feeStructure.late_fee_amount);
      }

      // Create payment
      const payment = await Payment.create({
        ...paymentData,
        receipt_number: receiptNumber,
        late_fee_paid: lateFeeAmount
      });

      // Update fee balance
      await updateFeeBalance(paymentData.student_id, paymentData.fee_structure_id);

      results.push(payment);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  res.status(201).json({
    success: true,
    message: `Bulk payment processing completed. ${results.length} successful, ${errors.length} failed`,
    data: {
      successful: results,
      errors
    }
  });
});

// @desc    Generate payment receipt
// @route   GET /api/payments/receipt/:id
// @access  Private
const generateReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number', 'phone', 'email']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date']
      },
      {
        model: User,
        as: 'receivedBy',
        attributes: ['id', 'username', 'email']
      }
    ]
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  // Generate PDF receipt (implementation would use puppeteer or similar)
  const receiptData = {
    payment,
    generatedAt: new Date(),
    totalAmount: payment.getTotalAmount()
  };

  res.json({
    success: true,
    data: { receipt: receiptData }
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private (Admin, Accountant)
const getPaymentStats = asyncHandler(async (req, res) => {
  const { start_date, end_date, academic_year } = req.query;

  const whereClause = { is_void: false };
  
  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  // Get total payments
  const totalPayments = await Payment.count({ where: whereClause });
  const totalAmount = await Payment.sum('amount_paid', { where: whereClause }) || 0;

  // Get payments by method
  const paymentsByMethod = await Payment.findAll({
    where: whereClause,
    attributes: [
      'payment_method',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('amount_paid')), 'total']
    ],
    group: ['payment_method']
  });

  // Get recent payments
  const recentPayments = await Payment.findAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['student_id', 'first_name', 'last_name', 'class']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['fee_type']
      }
    ],
    order: [['payment_date', 'DESC']],
    limit: 10
  });

  // Get daily collection for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyCollection = await Payment.findAll({
    where: {
      ...whereClause,
      payment_date: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('payment_date')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('amount_paid')), 'total']
    ],
    group: [Sequelize.fn('DATE', Sequelize.col('payment_date'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('payment_date')), 'ASC']]
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalPayments,
        totalAmount,
        averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0
      },
      paymentsByMethod,
      recentPayments,
      dailyCollection
    }
  });
});

// Helper function to update fee balance
const updateFeeBalance = async (studentId, feeStructureId) => {
  try {
    // Get all payments for this student and fee structure
    const totalPaid = await Payment.sum('amount_paid', {
      where: {
        student_id: studentId,
        fee_structure_id: feeStructureId,
        is_void: false
      }
    }) || 0;

    // Get fee structure details
    const feeStructure = await FeeStructure.findByPk(feeStructureId);
    
    // Update or create fee balance
    const [feeBalance] = await FeeBalance.findOrCreate({
      where: {
        student_id: studentId,
        fee_structure_id: feeStructureId
      },
      defaults: {
        total_amount: feeStructure.amount,
        paid_amount: 0,
        balance_amount: feeStructure.amount,
        due_date: feeStructure.due_date,
        academic_year: feeStructure.academic_year,
        is_overdue: feeStructure.isOverdue()
      }
    });

    // Update balance
    const balanceAmount = parseFloat(feeStructure.amount) - totalPaid;
    const isOverdue = new Date() > new Date(feeStructure.due_date);

    await feeBalance.update({
      paid_amount: totalPaid,
      balance_amount: Math.max(0, balanceAmount),
      is_overdue: isOverdue && balanceAmount > 0,
      last_payment_date: totalPaid > 0 ? new Date() : null
    });
  } catch (error) {
    console.error('Error updating fee balance:', error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  voidPayment,
  createBulkPayments,
  generateReceipt,
  getPaymentStats
};
