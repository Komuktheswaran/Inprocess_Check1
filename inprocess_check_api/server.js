// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');

// Routers
const parametersRouter = require('./routes/parameters');
const parameterLogRouter = require('./routes/parameterLog');
const configurationsRouter = require('./routes/configurations');

// DB pool bootstrap (re‑use your existing config/database.js)
const database = require('./config/database');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Core middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (only in prod)
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'web-build')));
}

// Health
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Inprocess Check API is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount routers (actual logic lives in controllers)
app.use('/api', parametersRouter);
app.use('/api', parameterLogRouter);

app.use('/api', configurationsRouter);

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: [
            'GET /api/health',
            'GET /api/parameters',
            'POST /api/parameters',
            'PUT /api/parameters/:id',
            'DELETE /api/parameters/:id',
            'GET /api/parameter-log',
            'POST /api/parameter-log',
            'POST /api/parameter-log/bulk',
            'DELETE /api/parameter-log',
            'GET /api/configuration'
        ],
    });
});

// Error handler
app.use((err, req, res, _next) => {
    console.error('Express Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});




// Serve SPA index (prod)
if (isProduction) {
    app.get('*', (req, res, next) => {
        if (req.url.startsWith('/api/')) return next();
        res.sendFile(path.join(__dirname, 'web-build', 'index.html'));
    });
}

const PORT = process.env.PORT || process.env.IISNODE_PORT || 3000;

async function start() {
    try {
        await database.connect(); // uses config/database.js
        app.listen(PORT, () => {
            console.log(`API listening on ${PORT}`);
        });
    } catch (e) {
        console.error('Startup failed:', e);
        process.exit(1);
    }
}

start();
module.exports = app;
