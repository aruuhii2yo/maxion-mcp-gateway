const express = require('express');
const os = require('os');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve the standalone telemetry dashboard
app.get('/', (req, res) => {
    try {
        const fs = require('fs');
        const html = fs.readFileSync(path.join(__dirname, '..', 'dashboard_telemetry.html'), 'utf8');
        res.send(html);
    } catch (err) {
        res.status(500).send('Error loading telemetry dashboard: ' + err.message);
    }
});

let simBattery = 100.0;

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



app.get('/metrics', async (req, res) => {
    // 1. Highly Accurate Hardware Telemetry via systeminformation
    const si = require('systeminformation');
    let load = 0, memUsage = 0, estimatedTemp = 0, cores = os.cpus().length, batteryLevel = simBattery;

    try {
        const cpuData = await si.currentLoad().catch(() => ({ currentLoad: 0 }));
        const memData = await si.mem().catch(() => ({ active: 0, total: 1 }));
        const tempData = await si.cpuTemperature().catch(() => ({ main: 0 }));
        const batteryData = await si.battery().catch(() => ({ hasBattery: false }));
        
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
    
    res.json({
        cpuLoad: load,
        estimatedTemp: estimatedTemp,
        memoryUsage: memUsage,
        cores: cores,
        batteryLevel: batteryLevel
    });
});

setInterval(() => {
    console.log(`Live Telemetry Pulled: ${os.cpus().length} Cores active. Load: ${os.freemem()} bytes free.`);
}, 5000);

app.listen(8080, () => {
    console.log('=============================================');
    console.log(' MAXION HARDWARE LINK ACTIVE ON PORT 8080');
    console.log('=============================================');
    
    // Auto-launch standalone telemetry dashboard disabled
    /*
    const startUrl = `http://localhost:8080`;
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
        exec(`start msedge --app="${startUrl}"`, (err) => {
            if (err) {
                exec(`start chrome --app="${startUrl}"`, (err2) => {
                    if (err2) exec(`start "${startUrl}"`);
                });
            }
        });
    }
    */
});
