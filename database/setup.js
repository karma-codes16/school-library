const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        // Create connection without specifying a database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true
        });

        console.log('Connected to MySQL server');

        // Create database if not exists
        await connection.query('CREATE DATABASE IF NOT EXISTS library_db');
        console.log('Database library_db ensured');

        // Switch to the database
        await connection.changeUser({ database: 'library_db' });

        // Read schema.sql (remove CREATE DATABASE and USE statements from schema.sql)
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema to create tables and insert sample data
        await connection.query(schema);
        console.log('Database schema created and data inserted successfully');

        await connection.end();
        console.log('Database setup completed!');
        
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

// Run setup if this file is called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;
