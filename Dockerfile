# Use Node.js LTS version as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"] 