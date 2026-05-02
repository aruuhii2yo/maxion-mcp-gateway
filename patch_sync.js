const fs = require('fs');

// 1. UPDATE subscriber_host.js
let host = fs.readFileSync('subscriber_host.js', 'utf8');
if (!host.includes('let currentTheme')) {
    host = host.replace("app.get('/api/status',", `
let currentTheme = { hue: 188, sat: 100, lit: 50 };

app.post('/api/theme', (req, res) => {
    currentTheme = req.body;
    res.json({success: true});
});

app.get('/api/theme', (req, res) => {
    res.json(currentTheme);
});

app.get('/api/status',`);
}

host = host.replace('trialExpired: trialExpired', 'trialExpired: trialExpired, isPromo: lifetimeStats.isPromo');
fs.writeFileSync('subscriber_host.js', host);

// 2. UPDATE subscriber_dashboard.html
let dash = fs.readFileSync('subscriber_dashboard.html', 'utf8');

dash = dash.replace('<span style="margin-left:8px; padding:2px 6px; background:hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.2); border:1px solid var(--primary); border-radius:4px; font-size:0.5rem; color:var(--primary); letter-spacing:0px; vertical-align: middle;">1 HOUR TRIAL</span>', 
    '<span id="licenseBadge" style="margin-left:8px; padding:2px 6px; background:hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.2); border:1px solid var(--primary); border-radius:4px; font-size:0.5rem; color:var(--primary); letter-spacing:0px; vertical-align: middle; transition: 0.3s;">1 HOUR TRIAL</span>');

dash = dash.replace('<div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">\\r\\n\\r\\n            <div style="font-size:0.7rem; color:#888; margin-bottom: 10px; letter-spacing: 1px;">SUBSCRIPTION MANAGEMENT</div>',
    '<div class="card" id="renewBox" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">\\r\\n\\r\\n            <div style="font-size:0.7rem; color:#888; margin-bottom: 10px; letter-spacing: 1px;">SUBSCRIPTION MANAGEMENT</div>');

if (!dash.includes("fetch('/api/theme'")) {
    dash = dash.replace("document.documentElement.style.setProperty('--theme-lit', l + '%');", 
`document.documentElement.style.setProperty('--theme-lit', l + '%');
            fetch('/api/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hue: h, sat: s, lit: l })
            });`);
}

if (!dash.includes("badge.innerText = \"LIFETIME ACTIVE\";")) {
    dash = dash.replace('if (enEl) enEl.innerText = data.sessionEnergy !== undefined && data.sessionEnergy !== "N/A" ? data.sessionEnergy : "N/A";',
`if (enEl) enEl.innerText = data.sessionEnergy !== undefined && data.sessionEnergy !== "N/A" ? data.sessionEnergy : "N/A";
                
                if (data.isPromo) {
                    const badge = document.getElementById('licenseBadge');
                    if (badge) {
                        badge.innerText = "LIFETIME ACTIVE";
                        badge.style.color = "#39ff14";
                        badge.style.borderColor = "#39ff14";
                        badge.style.background = "rgba(57, 255, 20, 0.2)";
                    }
                    const rb = document.getElementById('renewBox');
                    if (rb) rb.style.display = "none";
                }`);
}
fs.writeFileSync('subscriber_dashboard.html', dash);

// 3. UPDATE pulse_overlay.js
let pulse = fs.readFileSync('pulse_overlay.js', 'utf8');
pulse = pulse.replace('// Pure CSS animation is now handling the overlay.',
`// Poll theme from backend
                    setInterval(async () => {
                        try {
                            const res = await fetch('http://localhost:11011/api/theme');
                            const t = await res.json();
                            document.documentElement.style.setProperty('--theme-hue', t.hue);
                            document.documentElement.style.setProperty('--theme-sat', t.sat + '%');
                            document.documentElement.style.setProperty('--theme-lit', t.lit + '%');
                        } catch(e) {}
                    }, 500);`);

// Clean old pulse css and replace with variables
pulse = pulse.replace(/\\.frame-border \\{[\\s\\S]*?pointer-events: none;\\s*\\}/, '');
pulse = pulse.replace(/@keyframes organicPulse \\{[\\s\\S]*?100% \\{ box-shadow: inset 0 0 20px rgba\\(0, 242, 255, 0\\.3\\); \\}\\s*\\}/, '');

pulse = pulse.replace('</style>',
`   :root {
        --theme-hue: 188;
        --theme-sat: 100%;
        --theme-lit: 50%;
        --primary: hsl(var(--theme-hue), var(--theme-sat), var(--theme-lit));
        --primary-glow: hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.5);
    }
    @keyframes organicPulse {
        0%   { box-shadow: inset 0 0 15px var(--primary-glow); }
        50%  { box-shadow: inset 0 0 35px var(--primary); }
        100% { box-shadow: inset 0 0 15px var(--primary-glow); }
    }
    .frame-border {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        animation: organicPulse 6s ease-in-out infinite;
        z-index: 1;
        pointer-events: none;
    }
</style>`);

fs.writeFileSync('pulse_overlay.js', pulse);
console.log('All updates complete.');
