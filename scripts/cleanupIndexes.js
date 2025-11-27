/**
 * Script to clean up redundant indexes from the users table
 * This fixes the "Too many keys specified; max 64 keys allowed" error
 */

const { sequelize } = require('../config/database');

const cleanupIndexes = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all indexes on the users table
    const [indexes] = await sequelize.query(`
      SHOW INDEXES FROM users
    `);

    console.log('\n📊 Current indexes on users table:');
    console.table(indexes.map(idx => ({
      Key_name: idx.Key_name,
      Column_name: idx.Column_name,
      Non_unique: idx.Non_unique,
      Seq_in_index: idx.Seq_in_index
    })));

    // Find redundant indexes
    // UNIQUE constraints already create indexes, so we don't need separate INDEX statements
    const redundantIndexes = [];
    const uniqueIndexes = new Set();
    
    indexes.forEach(idx => {
      if (idx.Non_unique === 0) {
        // This is a unique index
        uniqueIndexes.add(idx.Column_name);
      }
    });

    // Check for redundant non-unique indexes on columns that already have unique indexes
    indexes.forEach(idx => {
      if (idx.Non_unique === 1 && uniqueIndexes.has(idx.Column_name)) {
        // This is a redundant index - the column already has a unique index
        if (!redundantIndexes.find(r => r.name === idx.Key_name)) {
          redundantIndexes.push({
            name: idx.Key_name,
            column: idx.Column_name
          });
        }
      }
    });

    if (redundantIndexes.length === 0) {
      console.log('\n✅ No redundant indexes found. The issue might be too many foreign key indexes.');
      console.log('💡 Consider removing some foreign key relationships or using a different sync strategy.');
      return;
    }

    console.log('\n🗑️  Found redundant indexes:');
    redundantIndexes.forEach(idx => {
      console.log(`   - ${idx.name} on column ${idx.column}`);
    });

    // Ask for confirmation (in a real scenario, you'd want user input)
    console.log('\n⚠️  To remove these indexes, run the following SQL commands:');
    redundantIndexes.forEach(idx => {
      console.log(`   ALTER TABLE users DROP INDEX ${idx.name};`);
    });

    console.log('\n💡 Alternatively, you can run this script with --execute flag to auto-remove (not implemented for safety)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run if called directly
if (require.main === module) {
  cleanupIndexes();
}

module.exports = { cleanupIndexes };




