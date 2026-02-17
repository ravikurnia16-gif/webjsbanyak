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

// Initialize WhatsApp with exit-on-fail
async function startWhatsApp() {
    console.log('Initializing WhatsApp Client...');
    try {
        await client.initialize();
    } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.error(`Initialization failed: ${msg}`);

        // If it failed, we must exit to let the container restart cleanly.
        // This is the only way to guarantee the Chromium lock is released.
        console.log('Exiting in 5 seconds to trigger a fresh container start...');

        try {
            await client.destroy();
        } catch (destroyErr) {
            // Ignore destroy errors
        }

        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }
}

startWhatsApp();
