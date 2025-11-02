const { sequelize } = require('../config/database');

// Setup test database
beforeAll(async () => {
  // Sync database for tests
  await sequelize.sync({ force: true });
});

// Clean up after tests
afterAll(async () => {
  await sequelize.close();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data
  const { User, Student, FeeStructure, FeeAssignment, Payment, FeeBalance } = require('../models/associations');
  
  await Payment.destroy({ where: {} });
  await FeeBalance.destroy({ where: {} });
  await FeeAssignment.destroy({ where: {} });
  await FeeStructure.destroy({ where: {} });
  await Student.destroy({ where: {} });
  await User.destroy({ where: {} });
});

