const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/send-message', messageController.sendMessage);
router.get('/send', messageController.triggerMessage);
router.post('/send-media', messageController.sendMedia);

module.exports = router;
