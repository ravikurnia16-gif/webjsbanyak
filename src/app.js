const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const routes = require('./routes');
const whatsappClient = require('./services/whatsappClient');
const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Pass io to whatsappClient
whatsappClient.setIo(io);

// Serve static files from src/public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', authenticate, routes);

// Serve dashboard index.html for any other route (SPA style)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error Handling
app.use(errorHandler);

// Function to restore sessions from disk
const restoreSessions = async () => {
    const authPath = path.join(process.cwd(), '.wwebjs_auth');
    if (fs.existsSync(authPath)) {
        const files = fs.readdirSync(authPath);
        for (const file of files) {
            if (file.startsWith('session-')) {
                const sessionId = file.replace('session-', '');
                logger.info(`Restoring session: ${sessionId}`);
                whatsappClient.initSession(sessionId).catch(err => {
                    logger.error(`Error restoring session ${sessionId}:`, err);
                });
            }
        }
    }
};

// Start Server
server.listen(config.port, async () => {
    logger.info(`Server is running on port ${config.port}`);
    
    // Restore existing sessions
    await restoreSessions();
});

module.exports = { app, server };
