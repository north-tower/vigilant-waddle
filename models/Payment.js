const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  fee_structure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'fee_structures',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
      notNull: true
    }
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque', 'other'),
    allowNull: false,
    defaultValue: 'cash'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  receipt_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  late_fee_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_applied: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  received_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receipt_file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_void: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  void_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  voided_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  voided_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bank_reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cheque_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cheque_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['payment_date']
    },
    {
      fields: ['receipt_number']
    },
    {
      fields: ['is_void']
    }
  ]
});

// Instance methods
Payment.prototype.getTotalAmount = function() {
  return parseFloat(this.amount_paid) + parseFloat(this.late_fee_paid) - parseFloat(this.discount_applied);
};

Payment.prototype.isOverdue = function() {
  // This would need to be calculated based on fee structure due date
  return false; // Placeholder
};

module.exports = Payment;

