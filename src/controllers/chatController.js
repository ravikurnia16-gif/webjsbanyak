const whatsapp = require('../services/whatsappClient');

exports.getChats = async (req, res) => {
    const sessionId = req.query.sessionId || req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    try {
        const client = whatsapp.getClient(sessionId);
        if (!client) return res.status(404).json({ error: 'Session not found' });
        const chats = await client.getChats();
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieving chats', details: error.message });
    }
};

exports.getContacts = async (req, res) => {
    const sessionId = req.query.sessionId || req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    try {
        const client = whatsapp.getClient(sessionId);
        if (!client) return res.status(404).json({ error: 'Session not found' });
        const contacts = await client.getContacts();
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieving contacts', details: error.message });
    }
};
