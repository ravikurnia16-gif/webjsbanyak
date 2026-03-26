const config = require('../config');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey || req.body?.apikey;

    if (!apiKey || apiKey !== config.apiKey) {
        logger.warn(`Unauthorized access attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    next();
};

module.exports = authenticate;
