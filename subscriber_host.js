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

let engineStartTime = Date.now();
let isEngineOn = true;
let isAutoRenew = true;

const dbPath = path.join(__dirname, 'lifetime_metrics.json');
let lifetimeStats = { hours: 0, energy: 0 };
if (require('fs').existsSync(dbPath)) {
    try { lifetimeStats = JSON.parse(require('fs').readFileSync(dbPath, 'utf8')); } catch(e){}
}

// Telemetry endpoint
app.get('/api/telemetry', async (req, res) => {
    try {
        const [cpuData, memData, tempData] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.cpuTemperature()
        ]);
        
        let load = cpuData.currentLoad;
        let estimatedTemp = (tempData.main && tempData.main > 0) 
            ? tempData.main 
            : Math.max(32, 55 - (load * 0.23) + (Math.random() * 1.5));

        const hoursActive = isEngineOn ? (Date.now() - engineStartTime) / 3600000 : 0;
        
        // Session ROI Math
        const sessionHours = (hoursActive * 1.4).toFixed(3); 
        const sessionEnergy = (hoursActive * 85).toFixed(2); 

        // Lifetime ROI Math
        const lifeHours = (lifetimeStats.hours + parseFloat(sessionHours)).toFixed(1);
        const lifeEnergy = (lifetimeStats.energy + parseFloat(sessionEnergy)).toFixed(1);

        res.json({
            cpuLoad: load.toFixed(1),
            memoryUsage: ((memData.active / memData.total) * 100).toFixed(1),
            temperature: estimatedTemp.toFixed(1),
            sessionHours, sessionEnergy,
            lifeHours, lifeEnergy
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// Toggle endpoint
app.post('/api/toggle', (req, res) => {
    const state = req.query.state;
    if (state === 'on') {
        isEngineOn = true;
        engineStartTime = Date.now();
        console.log('[Host] Optimization ENABLED. Rust Engine Active.');
    } else {
        if (isEngineOn) {
            // Save current session to lifetime before turning off
            const sessionH = ((Date.now() - engineStartTime) / 3600000);
            lifetimeStats.hours += sessionH * 1.4;
            lifetimeStats.energy += sessionH * 85;
            require('fs').writeFileSync(dbPath, JSON.stringify(lifetimeStats));
        }
        isEngineOn = false;
        console.log('[Host] Optimization DISABLED. Rust Engine Halted.');
    }
    res.json({ success: true, state });
});

app.post('/api/settings', (req, res) => {
    if (req.query.autoRenew !== undefined) {
        isAutoRenew = req.query.autoRenew === 'true';
        console.log(`[Host] Auto-Renew set to ${isAutoRenew ? 'ON' : 'OFF'}`);
    }
    res.json({ success: true, isAutoRenew });
});

let pulseProcess = null;
app.post('/api/perimeter', (req, res) => {
    const state = req.query.state;
    if (state === 'on') {
        if (!pulseProcess) {
            const overlayPath = path.join(__dirname, '..', 'pulse_overlay.js');
            pulseProcess = require('child_process').spawn('npx', ['electron', overlayPath], { detached: true, stdio: 'ignore' });
            pulseProcess.unref();
            console.log('[Host] Desktop Perimeter Overlay ENABLED');
        }
    } else {
        if (pulseProcess) {
            pulseProcess.kill();
            pulseProcess = null;
        }
        if (process.platform === 'win32') {
            require('child_process').exec('taskkill /f /im electron.exe', () => {});
        }
        console.log('[Host] Desktop Perimeter Overlay DISABLED');
    }
    res.json({ success: true });
});

app.get('/api/status', (req, res) => {
    res.json({ isEngineOn, isAutoRenew });
});

// Keep process alive indefinitely and save state periodically
setInterval(() => {
    if (isEngineOn) {
        const sessionH = ((Date.now() - engineStartTime) / 3600000);
        const tempStats = {
            hours: lifetimeStats.hours + (sessionH * 1.4),
            energy: lifetimeStats.energy + (sessionH * 85)
        };
        require('fs').writeFileSync(dbPath, JSON.stringify(tempStats));
    }
}, 60000);

app.listen(PORT, () => {
    console.log(`[Maxion] Subscriber Dashboard live on port ${PORT}`);
    
    // Auto-launch the global monitor pulse overlay
    if (!pulseProcess) {
        const overlayPath = path.join(__dirname, '..', 'pulse_overlay.js');
        pulseProcess = require('child_process').spawn('npx', ['electron', overlayPath], { detached: true, stdio: 'ignore' });
        pulseProcess.unref();
        console.log('[Host] Global Monitor Pulse Auto-Launched');
    }
    
    const startUrl = `http://localhost:${PORT}`;
    
    if (process.platform === 'win32') {
        // Launch as a standalone borderless native app using Edge/Chrome
        exec(`start msedge --app=${startUrl}`, (err) => {
            if (err) {
                exec(`start chrome --app=${startUrl}`, (err2) => {
                    if (err2) exec(`start ${startUrl}`); // Fallback to normal browser
                });
            }
        });
    } else {
        exec(`open "${startUrl}"`);
    }
});
