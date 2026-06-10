-- Library Management System Database Schema
-- Created by Arpan and Karma


-- Books table
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Borrowers table (students and teachers)
CREATE TABLE IF NOT EXISTS borrowers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('student', 'teacher') NOT NULL,
    class_roll VARCHAR(50), -- for students
    subject VARCHAR(100), -- for teachers
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transactions table (borrow/return records)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE
);

-- Reports table (book issue reports)
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT,
    reporter_name VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP NULL,
    resolved_by VARCHAR(255) NULL,
    resolution_notes TEXT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
);

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    borrower_id INT NOT NULL,
    book_id INT NOT NULL,
    days_late INT NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL,
    paid_status ENUM('unpaid', 'paid', 'waived') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO books (title, author, isbn, total_copies, available_copies, category, description) VALUES
('Harry Potter and the Philosopher\'s Stone', 'J.K. Rowling', '978-0747532699', 5, 5, 'Fiction', 'First book in the Harry Potter series'),
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 3, 3, 'Fiction', 'Classic American literature'),
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 4, 4, 'Fiction', 'American classic novel'),
('1984', 'George Orwell', '978-0451524935', 6, 6, 'Fiction', 'Dystopian social science fiction'),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', 2, 2, 'Romance', 'Classic romance novel');

INSERT INTO borrowers (name, type, class_roll, subject, phone, email) VALUES
('Rohan Kumar', 'student', 'Class 10, Roll 12', NULL, '9876543210', 'rohan@email.com'),
('Mr. Amit Sharma', 'teacher', NULL, 'English', '9876543211', 'amit@school.edu'),
('Priya Singh', 'student', 'Class 9, Roll 5', NULL, '9876543212', 'priya@email.com'),
('Ms. Sunita Verma', 'teacher', NULL, 'Mathematics', '9876543213', 'sunita@school.edu');

-- Insert sample transactions
INSERT INTO transactions (book_id, borrower_id, borrow_date, due_date, status) VALUES
(1, 1, '2024-01-15', '2024-01-29', 'borrowed'),
(2, 2, '2024-01-10', '2024-01-24', 'returned');

-- Update available copies after transactions
UPDATE books SET available_copies = available_copies - 1 WHERE id = 1;

-- Insert sample reports
INSERT INTO reports (book_id, reporter_name, issue_description, status) VALUES
(1, 'Rohan Kumar', 'Page 45 is torn and difficult to read', 'pending'),
(3, 'Anonymous', 'Cover is damaged and spine is loose', 'pending');
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- for now: plain or simple hash
  role ENUM('admin', 'staff') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role) VALUES
('admin', 'admin123', 'admin');
