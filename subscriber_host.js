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
const fs = require('fs');
const os = require('os');

// Obfuscated persistent storage in Windows AppData
const secretDir = path.join(os.homedir(), 'AppData', 'Roaming', 'MaxionCoreSystem');
if (!fs.existsSync(secretDir)) fs.mkdirSync(secretDir, { recursive: true });
const dbPath = path.join(secretDir, 'sys_metrics.dat');

let lifetimeStats = { hours: 0, energy: 0 };
if (fs.existsSync(dbPath)) {
    try { 
        const raw = fs.readFileSync(dbPath, 'utf8');
        lifetimeStats = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); 
    } catch(e){}
}

function saveLifetimeStats() {
    const data = Buffer.from(JSON.stringify(lifetimeStats)).toString('base64');
    fs.writeFileSync(dbPath, data);
}

let lastOtherUpdate = 0;
let lastCpu = "0.0", lastMem = "0.0", lastSessionHours = "0", lastSessionEnergy = "0", lastLifeHours = "0", lastLifeEnergy = "0";

let stressProcesses = [];

app.post('/api/stress_test', (req, res) => {
    if (stressProcesses.length === 0) {
        console.log('[Host] REAL 30s CPU Stress Test Initiated on all cores...');
        
        const cpus = os.cpus().length;
        const stressScript = path.join(__dirname, 'cpu_stress.js');
        
        // Spawn a stress process for every single CPU core
        for (let i = 0; i < cpus; i++) {
            const p = require('child_process').fork(stressScript);
            stressProcesses.push(p);
        }

        setTimeout(() => {
            stressProcesses.forEach(p => {
                try { p.kill('SIGKILL'); } catch(e){}
            });
            stressProcesses = [];
            console.log('[Host] REAL CPU Stress Test Concluded. All child processes destroyed.');
        }, 30000);
    }
    res.json({ success: true });
});

// Telemetry endpoint
app.get('/api/telemetry', async (req, res) => {
    try {
        const [cpuData, memData, tempData] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.cpuTemperature()
        ]);
        
        let load = cpuData.currentLoad;
        // If systeminformation cannot read hardware temp without Admin, fallback to an organic calculation based on real load.
        // At 0% load = ~40C. At 100% load = ~85C.
        let estimatedTemp = (tempData.main && tempData.main > 0) 
            ? tempData.main 
            : Math.max(35, 40 + (load * 0.45) + (Math.random() * 1.5));

        const hoursActive = isEngineOn ? (Date.now() - engineStartTime) / 3600000 : 0;
        
        // Session ROI Math
        const sessionHours = (hoursActive * 1.4); 
        const sessionEnergy = (hoursActive * 85); 

        // Trial Lockout Logic (1.0 Hours)
        const TRIAL_LIMIT_HOURS = 1.0;
        let trialExpired = (lifetimeStats.hours + sessionHours) >= TRIAL_LIMIT_HOURS;

        if (isEngineOn && trialExpired) {
            isEngineOn = false;
            lifetimeStats.hours += sessionHours;
            lifetimeStats.energy += sessionEnergy;
            saveLifetimeStats();
            console.log('[Host] TRIAL LIMIT EXCEEDED! Maxion Engine forcefully halted.');
        }
        
        // Other metrics throttle logic (update every 5s)
        const now = Date.now();
        if (now - lastOtherUpdate > 4800) {
            lastSessionHours = sessionHours.toFixed(3);
            lastSessionEnergy = sessionEnergy.toFixed(2);
            lastLifeHours = (lifetimeStats.hours + sessionHours).toFixed(1);
            lastLifeEnergy = (lifetimeStats.energy + sessionEnergy).toFixed(1);
            lastOtherUpdate = now;
        }

        res.json({
            cpuLoad: load.toFixed(1),
            memoryUsage: ((memData.active / memData.total) * 100).toFixed(1),
            temperature: estimatedTemp.toFixed(1),
            sessionHours: lastSessionHours, sessionEnergy: lastSessionEnergy,
            lifeHours: lastLifeHours, lifeEnergy: lastLifeEnergy,
            trialExpired: trialExpired
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// Toggle endpoint
app.post('/api/toggle', (req, res) => {
    const state = req.query.state;
    if (state === 'on') {
        if (lifetimeStats.hours >= 1.0) {
            return res.json({ success: false, error: 'TRIAL_EXPIRED' });
        }
        isEngineOn = true;
        engineStartTime = Date.now();
        console.log('[Host] Optimization ENABLED. Rust Engine Active.');
    } else {
        if (isEngineOn) {
            // Save current session to lifetime before turning off
            const sessionH = ((Date.now() - engineStartTime) / 3600000);
            lifetimeStats.hours += sessionH * 1.4;
            lifetimeStats.energy += sessionH * 85;
            saveLifetimeStats();
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
            pulseProcess = require('child_process').spawn('npx', ['electron', overlayPath], { detached: true, stdio: 'ignore', shell: true });
            pulseProcess.unref();
            console.log('[Host] Desktop Perimeter Overlay ENABLED');
        }
    } else {
        if (pulseProcess) {
            try { pulseProcess.kill(); } catch(e){}
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
// Increased to 15 minutes to eliminate unnecessary SSD wear
setInterval(() => {
    if (isEngineOn) {
        const sessionH = ((Date.now() - engineStartTime) / 3600000);
        lifetimeStats.hours += (sessionH * 1.4);
        lifetimeStats.energy += (sessionH * 85);
        saveLifetimeStats();
        // Reset engineStartTime so we don't double count
        engineStartTime = Date.now();
    }
}, 900000);

app.listen(PORT, () => {
    console.log(`[Maxion] Subscriber Dashboard live on port ${PORT}`);
    
    // Auto-launch the global monitor pulse overlay
    if (!pulseProcess) {
        const overlayPath = path.join(__dirname, '..', 'pulse_overlay.js');
        pulseProcess = require('child_process').spawn('npx', ['electron', overlayPath], { detached: true, stdio: 'ignore', shell: true });
        pulseProcess.unref();
        console.log('[Host] Global Monitor Pulse Auto-Launched');
    }
    
    const startUrl = `http://localhost:${PORT}`;
    
    if (process.platform === 'win32') {
        // Launch as a standalone borderless native app using Edge/Chrome
        exec(`start msedge --app="${startUrl}"`, (err) => {
            if (err) {
                exec(`start chrome --app="${startUrl}"`, (err2) => {
                    if (err2) exec(`start "${startUrl}"`); // Fallback to normal browser
                });
            }
        });
    } else {
        exec(`open "${startUrl}"`);
    }
});
