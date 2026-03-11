const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/chats', chatController.getChats);
router.get('/contacts', chatController.getContacts);

module.exports = router;
