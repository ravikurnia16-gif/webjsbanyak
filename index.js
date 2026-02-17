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

// Start server first
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Initialize WhatsApp with retry
const MAX_RETRIES = 10;
let attempt = 0;

async function startWhatsApp() {
    attempt++;
    console.log(`Initializing WhatsApp Client... (attempt ${attempt}/${MAX_RETRIES})`);
    try {
        await client.initialize();
    } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.error(`Initialization failed: ${msg}`);
        if (attempt < MAX_RETRIES) {
            const wait = Math.min(attempt * 5, 30);
            console.log(`Retrying in ${wait} seconds...`);
            setTimeout(startWhatsApp, wait * 1000);
        } else {
            console.error('Max retries reached. Restarting process...');
            process.exit(1);
        }
    }
}

startWhatsApp();
