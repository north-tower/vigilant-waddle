const { Payment, Student, FeeStructure, FeeBalance, FeeAssignment, User } = require('../models/associations');
const { Op, Sequelize } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get overall statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Accountant)
const getDashboardStats = asyncHandler(async (req, res) => {
  const { academic_year } = req.query;
  const currentYear = academic_year || moment().format('YYYY-YYYY');

  // Get total students
  const totalStudents = await Student.count({
    where: { status: 'active' }
  });

  // Get total fee structures
  const totalFeeStructures = await FeeStructure.count({
    where: {
      is_active: true,
      ...(academic_year && { academic_year })
    }
  });

  // Get total collection for current academic year
  const totalCollection = await Payment.sum('amount_paid', {
    where: {
      is_void: false,
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: []
      }
    ]
  }) || 0;

  // Get total outstanding amount
  const totalOutstanding = await FeeBalance.sum('balance_amount', {
    where: {
      balance_amount: { [Op.gt]: 0 },
      ...(academic_year && { academic_year })
    }
  }) || 0;

  // Get overdue fees count
  const overdueFeesCount = await FeeBalance.count({
    where: {
      is_overdue: true,
      balance_amount: { [Op.gt]: 0 },
      ...(academic_year && { academic_year })
    }
  });

  // Get total payments count
  const totalPayments = await Payment.count({
    where: {
      is_void: false,
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: []
      }
    ]
  });

  // Get collection rate
  const totalExpected = await FeeBalance.sum('total_amount', {
    where: {
      ...(academic_year && { academic_year })
    }
  }) || 0;

  const collectionRate = totalExpected > 0 ? (totalCollection / totalExpected) * 100 : 0;

  // Get this month's collection
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();

  const monthlyCollection = await Payment.sum('amount_paid', {
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startOfMonth, endOfMonth]
      },
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: []
      }
    ]
  }) || 0;

  // Get today's collection
  const startOfDay = moment().startOf('day').toDate();
  const endOfDay = moment().endOf('day').toDate();

  const todayCollection = await Payment.sum('amount_paid', {
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startOfDay, endOfDay]
      }
    }
  }) || 0;

  res.json({
    success: true,
    data: {
      overview: {
        totalStudents,
        totalFeeStructures,
        totalCollection: Math.round(totalCollection * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalPayments,
        overdueFeesCount,
        collectionRate: Math.round(collectionRate * 100) / 100
      },
      currentPeriod: {
        monthlyCollection: Math.round(monthlyCollection * 100) / 100,
        todayCollection: Math.round(todayCollection * 100) / 100
      }
    }
  });
});

// @desc    Get recent payments
// @route   GET /api/dashboard/recent-payments
// @access  Private (Admin, Accountant)
const getRecentPayments = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const recentPayments = await Payment.findAll({
    where: { is_void: false },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'fee_type', 'academic_year']
      },
      {
        model: User,
        as: 'receivedBy',
        attributes: ['id', 'username']
      }
    ],
    order: [['payment_date', 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: { recentPayments }
  });
});

// @desc    Get upcoming dues
// @route   GET /api/dashboard/upcoming-dues
// @access  Private (Admin, Accountant)
const getUpcomingDues = asyncHandler(async (req, res) => {
  const { days = 30, academic_year } = req.query;

  const futureDate = moment().add(parseInt(days), 'days').toDate();
  const today = moment().startOf('day').toDate();

  const upcomingDues = await FeeBalance.findAll({
    where: {
      balance_amount: { [Op.gt]: 0 },
      due_date: {
        [Op.between]: [today, futureDate]
      },
      ...(academic_year && { academic_year })
    },
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
      }
    ],
    order: [['due_date', 'ASC']]
  });

  // Add days until due
  const upcomingDuesWithDays = upcomingDues.map(fee => {
    const daysUntilDue = Math.ceil((new Date(fee.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    return {
      ...fee.toJSON(),
      daysUntilDue
    };
  });

  res.json({
    success: true,
    data: {
      upcomingDues: upcomingDuesWithDays,
      summary: {
        totalUpcoming: upcomingDuesWithDays.length,
        totalAmount: upcomingDuesWithDays.reduce((sum, fee) => sum + parseFloat(fee.balance_amount), 0)
      }
    }
  });
});

// @desc    Get collection trends
// @route   GET /api/dashboard/collection-trends
// @access  Private (Admin, Accountant)
const getCollectionTrends = asyncHandler(async (req, res) => {
  const { period = '30', academic_year } = req.query;

  const days = parseInt(period);
  const startDate = moment().subtract(days, 'days').startOf('day').toDate();
  const endDate = moment().endOf('day').toDate();

  // Get daily collection data
  const dailyCollection = await Payment.findAll({
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startDate, endDate]
      },
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: []
      }
    ],
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('Payment.payment_date')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: [Sequelize.fn('DATE', Sequelize.col('Payment.payment_date'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('Payment.payment_date')), 'ASC']]
  });

  // Get collection by payment method
  const collectionByMethod = await Payment.findAll({
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'payment_method',
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: ['payment_method']
  });

  // Get collection by fee type
  const collectionByFeeType = await Payment.findAll({
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startDate, endDate]
      },
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['fee_type']
      }
    ],
    attributes: [
      [Sequelize.col('feeStructure.fee_type'), 'fee_type'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: ['feeStructure.fee_type']
  });

  // Get class-wise collection
  const classWiseCollection = await Payment.findAll({
    where: {
      is_void: false,
      payment_date: {
        [Op.between]: [startDate, endDate]
      }
    },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['class']
      }
    ],
    attributes: [
      [Sequelize.col('student.class'), 'class'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: ['student.class']
  });

  res.json({
    success: true,
    data: {
      dailyCollection,
      collectionByMethod,
      collectionByFeeType,
      classWiseCollection,
      period: {
        startDate,
        endDate,
        days
      }
    }
  });
});

// @desc    Get fee collection summary by class
// @route   GET /api/dashboard/class-summary
// @access  Private (Admin, Accountant)
const getClassSummary = asyncHandler(async (req, res) => {
  const { academic_year } = req.query;

  // Get all active students grouped by class
  const studentsByClass = await Student.findAll({
    where: { status: 'active' },
    attributes: [
      'class',
      [Sequelize.fn('COUNT', Sequelize.col('Student.id')), 'student_count']
    ],
    group: ['class'],
    order: [['class', 'ASC']]
  });

  // Get fee assignments by class
  const feeAssignmentsByClass = await FeeAssignment.findAll({
    where: {
      status: 'assigned',
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['class']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['amount', 'academic_year']
      }
    ],
    attributes: [
      [Sequelize.col('student.class'), 'class'],
      [Sequelize.fn('COUNT', Sequelize.col('FeeAssignment.id')), 'assignment_count'],
      [Sequelize.fn('SUM', Sequelize.col('feeStructure.amount')), 'total_assigned']
    ],
    group: ['student.class']
  });

  // Get payments by class
  const paymentsByClass = await Payment.findAll({
    where: {
      is_void: false,
      ...(academic_year && {
        '$feeStructure.academic_year$': academic_year
      })
    },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['class']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: []
      }
    ],
    attributes: [
      [Sequelize.col('student.class'), 'class'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'payment_count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total_collected']
    ],
    group: ['student.class']
  });

  // Get outstanding by class
  const outstandingByClass = await FeeBalance.findAll({
    where: {
      balance_amount: { [Op.gt]: 0 },
      ...(academic_year && { academic_year })
    },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['class']
      }
    ],
    attributes: [
      [Sequelize.col('student.class'), 'class'],
      [Sequelize.fn('COUNT', Sequelize.col('FeeBalance.id')), 'outstanding_count'],
      [Sequelize.fn('SUM', Sequelize.col('FeeBalance.balance_amount')), 'total_outstanding']
    ],
    group: ['student.class']
  });

  // Combine all data by class
  const classSummary = {};
  
  // Initialize with student counts
  studentsByClass.forEach(item => {
    classSummary[item.dataValues.class] = {
      class: item.dataValues.class,
      studentCount: parseInt(item.dataValues.student_count),
      assignmentCount: 0,
      totalAssigned: 0,
      paymentCount: 0,
      totalCollected: 0,
      outstandingCount: 0,
      totalOutstanding: 0
    };
  });

  // Add fee assignment data
  feeAssignmentsByClass.forEach(item => {
    const className = item.dataValues.class;
    if (classSummary[className]) {
      classSummary[className].assignmentCount = parseInt(item.dataValues.assignment_count);
      classSummary[className].totalAssigned = parseFloat(item.dataValues.total_assigned) || 0;
    }
  });

  // Add payment data
  paymentsByClass.forEach(item => {
    const className = item.dataValues.class;
    if (classSummary[className]) {
      classSummary[className].paymentCount = parseInt(item.dataValues.payment_count);
      classSummary[className].totalCollected = parseFloat(item.dataValues.total_collected) || 0;
    }
  });

  // Add outstanding data
  outstandingByClass.forEach(item => {
    const className = item.dataValues.class;
    if (classSummary[className]) {
      classSummary[className].outstandingCount = parseInt(item.dataValues.outstanding_count);
      classSummary[className].totalOutstanding = parseFloat(item.dataValues.total_outstanding) || 0;
    }
  });

  // Calculate collection rates
  Object.values(classSummary).forEach(item => {
    item.collectionRate = item.totalAssigned > 0 
      ? Math.round((item.totalCollected / item.totalAssigned) * 100 * 100) / 100 
      : 0;
  });

  res.json({
    success: true,
    data: {
      classSummary: Object.values(classSummary)
    }
  });
});

// @desc    Get alerts and notifications
// @route   GET /api/dashboard/alerts
// @access  Private (Admin, Accountant)
const getAlerts = asyncHandler(async (req, res) => {
  const alerts = [];

  // Check for overdue fees
  const overdueCount = await FeeBalance.count({
    where: {
      is_overdue: true,
      balance_amount: { [Op.gt]: 0 }
    }
  });

  if (overdueCount > 0) {
    alerts.push({
      type: 'warning',
      message: `${overdueCount} fees are overdue`,
      action: 'View overdue fees',
      count: overdueCount
    });
  }

  // Check for fees due in next 7 days
  const nextWeek = moment().add(7, 'days').toDate();
  const today = moment().startOf('day').toDate();

  const upcomingDueCount = await FeeBalance.count({
    where: {
      balance_amount: { [Op.gt]: 0 },
      due_date: {
        [Op.between]: [today, nextWeek]
      }
    }
  });

  if (upcomingDueCount > 0) {
    alerts.push({
      type: 'info',
      message: `${upcomingDueCount} fees are due in the next 7 days`,
      action: 'View upcoming dues',
      count: upcomingDueCount
    });
  }

  // Check for low collection rate (less than 70%)
  const totalAssigned = await FeeBalance.sum('total_amount') || 0;
  const totalCollected = await Payment.sum('amount_paid', {
    where: { is_void: false }
  }) || 0;

  const collectionRate = totalAssigned > 0 ? (totalCollected / totalAssigned) * 100 : 0;

  if (collectionRate < 70 && totalAssigned > 0) {
    alerts.push({
      type: 'warning',
      message: `Collection rate is ${Math.round(collectionRate * 100) / 100}% (below 70%)`,
      action: 'View collection report',
      rate: collectionRate
    });
  }

  res.json({
    success: true,
    data: { alerts }
  });
});

module.exports = {
  getDashboardStats,
  getRecentPayments,
  getUpcomingDues,
  getCollectionTrends,
  getClassSummary,
  getAlerts
};
