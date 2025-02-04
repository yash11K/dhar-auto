const fs = require('fs');
const { watch } = require('fs/promises');
const { join } = require('path');
const MDBReader = require('mdb-reader');
const { insertReadings, initializeDatabase } = require('./database');

// Get MDB file path from environment variable or use default
const MDB_FILE_PATH = process.env.MDB_FILE_PATH || join(__dirname, 'your-database.mdb');

// Keep track of the last processed record's datetime during runtime
let lastProcessedDatetime = null;

async function processNewRecords() {
    try {
        console.log('Checking for new records...');
        
        // Read MDB file
        const buffer = fs.readFileSync(MDB_FILE_PATH);
        const reader = new MDBReader(buffer);
        const table = reader.getTable('Table1');
        const data = table.getData();

        // Filter only new records if we have a last processed datetime
        const newRecords = data.filter(row => {
            try {
                const dateStr = row.date || row.Date;
                const timeStr = row.time || row.Time;
                
                if (!dateStr || !timeStr) {
                    console.warn('Missing date or time:', { dateStr, timeStr });
                    return false;
                }

                // Extract time components
                const timeComponents = new Date(timeStr);
                const dateComponents = new Date(dateStr);
                
                if (isNaN(timeComponents.getTime()) || isNaN(dateComponents.getTime())) {
                    console.warn('Invalid date/time format:', { dateStr, timeStr });
                    return false;
                }

                // Combine date and time
                const datetime = new Date(
                    dateComponents.getFullYear(),
                    dateComponents.getMonth(),
                    dateComponents.getDate(),
                    timeComponents.getHours(),
                    timeComponents.getMinutes(),
                    timeComponents.getSeconds()
                );

                if (isNaN(datetime.getTime())) {
                    console.warn('Invalid combined datetime:', datetime);
                    return false;
                }

                // Only include records newer than the last processed datetime
                return !lastProcessedDatetime || datetime.toISOString() > lastProcessedDatetime;
            } catch (err) {
                console.error('Error processing row:', err);
                return false;
            }
        });

        if (newRecords.length === 0) {
            console.log('No new records found');
            return;
        }

        console.log(`Found ${newRecords.length} new records`);

        // Transform the new records
        const transformedData = newRecords.map(row => {
            const dateStr = row.date || row.Date;
            const timeStr = row.time || row.Time;
            
            const timeComponents = new Date(timeStr);
            const dateComponents = new Date(dateStr);
            
            const datetime = new Date(
                dateComponents.getFullYear(),
                dateComponents.getMonth(),
                dateComponents.getDate(),
                timeComponents.getHours(),
                timeComponents.getMinutes(),
                timeComponents.getSeconds()
            );

            const processNumeric = (value) => {
                if (typeof value === 'number' && !isNaN(value)) {
                    return value;
                }
                if (typeof value === 'string') {
                    const num = parseFloat(value);
                    return !isNaN(num) ? num : null;
                }
                return null;
            };

            return {
                datetime: datetime.toISOString(),
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
                events: processNumeric(row.Events) || 0
            };
        });

        // Insert records in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
            const batch = transformedData.slice(i, i + BATCH_SIZE);
            await insertReadings(batch);
            console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(transformedData.length / BATCH_SIZE)}`);
        }

        // Update last processed datetime
        lastProcessedDatetime = transformedData[transformedData.length - 1].datetime;
        console.log('Successfully processed new records. Last processed datetime:', lastProcessedDatetime);

    } catch (error) {
        console.error('Error processing records:', error);
        throw error;
    }
}

async function startSync() {
    try {
        console.log('Starting sync service...');
        console.log(`Using MDB file from: ${MDB_FILE_PATH}`);
        
        // Reset lastProcessedDatetime since we're starting fresh
        lastProcessedDatetime = null;
        
        // Process all records on startup (since lastProcessedDatetime is null)
        await processNewRecords();

        // Set up file watcher
        const watcher = watch(MDB_FILE_PATH);
        
        console.log(`Watching for changes to ${MDB_FILE_PATH}...`);
        
        for await (const event of watcher) {
            if (event.eventType === 'change') {
                console.log('MDB file changed, processing new records...');
                await processNewRecords();
            }
        }
    } catch (error) {
        console.error('Error in sync service:', error);
        process.exit(1);
    }
}

// Start the sync service
if (require.main === module) {
    startSync();
}

module.exports = {
    startSync,
    processNewRecords
}; 