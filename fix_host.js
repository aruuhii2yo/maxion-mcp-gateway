const fs = require('fs');

let host = fs.readFileSync('subscriber_host.js', 'utf8');

// Normalize line endings for reliable replacement
host = host.replace(/\r\n/g, '\n');

// 1. Add theme endpoints
const targetStatus = `app.get('/api/status', (req, res) => {`;
if (host.includes(targetStatus) && !host.includes('currentTheme')) {
    const replacement = `let currentTheme = { hue: 188, sat: 100, lit: 50 };

app.post('/api/theme', (req, res) => {
    currentTheme = req.body;
    res.json({success: true});
});

app.get('/api/theme', (req, res) => {
    res.json(currentTheme);
});

app.get('/api/status', (req, res) => {`;
    host = host.replace(targetStatus, replacement);
}

// 2. Add isPromo to telemetry
const targetTelemetry = `            trialExpired: trialExpired
        });`;
if (host.includes(targetTelemetry)) {
    const replacementTelemetry = `            trialExpired: trialExpired, isPromo: lifetimeStats.isPromo
        });`;
    host = host.replace(targetTelemetry, replacementTelemetry);
} else {
    // If exact match failed, try Regex
    host = host.replace(/trialExpired:\s*trialExpired\s*\n\s*\}\);/g, 'trialExpired: trialExpired, isPromo: lifetimeStats.isPromo\n        });');
}

fs.writeFileSync('subscriber_host.js', host);
console.log('subscriber_host.js successfully patched.');
