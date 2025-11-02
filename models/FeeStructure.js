const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeStructure = sequelize.define('FeeStructure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  class: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fee_type: {
    type: DataTypes.ENUM('tuition', 'transport', 'library', 'exam', 'sports', 'lab', 'other'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  },
  academic_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  late_fee_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_mandatory: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'fee_structures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['class', 'academic_year']
    },
    {
      fields: ['fee_type']
    }
  ]
});

// Instance methods
FeeStructure.prototype.getDisplayName = function() {
  return `${this.fee_type.charAt(0).toUpperCase() + this.fee_type.slice(1)} Fee - ${this.class}`;
};

FeeStructure.prototype.isOverdue = function() {
  const today = new Date();
  const dueDate = new Date(this.due_date);
  return today > dueDate;
};

module.exports = FeeStructure;

