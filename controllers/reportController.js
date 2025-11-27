const { Payment, Student, FeeStructure, FeeBalance, FeeAssignment, User } = require('../models/associations');
const { Op, Sequelize } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get fee collection summary
// @route   GET /api/reports/fee-collection
// @access  Private (Admin, Accountant)
const getFeeCollectionReport = asyncHandler(async (req, res) => {
  const { start_date, end_date, academic_year, class: studentClass } = req.query;

  const whereClause = { is_void: false };
  const studentWhereClause = {};
  const feeStructureWhereClause = {};

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  if (academic_year) feeStructureWhereClause.academic_year = academic_year;
  if (studentClass) studentWhereClause.class = studentClass;

  // Build include arrays with conditional where clauses
  // Only set required: true if we have filters, otherwise use left join
  const baseIncludes = [
    {
      model: Student,
      as: 'student',
      attributes: [],
      ...(Object.keys(studentWhereClause).length > 0 && { 
        where: studentWhereClause,
        required: true 
      })
    },
    {
      model: FeeStructure,
      as: 'feeStructure',
      attributes: [],
      ...(Object.keys(feeStructureWhereClause).length > 0 && { 
        where: feeStructureWhereClause,
        required: true 
      })
    }
  ];

  // Get total collection
  const totalCollection = await Payment.sum('amount_paid', {
    where: whereClause,
    include: baseIncludes
  }) || 0;

  // Get collection by fee type using raw query to avoid GROUP BY issues
  const collectionByFeeType = await Payment.findAll({
    where: whereClause,
    include: baseIncludes,
    attributes: [
      [Sequelize.literal('`feeStructure`.`fee_type`'), 'fee_type'],
      [Sequelize.fn('COUNT', Sequelize.literal('`Payment`.`id`')), 'count'],
      [Sequelize.fn('SUM', Sequelize.literal('`Payment`.`amount_paid`')), 'total']
    ],
    group: [Sequelize.literal('`feeStructure`.`fee_type`')],
    raw: true
  });

  // Get collection by class
  const collectionByClass = await Payment.findAll({
    where: whereClause,
    include: baseIncludes,
    attributes: [
      [Sequelize.literal('`student`.`class`'), 'class'],
      [Sequelize.fn('COUNT', Sequelize.literal('`Payment`.`id`')), 'count'],
      [Sequelize.fn('SUM', Sequelize.literal('`Payment`.`amount_paid`')), 'total']
    ],
    group: [Sequelize.literal('`student`.`class`')],
    raw: true
  });

  // Get monthly collection trend
  const monthlyCollection = await Payment.findAll({
    where: whereClause,
    include: baseIncludes,
    attributes: [
      [Sequelize.fn('DATE_FORMAT', Sequelize.literal('`Payment`.`payment_date`'), '%Y-%m'), 'month'],
      [Sequelize.fn('COUNT', Sequelize.literal('`Payment`.`id`')), 'count'],
      [Sequelize.fn('SUM', Sequelize.literal('`Payment`.`amount_paid`')), 'total']
    ],
    group: [Sequelize.fn('DATE_FORMAT', Sequelize.literal('`Payment`.`payment_date`'), '%Y-%m')],
    order: [[Sequelize.fn('DATE_FORMAT', Sequelize.literal('`Payment`.`payment_date`'), '%Y-%m'), 'ASC']],
    raw: true
  });

  // Results are already plain objects when using raw: true
  const transformedCollectionByFeeType = collectionByFeeType.map(item => ({
    fee_type: item.fee_type || 'Unknown',
    count: parseInt(item.count) || 0,
    total: parseFloat(item.total) || 0
  }));

  const transformedCollectionByClass = collectionByClass.map(item => ({
    class: item.class || 'Unknown',
    count: parseInt(item.count) || 0,
    total: parseFloat(item.total) || 0
  }));

  const transformedMonthlyCollection = monthlyCollection.map(item => ({
    month: item.month || 'Unknown',
    count: parseInt(item.count) || 0,
    total: parseFloat(item.total) || 0
  }));

  res.json({
    success: true,
    data: {
      summary: {
        totalCollection,
        totalTransactions: await Payment.count({
          where: whereClause,
          include: baseIncludes
        })
      },
      collectionByFeeType: transformedCollectionByFeeType,
      collectionByClass: transformedCollectionByClass,
      monthlyCollection: transformedMonthlyCollection
    }
  });
});

// @desc    Get outstanding fees report
// @route   GET /api/reports/outstanding-fees
// @access  Private (Admin, Accountant)
const getOutstandingFeesReport = asyncHandler(async (req, res) => {
  const { academic_year, class: studentClass, is_overdue } = req.query;

  const whereClause = { balance_amount: { [Op.gt]: 0 } };
  const studentWhereClause = {};
  const feeStructureWhereClause = {};

  if (academic_year) feeStructureWhereClause.academic_year = academic_year;
  if (studentClass) studentWhereClause.class = studentClass;
  if (is_overdue !== undefined) whereClause.is_overdue = is_overdue === 'true';

  // Build include array with conditional where clauses
  const includes = [
    {
      model: Student,
      as: 'student',
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number', 'phone', 'email'],
      ...(Object.keys(studentWhereClause).length > 0 && { where: studentWhereClause })
    },
    {
      model: FeeStructure,
      as: 'feeStructure',
      attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount'],
      ...(Object.keys(feeStructureWhereClause).length > 0 && { where: feeStructureWhereClause })
    }
  ];

  const outstandingFees = await FeeBalance.findAll({
    where: whereClause,
    include: includes,
    order: [['due_date', 'ASC']]
  });

  // Calculate summary statistics
  const totalOutstanding = outstandingFees.reduce((sum, fee) => sum + parseFloat(fee.balance_amount), 0);
  const overdueCount = outstandingFees.filter(fee => fee.is_overdue).length;
  const totalStudents = new Set(outstandingFees.map(fee => fee.student_id)).size;

  res.json({
    success: true,
    data: {
      summary: {
        totalOutstanding,
        overdueCount,
        totalStudents,
        totalFees: outstandingFees.length
      },
      outstandingFees
    }
  });
});

// @desc    Get payment history report
// @route   GET /api/reports/payment-history
// @access  Private (Admin, Accountant)
const getPaymentHistoryReport = asyncHandler(async (req, res) => {
  const {
    start_date,
    end_date,
    student_id,
    class: studentClass,
    payment_method,
    academic_year,
    page = 1,
    limit = 50
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { is_void: false };
  const studentWhereClause = {};
  const feeStructureWhereClause = {};

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  if (student_id) whereClause.student_id = student_id;
  if (studentClass) studentWhereClause.class = studentClass;
  if (payment_method) whereClause.payment_method = payment_method;
  if (academic_year) feeStructureWhereClause.academic_year = academic_year;

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student',
        where: studentWhereClause,
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: feeStructureWhereClause,
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year']
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

// @desc    Get class-wise collection report
// @route   GET /api/reports/class-wise-collection
// @access  Private (Admin, Accountant)
const getClassWiseCollectionReport = asyncHandler(async (req, res) => {
  const { academic_year, start_date, end_date } = req.query;

  const whereClause = { is_void: false };
  const feeStructureWhereClause = {};

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  if (academic_year) feeStructureWhereClause.academic_year = academic_year;

  const classWiseCollection = await Payment.findAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['class', 'section']
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: feeStructureWhereClause,
        attributes: ['fee_type']
      }
    ],
    attributes: [
      [Sequelize.col('student.class'), 'class'],
      [Sequelize.col('student.section'), 'section'],
      [Sequelize.col('feeStructure.fee_type'), 'fee_type'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: ['student.class', 'student.section', 'feeStructure.fee_type'],
    order: [['student.class', 'ASC'], ['student.section', 'ASC']]
  });

  // Group by class for summary
  const classSummary = {};
  classWiseCollection.forEach(item => {
    const classKey = `${item.dataValues.class}-${item.dataValues.section}`;
    if (!classSummary[classKey]) {
      classSummary[classKey] = {
        class: item.dataValues.class,
        section: item.dataValues.section,
        totalCollection: 0,
        totalTransactions: 0,
        feeTypes: {}
      };
    }
    
    classSummary[classKey].totalCollection += parseFloat(item.dataValues.total);
    classSummary[classKey].totalTransactions += parseInt(item.dataValues.count);
    classSummary[classKey].feeTypes[item.dataValues.fee_type] = {
      count: parseInt(item.dataValues.count),
      total: parseFloat(item.dataValues.total)
    };
  });

  res.json({
    success: true,
    data: {
      classWiseCollection,
      classSummary: Object.values(classSummary)
    }
  });
});

// @desc    Get monthly collection report
// @route   GET /api/reports/monthly-collection
// @access  Private (Admin, Accountant)
const getMonthlyCollectionReport = asyncHandler(async (req, res) => {
  const { year, academic_year } = req.query;

  const whereClause = { is_void: false };
  const feeStructureWhereClause = {};

  if (year) {
    whereClause.payment_date = {
      [Op.and]: [
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('Payment.payment_date')), year)
      ]
    };
  }

  if (academic_year) feeStructureWhereClause.academic_year = academic_year;

  const monthlyCollection = await Payment.findAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student'
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: feeStructureWhereClause
      }
    ],
    attributes: [
      [Sequelize.fn('MONTH', Sequelize.col('Payment.payment_date')), 'month'],
      [Sequelize.fn('YEAR', Sequelize.col('Payment.payment_date')), 'year'],
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total']
    ],
    group: [
      Sequelize.fn('YEAR', Sequelize.col('Payment.payment_date')),
      Sequelize.fn('MONTH', Sequelize.col('Payment.payment_date'))
    ],
    order: [
      [Sequelize.fn('YEAR', Sequelize.col('Payment.payment_date')), 'ASC'],
      [Sequelize.fn('MONTH', Sequelize.col('Payment.payment_date')), 'ASC']
    ]
  });

  // Get collection by fee type for the period
  const collectionByFeeType = await Payment.findAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        where: feeStructureWhereClause,
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

  res.json({
    success: true,
    data: {
      monthlyCollection,
      collectionByFeeType
    }
  });
});

// @desc    Get fee defaulters report
// @route   GET /api/reports/defaulters
// @access  Private (Admin, Accountant)
const getDefaultersReport = asyncHandler(async (req, res) => {
  const { academic_year, class: studentClass, days_overdue } = req.query;

  const whereClause = { 
    balance_amount: { [Op.gt]: 0 },
    is_overdue: true
  };
  const studentWhereClause = {};
  const feeStructureWhereClause = {};

  if (academic_year) feeStructureWhereClause.academic_year = academic_year;
  if (studentClass) studentWhereClause.class = studentClass;

  if (days_overdue) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days_overdue));
    whereClause.due_date = { [Op.lte]: cutoffDate };
  }

  // Build include array with conditional where clauses
  const defaulterIncludes = [
    {
      model: Student,
      as: 'student',
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number', 'phone', 'email'],
      ...(Object.keys(studentWhereClause).length > 0 && { where: studentWhereClause })
    },
    {
      model: FeeStructure,
      as: 'feeStructure',
      attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount'],
      ...(Object.keys(feeStructureWhereClause).length > 0 && { where: feeStructureWhereClause })
    }
  ];

  const defaulters = await FeeBalance.findAll({
    where: whereClause,
    include: defaulterIncludes,
    order: [['due_date', 'ASC']]
  });

  // Calculate days overdue for each defaulter
  const defaultersWithDaysOverdue = defaulters.map(fee => {
    const daysOverdue = Math.ceil((new Date() - new Date(fee.due_date)) / (1000 * 60 * 60 * 24));
    return {
      ...fee.toJSON(),
      daysOverdue
    };
  });

  // Group by student
  const studentDefaulters = {};
  defaultersWithDaysOverdue.forEach(fee => {
    const studentId = fee.student_id;
    if (!studentDefaulters[studentId]) {
      studentDefaulters[studentId] = {
        student: fee.student,
        totalOutstanding: 0,
        fees: [],
        maxDaysOverdue: 0
      };
    }
    
    studentDefaulters[studentId].totalOutstanding += parseFloat(fee.balance_amount);
    studentDefaulters[studentId].fees.push(fee);
    studentDefaulters[studentId].maxDaysOverdue = Math.max(
      studentDefaulters[studentId].maxDaysOverdue,
      fee.daysOverdue
    );
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalDefaulters: Object.keys(studentDefaulters).length,
        totalOutstanding: defaultersWithDaysOverdue.reduce((sum, fee) => sum + parseFloat(fee.balance_amount), 0),
        totalFees: defaultersWithDaysOverdue.length
      },
      studentDefaulters: Object.values(studentDefaulters)
    }
  });
});

// @desc    Generate custom report
// @route   POST /api/reports/custom
// @access  Private (Admin, Accountant)
const generateCustomReport = asyncHandler(async (req, res) => {
  const {
    report_type,
    start_date,
    end_date,
    academic_year,
    class: studentClass,
    fee_type,
    payment_method,
    group_by,
    format = 'json'
  } = req.body;

  // This is a simplified custom report generator
  // In a real application, you would have more sophisticated report generation logic
  
  let reportData = {};

  switch (report_type) {
    case 'collection_summary':
      // Reuse existing collection report logic
      const collectionReport = await getFeeCollectionReport(req, res);
      return collectionReport;

    case 'outstanding_fees':
      // Reuse existing outstanding fees report logic
      const outstandingReport = await getOutstandingFeesReport(req, res);
      return outstandingReport;

    case 'student_wise':
      // Generate student-wise payment summary
      const studentWiseData = await Payment.findAll({
        where: {
          is_void: false,
          ...(start_date && end_date && {
            payment_date: { [Op.between]: [start_date, end_date] }
          })
        },
        include: [
          {
            model: Student,
            as: 'student',
            where: studentClass ? { class: studentClass } : undefined,
            attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section']
          },
          {
            model: FeeStructure,
            as: 'feeStructure',
            where: {
              ...(academic_year && { academic_year }),
              ...(fee_type && { fee_type })
            },
            attributes: ['fee_type', 'academic_year']
          }
        ],
        attributes: [
          'student_id',
          [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'payment_count'],
          [Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'total_paid']
        ],
        group: ['student_id'],
        order: [[Sequelize.fn('SUM', Sequelize.col('Payment.amount_paid')), 'DESC']]
      });

      reportData = { studentWiseData };
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
  }

  res.json({
    success: true,
    data: reportData,
    metadata: {
      generated_at: new Date(),
      parameters: req.body
    }
  });
});

// @desc    Get reports summary (all key metrics in one call)
// @route   GET /api/reports/summary
// @access  Private (Admin, Accountant)
const getReportsSummary = asyncHandler(async (req, res) => {
  const { academic_year } = req.query;

  // Get total collection
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
        attributes: [],
        ...(academic_year && { required: true })
      }
    ]
  }) || 0;

  // Get total transactions count
  const totalTransactions = await Payment.count({
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
        attributes: [],
        ...(academic_year && { required: true })
      }
    ]
  });

  // Get total outstanding amount
  const totalOutstanding = await FeeBalance.sum('balance_amount', {
    where: {
      balance_amount: { [Op.gt]: 0 },
      ...(academic_year && { academic_year })
    }
  }) || 0;

  // Get defaulters count (students with overdue fees)
  const defaultersCount = await FeeBalance.count({
    where: {
      balance_amount: { [Op.gt]: 0 },
      is_overdue: true,
      ...(academic_year && { academic_year })
    },
    distinct: true,
    col: 'student_id'
  });

  // Get total expected (from fee balances)
  const totalExpected = await FeeBalance.sum('total_amount', {
    where: {
      ...(academic_year && { academic_year })
    }
  }) || 0;

  // Calculate collection rate
  const collectionRate = totalExpected > 0 ? (totalCollection / totalExpected) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalCollection: Math.round(totalCollection * 100) / 100,
      totalTransactions,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      defaulters: defaultersCount,
      collectionRate: Math.round(collectionRate * 100) / 100
    }
  });
});

module.exports = {
  getFeeCollectionReport,
  getOutstandingFeesReport,
  getPaymentHistoryReport,
  getClassWiseCollectionReport,
  getMonthlyCollectionReport,
  getDefaultersReport,
  getReportsSummary,
  generateCustomReport
};
