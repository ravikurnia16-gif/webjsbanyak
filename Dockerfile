# Use Node.js 20 slim as base
FROM node:20-slim

# Install Chromium and necessary dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create volume directory for WhatsApp sessions
RUN mkdir -p .wwebjs_auth && chmod 777 .wwebjs_auth

# Expose port
EXPOSE 3000

# Environment variables (Defaults)
ENV PORT=3000
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Start the application
CMD ["node", "src/app.js"]
