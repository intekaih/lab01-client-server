 
const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// Middleware để phục vụ static files
app.use(express.static('public'));
app.use(express.json());

// Custom headers
app.use((req, res, next) => {
    res.setHeader('X-Server-Info', 'Lab01-Client-Server');
    res.setHeader('X-Timestamp', new Date().toISOString());
    next();
});

// API endpoint - thông tin server
app.get('/api/server-info', (req, res) => {
    const serverInfo = {
        timestamp: new Date().toISOString(),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length
    };
    
    res.json({
        success: true,
        data: serverInfo
    });
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'POST request received',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});

// Xử lý 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.url} not found`,
        timestamp: new Date().toISOString()
    });
});

// Xử lý lỗi 500
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from 'public' directory`);
});