# MDB Temperature Dashboard - Beginner's Guide

Welcome! This guide will walk you through setting up and running the MDB Temperature Dashboard application, even if you've never set up a software project before. Don't worry - we'll go through this step by step! 🚀

## What is This Application?

This is a web application that helps you visualize and analyze temperature data stored in Microsoft Access Database (.mdb) files. It shows you:
- Real-time temperature readings
- Beautiful graphs and charts
- Daily temperature patterns
- And lets you export this data to Excel or PDF

## Step 1: Installing Required Software

### 1.1 Installing Node.js
Node.js is the engine that will run our application. Here's how to install it:

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the "LTS" (Long Term Support) version
   - For Windows: Click the .msi installer and follow the installation wizard
   - For Mac: Click the .pkg installer and follow the installation wizard
   - For Linux: Use your package manager or follow the instructions on Node.js website
3. Verify the installation:
   - Open Terminal (Mac/Linux) or Command Prompt (Windows)
   - Type: `node --version`
   - Type: `npm --version`
   - If you see version numbers, the installation was successful!

### 1.2 Installing Git
Git helps us download and manage the code:

1. Go to [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. Download the installer for your operating system
3. Follow the installation wizard
4. Verify the installation:
   - Open Terminal/Command Prompt
   - Type: `git --version`
   - If you see a version number, you're good to go!

## Step 2: Getting the Application

1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Navigate to where you want to store the application:
   ```bash
   # On Windows, you might use:
   cd C:\Projects

   # On Mac/Linux, you might use:
   cd ~/Projects
   ```
3. Clone (download) the application:
   ```bash
   git clone https://github.com/yash11k/mdb-dashboard
   cd mdb-dashboard
   ```

## Step 3: Installing Application Dependencies

1. Make sure you're in the application directory:
   ```bash
   # The following command should show you're in the mdb-dashboard folder
   pwd
   ```

2. Install all required packages:
   ```bash
   npm install
   ```
   - This might take a few minutes
   - You might see some warnings - that's normal!

## Step 4: Setting Up Your Database

The application needs a Microsoft Access Database (.mdb) file to work with. You have two options:

### Option A: Using Environment Variables (Recommended)
1. Find the path to your .mdb file
2. Set it up based on your operating system:

   For Windows (Command Prompt):
   ```bash
   set MDB_FILE_PATH=C:\path\to\your\database.mdb
   ```

   For Mac/Linux (Terminal):
   ```bash
   export MDB_FILE_PATH=/path/to/your/database.mdb
   ```

### Option B: Simple Method
1. Copy your .mdb file
2. Paste it into the mdb-dashboard folder
3. Rename it to exactly: `your-database.mdb`

## Step 5: Running the Application

### For Development/Testing:
1. Start the application:
   ```bash
   npm start
   ```
2. Wait until you see a message saying the server is running
3. Open your web browser
4. Go to: http://localhost:3001

### For Production Use:
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
3. Open your web browser
4. Go to: http://localhost:3001

## Common Problems and Solutions

### "Command not found: npm" or "Command not found: node"
- This means Node.js isn't installed correctly
- Go back to Step 1.1 and reinstall Node.js

### "MDB file not found" Error
1. Check if your .mdb file exists
2. If using Option A (environment variables):
   - Make sure the path is correct
   - Try using Option B instead
3. If using Option B:
   - Make sure the file is named exactly `your-database.mdb`
   - Make sure it's in the mdb-dashboard folder

### "Port 3001 is already in use"
1. Find and close any other applications using port 3001
2. Or try these commands:
   ```bash
   # On Windows:
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F

   # On Mac/Linux:
   lsof -i :3001
   kill -9 <PID>
   ```

### "npm install" Shows Errors
1. Delete the 'node_modules' folder:
   ```bash
   # On Windows:
   rmdir /s /q node_modules

   # On Mac/Linux:
   rm -rf node_modules
   ```
2. Delete package-lock.json:
   ```bash
   rm package-lock.json
   ```
3. Try installing again:
   ```bash
   npm install
   ```

## Learning More

Once you're comfortable with the basics, check out README.md for:
- Advanced configuration options
- Project structure details
- Development guidelines
- Additional features

