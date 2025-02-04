# MDB Temperature Dashboard

A full-stack web application for visualizing and analyzing temperature data from MDB files. This application provides real-time temperature monitoring, data visualization, and export capabilities.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- A Microsoft Access Database (.mdb) file containing temperature data

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd mdb-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. The application requires a Microsoft Access Database (.mdb) file. You can specify its location in two ways:

   a. Environment variable:
   ```bash
   export MDB_FILE_PATH=/path/to/your/database.mdb
   ```

   b. Place your .mdb file in the project root directory and name it `your-database.mdb`

## Running the Application

### Production Mode

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3001

## Features

- Real-time temperature monitoring
- Interactive data visualizations
- Data export in Excel and PDF formats
- Daily zone-wise temperature analysis
- Historical data viewing and analysis

## Troubleshooting

1. If you see "MDB file not found" error:
   - Make sure you've set the correct MDB_FILE_PATH environment variable
   - Or ensure your .mdb file is in the project root directory

2. If the application fails to start:
   - Check if all dependencies are installed (`npm install`)
   - Ensure no other application is using ports 3000 or 3001
   - Check the console for specific error messages

## Project Structure

```
mdb-dashboard/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── App.js             # Main React component
│   └── index.js           # React entry point
├── server.js              # Backend Express server
├── database.js            # Database operations
├── sync-service.js        # Data synchronization service
└── package.json           # Project dependencies and scripts
```

## License

[Your License Here]

## Support

For support, please [create an issue](your-issue-tracker-url) or contact [your-contact-info].
