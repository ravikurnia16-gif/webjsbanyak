const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

router.get('/status/:sessionId', statusController.getStatus);

module.exports = router;
