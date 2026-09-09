#!/bin/bash
# Install Puppeteer with Chrome on Render

echo "Installing dependencies and downloading Chrome..."

# Tell Puppeteer to download Chrome
export PUPPETEER_SKIP_DOWNLOAD=false

# Install Node dependencies (puppeteer will download Chrome)
npm install

# Verify Chrome was downloaded
if [ -d "node_modules/puppeteer/.local-chromium" ] || [ -d "$HOME/.cache/puppeteer" ]; then
  echo "✓ Chrome downloaded successfully"
else
  echo "⚠ Chrome not found, trying manual download..."
  npx puppeteer browsers install chrome
fi

echo "Build complete!"
