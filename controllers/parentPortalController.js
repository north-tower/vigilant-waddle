const { Student, User, FeeAssignment, Payment, FeeBalance, FeeStructure } = require('../models/associations');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// Middleware to get current parent's children
const getMyChildren = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available for parents'
      });
    }

    // Get children - explicitly list attributes to avoid user_id column if it doesn't exist
    const children = await Student.findAll({
      where: { parent_id: userId },
      attributes: [
        'id',
        'student_id',
        'first_name',
        'last_name',
        'class',
        'section',
        'roll_number',
        'phone',
        'email',
        'address',
        'parent_id',
        'admission_date',
        'status',
        'date_of_birth',
        'gender',
        'blood_group',
        'emergency_contact',
        'emergency_contact_name',
        'created_at',
        'updated_at'
        // Explicitly exclude user_id since column may not exist yet
      ],
      order: [['class', 'ASC'], ['section', 'ASC'], ['roll_number', 'ASC']]
    });

    if (children.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No children found. Please contact administrator to link your children.'
      });
    }

    req.children = children;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving children',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get parent's children list
// @route   GET /api/parent/children
// @access  Private (Parent)
const getChildren = asyncHandler(async (req, res) => {
  const children = req.children;

  res.json({
    success: true,
    data: {
      children,
      totalChildren: children.length
    }
  });
});

// @desc    Get specific child's profile
// @route   GET /api/parent/children/:childId
// @access  Private (Parent)
const getChildProfile = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;

  const child = await Student.findOne({
    where: {
      id: childId,
      parent_id: userId
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'role']
      }
    ]
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  res.json({
    success: true,
    data: { child }
  });
});

// @desc    Get child's fees
// @route   GET /api/parent/children/:childId/fees
// @access  Private (Parent)
const getChildFees = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;
  const { academic_year, status } = req.query;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  const whereClause = { student_id: childId };
  const feeStructureWhere = {};

  if (academic_year) {
    feeStructureWhere.academic_year = academic_year;
  }
  if (status) {
    whereClause.status = status;
  }

  const feeAssignments = await FeeAssignment.findAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: Object.keys(feeStructureWhere).length > 0 ? feeStructureWhere : undefined,
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount', 'description']
      }
    ],
    order: [['assigned_date', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section
      },
      fees: feeAssignments,
      totalFees: feeAssignments.length
    }
  });
});

// @desc    Get child's payments
// @route   GET /api/parent/children/:childId/payments
// @access  Private (Parent)
const getChildPayments = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;
  const { 
    page = 1, 
    limit = 20, 
    start_date, 
    end_date,
    academic_year 
  } = req.query;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  const offset = (page - 1) * limit;
  const whereClause = { 
    student_id: childId,
    is_void: false 
  };
  const feeStructureWhere = {};

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  if (academic_year) {
    feeStructureWhere.academic_year = academic_year;
  }

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: Object.keys(feeStructureWhere).length > 0 ? feeStructureWhere : undefined,
        attributes: ['id', 'fee_type', 'amount', 'academic_year']
      },
      {
        model: User,
        as: 'receivedBy',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [['payment_date', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section
      },
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

// @desc    Get child's fee balance
// @route   GET /api/parent/children/:childId/balance
// @access  Private (Parent)
const getChildBalance = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;
  const { academic_year } = req.query;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  const whereClause = { student_id: childId };
  if (academic_year) {
    whereClause.academic_year = academic_year;
  }

  const feeBalances = await FeeBalance.findAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount']
      }
    ],
    order: [['due_date', 'ASC']]
  });

  // Calculate totals
  const totalAmount = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.total_amount), 0);
  const paidAmount = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.paid_amount), 0);
  const balanceAmount = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.balance_amount), 0);
  const overdueCount = feeBalances.filter(balance => balance.is_overdue).length;
  const overdueAmount = feeBalances
    .filter(balance => balance.is_overdue)
    .reduce((sum, balance) => sum + parseFloat(balance.balance_amount), 0);

  res.json({
    success: true,
    data: {
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section
      },
      balances: feeBalances,
      summary: {
        totalAmount,
        paidAmount,
        balanceAmount,
        overdueCount,
        overdueAmount
      }
    }
  });
});

// @desc    Get child's statistics
// @route   GET /api/parent/children/:childId/stats
// @access  Private (Parent)
const getChildStats = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  // Get total fees assigned
  const totalFees = await FeeAssignment.count({
    where: { student_id: childId, status: 'assigned' }
  });

  // Get total payments
  const totalPayments = await Payment.count({
    where: { student_id: childId, is_void: false }
  });

  // Get total amount paid
  const totalPaid = await Payment.sum('amount_paid', {
    where: { student_id: childId, is_void: false }
  }) || 0;

  // Get outstanding balance
  const outstandingBalance = await FeeBalance.sum('balance_amount', {
    where: { 
      student_id: childId,
      balance_amount: { [Op.gt]: 0 }
    }
  }) || 0;

  // Get overdue fees count
  const overdueFees = await FeeBalance.count({
    where: { 
      student_id: childId,
      is_overdue: true,
      balance_amount: { [Op.gt]: 0 }
    }
  });

  // Get this month's payments
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  const monthlyPayments = await Payment.sum('amount_paid', {
    where: {
      student_id: childId,
      is_void: false,
      payment_date: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    }
  }) || 0;

  res.json({
    success: true,
    data: {
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section
      },
      stats: {
        totalFees,
        totalPayments,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        overdueFees,
        monthlyPayments: Math.round(monthlyPayments * 100) / 100
      }
    }
  });
});

// @desc    Get summary of all children
// @route   GET /api/parent/summary
// @access  Private (Parent)
const getSummary = asyncHandler(async (req, res) => {
  const children = req.children;
  const userId = req.user.id;

  // Get summary for all children
  const childrenIds = children.map(child => child.id || child.get('id'));
  
  // If no children, return empty summary
  if (childrenIds.length === 0) {
    return res.json({
      success: true,
      data: {
        summary: {
          totalChildren: 0,
          totalFees: 0,
          totalPayments: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalOverdue: 0
        },
        children: []
      }
    });
  }

  // Get total fees for all children
  const totalFees = await FeeAssignment.count({
    where: { 
      student_id: { [Op.in]: childrenIds },
      status: 'assigned' 
    }
  });

  // Get total payments for all children
  const totalPayments = await Payment.count({
    where: { 
      student_id: { [Op.in]: childrenIds },
      is_void: false 
    }
  });

  // Get total amount paid for all children
  const totalPaid = await Payment.sum('amount_paid', {
    where: { 
      student_id: { [Op.in]: childrenIds },
      is_void: false 
    }
  }) || 0;

  // Get total outstanding for all children
  const totalOutstanding = await FeeBalance.sum('balance_amount', {
    where: { 
      student_id: { [Op.in]: childrenIds },
      balance_amount: { [Op.gt]: 0 }
    }
  }) || 0;

  // Get overdue fees count for all children
  const totalOverdue = await FeeBalance.count({
    where: { 
      student_id: { [Op.in]: childrenIds },
      is_overdue: true,
      balance_amount: { [Op.gt]: 0 }
    }
  });

  // Get per-child summary
  const childrenSummary = await Promise.all(
    children.map(async (child) => {
      const childOutstanding = await FeeBalance.sum('balance_amount', {
        where: { 
          student_id: child.id,
          balance_amount: { [Op.gt]: 0 }
        }
      }) || 0;

      const childOverdue = await FeeBalance.count({
        where: { 
          student_id: child.id,
          is_overdue: true,
          balance_amount: { [Op.gt]: 0 }
        }
      });

      return {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section,
        outstandingBalance: Math.round(childOutstanding * 100) / 100,
        overdueCount: childOverdue
      };
    })
  );

  res.json({
    success: true,
    data: {
      summary: {
        totalChildren: children.length,
        totalFees,
        totalPayments,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalOverdue
      },
      children: childrenSummary
    }
  });
});

// @desc    Get child's payment receipt
// @route   GET /api/parent/children/:childId/receipt/:paymentId
// @access  Private (Parent)
const getChildReceipt = asyncHandler(async (req, res) => {
  const { childId, paymentId } = req.params;
  const userId = req.user.id;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  const payment = await Payment.findOne({
    where: {
      id: paymentId,
      student_id: childId,
      is_void: false
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'fee_type', 'amount', 'academic_year']
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
      message: 'Payment receipt not found'
    });
  }

  res.json({
    success: true,
    data: {
      payment,
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`,
        class: child.class,
        section: child.section,
        roll_number: child.roll_number
      }
    }
  });
});

// @desc    Create payment for child
// @route   POST /api/parent/children/:childId/payment
// @access  Private (Parent)
const createChildPayment = asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const userId = req.user.id;
  const { 
    fee_structure_id, 
    amount_paid, 
    payment_method = 'online',
    payment_date,
    transaction_id,
    notes 
  } = req.body;

  // Verify parent has access to this child
  const child = await Student.findOne({
    where: { id: childId, parent_id: userId }
  });

  if (!child) {
    return res.status(404).json({
      success: false,
      message: 'Child not found or access denied'
    });
  }

  // Validate required fields
  if (!fee_structure_id || !amount_paid) {
    return res.status(400).json({
      success: false,
      message: 'Fee structure ID and amount paid are required'
    });
  }

  // Validate fee structure exists
  const feeStructure = await FeeStructure.findByPk(fee_structure_id);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Check if fee is assigned to student
  const feeAssignment = await FeeAssignment.findOne({
    where: {
      student_id: childId,
      fee_structure_id: fee_structure_id,
      status: 'assigned'
    }
  });

  if (!feeAssignment) {
    return res.status(400).json({
      success: false,
      message: 'Fee is not assigned to this student'
    });
  }

  // Get current balance
  const feeBalance = await FeeBalance.findOne({
    where: {
      student_id: childId,
      fee_structure_id: fee_structure_id
    }
  });

  if (!feeBalance) {
    return res.status(400).json({
      success: false,
      message: 'Fee balance not found for this student'
    });
  }

  // Validate amount doesn't exceed balance
  const amountToPay = parseFloat(amount_paid);
  const currentBalance = parseFloat(feeBalance.balance_amount);

  if (amountToPay > currentBalance) {
    return res.status(400).json({
      success: false,
      message: `Payment amount (${amountToPay}) cannot exceed outstanding balance (${currentBalance})`
    });
  }

  if (amountToPay <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount must be greater than 0'
    });
  }

  // Generate receipt number
  const { generateReceiptNumber } = require('../utils/helpers');
  const receiptNumber = await generateReceiptNumber();

  // Calculate late fee if applicable
  const dueDate = new Date(feeStructure.due_date);
  const paymentDate = payment_date ? new Date(payment_date) : new Date();
  const isOverdue = paymentDate > dueDate;
  
  let lateFeeAmount = 0;
  if (isOverdue && feeStructure.late_fee_amount > 0) {
    lateFeeAmount = parseFloat(feeStructure.late_fee_amount);
  }

  // Create payment record
  // Note: received_by is set to parent's user ID, but in a real system,
  // you might want to have an accountant verify/approve parent payments
  const payment = await Payment.create({
    student_id: childId,
    fee_structure_id: fee_structure_id,
    amount_paid: amountToPay,
    payment_date: paymentDate,
    payment_method: payment_method,
    transaction_id: transaction_id,
    receipt_number: receiptNumber,
    late_fee_paid: lateFeeAmount,
    received_by: userId, // Parent's user ID
    notes: notes || `Payment made by parent for ${child.first_name} ${child.last_name}`
  });

  // Update fee balance
  const { updateFeeBalance } = require('./paymentController');
  await updateFeeBalance(childId, fee_structure_id);

  // Get updated payment with relations
  const createdPayment = await Payment.findByPk(payment.id, {
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'fee_type', 'amount', 'academic_year', 'due_date']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: {
      payment: createdPayment,
      child: {
        id: child.id,
        student_id: child.student_id,
        name: `${child.first_name} ${child.last_name}`
      }
    }
  });
});

module.exports = {
  getMyChildren,
  getChildren,
  getChildProfile,
  getChildFees,
  getChildPayments,
  getChildBalance,
  getChildStats,
  getSummary,
  getChildReceipt,
  createChildPayment
};

