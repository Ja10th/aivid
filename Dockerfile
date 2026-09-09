# Use Node with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including tsx)
RUN npm ci

# Copy application files
COPY . .

# Expose port
EXPOSE 10000

# Set Puppeteer to use installed Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start worker
CMD ["npm", "run", "worker"]
