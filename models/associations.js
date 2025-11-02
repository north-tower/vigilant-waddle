const User = require('./User');
const Student = require('./Student');
const FeeStructure = require('./FeeStructure');
const FeeAssignment = require('./FeeAssignment');
const Payment = require('./Payment');
const FeeBalance = require('./FeeBalance');

// User associations
User.hasMany(Student, {
  foreignKey: 'parent_id',
  as: 'children'
});

User.hasMany(Payment, {
  foreignKey: 'received_by',
  as: 'receivedPayments'
});

User.hasMany(Payment, {
  foreignKey: 'voided_by',
  as: 'voidedPayments'
});

User.hasMany(FeeStructure, {
  foreignKey: 'created_by',
  as: 'createdFeeStructures'
});

User.hasMany(FeeAssignment, {
  foreignKey: 'created_by',
  as: 'createdFeeAssignments'
});

User.hasMany(FeeAssignment, {
  foreignKey: 'waived_by',
  as: 'waivedFeeAssignments'
});

// Student associations
Student.belongsTo(User, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Student.hasMany(FeeAssignment, {
  foreignKey: 'student_id',
  as: 'feeAssignments'
});

Student.hasMany(Payment, {
  foreignKey: 'student_id',
  as: 'payments'
});

Student.hasMany(FeeBalance, {
  foreignKey: 'student_id',
  as: 'feeBalances'
});

// FeeStructure associations
FeeStructure.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

FeeStructure.hasMany(FeeAssignment, {
  foreignKey: 'fee_structure_id',
  as: 'assignments'
});

FeeStructure.hasMany(Payment, {
  foreignKey: 'fee_structure_id',
  as: 'payments'
});

FeeStructure.hasMany(FeeBalance, {
  foreignKey: 'fee_structure_id',
  as: 'balances'
});

// FeeAssignment associations
FeeAssignment.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student'
});

FeeAssignment.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

FeeAssignment.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

FeeAssignment.belongsTo(User, {
  foreignKey: 'waived_by',
  as: 'waivedBy'
});

// Payment associations
Payment.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student'
});

Payment.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

Payment.belongsTo(User, {
  foreignKey: 'received_by',
  as: 'receivedBy'
});

Payment.belongsTo(User, {
  foreignKey: 'voided_by',
  as: 'voidedBy'
});

// FeeBalance associations
FeeBalance.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student'
});

FeeBalance.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

module.exports = {
  User,
  Student,
  FeeStructure,
  FeeAssignment,
  Payment,
  FeeBalance
};

