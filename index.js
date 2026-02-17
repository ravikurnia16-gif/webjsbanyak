const express = require('express');
const bodyParser = require('body-parser');
const client = require('./src/whatsappClient');
const apiRoutes = require('./src/apiRoutes');

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('WhatsApp API Gateway is running');
});

// Start HTTP server first so EasyPanel sees a healthy container
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Then initialize WhatsApp (may take time for Chromium to start)
async function initializeClient() {
    try {
        console.log('Initializing WhatsApp Client...');
        await client.initialize();
    } catch (err) {
        console.error('Initialization failed:', err.message);
        console.log('Exiting to trigger container restart...');
        process.exit(1); // Let Docker/EasyPanel restart the container
    }
}

initializeClient();
