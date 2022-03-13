process.traceDeprecation = true;

require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => console.log('listening  at 3000'));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));