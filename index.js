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

// Initialize with retry logic
const MAX_RETRIES = 5;
let retryCount = 0;

async function initializeClient() {
    try {
        console.log(`Initializing WhatsApp Client... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await client.initialize();
    } catch (err) {
        retryCount++;
        console.error(`Initialization failed (attempt ${retryCount}/${MAX_RETRIES}):`, err.message);

        if (retryCount < MAX_RETRIES) {
            const delay = retryCount * 5000; // 5s, 10s, 15s, 20s, 25s
            console.log(`Retrying in ${delay / 1000} seconds...`);
            setTimeout(initializeClient, delay);
        } else {
            console.error('Max retries reached. Please restart the container manually.');
        }
    }
}

initializeClient();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
