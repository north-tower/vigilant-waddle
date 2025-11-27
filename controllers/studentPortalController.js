const { Student, User, FeeAssignment, Payment, FeeBalance, FeeStructure } = require('../models/associations');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// Middleware to get current student's record
const getCurrentStudent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available for students'
      });
    }

    const student = await Student.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'username', 'email', 'role']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please contact administrator to link your account.'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student profile',
      error: error.message
    });
  }
};

// @desc    Get current student's profile
// @route   GET /api/student/profile
// @access  Private (Student)
const getMyProfile = asyncHandler(async (req, res) => {
  const student = req.student;

  res.json({
    success: true,
    data: { student }
  });
});

// @desc    Get current student's fees
// @route   GET /api/student/my-fees
// @access  Private (Student)
const getMyFees = asyncHandler(async (req, res) => {
  const student = req.student;
  const { academic_year, status } = req.query;

  const whereClause = { student_id: student.id };
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
      fees: feeAssignments,
      totalFees: feeAssignments.length
    }
  });
});

// @desc    Get current student's payments
// @route   GET /api/student/my-payments
// @access  Private (Student)
const getMyPayments = asyncHandler(async (req, res) => {
  const student = req.student;
  const { 
    page = 1, 
    limit = 20, 
    start_date, 
    end_date,
    academic_year 
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { 
    student_id: student.id,
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

// @desc    Get current student's fee balance
// @route   GET /api/student/my-balance
// @access  Private (Student)
const getMyBalance = asyncHandler(async (req, res) => {
  const student = req.student;
  const { academic_year } = req.query;

  const whereClause = { student_id: student.id };
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

// @desc    Get current student's statistics
// @route   GET /api/student/my-stats
// @access  Private (Student)
const getMyStats = asyncHandler(async (req, res) => {
  const student = req.student;

  // Get total fees assigned
  const totalFees = await FeeAssignment.count({
    where: { student_id: student.id, status: 'assigned' }
  });

  // Get total payments
  const totalPayments = await Payment.count({
    where: { student_id: student.id, is_void: false }
  });

  // Get total amount paid
  const totalPaid = await Payment.sum('amount_paid', {
    where: { student_id: student.id, is_void: false }
  }) || 0;

  // Get outstanding balance
  const outstandingBalance = await FeeBalance.sum('balance_amount', {
    where: { 
      student_id: student.id,
      balance_amount: { [Op.gt]: 0 }
    }
  }) || 0;

  // Get overdue fees count
  const overdueFees = await FeeBalance.count({
    where: { 
      student_id: student.id,
      is_overdue: true,
      balance_amount: { [Op.gt]: 0 }
    }
  });

  // Get this month's payments
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();
  const monthlyPayments = await Payment.sum('amount_paid', {
    where: {
      student_id: student.id,
      is_void: false,
      payment_date: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    }
  }) || 0;

  res.json({
    success: true,
    data: {
      totalFees,
      totalPayments,
      totalPaid: Math.round(totalPaid * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      overdueFees,
      monthlyPayments: Math.round(monthlyPayments * 100) / 100
    }
  });
});

// @desc    Get current student's payment receipt
// @route   GET /api/student/receipt/:paymentId
// @access  Private (Student)
const getMyReceipt = asyncHandler(async (req, res) => {
  const student = req.student;
  const { paymentId } = req.params;

  const payment = await Payment.findOne({
    where: {
      id: paymentId,
      student_id: student.id,
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
      student: {
        id: student.id,
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        class: student.class,
        section: student.section,
        roll_number: student.roll_number
      }
    }
  });
});

module.exports = {
  getCurrentStudent,
  getMyProfile,
  getMyFees,
  getMyPayments,
  getMyBalance,
  getMyStats,
  getMyReceipt
};

