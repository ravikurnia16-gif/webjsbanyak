FROM public.ecr.aws/docker/library/node:20-slim

# Install chromium, fonts, and git (needed for whatsapp-web.js tarball)
RUN apt-get update \
    && apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 git \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip installing Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set default port
ENV PORT=2000

# Create app directory
WORKDIR /usr/src/app

# Copy package.json only (not lock file to avoid CRLF issues)
COPY package.json ./

# Install dependencies fresh
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

EXPOSE 2000

CMD [ "node", "index.js" ]
