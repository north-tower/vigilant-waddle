#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Fee Management System Backend...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please update the database credentials.');
  } else {
    console.log('⚠️  env.example file not found. Please create .env file manually.');
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('\n📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory already exists');
}

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('\n📁 Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created');
} else {
  console.log('✅ Logs directory already exists');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update the .env file with your database credentials');
console.log('2. Create the MySQL database and run the schema:');
console.log('   mysql -u root -p < database/schema.sql');
console.log('3. Seed sample data (optional):');
console.log('   npm run seed');
console.log('4. Start the development server:');
console.log('   npm run dev');
console.log('\n🔗 API will be available at: http://localhost:5000/api');
console.log('📚 API Documentation: Check README.md for detailed API documentation');
console.log('\n🔑 Default login credentials:');
console.log('   Admin: admin@feemanagement.com / admin123');
console.log('   Accountant: accountant@feemanagement.com / accountant123');
console.log('   Parent: parent@feemanagement.com / parent123');

