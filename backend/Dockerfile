FROM node:18-alpine

WORKDIR /app

# Install build dependencies for SQLite and wget for healthcheck
RUN apk add --no-cache python3 make g++ sqlite wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

# Switch to non-root user
USER node

EXPOSE 3001

CMD ["npm", "start"] 