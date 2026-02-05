const express = require('express');
const bodyParser = require('body-parser');
const client = require('./src/whatsappClient');
const apiRoutes = require('./src/apiRoutes');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/api', apiRoutes);

console.log('Initializing WhatsApp Client...');
client.initialize();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
