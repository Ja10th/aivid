# Use Node with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to install deps
USER root

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including tsx and optional deps)
RUN npm ci --include=optional && \
    npx puppeteer browsers install chrome

# Copy application files
COPY . .

# Create data directories and set ownership
RUN mkdir -p /app/data/videos /app/data/thumbs /app/data/tmp /app/data/music && \
    chown -R pptruser:pptruser /app/data

# Expose port
EXPOSE 10000

# Switch back to non-root user
USER pptruser

# Start worker
CMD ["npm", "run", "worker"]
