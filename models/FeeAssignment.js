const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeAssignment = sequelize.define('FeeAssignment', {
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
  assigned_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('assigned', 'waived', 'cancelled'),
    allowNull: false,
    defaultValue: 'assigned'
  },
  waived_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  waived_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  waived_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  custom_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'fee_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'fee_structure_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = FeeAssignment;

