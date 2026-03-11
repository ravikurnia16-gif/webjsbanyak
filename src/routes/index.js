const express = require('express');
const router = express.Router();

const messageRoutes = require('./messageRoutes');
const chatRoutes = require('./chatRoutes');
const groupRoutes = require('./groupRoutes');
const statusRoutes = require('./statusRoutes');
const sessionRoutes = require('./sessionRoutes');

router.use(messageRoutes);
router.use(chatRoutes);
router.use(groupRoutes);
router.use(statusRoutes); // This will handle /status/:sessionId
router.use(sessionRoutes);

module.exports = router;
