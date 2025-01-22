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
    try {
        const { default: MDBReader } = await import('mdb-reader');
        const buffer = readFileSync(DB_PATH);
        const reader = new MDBReader(buffer);
        const table = reader.getTable('Table1');
        const data = table.getData({});

        console.log('Raw data from database:', {
            totalRows: data.length,
            sampleRow: data[0]
        });

        const processedData = data.map((row, index) => {
            try {
                // Format date and time properly
                const dateStr = row.date || row.Date;
                const timeStr = row.time || row.Time;
                
                // Parse date string to Date object
                const dateObj = dateStr ? new Date(dateStr) : null;
                const timeObj = timeStr ? new Date(`1970-01-01 ${timeStr}`) : null;

                // Validate date and time
                const validDate = dateObj && !isNaN(dateObj.getTime());
                const validTime = timeObj && !isNaN(timeObj.getTime());

                // Format date in YYYY-MM-DD format
                const formattedDate = validDate ? 
                    dateObj.toISOString().split('T')[0] : null;

                // Format time in HH:mm:ss format
                const formattedTime = validTime ? 
                    timeObj.toTimeString().split(' ')[0] : null;

                // Process numeric fields
                const processNumeric = (value) => {
                    return typeof value === 'number' && !isNaN(value) ? value : null;
                };

                return {
                    id: processNumeric(row.ID) || processNumeric(row.id) || index + 1,
                    date: formattedDate,
                    time: formattedTime,
                    formattedDate: validDate ? dateObj.toLocaleDateString() : null,
                    formattedTime: formattedTime,
                    T1: processNumeric(row.T1),
                    T2: processNumeric(row.T2),
                    T3: processNumeric(row.T3),
                    T4: processNumeric(row.T4),
                    T5: processNumeric(row.T5),
                    T6: processNumeric(row.T6),
                    T7: processNumeric(row.T7),
                    T8: processNumeric(row.T8),
                    T9: processNumeric(row.T9),
                    T10: processNumeric(row.T10),
                    T11: processNumeric(row.T11),
                    T12: processNumeric(row.T12),
                    T13: processNumeric(row.T13),
                    T14: processNumeric(row.T14),
                    events: processNumeric(row.Events) || 0,
                    blowerRunTime: processNumeric(row.Blower_Run_Time) || 0,
                    pushTimeNormalizing: processNumeric(row['Push Time Normalizing']) || 0,
                    preheatingTimeNormalizing: processNumeric(row['Preheating Time Normalizing']) || 0,
                    sockingTimeNormalizing: processNumeric(row['Socking Time Normalizing']) || 0,
                    pushTimeISO: processNumeric(row['Push Time ISO Aniling/HT']) || 0,
                    preheatingTimeISO: processNumeric(row['Preheating Time ISO Aniling/HT']) || 0,
                    sockingTimeISO: processNumeric(row['Socking Time ISO Aniling/HT']) || 0
                };
            } catch (err) {
                console.error('Error processing row:', err, row);
                return null;
            }
        }).filter(Boolean); // Remove any null entries

        if (processedData.length === 0) {
            throw new Error('No valid data could be processed from the database');
        }

        console.log('Processed data:', {
            totalRows: processedData.length,
            sampleRow: processedData[0]
        });

        return processedData;
    } catch (error) {
        console.error('Error in readDatabaseData:', error);
        throw error;
    }
};

// Calculate temperature statistics once for cached data
const calculateTemperatureStats = (data) => {
    try {
        const allTemps = [];
        for (let i = 1; i <= 14; i++) {
            const zoneTemps = data
                .map(row => row[`T${i}`])
                .filter(temp => temp != null && !isNaN(temp));
            allTemps.push(...zoneTemps);
        }

        if (allTemps.length === 0) {
            console.warn('No valid temperature data found for statistics');
            return {
                min: 0,
                max: 0,
                q1: 0,
                q3: 0,
                median: 0
            };
        }

        allTemps.sort((a, b) => a - b);
        const len = allTemps.length;
        
        return {
            min: allTemps[0],
            max: allTemps[len - 1],
            q1: allTemps[Math.floor(len * 0.25)],
            q3: allTemps[Math.floor(len * 0.75)],
            median: allTemps[Math.floor(len * 0.5)]
        };
    } catch (error) {
        console.error('Error calculating temperature stats:', error);
        return {
            min: 0,
            max: 0,
            q1: 0,
            q3: 0,
            median: 0
        };
    }
};

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to get temperature data with pagination
app.get('/api/temperature-data', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        console.log('Received request with params:', { page, pageSize, startDate, endDate });

        // Check if we need to refresh the cache
        if (!isCacheValid() || !cachedData) {
            console.log('Cache miss - reading from database file...');
            const rawData = await readDatabaseData();
            if (!Array.isArray(rawData)) {
                throw new Error('Invalid data format from database');
            }
            cachedData = {
                data: rawData,
                stats: calculateTemperatureStats(rawData)
            };
            console.log('Cache updated with new data, total records:', rawData.length);
        } else {
            console.log('Cache hit - serving cached data...');
        }

        if (!cachedData || !cachedData.data || !Array.isArray(cachedData.data)) {
            throw new Error('Invalid cache data format');
        }

        // Filter data based on date range if provided
        let filteredData = [...cachedData.data]; // Create a copy to avoid modifying cache
        if (startDate && endDate) {
            console.log('Filtering by date range:', { startDate, endDate });
            filteredData = filteredData.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
            });
            console.log('Filtered data length:', filteredData.length);
        }

        // Sort data by date and time
        filteredData.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            const dateComparison = new Date(a.date) - new Date(b.date);
            if (dateComparison !== 0) return dateComparison;
            if (!a.time || !b.time) return 0;
            return new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`);
        });

        // Calculate pagination
        const total = filteredData.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const paginatedData = filteredData.slice(start, start + pageSize);
        
        const responseData = {
            data: paginatedData,
            total,
            page,
            pageSize,
            totalPages,
            stats: cachedData.stats
        };

        console.log('Sending response:', {
            dataLength: paginatedData.length,
            total,
            page,
            totalPages,
            sampleRow: paginatedData[0]
        });

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in /api/temperature-data:', error);
        return res.status(500).json({ 
            error: 'Failed to read database file',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Endpoint to force cache refresh
app.post('/api/refresh-cache', async (req, res) => {
    try {
        console.log('Forcing cache refresh...');
        const rawData = await readDatabaseData();
        cachedData = {
            data: rawData,
            stats: calculateTemperatureStats(rawData)
        };
        lastModified = statSync(DB_PATH).mtime;
        console.log('Cache refreshed, total records:', rawData.length);
        res.json({ 
            success: true, 
            message: 'Cache refreshed successfully',
            totalRecords: rawData.length
        });
    } catch (error) {
        console.error('Error refreshing cache:', error);
        res.status(500).json({ 
            error: 'Failed to refresh cache',
            message: error.message
        });
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