const express = require('express');
const cors = require('cors');
const path = require('path');
const { join } = require('path');
const { getReadings, getTemperatureStats, getDatabase } = require('./database');
const { startSync } = require('./sync-service');
const fs = require('fs-extra');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

// Configuration
const MDB_FILE_PATH = process.env.MDB_FILE_PATH || path.join(__dirname, 'data/your-database.mdb');
if (!fs.existsSync(MDB_FILE_PATH)) {
    console.error(`Error: MDB file not found at ${MDB_FILE_PATH}`);
    console.error('Please set the MDB_FILE_PATH environment variable to point to your .mdb file');
    process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Initialize database connection and start sync service
Promise.all([
    getDatabase().catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }),
    startSync().catch(err => {
        console.error('Failed to start sync service:', err);
        process.exit(1);
    })
]);

// Endpoint to get temperature data with date-based pagination
app.get('/api/temperature-data', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30; // Default to 30 days if not specified
        const endDate = req.query.endDate || new Date().toISOString();
        const startDate = req.query.startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const limit = parseInt(req.query.limit) || 999999;
        const offset = parseInt(req.query.offset) || 0;

        console.log('Received request with params:', { startDate, endDate, days, limit, offset });

        // Check if requesting data for a single day
        const isSingleDay = dayjs(startDate).isSame(dayjs(endDate), 'day');

        let data, stats;
        if (isSingleDay) {
            // If requesting a single day, return all data points
            [data, stats] = await Promise.all([
                getReadings(startDate, endDate, limit, offset),
                getTemperatureStats(startDate, endDate)
            ]);
        } else {
            // For date ranges, aggregate by day
            const query = `
                SELECT 
                    DATE(datetime) as date,
                    AVG(T1) as T1, AVG(T2) as T2, AVG(T3) as T3, AVG(T4) as T4,
                    AVG(T5) as T5, AVG(T6) as T6, AVG(T7) as T7, AVG(T8) as T8,
                    AVG(T9) as T9, AVG(T10) as T10, AVG(T11) as T11, AVG(T12) as T12,
                    AVG(T13) as T13, AVG(T14) as T14
                FROM temperature_readings
                WHERE datetime BETWEEN ? AND ?
                GROUP BY DATE(datetime)
                ORDER BY date ASC
                LIMIT ? OFFSET ?
            `;

            const db = await getDatabase();
            const aggregatedData = await db.all(query, [startDate, endDate, limit, offset]);
            
            // Format the aggregated data to match the expected structure
            data = {
                readings: aggregatedData.map(row => ({
                    ...row,
                    datetime: row.date, // Use the date as datetime
                    // Round temperature values to 2 decimal places
                    ...Object.keys(row)
                        .filter(key => key.startsWith('T'))
                        .reduce((acc, key) => ({
                            ...acc,
                            [key]: row[key] ? Number(row[key].toFixed(2)) : null
                        }), {})
                })),
                total: aggregatedData.length
            };

            stats = await getTemperatureStats(startDate, endDate);
        }

        const response = {
            data: data.readings,
            total: data.total,
            limit,
            offset,
            stats
        };

        console.log('Sending response:', {
            dataLength: response.data.length,
            total: response.total,
            stats: response.stats
        });

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in /api/temperature-data:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch temperature data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// New endpoint for daily temperature data
app.get('/api/temperature-data/daily', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: 'Date parameter is required',
        message: 'Please provide a date in ISO format'
      });
    }

    const startDate = dayjs(date).startOf('day').toISOString();
    const endDate = dayjs(date).endOf('day').toISOString();

    console.log('Fetching daily data with params:', { startDate, endDate });

    // Use the getReadings function from database.js
    const [data, stats] = await Promise.all([
      getReadings(startDate, endDate, 1000, 0), // Get all readings for the day
      getTemperatureStats(startDate, endDate)
    ]);

    // If no data found, return empty array with stats
    if (!data.readings || data.readings.length === 0) {
      return res.status(200).json({
        data: [],
        total: 0,
        stats: {
          min: null,
          max: null,
          avg: null
        }
      });
    }

    // Return the data with stats
    return res.status(200).json({
      data: data.readings,
      total: data.total,
      stats
    });

  } catch (error) {
    console.error('Error in /api/temperature-data/daily:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch daily temperature data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Export endpoint
app.post('/api/temperature-data/export', async (req, res) => {
  try {
    const { startDate, endDate, zones, format, exportDirectory } = req.body;

    // Validate export directory
    if (!exportDirectory) {
      return res.status(400).json({ success: false, message: 'Export directory is required' });
    }

    // Ensure export directory exists
    await fs.ensureDir(exportDirectory);

    // Fetch data for export
    const query = `
      SELECT datetime, ${zones.map(zone => `T${zone}`).join(', ')}
      FROM temperature_data
      WHERE datetime BETWEEN ? AND ?
      ORDER BY datetime ASC
    `;

    const data = await db.all(query, [startDate, endDate]);

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data found for the selected period' });
    }

    let filePath;
    if (format === 'excel') {
      // Generate Excel file
      filePath = path.join(exportDirectory, `temperature_data_${startDate.slice(0,10)}_to_${endDate.slice(0,10)}.xlsx`);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Format data for Excel
      const formattedData = data.map(row => {
        const newRow = {
          DateTime: new Date(row.datetime).toLocaleString()
        };
        zones.forEach(zone => {
          newRow[`Zone ${zone} (°C)`] = row[`T${zone}`];
        });
        return newRow;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Temperature Data');
      
      // Write to file
      await XLSX.writeFile(wb, filePath);

    } else if (format === 'pdf') {
      // Generate PDF file
      filePath = path.join(exportDirectory, `temperature_report_${startDate.slice(0,10)}_to_${endDate.slice(0,10)}.pdf`);
      
      // Create PDF document
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add title
      doc.fontSize(20).text('Temperature Data Report', { align: 'center' });
      doc.moveDown();
      
      // Add date range
      doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();

      // Add zones info
      doc.fontSize(12).text(`Selected Zones: ${zones.join(', ')}`, { align: 'center' });
      doc.moveDown();

      // Create table header
      const tableTop = 200;
      let currentY = tableTop;
      
      // Draw table headers
      doc.fontSize(10);
      doc.text('DateTime', 50, currentY);
      zones.forEach((zone, index) => {
        doc.text(`Zone ${zone} (°C)`, 200 + (index * 80), currentY);
      });
      
      currentY += 20;

      // Draw table rows
      data.forEach((row, index) => {
        if (currentY > 700) { // Start new page if near bottom
          doc.addPage();
          currentY = 50;
        }

        doc.text(new Date(row.datetime).toLocaleString(), 50, currentY);
        zones.forEach((zone, zIndex) => {
          doc.text(row[`T${zone}`]?.toFixed(2) || '-', 200 + (zIndex * 80), currentY);
        });
        
        currentY += 20;
      });

      // Finalize PDF
      doc.end();
      
      // Wait for the stream to finish
      await new Promise((resolve) => stream.on('finish', resolve));
    }

    res.json({
      success: true,
      message: `File exported successfully as ${format.toUpperCase()}`,
      filePath
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data: ' + error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode');
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Improved server startup
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API available at http://localhost:${PORT}`);
        console.log('Frontend dev server will be available at http://localhost:3000');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 