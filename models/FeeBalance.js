const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeBalance = sequelize.define('FeeBalance', {
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
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  is_overdue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  late_fee_applied: {
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
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false
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
  tableName: 'fee_balances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'fee_structure_id']
    },
    {
      fields: ['is_overdue']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['academic_year']
    }
  ]
});

// Instance methods
FeeBalance.prototype.calculateBalance = function() {
  this.balance_amount = parseFloat(this.total_amount) - parseFloat(this.paid_amount);
  return this.balance_amount;
};

FeeBalance.prototype.isFullyPaid = function() {
  return parseFloat(this.balance_amount) <= 0;
};

FeeBalance.prototype.getDaysOverdue = function() {
  if (!this.is_overdue) return 0;
  const today = new Date();
  const dueDate = new Date(this.due_date);
  const diffTime = today - dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = FeeBalance;

