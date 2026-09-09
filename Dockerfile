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

# Fix permissions for data directories
RUN chown -R pptruser:pptruser /app && \
    mkdir -p /app/data/videos /app/data/thumbs /app/data/tmp /app/data/music

# Expose port
EXPOSE 10000

# Set Puppeteer to use installed Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Switch to non-root user
USER pptruser

# Start worker
CMD ["npm", "run", "worker"]
