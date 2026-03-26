const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const logger = require('../utils/logger');

class WhatsAppClient {
    constructor() {
        this.clients = new Map();
        this.io = null;
    }

    setIo(io) {
        this.io = io;
    }

    async initSession(sessionId) {
        if (this.clients.has(sessionId)) {
            logger.info(`Session ${sessionId} already exists.`);
            return this.clients.get(sessionId);
        }

        logger.info(`Initializing session: ${sessionId} with Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'default'}`);
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionId }),
            authTimeoutMs: 60000,
            qrMaxRetries: 5,
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            },
            puppeteer: {
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--disable-gpu',
                    '--disable-canvas-aa',
                    '--disable-2d-canvas-clip-aa',
                    '--disable-gl-drawing-for-tests',
                    '--disable-dev-db-utils',
                    '--mute-audio',
                    '--no-default-browser-check'
                ]
            }
        });

        this.clients.set(sessionId, client);

        client.on('qr', (qr) => {
            logger.info(`QR Code received for session ${sessionId}`);
            if (this.io) {
                this.io.emit('qr', { sessionId, qr });
            }
        });

        client.on('ready', () => {
            logger.info(`WhatsApp Client ${sessionId} is ready!`);
            if (this.io) {
                this.io.emit('ready', { sessionId });
            }
        });

        client.on('authenticated', () => {
            logger.info(`WhatsApp Client ${sessionId} authenticated`);
            if (this.io) {
                this.io.emit('authenticated', { sessionId });
            }
        });

        client.on('auth_failure', (msg) => {
            logger.error(`WhatsApp Authentication failure for ${sessionId}`, msg);
            if (this.io) {
                this.io.emit('auth_failure', { sessionId, message: msg });
            }
        });

        client.on('disconnected', (reason) => {
            logger.warn(`WhatsApp Client ${sessionId} disconnected`, reason);
            if (this.io) {
                this.io.emit('disconnected', { sessionId, reason });
            }
            this.clients.delete(sessionId);
        });

        client.on('message', async msg => {
            logger.info(`Message received from ${msg.from} on session ${sessionId}: ${msg.body}`);
            // Future webhook logic here
        });

        try {
            await client.initialize();
        } catch (error) {
            logger.error(`Failed to initialize client ${sessionId}:`, error);
            this.clients.delete(sessionId);
        }

        return client;
    }

    getClient(sessionId) {
        return this.clients.get(sessionId);
    }

    async sendMessage(sessionId, number, message) {
        const client = this.getClient(sessionId);
        if (!client) throw new Error('Session not found');
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        return await client.sendMessage(chatId, message);
    }

    async sendMedia(sessionId, number, mediaPath, caption) {
        const client = this.getClient(sessionId);
        if (!client) throw new Error('Session not found');
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        const media = MessageMedia.fromFilePath(mediaPath);
        return await client.sendMessage(chatId, media, { caption });
    }

    async getStatus(sessionId) {
        const client = this.getClient(sessionId);
        if (!client) return 'DISCONNECTED';
        try {
            const state = await client.getState();
            return state || 'CONNECTED';
        } catch (e) {
            return 'DISCONNECTED';
        }
    }

    getAllSessions() {
        const sessions = [];
        for (let [id, client] of this.clients) {
            sessions.push({ id });
        }
        return sessions;
    }

    async deleteSession(sessionId) {
        const client = this.getClient(sessionId);
        if (!client) return;

        try {
            await client.destroy();
            this.clients.delete(sessionId);
            logger.info(`Session ${sessionId} deleted successfully.`);
        } catch (error) {
            logger.error(`Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
}

const whatsappClient = new WhatsAppClient();
module.exports = whatsappClient;
