const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 11012; // Dedicated Admin Port

let ngrokProcess = null;
let isNgrokRunning = false;
let isShuttingDown = false;

// Business Intelligence state
let simAgentsEncountered = 0;
let simActiveSubscribers = 0;
let simMigratedWorkloads = 0;
let lastAgentPing = 0;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Keep Ngrok Alive Loop
function startNgrok() {
    if (ngrokProcess) {
        try { ngrokProcess.kill(); } catch (e) {}
    }
    const ngrokExe = path.join(__dirname, '..', 'ngrok.exe');
    console.log('[Admin] Initiating Ngrok public tunnel on port 11011...');
    ngrokProcess = spawn(ngrokExe, ['http', '11011'], { stdio: 'ignore', windowsHide: true });
    isNgrokRunning = true;

    ngrokProcess.on('exit', () => {
        isNgrokRunning = false;
        if (!isShuttingDown) {
            console.log('[Admin] WARNING: Ngrok tunnel crashed. Restarting in 3 seconds...');
            setTimeout(startNgrok, 3000);
        }
    });
}

// Initial boot
startNgrok();

// Simulation loop removed for Production.
// The dashboard will now exclusively display real, verified metrics.

app.use(express.json());

// Serve the unified standalone UI
app.get('/', (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, 'admin_dashboard.html'), 'utf8');
        res.send(html);
    } catch (err) {
        res.status(500).send('Error loading admin dashboard: ' + err.message);
    }
});

// Admin Analytics API
app.get('/api/stats', async (req, res) => {
    // 1. Fetch Ngrok Status directly from the local Ngrok API (port 4040)
    let publicUrl = null;
    let requests = 0;
    try {
        const tunnelRes = await fetch('http://localhost:4040/api/tunnels');
        const tunnelData = await tunnelRes.json();
        if (tunnelData.tunnels && tunnelData.tunnels.length > 0) {
            publicUrl = tunnelData.tunnels[0].public_url;
        }
        
        const reqRes = await fetch('http://localhost:4040/api/requests/http');
        const reqData = await reqRes.json();
        requests = reqData.requests ? reqData.requests.length : 0;
    } catch (e) {
        // Ngrok API not ready or offline
    }

    // 2. Fetch Business Metrics
    let activeSubscribers = simActiveSubscribers;
    let migratedWorkloads = simMigratedWorkloads;
    
    if (supabase) {
        try {
            const { count: subCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
            if (subCount !== null) activeSubscribers = subCount;

            const { count: workCount } = await supabase.from('migrations_log').select('*', { count: 'exact', head: true });
            if (workCount !== null) migratedWorkloads = workCount;
        } catch (e) {}
    }

    res.json({
        ngrok: { running: isNgrokRunning, url: publicUrl, requests: requests },
        agents: { count: simAgentsEncountered, pingActive: (Date.now() - lastAgentPing) < 3000 },
        business: {
            subscribers: activeSubscribers,
            mrr: activeSubscribers * 20,
            migrated: migratedWorkloads,
            treasury: "0x6E5b3C4A51D1E0aE2E8c4f923b7a5B229C8B5f6A"
        }
    });
});

app.post('/api/shutdown', (req, res) => {
    isShuttingDown = true;
    if (ngrokProcess) ngrokProcess.kill();
    console.log('[Admin] Shutting down dashboard and tunnels...');
    res.json({ success: true });
    setTimeout(() => process.exit(0), 1000);
});

app.listen(PORT, () => {
    console.log(`[Admin] Unified dashboard live on port ${PORT}`);
    
    // Auto-launch standalone app window
    const startUrl = `http://localhost:${PORT}`;
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
        exec(`start msedge --app="${startUrl}"`, (err) => {
            if (err) exec(`start chrome --app="${startUrl}"`);
        });
    }
});
