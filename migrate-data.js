const { readFileSync } = require('fs');
const { join } = require('path');
const MDBReader = require('mdb-reader');
const { insertReadings } = require('./database');

async function migrateMDBToSQLite() {
    try {
        console.log('Starting migration from MDB to SQLite...');
        
        // Read MDB file
        const buffer = readFileSync(join(__dirname, 'your-database.mdb'));
        const reader = new MDBReader(buffer);
        const table = reader.getTable('Table1');
        const data = table.getData();

        console.log(`Found ${data.length} records in MDB file`);

        // Process and transform the data
        const transformedData = data.map(row => {
            try {
                const dateStr = row.date || row.Date;
                const timeStr = row.time || row.Time;
                
                if (!dateStr || !timeStr) {
                    console.warn('Missing date or time:', { dateStr, timeStr });
                    return null;
                }

                // Extract time components from the 1899-12-30 based time
                const timeComponents = new Date(timeStr);
                if (isNaN(timeComponents.getTime())) {
                    console.warn('Invalid time format:', timeStr);
                    return null;
                }

                // Extract date components from the date string
                const dateComponents = new Date(dateStr);
                if (isNaN(dateComponents.getTime())) {
                    console.warn('Invalid date format:', dateStr);
                    return null;
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
                    return null;
                }

                // Process numeric fields
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

                // Log first few records for debugging
                if (data.indexOf(row) < 5) {
                    console.log('Sample record:', {
                        original: {
                            date: dateStr,
                            time: timeStr,
                            T1: row.T1
                        },
                        processed: {
                            datetime: datetime.toISOString(),
                            T1: processNumeric(row.T1)
                        }
                    });
                }

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
            } catch (err) {
                console.error('Error processing row:', err);
                return null;
            }
        }).filter(Boolean);

        console.log(`Transformed ${transformedData.length} valid records`);

        if (transformedData.length === 0) {
            throw new Error('No valid records were transformed. Check the data format and logging output above.');
        }

        // Insert data in batches
        const BATCH_SIZE = 1000;
        for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
            const batch = transformedData.slice(i, i + BATCH_SIZE);
            await insertReadings(batch);
            console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(transformedData.length / BATCH_SIZE)}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Log raw data format for the first few records
async function debugMDBFormat() {
    try {
        const buffer = readFileSync(join(__dirname, 'your-database.mdb'));
        const reader = new MDBReader(buffer);
        const table = reader.getTable('Table1');
        const data = table.getData();
        
        console.log('First 3 records raw format:');
        data.slice(0, 3).forEach((row, index) => {
            console.log(`Record ${index + 1}:`, {
                date: row.date || row.Date,
                time: row.time || row.Time,
                T1: row.T1,
                rawDate: row.date || row.Date,
                rawTime: row.time || row.Time
            });
        });
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

// Run debug first, then migration
debugMDBFormat().then(() => {
    console.log('\nStarting migration...\n');
    migrateMDBToSQLite();
}); 