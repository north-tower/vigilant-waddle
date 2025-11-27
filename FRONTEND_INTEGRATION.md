# Frontend Integration Guide

## Backend API Overview

Your backend is running on `http://localhost:5000` with the following main endpoints:

### Base URL
```
http://localhost:5000/api
```

## Authentication Flow

### 1. Login
```javascript
// POST /api/auth/login
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store the token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    }
    throw new Error(data.message);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 2. Register
```javascript
// POST /api/auth/register
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
```

## API Helper Functions

### Create an API utility file:

```javascript
// utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create headers with authentication
const createHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: createHeaders(options.auth !== false),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export { apiCall, getToken };
```

## Main API Functions

### Dashboard Data
```javascript
// Get dashboard statistics
const getDashboardStats = () => apiCall('/dashboard/stats');

// Get recent payments
const getRecentPayments = () => apiCall('/dashboard/recent-payments');

// Get upcoming dues
const getUpcomingDues = () => apiCall('/dashboard/upcoming-dues');

// Get collection trends
const getCollectionTrends = () => apiCall('/dashboard/collection-trends');
```

### Student Management
```javascript
// Get all students with pagination
const getStudents = (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({ page, limit, search });
  return apiCall(`/students?${params}`);
};

// Get student by ID
const getStudentById = (id) => apiCall(`/students/${id}`);

// Create new student
const createStudent = (studentData) => apiCall('/students', {
  method: 'POST',
  body: JSON.stringify(studentData)
});

// Update student
const updateStudent = (id, studentData) => apiCall(`/students/${id}`, {
  method: 'PUT',
  body: JSON.stringify(studentData)
});

// Get student fees
const getStudentFees = (id) => apiCall(`/students/${id}/fees`);

// Get student payments
const getStudentPayments = (id) => apiCall(`/students/${id}/payments`);
```

### Fee Management
```javascript
// Get fee structures
const getFeeStructures = () => apiCall('/fee-structures');

// Create fee structure
const createFeeStructure = (feeData) => apiCall('/fee-structures', {
  method: 'POST',
  body: JSON.stringify(feeData)
});
```

### Payment Processing
```javascript
// Get payments
const getPayments = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return apiCall(`/payments?${params}`);
};

// Create payment
const createPayment = (paymentData) => apiCall('/payments', {
  method: 'POST',
  body: JSON.stringify(paymentData)
});

// Get payment by ID
const getPaymentById = (id) => apiCall(`/payments/${id}`);
```

## React Integration Examples

### 1. Login Component
```jsx
import React, { useState } from 'react';
import { apiCall } from '../utils/api';

const LoginForm = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        auth: false
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### 2. Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, paymentsData] = await Promise.all([
          apiCall('/dashboard/stats'),
          apiCall('/dashboard/recent-payments')
        ]);

        setStats(statsData.data);
        setRecentPayments(paymentsData.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats?.totalStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Collection</h3>
          <p>₹{stats?.totalCollection || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Dues</h3>
          <p>₹{stats?.pendingDues || 0}</p>
        </div>
      </div>

      <div className="recent-payments">
        <h3>Recent Payments</h3>
        {recentPayments.map(payment => (
          <div key={payment.id} className="payment-item">
            <span>{payment.studentName}</span>
            <span>₹{payment.amount}</span>
            <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Student List Component
```jsx
import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStudents = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const response = await apiCall(`/students?page=${page}&limit=10&search=${searchTerm}`);
      setStudents(response.data.students);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(1, search);
  };

  return (
    <div className="student-list">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="students-grid">
          {students.map(student => (
            <div key={student.id} className="student-card">
              <h4>{student.firstName} {student.lastName}</h4>
              <p>Roll No: {student.rollNumber}</p>
              <p>Class: {student.class}</p>
              <p>Email: {student.email}</p>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button 
          onClick={() => fetchStudents(pagination.page - 1, search)}
          disabled={pagination.page <= 1}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          onClick={() => fetchStudents(pagination.page + 1, search)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

## Environment Configuration

### Frontend .env file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000
```

### Backend CORS Configuration
Your backend is already configured for CORS. Make sure your `.env` file has:
```env
CORS_ORIGIN=http://localhost:3000
```

## Error Handling

### Global Error Handler
```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Forbidden - show access denied message
    alert('Access denied. You do not have permission to perform this action.');
  } else {
    // Other errors
    console.error('API Error:', error);
    alert(error.message || 'An unexpected error occurred');
  }
};
```

## Authentication Context (React)

```jsx
// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

## Next Steps

1. **Start your backend**: `npm run dev` (runs on port 5000)
2. **Configure your frontend** to use the API endpoints above
3. **Test the connection** by making a simple API call
4. **Implement authentication** using the provided examples
5. **Build your UI components** using the API functions

## Available API Endpoints Summary

- **Auth**: `/api/auth/*` - Login, register, profile management
- **Students**: `/api/students/*` - Student CRUD operations
- **Fees**: `/api/fee-structures/*` - Fee structure management
- **Payments**: `/api/payments/*` - Payment processing
- **Reports**: `/api/reports/*` - Generate various reports
- **Dashboard**: `/api/dashboard/*` - Dashboard statistics and data

Your backend is fully functional and ready to serve your frontend!