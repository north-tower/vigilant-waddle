-- Fee Management System Database Schema
-- MySQL Database Schema for Fee Management System

-- Create database
CREATE DATABASE IF NOT EXISTS fee_management;
USE fee_management;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'accountant', 'student', 'parent') NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    class VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL,
    roll_number VARCHAR(20) NOT NULL,
    phone VARCHAR(15) NULL,
    email VARCHAR(100) NULL,
    address TEXT NULL,
    parent_id INT NULL,
    admission_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('active', 'inactive', 'graduated', 'transferred') NOT NULL DEFAULT 'active',
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    blood_group VARCHAR(5) NULL,
    emergency_contact VARCHAR(15) NULL,
    emergency_contact_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_class_section_roll (class, section, roll_number),
    INDEX idx_student_id (student_id),
    INDEX idx_class (class),
    INDEX idx_section (section),
    INDEX idx_status (status),
    INDEX idx_parent_id (parent_id)
);

-- Fee structures table
CREATE TABLE fee_structures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class VARCHAR(20) NOT NULL,
    fee_type ENUM('tuition', 'transport', 'library', 'exam', 'sports', 'lab', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    due_date DATE NOT NULL,
    late_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class (class),
    INDEX idx_fee_type (fee_type),
    INDEX idx_academic_year (academic_year),
    INDEX idx_due_date (due_date),
    INDEX idx_is_active (is_active),
    UNIQUE KEY unique_class_fee_type_year (class, fee_type, academic_year)
);

-- Fee assignments table
CREATE TABLE fee_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('assigned', 'waived', 'cancelled') NOT NULL DEFAULT 'assigned',
    waived_reason TEXT NULL,
    waived_by INT NULL,
    waived_date DATETIME NULL,
    custom_amount DECIMAL(10,2) NULL,
    notes TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
    FOREIGN KEY (waived_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_fee (student_id, fee_structure_id),
    INDEX idx_student_id (student_id),
    INDEX idx_fee_structure_id (fee_structure_id),
    INDEX idx_status (status),
    INDEX idx_assigned_date (assigned_date)
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque', 'other') NOT NULL DEFAULT 'cash',
    transaction_id VARCHAR(100) NULL UNIQUE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    late_fee_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_reason VARCHAR(255) NULL,
    received_by INT NOT NULL,
    notes TEXT NULL,
    receipt_file_path VARCHAR(500) NULL,
    is_void BOOLEAN DEFAULT FALSE,
    void_reason TEXT NULL,
    voided_by INT NULL,
    voided_at DATETIME NULL,
    bank_reference VARCHAR(100) NULL,
    cheque_number VARCHAR(50) NULL,
    cheque_date DATE NULL,
    bank_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_receipt_number (receipt_number),
    INDEX idx_is_void (is_void),
    INDEX idx_payment_method (payment_method),
    INDEX idx_received_by (received_by)
);

-- Fee balances table (calculated/cached table)
CREATE TABLE fee_balances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    last_payment_date DATETIME NULL,
    late_fee_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0,
    academic_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_fee_balance (student_id, fee_structure_id),
    INDEX idx_student_id (student_id),
    INDEX idx_is_overdue (is_overdue),
    INDEX idx_due_date (due_date),
    INDEX idx_academic_year (academic_year),
    INDEX idx_balance_amount (balance_amount)
);

-- Create indexes for better performance
CREATE INDEX idx_payments_student_date ON payments(student_id, payment_date);
CREATE INDEX idx_payments_fee_structure ON payments(fee_structure_id, payment_date);
CREATE INDEX idx_fee_balances_overdue ON fee_balances(is_overdue, due_date);
CREATE INDEX idx_students_class_status ON students(class, status);
CREATE INDEX idx_fee_structures_class_year ON fee_structures(class, academic_year);

-- Create views for common queries
CREATE VIEW student_fee_summary AS
SELECT 
    s.id as student_id,
    s.student_id as student_number,
    CONCAT(s.first_name, ' ', s.last_name) as student_name,
    s.class,
    s.section,
    s.roll_number,
    COUNT(fa.id) as total_fees_assigned,
    SUM(fb.total_amount) as total_amount_due,
    SUM(fb.paid_amount) as total_amount_paid,
    SUM(fb.balance_amount) as total_balance,
    COUNT(CASE WHEN fb.is_overdue = TRUE THEN 1 END) as overdue_fees_count
FROM students s
LEFT JOIN fee_assignments fa ON s.id = fa.student_id AND fa.status = 'assigned'
LEFT JOIN fee_balances fb ON s.id = fb.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.student_id, s.first_name, s.last_name, s.class, s.section, s.roll_number;

CREATE VIEW payment_summary AS
SELECT 
    DATE(p.payment_date) as payment_date,
    COUNT(p.id) as total_payments,
    SUM(p.amount_paid) as total_amount,
    AVG(p.amount_paid) as average_amount,
    COUNT(CASE WHEN p.payment_method = 'cash' THEN 1 END) as cash_payments,
    COUNT(CASE WHEN p.payment_method = 'card' THEN 1 END) as card_payments,
    COUNT(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 END) as bank_transfer_payments,
    COUNT(CASE WHEN p.payment_method = 'online' THEN 1 END) as online_payments
FROM payments p
WHERE p.is_void = FALSE
GROUP BY DATE(p.payment_date)
ORDER BY payment_date DESC;

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('admin', 'admin@feemanagement.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4j5Qz8Kz6G', 'admin', TRUE);

-- Insert sample data for testing
INSERT INTO users (username, email, password_hash, role, is_active) VALUES
('accountant1', 'accountant@feemanagement.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4j5Qz8Kz6G', 'accountant', TRUE),
('parent1', 'parent@feemanagement.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4j5Qz8Kz6G', 'parent', TRUE);

-- Insert sample students
INSERT INTO students (student_id, first_name, last_name, class, section, roll_number, phone, email, parent_id, admission_date, date_of_birth, gender) VALUES
('2024X1A001', 'John', 'Doe', 'X', 'A', '001', '+1234567890', 'john.doe@student.com', 3, '2024-04-01', '2008-05-15', 'male'),
('2024X1A002', 'Jane', 'Smith', 'X', 'A', '002', '+1234567891', 'jane.smith@student.com', 3, '2024-04-01', '2008-07-20', 'female'),
('2024X1B001', 'Mike', 'Johnson', 'X', 'B', '001', '+1234567892', 'mike.johnson@student.com', 3, '2024-04-01', '2008-03-10', 'male'),
('2024IXA001', 'Sarah', 'Wilson', 'IX', 'A', '001', '+1234567893', 'sarah.wilson@student.com', 3, '2024-04-01', '2009-01-25', 'female');

-- Insert sample fee structures
INSERT INTO fee_structures (class, fee_type, amount, academic_year, due_date, late_fee_amount, description, created_by) VALUES
('X', 'tuition', 5000.00, '2024-2025', '2024-05-01', 100.00, 'Monthly tuition fee for Class X', 1),
('X', 'transport', 800.00, '2024-2025', '2024-05-01', 50.00, 'Monthly transport fee for Class X', 1),
('X', 'library', 200.00, '2024-2025', '2024-05-01', 25.00, 'Library fee for Class X', 1),
('IX', 'tuition', 4500.00, '2024-2025', '2024-05-01', 100.00, 'Monthly tuition fee for Class IX', 1),
('IX', 'transport', 800.00, '2024-2025', '2024-05-01', 50.00, 'Monthly transport fee for Class IX', 1),
('IX', 'library', 200.00, '2024-2025', '2024-05-01', 25.00, 'Library fee for Class IX', 1);

-- Insert sample fee assignments
INSERT INTO fee_assignments (student_id, fee_structure_id, created_by) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1),
(2, 1, 1), (2, 2, 1), (2, 3, 1),
(3, 1, 1), (3, 2, 1), (3, 3, 1),
(4, 4, 1), (4, 5, 1), (4, 6, 1);

-- Insert sample fee balances
INSERT INTO fee_balances (student_id, fee_structure_id, total_amount, paid_amount, balance_amount, due_date, is_overdue, academic_year) VALUES
(1, 1, 5000.00, 0.00, 5000.00, '2024-05-01', FALSE, '2024-2025'),
(1, 2, 800.00, 0.00, 800.00, '2024-05-01', FALSE, '2024-2025'),
(1, 3, 200.00, 0.00, 200.00, '2024-05-01', FALSE, '2024-2025'),
(2, 1, 5000.00, 0.00, 5000.00, '2024-05-01', FALSE, '2024-2025'),
(2, 2, 800.00, 0.00, 800.00, '2024-05-01', FALSE, '2024-2025'),
(2, 3, 200.00, 0.00, 200.00, '2024-05-01', FALSE, '2024-2025'),
(3, 1, 5000.00, 0.00, 5000.00, '2024-05-01', FALSE, '2024-2025'),
(3, 2, 800.00, 0.00, 800.00, '2024-05-01', FALSE, '2024-2025'),
(3, 3, 200.00, 0.00, 200.00, '2024-05-01', FALSE, '2024-2025'),
(4, 4, 4500.00, 0.00, 4500.00, '2024-05-01', FALSE, '2024-2025'),
(4, 5, 800.00, 0.00, 800.00, '2024-05-01', FALSE, '2024-2025'),
(4, 6, 200.00, 0.00, 200.00, '2024-05-01', FALSE, '2024-2025');

-- Create stored procedures for common operations
DELIMITER //

-- Procedure to update fee balance
CREATE PROCEDURE UpdateFeeBalance(IN p_student_id INT, IN p_fee_structure_id INT)
BEGIN
    DECLARE v_total_paid DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_due_date DATE;
    DECLARE v_academic_year VARCHAR(10);
    DECLARE v_is_overdue BOOLEAN DEFAULT FALSE;
    
    -- Get total paid amount
    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
    FROM payments 
    WHERE student_id = p_student_id 
    AND fee_structure_id = p_fee_structure_id 
    AND is_void = FALSE;
    
    -- Get fee structure details
    SELECT amount, due_date, academic_year 
    INTO v_total_amount, v_due_date, v_academic_year
    FROM fee_structures 
    WHERE id = p_fee_structure_id;
    
    -- Check if overdue
    SET v_is_overdue = (CURDATE() > v_due_date);
    
    -- Insert or update fee balance
    INSERT INTO fee_balances (student_id, fee_structure_id, total_amount, paid_amount, balance_amount, due_date, is_overdue, academic_year)
    VALUES (p_student_id, p_fee_structure_id, v_total_amount, v_total_paid, v_total_amount - v_total_paid, v_due_date, v_is_overdue, v_academic_year)
    ON DUPLICATE KEY UPDATE
        paid_amount = v_total_paid,
        balance_amount = v_total_amount - v_total_paid,
        is_overdue = v_is_overdue,
        last_payment_date = CASE WHEN v_total_paid > 0 THEN NOW() ELSE last_payment_date END,
        updated_at = NOW();
END //

-- Procedure to generate receipt number
CREATE PROCEDURE GenerateReceiptNumber(OUT p_receipt_number VARCHAR(50))
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_date VARCHAR(8);
    DECLARE v_sequence VARCHAR(4);
    
    SET v_date = DATE_FORMAT(NOW(), '%Y%m%d');
    
    SELECT COUNT(*) INTO v_count
    FROM payments 
    WHERE DATE(payment_date) = CURDATE();
    
    SET v_sequence = LPAD(v_count + 1, 4, '0');
    SET p_receipt_number = CONCAT('RCP-', v_date, '-', v_sequence);
END //

DELIMITER ;

-- Create triggers for automatic updates
DELIMITER //

-- Trigger to update fee balance after payment insert
CREATE TRIGGER tr_payment_insert_balance
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    IF NEW.is_void = FALSE THEN
        CALL UpdateFeeBalance(NEW.student_id, NEW.fee_structure_id);
    END IF;
END //

-- Trigger to update fee balance after payment update
CREATE TRIGGER tr_payment_update_balance
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF OLD.is_void != NEW.is_void OR OLD.amount_paid != NEW.amount_paid THEN
        CALL UpdateFeeBalance(NEW.student_id, NEW.fee_structure_id);
    END IF;
END //

-- Trigger to update fee balance after payment delete
CREATE TRIGGER tr_payment_delete_balance
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    CALL UpdateFeeBalance(OLD.student_id, OLD.fee_structure_id);
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON fee_management.* TO 'fee_user'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;

