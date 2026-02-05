const express = require('express');
const router = express.Router();
const client = require('./whatsappClient');

router.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: 'Missing number or message' });
    }

    try {
        // Appending @c.us if not present, assuming number is only digits
        let finalNumber = number;
        if (!finalNumber.includes('@c.us')) {
            finalNumber = `${number}@c.us`;
        }

        const isRegistered = await client.isRegisteredUser(finalNumber);
        if (!isRegistered) {
            return res.status(404).json({ status: 'error', message: 'User not registered on WhatsApp' });
        }

        await client.sendMessage(finalNumber, message);
        res.json({ status: 'success', message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
