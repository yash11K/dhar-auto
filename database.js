const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs-extra');

// Get MDB file path from environment variable or use default
const MDB_FILE_PATH = process.env.MDB_FILE_PATH || path.join(__dirname, 'your-database.mdb');
const DB_PATH = path.join(__dirname, 'temperature_data.sqlite');

// Validate MDB file existence
if (!fs.existsSync(MDB_FILE_PATH)) {
    console.error(`Error: MDB file not found at ${MDB_FILE_PATH}`);
    console.error('Please set the MDB_FILE_PATH environment variable to point to your .mdb file');
    process.exit(1);
}

// Database connection
let db = null;

// First-time database setup
async function setupDatabase() {
    const dbDir = path.dirname(DB_PATH);

    try {
        // Ensure the database directory exists with proper permissions
        await fs.ensureDir(dbDir, { mode: 0o755 });

        // Create tables if they don't exist
        const tempDb = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        });

        await tempDb.exec(`
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

        await tempDb.close();
        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Database setup error:', error.message);
        throw error;
    }
}

// Get database connection
async function getDatabase() {
    if (db) return db;

    try {
        // If database file doesn't exist, run first-time setup
        if (!fs.existsSync(DB_PATH)) {
            await setupDatabase();
        }

        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE
        });

        return db;
    } catch (error) {
        console.error('Database connection error:', error.message);
        if (error.code === 'SQLITE_READONLY') {
            console.error('Error: Unable to write to database file. Please check file permissions.');
            console.error(`Database path: ${DB_PATH}`);
            console.error('Try running: chmod 644 temperature_data.sqlite');
        }
        throw error;
    }
}

// Get readings for a specific date range with pagination
async function getReadings(startDate, endDate, limit = 1000, offset = 0) {
    const db = await getDatabase();
    
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
    const db = await getDatabase();
    
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
    const db = await getDatabase();
    
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
    setupDatabase,
    getDatabase,
    getReadings,
    getTemperatureStats,
    insertReadings
}; 