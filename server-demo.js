const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Data storage file
const DATA_FILE = path.join(__dirname, 'data', 'storage.json');

// Helper functions for data management
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return {
            books: [],
            borrowers: [],
            transactions: [],
            reports: [],
            fines: [],
            counters: { books: 0, borrowers: 0, transactions: 0, reports: 0, fines: 0 }
        };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

function getNextId(type) {
    const data = readData();
    data.counters[type] = (data.counters[type] || 0) + 1;
    writeData(data);
    return data.counters[type];
}

// API Routes

// Books API
app.get('/api/books', (req, res) => {
    try {
        const data = readData();
        res.json(data.books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.post('/api/books', (req, res) => {
    try {
        const { title, author, isbn, copies, category, description } = req.body;

        if (!title || !author || !isbn || !copies || copies < 1) {
            return res.status(400).json({ error: 'Missing required fields or invalid copies' });
        }

        const data = readData();
        
        // Check for duplicate ISBN
        if (data.books.find(book => book.isbn === isbn)) {
            return res.status(400).json({ error: 'ISBN already exists' });
        }

        const newBook = {
            id: getNextId('books'),
            title,
            author,
            isbn,
            total_copies: parseInt(copies),
            available_copies: parseInt(copies),
            category: category || null,
            description: description || null,
            created_at: new Date().toISOString()
        };

        data.books.push(newBook);
        writeData(data);

        res.status(201).json({ 
            message: 'Book added successfully', 
            bookId: newBook.id 
        });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// Borrowers API
app.get('/api/borrowers', (req, res) => {
    try {
        const data = readData();
        res.json(data.borrowers);
    } catch (error) {
        console.error('Error fetching borrowers:', error);
        res.status(500).json({ error: 'Failed to fetch borrowers' });
    }
});

app.post('/api/borrowers', (req, res) => {
    try {
        const { name, type, class_roll, subject, phone, email } = req.body;

        if (!name || !type || (type !== 'student' && type !== 'teacher')) {
            return res.status(400).json({ error: 'Invalid borrower data' });
        }

        const data = readData();
        const newBorrower = {
            id: getNextId('borrowers'),
            name,
            type,
            class_roll: class_roll || null,
            subject: subject || null,
            phone: phone || null,
            email: email || null,
            created_at: new Date().toISOString()
        };

        data.borrowers.push(newBorrower);
        writeData(data);

        res.status(201).json({ 
            message: 'Borrower registered successfully', 
            borrowerId: newBorrower.id 
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
      SELECT
        t.id AS transaction_id,
        b.title AS book_title,
        br.name AS borrower_name,
        br.type AS borrower_type,
        t.borrow_date,
        t.due_date,
        t.return_date,
        t.status
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN borrowers br ON t.borrower_id = br.id
      ORDER BY t.borrow_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', (req, res) => {
    try {
        const { action, book_id, borrower_name, borrower_type, class_roll, subject, phone } = req.body;

        if (!action || !book_id || !borrower_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const data = readData();

        if (action === 'borrow') {
            // Check book availability
            const book = data.books.find(b => b.id == book_id);
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }
            if (book.available_copies <= 0) {
                return res.status(400).json({ error: 'Book not available' });
            }

            // Find or create borrower
            let borrower = data.borrowers.find(b => b.name === borrower_name);
            if (!borrower) {
                borrower = {
                    id: getNextId('borrowers'),
                    name: borrower_name,
                    type: borrower_type || 'student',
                    class_roll: class_roll || null,
                    subject: subject || null,
                    phone: phone || null,
                    email: null,
                    created_at: new Date().toISOString()
                };
                data.borrowers.push(borrower);
            }

            // Create transaction
            const borrowDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (parseInt(process.env.DEFAULT_LOAN_PERIOD) || 14));

            const newTransaction = {
                id: getNextId('transactions'),
                book_id: parseInt(book_id),
                borrower_id: borrower.id,
                borrow_date: borrowDate.toISOString().split('T')[0],
                due_date: dueDate.toISOString().split('T')[0],
                return_date: null,
                status: 'borrowed',
                created_at: new Date().toISOString(),
                book_title: book.title,
                borrower_name: borrower.name,
                borrower_type: borrower.type
            };

            data.transactions.push(newTransaction);

            // Update available copies
            book.available_copies -= 1;
            writeData(data);

            res.json({ message: 'Book borrowed successfully' });

        } else if (action === 'return') {
            // Find active transaction
            const transaction = data.transactions.find(t => 
                t.book_id == book_id && 
                t.borrower_name === borrower_name && 
                t.status === 'borrowed'
            );

            if (!transaction) {
                return res.status(404).json({ error: 'No active borrowing record found' });
            }

            const returnDate = new Date();
            const dueDate = new Date(transaction.due_date);
            
            // Calculate fine if overdue
            let fine = 0;
            if (returnDate > dueDate) {
                const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
                fine = daysLate * (parseInt(process.env.FINE_PER_DAY) || 5);
                
                // Create fine record
                const newFine = {
                    id: getNextId('fines'),
                    transaction_id: transaction.id,
                    borrower_id: transaction.borrower_id,
                    book_id: parseInt(book_id),
                    days_late: daysLate,
                    fine_amount: fine,
                    paid_status: 'unpaid',
                    created_at: new Date().toISOString(),
                    paid_at: null,
                    book_title: transaction.book_title,
                    borrower_name: transaction.borrower_name
                };
                data.fines.push(newFine);
            }

            // Update transaction
            transaction.return_date = returnDate.toISOString().split('T')[0];
            transaction.status = 'returned';

            // Update available copies
            const book = data.books.find(b => b.id == book_id);
            if (book) {
                book.available_copies += 1;
            }

            writeData(data);

            res.json({ 
                message: 'Book returned successfully',
                fine: fine > 0 ? `Fine: ₹${fine}` : 'No fine'
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
app.get('/api/reports', (req, res) => {
    try {
        const data = readData();
        res.json(data.reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

app.post('/api/reports', (req, res) => {
    try {
        const { book_id, reporter_name, issue_description } = req.body;

        if (!reporter_name || !issue_description) {
            return res.status(400).json({ error: 'Reporter name and issue description are required' });
        }

        const data = readData();
        let book_title = null;
        let book_author = null;

        if (book_id) {
            const book = data.books.find(b => b.id == book_id);
            if (book) {
                book_title = book.title;
                book_author = book.author;
            }
        }

        const newReport = {
            id: getNextId('reports'),
            book_id: book_id ? parseInt(book_id) : null,
            reporter_name,
            issue_description,
            status: 'pending',
            report_date: new Date().toISOString(),
            resolved_date: null,
            resolved_by: null,
            resolution_notes: null,
            book_title,
            book_author
        };

        data.reports.push(newReport);
        writeData(data);

        res.status(201).json({ 
            message: 'Report submitted successfully', 
            reportId: newReport.id 
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

app.put('/api/reports/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolved_by, resolution_notes } = req.body;

        const data = readData();
        const report = data.reports.find(r => r.id == id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        report.status = status;
        report.resolved_by = resolved_by || null;
        report.resolution_notes = resolution_notes || null;
        
        if (status === 'resolved') {
            report.resolved_date = new Date().toISOString();
        }

        writeData(data);

        res.json({ message: 'Report updated successfully' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// Fines API
app.get('/api/fines', (req, res) => {
    try {
        const data = readData();
        res.json(data.fines);
    } catch (error) {
        console.error('Error fetching fines:', error);
        res.status(500).json({ error: 'Failed to fetch fines' });
    }
});

app.put('/api/fines/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { paid_status } = req.body;

        const data = readData();
        const fine = data.fines.find(f => f.id == id);

        if (!fine) {
            return res.status(404).json({ error: 'Fine not found' });
        }

        fine.paid_status = paid_status;
        if (paid_status === 'paid') {
            fine.paid_at = new Date().toISOString();
        }

        writeData(data);

        res.json({ message: 'Fine status updated successfully' });
    } catch (error) {
        console.error('Error updating fine:', error);
        res.status(500).json({ error: 'Failed to update fine' });
    }
});

// Dashboard API
app.get('/api/dashboard', (req, res) => {
    try {
        const data = readData();
        
        const totalBooks = data.books.length;
        const totalBorrowers = data.borrowers.length;
        const activeBorrows = data.transactions.filter(t => t.status === 'borrowed').length;
        const pendingReports = data.reports.filter(r => r.status === 'pending').length;
        const unpaidFines = data.fines.filter(f => f.paid_status === 'unpaid').length;
        const totalFineAmount = data.fines
            .filter(f => f.paid_status === 'unpaid')
            .reduce((sum, f) => sum + parseFloat(f.fine_amount), 0);

        res.json({
            totalBooks,
            totalBorrowers,
            activeBorrows,
            pendingReports,
            unpaidFines,
            totalFineAmount
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Library Management System running on http://localhost:${PORT}`);
    console.log('📚 Created by Arpan and Karma');
    console.log('💾 Using JSON file storage for demo purposes');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Test data file
    try {
        readData();
        console.log('✅ Data file loaded successfully');
    } catch (error) {
        console.log('⚠️  Data file not found, will be created on first write');
    }
});

module.exports = app;