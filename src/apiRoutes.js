const express = require('express');
const router = express.Router();
const client = require('./whatsappClient');

router.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: 'Missing number or message' });
    }

    try {
        // Appending @c.us if not present AND not a group ID (@g.us)
        let finalNumber = number;
        if (!finalNumber.includes('@c.us') && !finalNumber.includes('@g.us')) {
            finalNumber = `${number}@c.us`;
        }

        // Only check registration for individual numbers, not groups
        if (!finalNumber.includes('@g.us')) {
            const isRegistered = await client.isRegisteredUser(finalNumber);
            if (!isRegistered) {
                return res.status(404).json({ status: 'error', message: 'User not registered on WhatsApp' });
            }
        }

        await client.sendMessage(finalNumber, message);
        res.json({ status: 'success', message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/groups', async (req, res) => {
    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(chat => ({
                id: chat.id._serialized,
                name: chat.name
            }));
        res.json({ status: 'success', groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
