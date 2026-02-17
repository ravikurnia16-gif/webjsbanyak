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

console.log('Initializing WhatsApp Client...');
client.initialize().catch(err => console.error('Initialization failed:', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
