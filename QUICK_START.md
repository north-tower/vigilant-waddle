# 🚀 Quick Start Guide

## Prerequisites
- Node.js (>=16.0.0)
- MySQL (>=5.7)
- npm or yarn

## 1. Setup
```bash
# Clone and navigate to project
cd fee-management-backend

# Run automated setup
npm run setup

# Or manually:
npm install
cp env.example .env
```

## 2. Database Setup
```bash
# Create database and run schema
mysql -u root -p < database/schema.sql

# Seed sample data (optional)
npm run seed
```

## 3. Start Development Server
```bash
npm run dev
```

## 4. Test the API
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@feemanagement.com","password":"admin123"}'
```

## 🔑 Default Credentials
- **Admin**: admin@feemanagement.com / admin123
- **Accountant**: accountant@feemanagement.com / accountant123
- **Parent**: parent@feemanagement.com / parent123

## 📚 API Endpoints
- **Auth**: `/api/auth/*`
- **Students**: `/api/students/*`
- **Fees**: `/api/fee-structures/*`
- **Payments**: `/api/payments/*`
- **Reports**: `/api/reports/*`
- **Dashboard**: `/api/dashboard/*`

## 🧪 Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📖 Full Documentation
See `README.md` for complete API documentation and features.

## 🆘 Troubleshooting
1. **Database connection issues**: Check `.env` file credentials
2. **Port already in use**: Change `PORT` in `.env` file
3. **Permission errors**: Ensure proper file permissions for uploads directory
4. **Module not found**: Run `npm install` again

## 🎯 Next Steps
1. Customize fee structures for your institution
2. Add your school's branding and styling
3. Configure email notifications
4. Set up production database
5. Deploy to your preferred hosting platform

