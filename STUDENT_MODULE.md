# Student Module Implementation

## Overview

A complete student portal module has been added to allow students with User accounts to access their own fee and payment information.

## Changes Made

### 1. Database Schema Update

**Added `user_id` field to Student model:**
- Links User accounts (with role 'student') to Student records
- Unique constraint ensures one User account per Student
- Foreign key references `users.id`

**Migration Required:**
```sql
ALTER TABLE students 
ADD COLUMN user_id INT NULL UNIQUE,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 2. Model Updates

**Student Model (`models/Student.js`):**
- Added `user_id` field with unique constraint
- Links to User model for student authentication

**Associations (`models/associations.js`):**
- Added `User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile' })`
- Added `Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' })`

### 3. Middleware Fixes

**Auth Middleware (`middleware/auth.js`):**
- Fixed `canAccessStudent` to check `student.user_id === userId` instead of `student.id === userId`
- Now properly validates student access based on user_id relationship

### 4. New Student Portal Controller

**File: `controllers/studentPortalController.js`**

**Middleware:**
- `getCurrentStudent` - Automatically retrieves the logged-in student's record

**Endpoints:**
- `getMyProfile` - Get student's own profile
- `getMyFees` - Get student's fee assignments
- `getMyPayments` - Get student's payment history (paginated)
- `getMyBalance` - Get student's fee balances and summary
- `getMyStats` - Get student's statistics
- `getMyReceipt` - Get payment receipt by ID

### 5. New Student Routes

**File: `routes/student.js`**

**Base Path:** `/api/student`

**All routes:**
- Require authentication (`authenticateToken`)
- Require student role (`authorizeStudent`)
- Automatically use `getCurrentStudent` middleware

**Available Routes:**
- `GET /api/student/profile` - Get my profile
- `GET /api/student/my-fees` - Get my fees
- `GET /api/student/my-payments` - Get my payments (with pagination)
- `GET /api/student/my-balance` - Get my balance
- `GET /api/student/my-stats` - Get my statistics
- `GET /api/student/receipt/:paymentId` - Get payment receipt

## Usage

### 1. Link User Account to Student Record

When creating a student or updating an existing student, set the `user_id`:

```javascript
// Create student with user account
const student = await Student.create({
  student_id: '2024X1A001',
  first_name: 'John',
  last_name: 'Doe',
  class: 'X',
  section: 'A',
  roll_number: '001',
  user_id: user.id  // Link to User account
});
```

### 2. Student Login Flow

1. Student registers/logs in as a User with role 'student'
2. Admin/Accountant links the User account to Student record via `user_id`
3. Student can now access `/api/student/*` endpoints

### 3. Example API Calls

**Get My Profile:**
```javascript
GET /api/student/profile
Authorization: Bearer <student-token>

Response:
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "student_id": "2024X1A001",
      "first_name": "John",
      "last_name": "Doe",
      "class": "X",
      "section": "A",
      "roll_number": "001",
      "user_id": 5,
      "parent": { ... }
    }
  }
}
```

**Get My Fees:**
```javascript
GET /api/student/my-fees?academic_year=2024-2025
Authorization: Bearer <student-token>
```

**Get My Payments:**
```javascript
GET /api/student/my-payments?page=1&limit=10
Authorization: Bearer <student-token>
```

**Get My Balance:**
```javascript
GET /api/student/my-balance
Authorization: Bearer <student-token>

Response:
{
  "success": true,
  "data": {
    "balances": [...],
    "summary": {
      "totalAmount": 15000,
      "paidAmount": 5000,
      "balanceAmount": 10000,
      "overdueCount": 2,
      "overdueAmount": 3000
    }
  }
}
```

## Security

- All endpoints require authentication
- All endpoints require student role
- Students can only access their own data
- No student can access another student's information
- Admin/Accountant can still access all student data via `/api/students/*` endpoints

## Differences from Admin Routes

| Feature | Admin Routes (`/api/students`) | Student Portal (`/api/student`) |
|---------|-------------------------------|--------------------------------|
| Access | Admin/Accountant only | Student only |
| Student ID | Required in URL (`/api/students/:id`) | Auto-detected from logged-in user |
| Scope | All students | Own data only |
| Endpoints | Full CRUD operations | Read-only (view own data) |

## Next Steps

1. **Run Database Migration:**
   ```sql
   ALTER TABLE students 
   ADD COLUMN user_id INT NULL UNIQUE,
   ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
   ```

2. **Link Existing Students:**
   - Update existing student records to link them to User accounts
   - Or create User accounts for students and link them

3. **Frontend Integration:**
   - Create student portal UI
   - Use `/api/student/*` endpoints for student-specific views
   - Handle cases where student profile is not linked (404 error)

## Error Handling

**Student Profile Not Found:**
```json
{
  "success": false,
  "message": "Student profile not found. Please contact administrator to link your account."
}
```

This occurs when:
- User has role 'student' but no Student record is linked via `user_id`
- Student record was deleted but User account still exists

