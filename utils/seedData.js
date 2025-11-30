const { sequelize } = require('../config/database');
const { User, Student, FeeStructure, FeeAssignment, Payment, FeeBalance } = require('../models/associations');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data (in development only)
    if (process.env.NODE_ENV === 'production') {
      console.log('🗑️  Clearing existing data...');
      await Payment.destroy({ where: {} });
      await FeeBalance.destroy({ where: {} });
      await FeeAssignment.destroy({ where: {} });
      await FeeStructure.destroy({ where: {} });
      await Student.destroy({ where: {} });
      await User.destroy({ where: {} });
    }

    // Create users
    console.log('👥 Creating users...');
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@feemanagement.com',
        password_hash: await bcrypt.hash('admin123', 12),
        role: 'admin',
        is_active: true
      },
      {
        username: 'accountant1',
        email: 'accountant@feemanagement.com',
        password_hash: await bcrypt.hash('accountant123', 12),
        role: 'accountant',
        is_active: true
      },
      {
        username: 'parent1',
        email: 'parent@feemanagement.com',
        password_hash: await bcrypt.hash('parent123', 12),
        role: 'parent',
        is_active: true
      },
      {
        username: 'parent2',
        email: 'parent2@feemanagement.com',
        password_hash: await bcrypt.hash('parent123', 12),
        role: 'parent',
        is_active: true
      }
    ]);

    // Create students
    console.log('🎓 Creating students...');
    const students = await Student.bulkCreate([
      {
        student_id: '2024X1A001',
        first_name: 'John',
        last_name: 'Doe',
        class: 'X',
        section: 'A',
        roll_number: '001',
        phone: '+1234567890',
        email: 'john.doe@student.com',
        address: '123 Main St, City, State',
        parent_id: users[2].id,
        admission_date: '2024-04-01',
        date_of_birth: '2008-05-15',
        gender: 'male',
        blood_group: 'O+',
        emergency_contact: '+1234567890',
        emergency_contact_name: 'Jane Doe'
      },
      {
        student_id: '2024X1A002',
        first_name: 'Jane',
        last_name: 'Smith',
        class: 'X',
        section: 'A',
        roll_number: '002',
        phone: '+1234567891',
        email: 'jane.smith@student.com',
        address: '456 Oak Ave, City, State',
        parent_id: users[2].id,
        admission_date: '2024-04-01',
        date_of_birth: '2008-07-20',
        gender: 'female',
        blood_group: 'A+',
        emergency_contact: '+1234567891',
        emergency_contact_name: 'John Smith'
      },
      {
        student_id: '2024X1B001',
        first_name: 'Mike',
        last_name: 'Johnson',
        class: 'X',
        section: 'B',
        roll_number: '001',
        phone: '+1234567892',
        email: 'mike.johnson@student.com',
        address: '789 Pine St, City, State',
        parent_id: users[3].id,
        admission_date: '2024-04-01',
        date_of_birth: '2008-03-10',
        gender: 'male',
        blood_group: 'B+',
        emergency_contact: '+1234567892',
        emergency_contact_name: 'Sarah Johnson'
      },
      {
        student_id: '2024IXA001',
        first_name: 'Sarah',
        last_name: 'Wilson',
        class: 'IX',
        section: 'A',
        roll_number: '001',
        phone: '+1234567893',
        email: 'sarah.wilson@student.com',
        address: '321 Elm St, City, State',
        parent_id: users[3].id,
        admission_date: '2024-04-01',
        date_of_birth: '2009-01-25',
        gender: 'female',
        blood_group: 'AB+',
        emergency_contact: '+1234567893',
        emergency_contact_name: 'Robert Wilson'
      },
      {
        student_id: '2024IXA002',
        first_name: 'David',
        last_name: 'Brown',
        class: 'IX',
        section: 'A',
        roll_number: '002',
        phone: '+1234567894',
        email: 'david.brown@student.com',
        address: '654 Maple Ave, City, State',
        parent_id: users[2].id,
        admission_date: '2024-04-01',
        date_of_birth: '2009-06-12',
        gender: 'male',
        blood_group: 'O-',
        emergency_contact: '+1234567894',
        emergency_contact_name: 'Lisa Brown'
      }
    ]);

    // Create fee structures
    console.log('💰 Creating fee structures...');
    const currentYear = moment().format('YYYY-YYYY');
    const feeStructures = await FeeStructure.bulkCreate([
      {
        class: 'X',
        fee_type: 'tuition',
        amount: 5000.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 100.00,
        description: 'Monthly tuition fee for Class X',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'X',
        fee_type: 'transport',
        amount: 800.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 50.00,
        description: 'Monthly transport fee for Class X',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'X',
        fee_type: 'library',
        amount: 200.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 25.00,
        description: 'Library fee for Class X',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'IX',
        fee_type: 'tuition',
        amount: 4500.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 100.00,
        description: 'Monthly tuition fee for Class IX',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'IX',
        fee_type: 'transport',
        amount: 800.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 50.00,
        description: 'Monthly transport fee for Class IX',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'IX',
        fee_type: 'library',
        amount: 200.00,
        academic_year: currentYear,
        due_date: '2024-05-01',
        late_fee_amount: 25.00,
        description: 'Library fee for Class IX',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'X',
        fee_type: 'exam',
        amount: 300.00,
        academic_year: currentYear,
        due_date: '2024-06-01',
        late_fee_amount: 30.00,
        description: 'Examination fee for Class X',
        is_mandatory: true,
        created_by: users[0].id
      },
      {
        class: 'IX',
        fee_type: 'exam',
        amount: 300.00,
        academic_year: currentYear,
        due_date: '2024-06-01',
        late_fee_amount: 30.00,
        description: 'Examination fee for Class IX',
        is_mandatory: true,
        created_by: users[0].id
      }
    ]);

    // Create fee assignments
    console.log('📋 Creating fee assignments...');
    const assignments = [];
    
    // Assign fees to Class X students
    const classXStudents = students.filter(s => s.class === 'X');
    const classXFeeStructures = feeStructures.filter(f => f.class === 'X');
    
    for (const student of classXStudents) {
      for (const feeStructure of classXFeeStructures) {
        assignments.push({
          student_id: student.id,
          fee_structure_id: feeStructure.id,
          created_by: users[0].id
        });
      }
    }

    // Assign fees to Class IX students
    const classIXStudents = students.filter(s => s.class === 'IX');
    const classIXFeeStructures = feeStructures.filter(f => f.class === 'IX');
    
    for (const student of classIXStudents) {
      for (const feeStructure of classIXFeeStructures) {
        assignments.push({
          student_id: student.id,
          fee_structure_id: feeStructure.id,
          created_by: users[0].id
        });
      }
    }

    await FeeAssignment.bulkCreate(assignments);

    // Create fee balances
    console.log('⚖️  Creating fee balances...');
    const balances = [];
    
    for (const assignment of assignments) {
      const feeStructure = feeStructures.find(f => f.id === assignment.fee_structure_id);
      balances.push({
        student_id: assignment.student_id,
        fee_structure_id: assignment.fee_structure_id,
        total_amount: feeStructure.amount,
        paid_amount: 0,
        balance_amount: feeStructure.amount,
        due_date: feeStructure.due_date,
        is_overdue: moment().isAfter(moment(feeStructure.due_date)),
        academic_year: feeStructure.academic_year
      });
    }

    await FeeBalance.bulkCreate(balances);

    // Create sample payments
    console.log('💳 Creating sample payments...');
    const payments = [];
    const paymentMethods = ['cash', 'card', 'bank_transfer', 'online'];
    
    // Create some payments for demonstration
    const samplePayments = [
      {
        student_id: students[0].id,
        fee_structure_id: feeStructures[0].id,
        amount_paid: 2500.00,
        payment_date: moment().subtract(10, 'days').toDate(),
        payment_method: 'cash',
        received_by: users[1].id,
        notes: 'Partial payment'
      },
      {
        student_id: students[0].id,
        fee_structure_id: feeStructures[1].id,
        amount_paid: 800.00,
        payment_date: moment().subtract(5, 'days').toDate(),
        payment_method: 'card',
        received_by: users[1].id
      },
      {
        student_id: students[1].id,
        fee_structure_id: feeStructures[0].id,
        amount_paid: 5000.00,
        payment_date: moment().subtract(15, 'days').toDate(),
        payment_method: 'bank_transfer',
        received_by: users[1].id,
        bank_reference: 'TXN123456789'
      },
      {
        student_id: students[2].id,
        fee_structure_id: feeStructures[0].id,
        amount_paid: 3000.00,
        payment_date: moment().subtract(8, 'days').toDate(),
        payment_method: 'online',
        received_by: users[1].id,
        transaction_id: 'TXN987654321'
      },
      {
        student_id: students[3].id,
        fee_structure_id: feeStructures[3].id,
        amount_paid: 4500.00,
        payment_date: moment().subtract(12, 'days').toDate(),
        payment_method: 'cash',
        received_by: users[1].id
      }
    ];

    // Generate receipt numbers and create payments
    for (let i = 0; i < samplePayments.length; i++) {
      const payment = samplePayments[i];
      const receiptNumber = `RCP-${moment().format('YYYYMMDD')}-${String(i + 1).padStart(4, '0')}`;
      
      payments.push({
        ...payment,
        receipt_number: receiptNumber,
        late_fee_paid: 0,
        discount_applied: 0
      });
    }

    await Payment.bulkCreate(payments);

    // Update fee balances after payments
    console.log('🔄 Updating fee balances...');
    for (const payment of payments) {
      const balance = await FeeBalance.findOne({
        where: {
          student_id: payment.student_id,
          fee_structure_id: payment.fee_structure_id
        }
      });

      if (balance) {
        const newPaidAmount = parseFloat(balance.paid_amount) + parseFloat(payment.amount_paid);
        const newBalanceAmount = parseFloat(balance.total_amount) - newPaidAmount;
        
        await balance.update({
          paid_amount: newPaidAmount,
          balance_amount: Math.max(0, newBalanceAmount),
          last_payment_date: payment.payment_date
        });
      }
    }

    console.log('✅ Data seeding completed successfully!');
    console.log(`👥 Created ${users.length} users`);
    console.log(`🎓 Created ${students.length} students`);
    console.log(`💰 Created ${feeStructures.length} fee structures`);
    console.log(`📋 Created ${assignments.length} fee assignments`);
    console.log(`⚖️  Created ${balances.length} fee balances`);
    console.log(`💳 Created ${payments.length} payments`);

    console.log('\n🔑 Default login credentials:');
    console.log('Admin: admin@feemanagement.com / admin123');
    console.log('Accountant: accountant@feemanagement.com / accountant123');
    console.log('Parent: parent@feemanagement.com / parent123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;

