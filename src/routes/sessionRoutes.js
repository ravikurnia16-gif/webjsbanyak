const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/sessions', sessionController.getSessions);
router.post('/sessions', sessionController.createSession);
router.get('/sessions/:sessionId', sessionController.getSessionStatus);
router.delete('/sessions/:sessionId', sessionController.deleteSession);

module.exports = router;
