const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'library_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Make sure MySQL is running and database is created');
        console.log('💡 Run: npm run setup-db to create the database');
    }
}

// API Routes

// Books API
app.get('/api/books', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, title, author, isbn, total_copies, available_copies, category, description, created_at 
            FROM books ORDER BY title
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const { title, author, isbn, copies, category, description } = req.body;

        if (!title || !author || !isbn || !copies || copies < 1) {
            return res.status(400).json({ error: 'Missing required fields or invalid copies' });
        }

        const [result] = await pool.execute(`
            INSERT INTO books (title, author, isbn, total_copies, available_copies, category, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, author, isbn, copies, copies, category || null, description || null]);

        res.status(201).json({ 
            message: 'Book added successfully', 
            bookId: result.insertId 
        });
    } catch (error) {
        console.error('Error adding book:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'ISBN already exists' });
        } else {
            res.status(500).json({ error: 'Failed to add book' });
        }
    }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM books WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});


// Borrowers API
app.get('/api/borrowers', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM borrowers ORDER BY name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching borrowers:', error);
        res.status(500).json({ error: 'Failed to fetch borrowers' });
    }
});

app.post('/api/borrowers', async (req, res) => {
    try {
        const { name, type, class_roll, subject, phone, email } = req.body;

        if (!name || !type || (type !== 'student' && type !== 'teacher')) {
            return res.status(400).json({ error: 'Invalid borrower data' });
        }

        const [result] = await pool.execute(`
            INSERT INTO borrowers (name, type, class_roll, subject, phone, email)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, type, class_roll || null, subject || null, phone || null, email || null]);

        res.status(201).json({ 
            message: 'Borrower registered successfully', 
            borrowerId: result.insertId 
        });
    } catch (error) {
        console.error('Error adding borrower:', error);
        res.status(500).json({ error: 'Failed to register borrower' });
    }
});

// Transactions API
app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT t.*, b.title as book_title, br.name as borrower_name, br.type as borrower_type
            FROM transactions t
            JOIN books b ON t.book_id = b.id
            JOIN borrowers br ON t.borrower_id = br.id
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const { action, book_id, borrower_name, borrower_type, class_roll, subject, phone } = req.body;

        if (!action || !book_id || !borrower_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (action === 'borrow') {
            // Check book availability
            const [bookRows] = await pool.execute('SELECT available_copies FROM books WHERE id = ?', [book_id]);
            if (bookRows.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
            if (bookRows[0].available_copies <= 0) {
                return res.status(400).json({ error: 'Book not available' });
            }

            // Find or create borrower
            let borrowerId;
            const [borrowerRows] = await pool.execute('SELECT id FROM borrowers WHERE name = ?', [borrower_name]);
            
            if (borrowerRows.length > 0) {
                borrowerId = borrowerRows[0].id;
            } else {
                // Create new borrower
                const [result] = await pool.execute(`
                    INSERT INTO borrowers (name, type, class_roll, subject, phone)
                    VALUES (?, ?, ?, ?, ?)
                `, [borrower_name, borrower_type || 'student', class_roll || null, subject || null, phone || null]);
                borrowerId = result.insertId;
            }

            // Create transaction
            const borrowDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (parseInt(process.env.DEFAULT_LOAN_PERIOD) || 14));

            await pool.execute(`
                INSERT INTO transactions (book_id, borrower_id, borrow_date, due_date, status)
                VALUES (?, ?, ?, ?, 'borrowed')
            `, [book_id, borrowerId, borrowDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0]]);

            // Update available copies
            await pool.execute('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]);

            res.json({ message: 'Book borrowed successfully' });

        } else if (action === 'return') {
            // Find active transaction
            const [transactionRows] = await pool.execute(`
                SELECT t.*, br.name FROM transactions t
                JOIN borrowers br ON t.borrower_id = br.id
                WHERE t.book_id = ? AND br.name = ? AND t.status = 'borrowed'
                ORDER BY t.borrow_date DESC LIMIT 1
            `, [book_id, borrower_name]);

            if (transactionRows.length === 0) {
                return res.status(404).json({ error: 'No active borrowing record found' });
            }

            const transaction = transactionRows[0];
            const returnDate = new Date();
            const dueDate = new Date(transaction.due_date);
            
            // Calculate fine if overdue
            let fine = 0;
            if (returnDate > dueDate) {
                const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
                fine = daysLate * (parseInt(process.env.FINE_PER_DAY) || 5);
                
                // Create fine record
                await pool.execute(`
                    INSERT INTO fines (transaction_id, borrower_id, book_id, days_late, fine_amount)
                    VALUES (?, ?, ?, ?, ?)
                `, [transaction.id, transaction.borrower_id, book_id, daysLate, fine]);
            }

            // Update transaction
            await pool.execute(`
                UPDATE transactions SET return_date = ?, status = 'returned' WHERE id = ?
            `, [returnDate.toISOString().split('T')[0], transaction.id]);

            // Update available copies
            await pool.execute('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [book_id]);

            res.json({ 
                message: 'Book returned successfully',
                fine: fine > 0 ? `Fine: Rs. ${fine}` : 'No fine'
            });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});

// Reports API
app.get('/api/reports', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT r.*, b.title as book_title, b.author as book_author
            FROM reports r
            LEFT JOIN books b ON r.book_id = b.id
            ORDER BY r.report_date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { book_id, reporter_name, issue_description } = req.body;

        if (!reporter_name || !issue_description) {
            return res.status(400).json({ error: 'Reporter name and issue description are required' });
        }

        const [result] = await pool.execute(`
            INSERT INTO reports (book_id, reporter_name, issue_description)
            VALUES (?, ?, ?)
        `, [book_id || null, reporter_name, issue_description]);

        res.status(201).json({ 
            message: 'Report submitted successfully', 
            reportId: result.insertId 
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

app.put('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolved_by, resolution_notes } = req.body;

        const resolvedDate = status === 'resolved' ? new Date().toISOString().split('T')[0] : null;

        await pool.execute(`
            UPDATE reports 
            SET status = ?, resolved_date = ?, resolved_by = ?, resolution_notes = ?
            WHERE id = ?
        `, [status, resolvedDate, resolved_by || null, resolution_notes || null, id]);

        res.json({ message: 'Report updated successfully' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// Fines API
app.get('/api/fines', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT f.*, b.title as book_title, br.name as borrower_name
            FROM fines f
            JOIN books b ON f.book_id = b.id
            JOIN borrowers br ON f.borrower_id = br.id
            ORDER BY f.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching fines:', error);
        res.status(500).json({ error: 'Failed to fetch fines' });
    }
});

app.put('/api/fines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { paid_status } = req.body;

        const paidAt = paid_status === 'paid' ? new Date().toISOString().split('T')[0] : null;

        await pool.execute(`
            UPDATE fines SET paid_status = ?, paid_at = ? WHERE id = ?
        `, [paid_status, paidAt, id]);

        res.json({ message: 'Fine status updated successfully' });
    } catch (error) {
        console.error('Error updating fine:', error);
        res.status(500).json({ error: 'Failed to update fine' });
    }
});

// Dashboard API
app.get('/api/dashboard', async (req, res) => {
    try {
        const [totalBooks] = await pool.execute('SELECT COUNT(*) as count FROM books');
        const [totalBorrowers] = await pool.execute('SELECT COUNT(*) as count FROM borrowers');
        const [activeBorrows] = await pool.execute('SELECT COUNT(*) as count FROM transactions WHERE status = "borrowed"');
        const [pendingReports] = await pool.execute('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
        const [unpaidFines] = await pool.execute('SELECT COUNT(*) as count, SUM(fine_amount) as total FROM fines WHERE paid_status = "unpaid"');

        res.json({
            totalBooks: totalBooks[0].count,
            totalBorrowers: totalBorrowers[0].count,
            activeBorrows: activeBorrows[0].count,
            pendingReports: pendingReports[0].count,
            unpaidFines: unpaidFines[0].count || 0,
            totalFineAmount: unpaidFines[0].total || 0
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Library Management System running on http://localhost:${PORT}`);
    console.log('📚 Created by Arpan and Karma');
    await testConnection();
});

module.exports = app;


