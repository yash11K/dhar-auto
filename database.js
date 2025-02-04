const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Get MDB file path from environment variable or use default
const MDB_FILE_PATH = process.env.MDB_FILE_PATH || path.join(__dirname, 'your-database.mdb');

// Validate MDB file existence
if (!fs.existsSync(MDB_FILE_PATH)) {
    console.error(`Error: MDB file not found at ${MDB_FILE_PATH}`);
    console.error('Please set the MDB_FILE_PATH environment variable to point to your .mdb file');
    process.exit(1);
}

// Database connection
let db = null;

// Initialize database
async function initializeDatabase() {
    if (db) return db;

    const dbPath = path.join(__dirname, 'temperature_data.sqlite');

    // Delete existing database if it exists
    try {
        if (fs.existsSync(dbPath)) {
            console.log('Removing existing database...');
            fs.unlinkSync(dbPath);
        }
    } catch (error) {
        console.error('Error removing existing database:', error);
    }

    console.log('Creating new database...');
    console.log(`Using MDB file from: ${MDB_FILE_PATH}`);
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS temperature_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            datetime DATETIME NOT NULL,
            T1 REAL,
            T2 REAL,
            T3 REAL,
            T4 REAL,
            T5 REAL,
            T6 REAL,
            T7 REAL,
            T8 REAL,
            T9 REAL,
            T10 REAL,
            T11 REAL,
            T12 REAL,
            T13 REAL,
            T14 REAL,
            events INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_datetime ON temperature_readings(datetime);
    `);

    return db;
}

// Get readings for a specific date range with pagination
async function getReadings(startDate, endDate, limit = 1000, offset = 0) {
    const db = await initializeDatabase();
    
    const query = `
        SELECT *
        FROM temperature_readings
        WHERE datetime BETWEEN ? AND ?
        ORDER BY datetime
        LIMIT ? OFFSET ?
    `;

    const readings = await db.all(query, [startDate, endDate, limit, offset]);
    const total = await db.get(
        'SELECT COUNT(*) as count FROM temperature_readings WHERE datetime BETWEEN ? AND ?',
        [startDate, endDate]
    );

    return {
        readings,
        total: total.count
    };
}

// Get temperature statistics for a date range
async function getTemperatureStats(startDate, endDate) {
    const db = await initializeDatabase();
    
    const stats = await db.get(`
        SELECT 
            MIN(CASE 
                WHEN T1 IS NOT NULL THEN T1
                WHEN T2 IS NOT NULL THEN T2
                WHEN T3 IS NOT NULL THEN T3
                WHEN T4 IS NOT NULL THEN T4
                WHEN T5 IS NOT NULL THEN T5
                WHEN T6 IS NOT NULL THEN T6
                WHEN T7 IS NOT NULL THEN T7
                WHEN T8 IS NOT NULL THEN T8
                WHEN T9 IS NOT NULL THEN T9
                WHEN T10 IS NOT NULL THEN T10
                WHEN T11 IS NOT NULL THEN T11
                WHEN T12 IS NOT NULL THEN T12
                WHEN T13 IS NOT NULL THEN T13
                WHEN T14 IS NOT NULL THEN T14
            END) as min,
            MAX(CASE 
                WHEN T1 IS NOT NULL THEN T1
                WHEN T2 IS NOT NULL THEN T2
                WHEN T3 IS NOT NULL THEN T3
                WHEN T4 IS NOT NULL THEN T4
                WHEN T5 IS NOT NULL THEN T5
                WHEN T6 IS NOT NULL THEN T6
                WHEN T7 IS NOT NULL THEN T7
                WHEN T8 IS NOT NULL THEN T8
                WHEN T9 IS NOT NULL THEN T9
                WHEN T10 IS NOT NULL THEN T10
                WHEN T11 IS NOT NULL THEN T11
                WHEN T12 IS NOT NULL THEN T12
                WHEN T13 IS NOT NULL THEN T13
                WHEN T14 IS NOT NULL THEN T14
            END) as max,
            AVG(COALESCE(T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14)) as avg
        FROM temperature_readings
        WHERE datetime BETWEEN ? AND ?
    `, [startDate, endDate]);

    return stats || {
        min: null,
        max: null,
        avg: null
    };
}

// Insert or update readings
async function insertReadings(readings) {
    const db = await initializeDatabase();
    
    const stmt = await db.prepare(`
        INSERT INTO temperature_readings 
        (datetime, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, events)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await db.run('BEGIN TRANSACTION');
    
    try {
        for (const reading of readings) {
            await stmt.run([
                reading.datetime,
                reading.T1, reading.T2, reading.T3, reading.T4, reading.T5,
                reading.T6, reading.T7, reading.T8, reading.T9, reading.T10,
                reading.T11, reading.T12, reading.T13, reading.T14,
                reading.events
            ]);
        }
        await db.run('COMMIT');
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    } finally {
        await stmt.finalize();
    }
}

module.exports = {
    initializeDatabase,
    getReadings,
    getTemperatureStats,
    insertReadings
}; 