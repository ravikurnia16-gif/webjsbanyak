const whatsapp = require('../services/whatsappClient');

exports.getStatus = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const status = await whatsapp.getStatus(sessionId);
        res.json({ sessionId, status });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get status', details: error.message });
    }
};
