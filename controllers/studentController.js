const { Student, User, FeeAssignment, Payment, FeeBalance, FeeStructure } = require('../models/associations');
const { Op } = require('sequelize');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

// @desc    Get all students with pagination and filtering
// @route   GET /api/students
// @access  Private (Admin, Accountant)
const getStudents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    class: studentClass,
    section,
    status,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Build search conditions
  if (search) {
    whereClause[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { student_id: { [Op.like]: `%${search}%` } },
      { roll_number: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  if (studentClass) whereClause.class = studentClass;
  if (section) whereClause.section = section;
  if (status) whereClause.status = status;

  const { count, rows: students } = await Student.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'parent',
        attributes: ['id', 'username', 'email', 'role']
      }
    ],
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: {
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByPk(id, {
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
      message: 'Student not found'
    });
  }

  res.json({
    success: true,
    data: { student }
  });
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin, Accountant)
const createStudent = asyncHandler(async (req, res) => {
  const studentData = req.body;

  // Check if student ID already exists
  const existingStudent = await Student.findOne({
    where: { student_id: studentData.student_id }
  });

  if (existingStudent) {
    return res.status(400).json({
      success: false,
      message: 'Student with this ID already exists'
    });
  }

  // Check if roll number already exists in the same class and section
  const existingRollNumber = await Student.findOne({
    where: {
      class: studentData.class,
      section: studentData.section,
      roll_number: studentData.roll_number
    }
  });

  if (existingRollNumber) {
    return res.status(400).json({
      success: false,
      message: 'Roll number already exists in this class and section'
    });
  }

  const student = await Student.create(studentData);

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: { student }
  });
});

// @desc    Update student information
// @route   PUT /api/students/:id
// @access  Private (Admin, Accountant)
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Check for duplicate student ID if it's being changed
  if (updateData.student_id && updateData.student_id !== student.student_id) {
    const existingStudent = await Student.findOne({
      where: { student_id: updateData.student_id }
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this ID already exists'
      });
    }
  }

  // Check for duplicate roll number if it's being changed
  if ((updateData.class || updateData.section || updateData.roll_number) &&
      (updateData.class !== student.class || 
       updateData.section !== student.section || 
       updateData.roll_number !== student.roll_number)) {
    
    const existingRollNumber = await Student.findOne({
      where: {
        class: updateData.class || student.class,
        section: updateData.section || student.section,
        roll_number: updateData.roll_number || student.roll_number
      }
    });

    if (existingRollNumber && existingRollNumber.id !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists in this class and section'
      });
    }
  }

  await student.update(updateData);

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: { student }
  });
});

// @desc    Delete/deactivate student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Soft delete by changing status
  await student.update({ status: 'inactive' });

  res.json({
    success: true,
    message: 'Student deactivated successfully'
  });
});

// @desc    Get all fees for a student
// @route   GET /api/students/:id/fees
// @access  Private
const getStudentFees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { academic_year } = req.query;

  const whereClause = { student_id: id };
  if (academic_year) {
    whereClause['$FeeStructure.academic_year$'] = academic_year;
  }

  const feeAssignments = await FeeAssignment.findAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount', 'description']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: { feeAssignments }
  });
});

// @desc    Get payment history for a student
// @route   GET /api/students/:id/payments
// @access  Private
const getStudentPayments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    page = 1,
    limit = 10,
    start_date,
    end_date,
    payment_method
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { student_id: id };

  if (start_date || end_date) {
    whereClause.payment_date = {};
    if (start_date) whereClause.payment_date[Op.gte] = start_date;
    if (end_date) whereClause.payment_date[Op.lte] = end_date;
  }

  if (payment_method) whereClause.payment_method = payment_method;

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: whereClause,
    include: [
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

// @desc    Get current balance for a student
// @route   GET /api/students/:id/balance
// @access  Private
const getStudentBalance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { academic_year } = req.query;

  const whereClause = { student_id: id };
  if (academic_year) {
    whereClause.academic_year = academic_year;
  }

  const feeBalances = await FeeBalance.findAll({
    where: whereClause,
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['id', 'class', 'fee_type', 'amount', 'academic_year', 'due_date', 'late_fee_amount']
      }
    ],
    order: [['due_date', 'ASC']]
  });

  // Calculate totals
  const totalAmount = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.total_amount), 0);
  const totalPaid = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.paid_amount), 0);
  const totalBalance = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.balance_amount), 0);
  const overdueCount = feeBalances.filter(balance => balance.is_overdue).length;

  res.json({
    success: true,
    data: {
      feeBalances,
      summary: {
        totalAmount,
        totalPaid,
        totalBalance,
        overdueCount,
        totalFees: feeBalances.length
      }
    }
  });
});

// @desc    Get students by class
// @route   GET /api/students/class/:class
// @access  Private (Admin, Accountant)
const getStudentsByClass = asyncHandler(async (req, res) => {
  const { class: studentClass } = req.params;
  const { section } = req.query;

  const whereClause = { class: studentClass };
  if (section) whereClause.section = section;

  const students = await Student.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'parent',
        attributes: ['id', 'username', 'email']
      }
    ],
    order: [['roll_number', 'ASC']]
  });

  res.json({
    success: true,
    data: { students }
  });
});

// @desc    Get student statistics
// @route   GET /api/students/:id/stats
// @access  Private
const getStudentStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByPk(id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Get payment statistics
  const totalPayments = await Payment.count({
    where: { student_id: id, is_void: false }
  });

  const totalPaid = await Payment.sum('amount_paid', {
    where: { student_id: id, is_void: false }
  }) || 0;

  const lastPayment = await Payment.findOne({
    where: { student_id: id, is_void: false },
    order: [['payment_date', 'DESC']],
    include: [
      {
        model: FeeStructure,
        as: 'feeStructure',
        attributes: ['fee_type']
      }
    ]
  });

  // Get fee balance statistics
  const feeBalances = await FeeBalance.findAll({
    where: { student_id: id }
  });

  const totalBalance = feeBalances.reduce((sum, balance) => sum + parseFloat(balance.balance_amount), 0);
  const overdueFees = feeBalances.filter(balance => balance.is_overdue).length;

  res.json({
    success: true,
    data: {
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.getFullName(),
        class: student.class,
        section: student.section
      },
      stats: {
        totalPayments,
        totalPaid,
        totalBalance,
        overdueFees,
        lastPayment: lastPayment ? {
          amount: lastPayment.amount_paid,
          date: lastPayment.payment_date,
          feeType: lastPayment.feeStructure?.fee_type
        } : null
      }
    }
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFees,
  getStudentPayments,
  getStudentBalance,
  getStudentsByClass,
  getStudentStats
};
