const moment = require('moment');
const { Payment } = require('../models/associations');
const { Op } = require('sequelize');

// Generate unique receipt number
const generateReceiptNumber = async () => {
  const today = moment().format('YYYYMMDD');
  const count = await Payment.count({
    where: {
      payment_date: {
        [Op.gte]: moment().startOf('day').toDate(),
        [Op.lte]: moment().endOf('day').toDate()
      }
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `RCP-${today}-${sequence}`;
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

// Generate student ID
const generateStudentId = async (className, section, rollNumber) => {
  const year = moment().format('YY');
  const classCode = className.replace(/\s+/g, '').toUpperCase();
  const sectionCode = section.toUpperCase();
  const rollCode = String(rollNumber).padStart(3, '0');
  
  return `${year}${classCode}${sectionCode}${rollCode}`;
};

// Validate academic year format
const validateAcademicYear = (academicYear) => {
  const pattern = /^\d{4}-\d{4}$/;
  return pattern.test(academicYear);
};

// Get current academic year
const getCurrentAcademicYear = () => {
  const currentYear = moment().year();
  const currentMonth = moment().month();
  
  // Assuming academic year starts in April (month 3)
  if (currentMonth >= 3) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

// Calculate days between dates
const calculateDaysBetween = (startDate, endDate) => {
  return moment(endDate).diff(moment(startDate), 'days');
};

// Check if date is overdue
const isOverdue = (dueDate) => {
  return moment().isAfter(moment(dueDate));
};

// Generate random password
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Sanitize string for database
const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

// Validate phone number
const validatePhoneNumber = (phone) => {
  const pattern = /^[\+]?[1-9][\d]{0,15}$/;
  return pattern.test(phone);
};

// Validate email
const validateEmail = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

// Generate pagination metadata
const generatePaginationMeta = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems,
    itemsPerPage: parseInt(limit),
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

// Calculate late fee
const calculateLateFee = (dueDate, lateFeeAmount, paymentDate = new Date()) => {
  if (!isOverdue(dueDate)) return 0;
  return parseFloat(lateFeeAmount) || 0;
};

// Format date for display
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

// Parse date from string
const parseDate = (dateString) => {
  return moment(dateString).toDate();
};

// Check if date is valid
const isValidDate = (date) => {
  return moment(date).isValid();
};

// Generate report filename
const generateReportFilename = (reportType, format = 'pdf') => {
  const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
  return `${reportType}_${timestamp}.${format}`;
};

// Calculate percentage
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// Generate UUID (simple version)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Sleep function for delays
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
};

// Validate file type
const validateFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Get file size in MB
const getFileSizeInMB = (sizeInBytes) => {
  return (sizeInBytes / (1024 * 1024)).toFixed(2);
};

// Truncate string
const truncateString = (str, maxLength) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// Capitalize first letter
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert string to title case
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

module.exports = {
  generateReceiptNumber,
  formatCurrency,
  calculateAge,
  generateStudentId,
  validateAcademicYear,
  getCurrentAcademicYear,
  calculateDaysBetween,
  isOverdue,
  generateRandomPassword,
  sanitizeString,
  validatePhoneNumber,
  validateEmail,
  generatePaginationMeta,
  calculateLateFee,
  formatDate,
  parseDate,
  isValidDate,
  generateReportFilename,
  calculatePercentage,
  deepClone,
  isEmpty,
  generateUUID,
  sleep,
  retry,
  validateFileType,
  getFileSizeInMB,
  truncateString,
  capitalizeFirst,
  toTitleCase
};
