const whatsapp = require('../services/whatsappClient');

exports.sendMessage = async (req, res) => {
    const { number, message, sessionId } = req.body;
    const targetSession = sessionId || req.headers['x-session-id'];

    if (!number || !message || !targetSession) {
        return res.status(400).json({ error: 'Number, message, and sessionId are required' });
    }

    try {
        const response = await whatsapp.sendMessage(targetSession, number, message);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
};

exports.sendMedia = async (req, res) => {
    const { number, mediaPath, caption, sessionId } = req.body;
    const targetSession = sessionId || req.headers['x-session-id'];

    if (!number || !mediaPath || !targetSession) {
        return res.status(400).json({ error: 'Number, mediaPath, and sessionId are required' });
    }

    try {
        const response = await whatsapp.sendMedia(targetSession, number, mediaPath, caption);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send media', details: error.message });
    }
}
