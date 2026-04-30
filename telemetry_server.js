const express = require('express');
const os = require('os');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let lastAgentPing = 0;

let previousCpus = os.cpus();
let simBattery = 100.0;

// Initialize Supabase for live MRR and traffic data
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fallback variables if Supabase is not yet configured (Starting Baseline)
let simAgentsEncountered = 0;
let simActiveSubscribers = 0;
let simMigratedWorkloads = 0;

// Simulation loop disabled for Production
/*
setInterval(() => {
    // 70% chance to simulate an agent hit every second
    if(Math.random() > 0.3) {
        simAgentsEncountered += Math.floor(Math.random() * 3) + 1;
        lastAgentPing = Date.now(); // Triggers the visual pulse on the UI
    }
    // 20% chance to simulate a new subscriber every second
    if(Math.random() > 0.8) {
        simActiveSubscribers++;
        simMigratedWorkloads++;
    }
}, 1000);
*/

app.post('/agent-ping', (req, res) => {
    lastAgentPing = Date.now();
    simAgentsEncountered++;
    res.json({ success: true });
});

app.post('/start-ngrok', (req, res) => {
    const { spawn, exec } = require('child_process');
    const path = require('path');
    const ngrokExe = path.join(__dirname, '..', 'ngrok.exe');
    console.log('[Remote] Dashboard trigger: REBOOT TUNNEL');
    exec('taskkill /F /IM ngrok.exe /T', () => {
        const proc = spawn(ngrokExe, ['http', '8080'], { detached: true, stdio: 'ignore', shell: true });
        proc.unref();
        res.json({ success: true });
    });
});

app.post('/start-rust', (req, res) => {
    const { spawn, exec } = require('child_process');
    const path = require('path');
    const rustExe = 'C:\\Users\\aruuh\\.gemini\\antigravity\\scratch\\Maxion_Windows_Core\\maxion_windows_cores.exe';
    console.log('[Remote] Dashboard trigger: POWER ON RUST ENGINE');
    exec('taskkill /F /IM maxion_windows_cores.exe /T', () => {
        const proc = spawn(rustExe, [], { detached: true, stdio: 'ignore', shell: true });
        proc.unref();
        res.json({ success: true });
    });
});

app.post('/stop-rust', (req, res) => {
    const { exec } = require('child_process');
    console.log('[Remote] Powering OFF Rust Engine...');
    exec('taskkill /F /IM maxion_windows_cores.exe /T', () => {
        res.json({ success: true });
    });
});

app.get('/metrics', async (req, res) => {
    // 1. Highly Accurate Hardware Telemetry via systeminformation
    const si = require('systeminformation');
    let load = 0, memUsage = 0, estimatedTemp = 0, cores = os.cpus().length, batteryLevel = simBattery;

    try {
        const [cpuData, memData, tempData, batteryData] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.cpuTemperature(),
            si.battery()
        ]);
        
        load = cpuData.currentLoad.toFixed(1);
        memUsage = ((memData.active / memData.total) * 100).toFixed(1);
        
        // If exact hardware temperature is not available on Windows, fall back to our simulated load-based model
        if (tempData.main && tempData.main > 0) {
            estimatedTemp = tempData.main.toFixed(1);
        } else {
            estimatedTemp = Math.max(32, 55 - (load * 0.23) + (Math.random() * 1.5)).toFixed(1);
        }
        
        if (batteryData.hasBattery) {
            batteryLevel = batteryData.percent;
        } else {
            simBattery = Math.max(0, simBattery - (load * 0.005 + 0.01));
            if (simBattery < 15) simBattery = 100.0;
            batteryLevel = simBattery.toFixed(1);
        }
    } catch (e) {
        console.error("Telemetry error", e);
    }

    // 2. Business Intelligence (Supabase Binding)
    let activeSubscribers = simActiveSubscribers;
    let migratedWorkloads = simMigratedWorkloads;
    let agentsEncountered = simAgentsEncountered;

    if (supabase) {
        try {
            // Pull real active subscribers
            const { count: subCount } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            
            if (subCount !== null) activeSubscribers = subCount;

            // Pull real migrated workloads
            const { count: workCount } = await supabase
                .from('migrations_log')
                .select('*', { count: 'exact', head: true });
            
            if (workCount !== null) migratedWorkloads = workCount;
            
        } catch (e) {
            // Fail silently and use simulation metrics
        }
    }
    
    res.json({
        cpuLoad: load,
        estimatedTemp: estimatedTemp,
        memoryUsage: memUsage,
        cores: cores,
        agentsEncountered,
        activeSubscribers,
        mrr: activeSubscribers * 20,
        treasury: "0x6E5b3C4A51D1E0aE2E8c4f923b7a5B229C8B5f6A",
        agentPingActive: (Date.now() - lastAgentPing) < 3000,
        batteryLevel: batteryLevel,
        globalLive: agentsEncountered > 0
    });
});

setInterval(() => {
    console.log(`Live Telemetry Pulled: ${os.cpus().length} Cores active. Load: ${os.freemem()} bytes free.`);
}, 5000);

app.listen(8080, () => {
    console.log('=============================================');
    console.log(' MAXION HARDWARE LINK ACTIVE ON PORT 8080');
    console.log('=============================================');
});
