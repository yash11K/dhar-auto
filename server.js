const express = require('express');
const { readFileSync, statSync } = require('fs');
const { join } = require('path');

const app = express();
const PORT = 3001;

// Cache mechanism
let cachedData = null;
let lastModified = null;
const DB_PATH = join(__dirname, 'your-database.mdb');

// Function to check if cache is valid
const isCacheValid = () => {
    try {
        const stats = statSync(DB_PATH);
        if (!lastModified || stats.mtime > lastModified) {
            lastModified = stats.mtime;
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking file stats:', error);
        return false;
    }
};

// Function to read and process database data
const readDatabaseData = async () => {
    const { default: MDBReader } = await import('mdb-reader');
    const buffer = readFileSync(DB_PATH);
    const reader = new MDBReader(buffer);
    const table = reader.getTable('Table1');
    const data = table.getData({ rowLimit: 1000 });

    return data.map((row, index) => ({
        id: row.ID || index,
        date: row.Date ? new Date(row.Date).toLocaleDateString() : null,
        time: row.Time ? new Date(row.Time).toLocaleTimeString() : null,
        T1: row.T1,
        T2: row.T2,
        T3: row.T3,
        T4: row.T4,
        T5: row.T5,
        T6: row.T6,
        T7: row.T7,
        T8: row.T8,
        T9: row.T9,
        T10: row.T10,
        T11: row.T11,
        T12: row.T12,
        T13: row.T13,
        T14: row.T14,
        events: row.Events,
        blowerRunTime: row.Blower_Run_Time,
        pushTimeNormalizing: row['Push Time Normalizing'],
        preheatingTimeNormalizing: row['Preheating Time Normalizing'],
        sockingTimeNormalizing: row['Socking Time Normalizing'],
        pushTimeISO: row['Push Time ISO Aniling/HT'],
        preheatingTimeISO: row['Preheating Time ISO Aniling/HT'],
        sockingTimeISO: row['Socking Time ISO Aniling/HT']
    }));
};

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to get temperature data
app.get('/api/temperature-data', async (req, res) => {
    try {
        // Check if we need to refresh the cache
        if (!isCacheValid() || !cachedData) {
            console.log('Cache miss - reading from database file...');
            cachedData = await readDatabaseData();
        } else {
            console.log('Cache hit - serving cached data...');
        }

        res.json(cachedData);
    } catch (error) {
        console.error('Error reading MDB file:', error);
        res.status(500).json({ error: 'Failed to read database file' });
    }
});

// Endpoint to force cache refresh
app.post('/api/refresh-cache', async (req, res) => {
    try {
        console.log('Forcing cache refresh...');
        cachedData = await readDatabaseData();
        lastModified = statSync(DB_PATH).mtime;
        res.json({ success: true, message: 'Cache refreshed successfully' });
    } catch (error) {
        console.error('Error refreshing cache:', error);
        res.status(500).json({ error: 'Failed to refresh cache' });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('build'));
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, 'build', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 