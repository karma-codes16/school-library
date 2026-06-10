# Library Management System

A complete library management system built with Node.js, Express, and MySQL. Created by **Arpan and Karma**.

## Features

### 📚 Book Management
- Add new books with ISBN, author, category, and description
- View all books with availability status
- Search books by title, author, or ISBN
- Track total and available copies

### 👥 Borrower Management
- Register students and teachers
- Store contact information and details
- Automatic borrower creation during transactions

### 🔄 Transaction System
- Borrow and return books
- Automatic due date calculation (14 days default)
- Real-time availability updates
- Transaction history tracking

### 📋 Reports System
- Report book issues (damaged, missing pages, etc.)
- Dedicated reports management page
- Status tracking (pending, resolved, dismissed)
- Resolution notes and tracking

### 💰 Fines Management
- Automatic fine calculation for overdue books
- Fine calculator tool
- Payment status tracking
- Waive fines option

### 📊 Dashboard
- Real-time statistics
- Total books, borrowers, active loans
- Pending reports and unpaid fines
- Beautiful visual interface

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with warm color scheme

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### 1. Clone/Download the Project
```bash
# If you have the files, navigate to the project directory
cd library-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Make sure MySQL is running
# Create the database and tables
npm run setup-db
```

### 4. Environment Configuration
Create a `.env` file in the root directory (already provided):
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=library_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Fine Configuration (per day in rupees)
FINE_PER_DAY=5

# Loan Period (days)
DEFAULT_LOAN_PERIOD=14
```

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

### 6. Access the Application
Open your browser and go to: `http://localhost:3000`

## Database Schema

### Tables
- **books**: Store book information and availability
- **borrowers**: Student and teacher information
- **transactions**: Borrow/return records
- **reports**: Book issue reports
- **fines**: Overdue fine records

### Sample Data
The system comes with sample books and borrowers for testing.

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Add new book

### Borrowers
- `GET /api/borrowers` - Get all borrowers
- `POST /api/borrowers` - Register new borrower

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Process borrow/return

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Submit new report
- `PUT /api/reports/:id` - Update report status

### Fines
- `GET /api/fines` - Get all fines
- `PUT /api/fines/:id` - Update fine status

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Pages

1. **Dashboard** (`/`) - Main overview with statistics
2. **Books Data** (`/books_data.html`) - View all books and transactions
3. **Add Books** (`/add.html`) - Add new books to the library
4. **Borrow/Return** (`/borrow_return.html`) - Process book transactions
5. **Report Books** (`/report_books.html`) - Report book issues
6. **Manage Reports** (`/reports_management.html`) - Handle reported issues
7. **Fines** (`/fines.html`) - Manage overdue fines

## Usage Guide

### Adding Books
1. Go to "Add Books" page
2. Fill in book details (Title, Author, ISBN, Copies)
3. Optionally add category and description
4. Click "Add Book"

### Borrowing Books
1. Go to "Borrow / Return" page
2. Select "Borrow Book" action
3. Search for book by ID or title
4. Enter borrower name and details
5. Submit transaction

### Returning Books
1. Go to "Borrow / Return" page
2. Select "Return Book" action
3. Enter book ID and borrower name
4. System automatically calculates fines if overdue

### Managing Reports
1. Go to "Manage Reports" page
2. View all submitted reports
3. Mark reports as resolved or dismissed
4. Add resolution notes

### Handling Fines
1. Go to "Fines" page
2. View all fines with status
3. Mark fines as paid or waived
4. Use calculator to estimate fines

## Customization

### Fine Configuration
- Modify `FINE_PER_DAY` in `.env` file
- Default: ₹5 per day

### Loan Period
- Modify `DEFAULT_LOAN_PERIOD` in `.env` file
- Default: 14 days

### Colors and Styling
The system uses a warm color scheme:
- Primary: `#ff6f61` (coral)
- Background: `#ffecd2` to `#fcb69f` (gradient)
- Accent: `#ffe6df` (light peach)

## Troubleshooting

### Database Connection Issues
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Run `npm run setup-db` to create database

### Server Won't Start
1. Check if port 3000 is available
2. Verify all dependencies are installed
3. Check console for error messages

### API Errors
1. Check server console for detailed errors
2. Verify database connection
3. Ensure all required fields are provided

## Development

### Project Structure
```
library-management-system/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── database/
│   ├── schema.sql         # Database schema
│   └── setup.js           # Database setup script
└── public/                # Frontend files
    ├── index.html         # Dashboard
    ├── books_data.html    # Books and transactions
    ├── add.html           # Add books
    ├── borrow_return.html # Borrow/return
    ├── report_books.html  # Report issues
    ├── reports_management.html # Manage reports
    └── fines.html         # Fines management
```

### Adding New Features
1. Add API endpoints in `server.js`
2. Create/modify frontend pages in `public/`
3. Update database schema if needed
4. Test thoroughly before deployment

## License

This project is created by **Arpan and Karma** for educational purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server console logs
3. Verify database connection and setup

---

**Created with ❤️ by Arpan and Karma**