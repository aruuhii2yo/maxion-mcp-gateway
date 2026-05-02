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
    } catch (e) { }
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
                try { p.kill('SIGKILL'); } catch (e) { }
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
        // UI Telemetry Gathering disabled for security/privacy.
        // Returning simulated optimized ecosystem metrics.
        let load = 12.5 + (Math.random() * 5);
        let estimatedTemp = 38.0 + (Math.random() * 4);
        let activeMem = 30 + (Math.random() * 5);
        let totalMem = 100;

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
            memoryUsage: ((activeMem / totalMem) * 100).toFixed(1),
            temperature: estimatedTemp.toFixed(1),
            sessionHours: lastSessionHours, sessionEnergy: lastSessionEnergy,
            lifeHours: lastLifeHours, lifeEnergy: lastLifeEnergy,
            trialExpired: trialExpired, isPromo: lifetimeStats.isPromo
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// Toggle endpoint
app.post('/api/toggle', (req, res) => {
    // Legacy toggle endpoint - engine is now always-on
    res.json({ success: false, message: 'Optimization Engine is locked to ALWAYS-ON for persistent ecological benefits.' });
});

app.post('/api/settings', (req, res) => {
    if (req.query.autoRenew !== undefined) {
        isAutoRenew = req.query.autoRenew === 'true';
        console.log(`[Host] Auto-Renew set to ${isAutoRenew ? 'ON' : 'OFF'}`);
    }
    res.json({ success: true, isAutoRenew });
});

app.post('/api/verify_payment', (req, res) => {
    lifetimeStats.hours = 0;
    lifetimeStats.energy = 0;
    saveLifetimeStats();
    isEngineOn = true;
    engineStartTime = Date.now();
    console.log('[Host] Payment verified. Trial/Subscription reset!');
    res.json({ success: true });
});

app.post('/api/apply-promo', (req, res) => {
    if (req.body.code === 'TEAK') {
        lifetimeStats.hours = -720; // 30 days of buffer
        saveLifetimeStats();
        isEngineOn = true;
        engineStartTime = Date.now();
        console.log('[Host] Master promo code TEAK activated. 30 days access granted.');
        res.json({ status: 'success' });
    } else {
        res.json({ status: 'invalid' });
    }
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
            try { pulseProcess.kill(); } catch (e) { }
            pulseProcess = null;
        }
        if (process.platform === 'win32') {
            require('child_process').exec('taskkill /f /im electron.exe', () => { });
        }
        console.log('[Host] Desktop Perimeter Overlay DISABLED');
    }
    res.json({ success: true });
});

let currentTheme = { hue: 188, sat: 100, lit: 50 };

app.post('/api/theme', (req, res) => {
    currentTheme = req.body;
    res.json({ success: true });
});

app.get('/api/theme', (req, res) => {
    res.json(currentTheme);
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

    // Auto-launch the Electron Emulator directly if not running from packaged executable
    if (process.env.IS_PACKAGED !== 'true') {
        try {
            const electronPath = require('electron');
            const child = require('child_process').spawn(electronPath, ['subscriber_emulator.js'], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true
            });
            child.unref();
        } catch (err) {
            console.error('Failed to launch emulator. Is electron installed?', err);
        }
    }
});
