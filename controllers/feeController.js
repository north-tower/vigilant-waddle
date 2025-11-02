const { FeeStructure, FeeAssignment, Student, FeeBalance, User } = require('../models/associations');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get all fee structures
// @route   GET /api/fee-structures
// @access  Private (Admin, Accountant)
const getFeeStructures = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    class: studentClass,
    fee_type,
    academic_year,
    is_active,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  if (studentClass) whereClause.class = studentClass;
  if (fee_type) whereClause.fee_type = fee_type;
  if (academic_year) whereClause.academic_year = academic_year;
  if (is_active !== undefined) whereClause.is_active = is_active === 'true';

  const { count, rows: feeStructures } = await FeeStructure.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'creator',
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
      feeStructures,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get specific fee structure
// @route   GET /api/fee-structures/:id
// @access  Private (Admin, Accountant)
const getFeeStructureById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feeStructure = await FeeStructure.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email']
      }
    ]
  });

  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  res.json({
    success: true,
    data: { feeStructure }
  });
});

// @desc    Create new fee structure
// @route   POST /api/fee-structures
// @access  Private (Admin, Accountant)
const createFeeStructure = asyncHandler(async (req, res) => {
  const feeStructureData = {
    ...req.body,
    created_by: req.user.id
  };

  // Check if fee structure already exists for the same class, fee_type, and academic_year
  const existingFeeStructure = await FeeStructure.findOne({
    where: {
      class: feeStructureData.class,
      fee_type: feeStructureData.fee_type,
      academic_year: feeStructureData.academic_year
    }
  });

  if (existingFeeStructure) {
    return res.status(400).json({
      success: false,
      message: 'Fee structure already exists for this class, fee type, and academic year'
    });
  }

  const feeStructure = await FeeStructure.create(feeStructureData);

  res.status(201).json({
    success: true,
    message: 'Fee structure created successfully',
    data: { feeStructure }
  });
});

// @desc    Update fee structure
// @route   PUT /api/fee-structures/:id
// @access  Private (Admin, Accountant)
const updateFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const feeStructure = await FeeStructure.findByPk(id);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Check for duplicate if class, fee_type, or academic_year is being changed
  if (updateData.class || updateData.fee_type || updateData.academic_year) {
    const existingFeeStructure = await FeeStructure.findOne({
      where: {
        class: updateData.class || feeStructure.class,
        fee_type: updateData.fee_type || feeStructure.fee_type,
        academic_year: updateData.academic_year || feeStructure.academic_year,
        id: { [Op.ne]: id }
      }
    });

    if (existingFeeStructure) {
      return res.status(400).json({
        success: false,
        message: 'Fee structure already exists for this class, fee type, and academic year'
      });
    }
  }

  await feeStructure.update(updateData);

  res.json({
    success: true,
    message: 'Fee structure updated successfully',
    data: { feeStructure }
  });
});

// @desc    Delete fee structure
// @route   DELETE /api/fee-structures/:id
// @access  Private (Admin only)
const deleteFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feeStructure = await FeeStructure.findByPk(id);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Check if fee structure has any assignments
  const assignmentsCount = await FeeAssignment.count({
    where: { fee_structure_id: id }
  });

  if (assignmentsCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete fee structure with existing assignments'
    });
  }

  await feeStructure.destroy();

  res.json({
    success: true,
    message: 'Fee structure deleted successfully'
  });
});

// @desc    Assign fee structure to students
// @route   POST /api/fee-structures/:id/assign
// @access  Private (Admin, Accountant)
const assignFeeStructure = asyncHandler(async (req, res) => {
  const { id: feeStructureId } = req.params;
  const { student_ids, class: studentClass, section, academic_year } = req.body;

  const feeStructure = await FeeStructure.findByPk(feeStructureId);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  let students = [];

  if (student_ids && student_ids.length > 0) {
    // Assign to specific students
    students = await Student.findAll({
      where: { id: { [Op.in]: student_ids } }
    });
  } else if (studentClass) {
    // Assign to all students in a class
    const whereClause = { class: studentClass };
    if (section) whereClause.section = section;
    if (academic_year) whereClause.academic_year = academic_year;

    students = await Student.findAll({
      where: whereClause
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either student_ids or class must be provided'
    });
  }

  if (students.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No students found for assignment'
    });
  }

  // Create fee assignments
  const assignments = [];
  const balances = [];

  for (const student of students) {
    // Check if assignment already exists
    const existingAssignment = await FeeAssignment.findOne({
      where: {
        student_id: student.id,
        fee_structure_id: feeStructureId
      }
    });

    if (!existingAssignment) {
      const assignment = await FeeAssignment.create({
        student_id: student.id,
        fee_structure_id: feeStructureId,
        created_by: req.user.id
      });
      assignments.push(assignment);

      // Create fee balance record
      const balance = await FeeBalance.create({
        student_id: student.id,
        fee_structure_id: feeStructureId,
        total_amount: feeStructure.amount,
        paid_amount: 0,
        balance_amount: feeStructure.amount,
        due_date: feeStructure.due_date,
        academic_year: feeStructure.academic_year,
        is_overdue: feeStructure.isOverdue()
      });
      balances.push(balance);
    }
  }

  res.json({
    success: true,
    message: `Fee structure assigned to ${assignments.length} students`,
    data: {
      assignments,
      balances,
      totalAssigned: assignments.length
    }
  });
});

// @desc    Get fee assignments
// @route   GET /api/fee-structures/assignments
// @access  Private (Admin, Accountant)
const getFeeAssignments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    student_id,
    fee_structure_id,
    status,
    class: studentClass,
    academic_year
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  if (student_id) whereClause.student_id = student_id;
  if (fee_structure_id) whereClause.fee_structure_id = fee_structure_id;
  if (status) whereClause.status = status;

  const { count, rows: assignments } = await FeeAssignment.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'student_id', 'first_name', 'last_name', 'class', 'section', 'roll_number'],
        where: studentClass ? { class: studentClass } : undefined
      },
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date'],
        where: academic_year ? { academic_year } : undefined
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Waive fee assignment
// @route   PUT /api/fee-structures/assignments/:id/waive
// @access  Private (Admin only)
const waiveFeeAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const assignment = await FeeAssignment.findByPk(id);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Fee assignment not found'
    });
  }

  if (assignment.status === 'waived') {
    return res.status(400).json({
      success: false,
      message: 'Fee assignment is already waived'
    });
  }

  await assignment.update({
    status: 'waived',
    waived_reason: reason,
    waived_by: req.user.id,
    waived_date: new Date()
  });

  // Update corresponding fee balance
  await FeeBalance.update(
    { balance_amount: 0 },
    {
      where: {
        student_id: assignment.student_id,
        fee_structure_id: assignment.fee_structure_id
      }
    }
  );

  res.json({
    success: true,
    message: 'Fee assignment waived successfully',
    data: { assignment }
  });
});

// @desc    Get fee structure statistics
// @route   GET /api/fee-structures/:id/stats
// @access  Private (Admin, Accountant)
const getFeeStructureStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feeStructure = await FeeStructure.findByPk(id);
  if (!feeStructure) {
    return res.status(404).json({
      success: false,
      message: 'Fee structure not found'
    });
  }

  // Get assignment statistics
  const totalAssignments = await FeeAssignment.count({
    where: { fee_structure_id: id }
  });

  const waivedAssignments = await FeeAssignment.count({
    where: { fee_structure_id: id, status: 'waived' }
  });

  const activeAssignments = totalAssignments - waivedAssignments;

  // Get payment statistics
  const totalPayments = await Payment.sum('amount_paid', {
    where: { fee_structure_id: id, is_void: false }
  }) || 0;

  const totalExpected = activeAssignments * parseFloat(feeStructure.amount);
  const collectionRate = totalExpected > 0 ? (totalPayments / totalExpected) * 100 : 0;

  // Get balance statistics
  const feeBalances = await FeeBalance.findAll({
    where: { fee_structure_id: id }
  });

  const totalBalance = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.balance_amount), 0);
  const overdueCount = feeBalances.filter(balance => balance.is_overdue).length;

  res.json({
    success: true,
    data: {
      feeStructure: {
        id: feeStructure.id,
        class: feeStructure.class,
        fee_type: feeStructure.fee_type,
        amount: feeStructure.amount,
        academic_year: feeStructure.academic_year
      },
      stats: {
        totalAssignments,
        activeAssignments,
        waivedAssignments,
        totalExpected,
        totalPayments,
        totalBalance,
        collectionRate: Math.round(collectionRate * 100) / 100,
        overdueCount
      }
    }
  });
});

module.exports = {
  getFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  assignFeeStructure,
  getFeeAssignments,
  waiveFeeAssignment,
  getFeeStructureStats
};
