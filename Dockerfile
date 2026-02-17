FROM ghcr.io/puppeteer/puppeteer:latest

# Set default port
ENV PORT=2000

# Skip Chromium download (already installed in base image)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /usr/src/app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 2000

CMD [ "node", "index.js" ]
