const express = require('express');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');

const app = express();
const PORT = 11011;

app.use(express.json());

// Serve the dashboard
app.get('/', (req, res) => {
    try {
        const fs = require('fs');
        const html = fs.readFileSync(path.join(__dirname, 'subscriber_dashboard.html'), 'utf8');
        res.send(html);
    } catch (err) {
        res.status(500).send('Error loading dashboard: ' + err.message);
    }
});

// Telemetry endpoint
app.get('/api/telemetry', async (req, res) => {
    try {
        const [cpuData, memData] = await Promise.all([
            si.currentLoad(),
            si.mem()
        ]);
        
        res.json({
            cpuLoad: cpuData.currentLoad.toFixed(1),
            memoryUsage: ((memData.active / memData.total) * 100).toFixed(1)
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// Toggle endpoint
app.post('/api/toggle', (req, res) => {
    const state = req.query.state;
    if (state === 'on') {
        console.log('[Host] Optimization ENABLED. Rust Engine Active.');
        // Here you would spawn the actual Rust core binary locally
    } else {
        console.log('[Host] Optimization DISABLED. Rust Engine Halted.');
        // Here you would kill the Rust core binary
    }
    res.json({ success: true, state });
});

// Keep process alive indefinitely
setInterval(() => {
    // Heartbeat to prevent the app from ever sleeping while active
}, 60000);

app.listen(PORT, () => {
    console.log(`[Maxion] Subscriber Dashboard live on port ${PORT}`);
    
    // Automatically open the user's default browser to the side tab
    const startUrl = `http://localhost:${PORT}`;
    const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    exec(`${startCmd} ${startUrl}`);
});
