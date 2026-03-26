const whatsapp = require('../services/whatsappClient');
const logger = require('../utils/logger');

exports.createSession = async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    try {
        // This will trigger the 'qr' event via Socket.io
        whatsapp.initSession(sessionId);
        res.json({ message: `Initializing session ${sessionId}. Watch for QR code in dashboard.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
};

exports.getSessions = (req, res) => {
    try {
        const sessions = whatsapp.getAllSessions();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get sessions' });
    }
};

exports.getSessionStatus = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const status = await whatsapp.getStatus(sessionId);
        res.json({ sessionId, status });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get session status' });
    }
};
exports.deleteSession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        await whatsapp.deleteSession(sessionId);
        res.json({ message: `Session ${sessionId} deleted successfully.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
};
