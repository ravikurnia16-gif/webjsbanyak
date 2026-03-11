const whatsapp = require('../services/whatsappClient');

exports.createGroup = async (req, res) => {
    const { title, participants, sessionId } = req.body;
    const targetSession = sessionId || req.headers['x-session-id'];

    if (!title || !participants || !targetSession) {
        return res.status(400).json({ error: 'Title, participants, and sessionId are required' });
    }

    try {
        const client = whatsapp.getClient(targetSession);
        if (!client) return res.status(404).json({ error: 'Session not found' });
        const response = await client.createGroup(title, participants);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group', details: error.message });
    }
};
