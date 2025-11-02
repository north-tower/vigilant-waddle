# Fee Management System Backend

A comprehensive backend system for managing student fees, payments, and financial records for educational institutions. Built with Node.js, Express.js, and MySQL.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role authentication (Admin, Accountant, Student, Parent)
- **Student Management**: Complete student records with academic information
- **Fee Structure Management**: Flexible fee types and structures per class
- **Payment Processing**: Multiple payment methods with receipt generation
- **Fee Assignment**: Automatic assignment of fees to students
- **Balance Tracking**: Real-time fee balance calculations
- **Reporting System**: Comprehensive financial reports and analytics
- **Dashboard**: Real-time statistics and insights

### Security Features
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- SQL injection prevention

### API Features
- RESTful API design
- Comprehensive error handling
- Request logging
- Pagination support
- Search and filtering
- Bulk operations
- File upload support

## 🛠️ Technology Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens
- **Validation**: Joi and express-validator
- **File Handling**: Multer
- **Date Handling**: Moment.js
- **Security**: Helmet, bcryptjs, cors
- **Logging**: Winston
- **Documentation**: Built-in API documentation

## 📋 Prerequisites

- Node.js (>=16.0.0)
- MySQL (>=5.7)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fee-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=fee_management
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=24h
   UPLOAD_PATH=./uploads
   ```

4. **Database Setup**
   ```bash
   # Create database and run schema
   mysql -u root -p < database/schema.sql
   ```

5. **Seed Sample Data** (Optional)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication)

#### PUT `/api/auth/profile`
Update user profile (requires authentication)

### Student Management

#### GET `/api/students`
Get all students with pagination and filtering
- Query params: `page`, `limit`, `search`, `class`, `section`, `status`

#### POST `/api/students`
Create new student
```json
{
  "student_id": "2024X1A001",
  "first_name": "John",
  "last_name": "Doe",
  "class": "X",
  "section": "A",
  "roll_number": "001",
  "phone": "+1234567890",
  "email": "john@student.com"
}
```

#### GET `/api/students/:id`
Get student by ID

#### PUT `/api/students/:id`
Update student information

#### DELETE `/api/students/:id`
Deactivate student (soft delete)

#### GET `/api/students/:id/fees`
Get all fees assigned to a student

#### GET `/api/students/:id/payments`
Get payment history for a student

#### GET `/api/students/:id/balance`
Get current fee balance for a student

### Fee Structure Management

#### GET `/api/fee-structures`
Get all fee structures

#### POST `/api/fee-structures`
Create new fee structure
```json
{
  "class": "X",
  "fee_type": "tuition",
  "amount": 5000.00,
  "academic_year": "2024-2025",
  "due_date": "2024-05-01",
  "late_fee_amount": 100.00
}
```

#### POST `/api/fee-structures/:id/assign`
Assign fee structure to students
```json
{
  "student_ids": [1, 2, 3],
  "class": "X"
}
```

### Payment Management

#### GET `/api/payments`
Get all payments with filtering

#### POST `/api/payments`
Record new payment
```json
{
  "student_id": 1,
  "fee_structure_id": 1,
  "amount_paid": 2500.00,
  "payment_method": "cash",
  "notes": "Partial payment"
}
```

#### POST `/api/payments/bulk`
Record bulk payments
```json
{
  "payments": [
    {
      "student_id": 1,
      "fee_structure_id": 1,
      "amount_paid": 2500.00,
      "payment_method": "cash"
    }
  ]
}
```

#### GET `/api/payments/receipt/:id`
Generate payment receipt

### Reports

#### GET `/api/reports/fee-collection`
Fee collection summary report

#### GET `/api/reports/outstanding-fees`
Outstanding fees report

#### GET `/api/reports/payment-history`
Payment history report

#### GET `/api/reports/class-wise-collection`
Class-wise collection report

#### GET `/api/reports/monthly-collection`
Monthly collection report

#### GET `/api/reports/defaulters`
Fee defaulters report

### Dashboard

#### GET `/api/dashboard/stats`
Overall statistics

#### GET `/api/dashboard/recent-payments`
Recent payment transactions

#### GET `/api/dashboard/upcoming-dues`
Upcoming fee dues

#### GET `/api/dashboard/collection-trends`
Collection trend data

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **Admin**: Full access to all features
- **Accountant**: Access to financial operations and reports
- **Student**: Access to own records only
- **Parent**: Access to children's records only

## 📊 Database Schema

### Core Tables

- **users**: User accounts and authentication
- **students**: Student information and academic details
- **fee_structures**: Fee types and amounts per class
- **fee_assignments**: Assignment of fees to students
- **payments**: Payment transactions and receipts
- **fee_balances**: Calculated fee balances per student

### Key Relationships

- Students belong to Users (parent relationship)
- Fee Assignments link Students to Fee Structures
- Payments are linked to Students and Fee Structures
- Fee Balances are automatically calculated and maintained

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | fee_management |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | JWT expiration | 24h |
| UPLOAD_PATH | File upload path | ./uploads |

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper database credentials
4. Set up SSL/HTTPS
5. Configure proper CORS origins
6. Set up monitoring and logging
7. Configure backup strategy

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performance Considerations

- Database indexing on frequently queried columns
- Connection pooling for database connections
- Rate limiting to prevent abuse
- Pagination for large datasets
- Caching for frequently accessed data

## 🔧 Development

### Project Structure

```
backend/
├── config/          # Database and auth configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── utils/           # Utility functions
├── uploads/         # File uploads directory
├── database/        # Database schema and migrations
└── logs/           # Application logs
```

### Adding New Features

1. Create model in `models/`
2. Add controller in `controllers/`
3. Define routes in `routes/`
4. Add validation in `middleware/validation.js`
5. Update API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the sample data for examples

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete fee management system
- Multi-role authentication
- Comprehensive reporting
- Payment processing
- Dashboard analytics

---

**Built with ❤️ for educational institutions**

