FROM node:20-slim

# Install chromium and dependencies
RUN apt-get update \
    && apt-get install -y \
       chromium \
       fonts-ipafont-gothic \
       fonts-wqy-zenhei \
       fonts-thai-tlwg \
       fonts-kacst \
       fonts-freefont-ttf \
       libxss1 \
       git \
       --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer config
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# App config
ENV PORT=2000

WORKDIR /usr/src/app

# Copy only package.json (avoid CRLF lock file issues)
COPY package.json ./

# Install deps
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

EXPOSE 2000

CMD [ "node", "index.js" ]
