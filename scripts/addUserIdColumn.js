/**
 * Migration script to add user_id column to students table
 * Run this script on your production database to fix the schema mismatch
 * 
 * Usage: node scripts/addUserIdColumn.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const addUserIdColumn = async () => {
  try {
    console.log('🔄 Starting migration: Adding user_id column to students table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'user_id'
    `, { type: QueryTypes.SELECT });

    if (results.count > 0) {
      console.log('✅ Column user_id already exists. Skipping migration.');
      await sequelize.close();
      process.exit(0);
    }

    // Add the user_id column
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN user_id INT NULL UNIQUE AFTER parent_id,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `);

    console.log('✅ Successfully added user_id column to students table');
    console.log('✅ Added foreign key constraint to users table');
    
    await sequelize.close();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    
    // If column exists but foreign key failed, that's okay
    if (error.message.includes('Duplicate column name')) {
      console.log('⚠️  Column already exists. Migration may have been partially applied.');
    }
    
    await sequelize.close();
    process.exit(1);
  }
};

// Run migration
addUserIdColumn();

