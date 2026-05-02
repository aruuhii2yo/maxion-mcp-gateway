const fs = require('fs');

let host = fs.readFileSync('subscriber_host.js', 'utf8');

if (!host.includes('currentTheme')) {
    host = host.replace("app.get('/api/status'", `let currentTheme = { hue: 188, sat: 100, lit: 50 };

app.post('/api/theme', (req, res) => {
    currentTheme = req.body;
    res.json({success: true});
});

app.get('/api/theme', (req, res) => {
    res.json(currentTheme);
});

app.get('/api/status'`);
    
    host = host.replace('trialExpired: trialExpired', 'trialExpired: trialExpired, isPromo: lifetimeStats.isPromo');
    fs.writeFileSync('subscriber_host.js', host);
    console.log('subscriber_host.js updated.');
} else {
    console.log('subscriber_host.js already updated.');
}

let dash = fs.readFileSync('subscriber_dashboard.html', 'utf8');

if (!dash.includes('hueSlider')) {
    dash = dash.replace(/#00f2ff/gi, 'var(--primary)');
    dash = dash.replace(/rgba\(0,\s*242,\s*255,\s*([^)]+)\)/gi, 'hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), $1)');

    dash = dash.replace('<style>', `<style>
    :root {
        --theme-hue: 188;
        --theme-sat: 100%;
        --theme-lit: 50%;
        --primary: hsl(var(--theme-hue), var(--theme-sat), var(--theme-lit));
        --primary-glow: hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.5);
    }
`);

    dash = dash.replace('<div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">', `
        <div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding: 15px;">
            <div style="font-size:0.7rem; color:#888; margin-bottom: 12px; letter-spacing: 1px;">THEME CUSTOMIZATION</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <label style="font-size: 0.65rem; color: var(--primary); text-align: left; display: flex; justify-content: space-between;">
                    <span>HUE</span>
                    <input type="range" id="hueSlider" min="0" max="360" value="188" oninput="updateTheme()" style="width: 70%; accent-color: var(--primary);">
                </label>
                <label style="font-size: 0.65rem; color: var(--primary); text-align: left; display: flex; justify-content: space-between;">
                    <span>SATURATION</span>
                    <input type="range" id="satSlider" min="0" max="100" value="100" oninput="updateTheme()" style="width: 70%; accent-color: var(--primary);">
                </label>
                <label style="font-size: 0.65rem; color: var(--primary); text-align: left; display: flex; justify-content: space-between;">
                    <span>LIGHTNESS</span>
                    <input type="range" id="litSlider" min="20" max="80" value="50" oninput="updateTheme()" style="width: 70%; accent-color: var(--primary);">
                </label>
            </div>
        </div>
        <div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">
`);

    dash = dash.replace('</script>', `
        function updateTheme() {
            const h = document.getElementById('hueSlider').value;
            const s = document.getElementById('satSlider').value;
            const l = document.getElementById('litSlider').value;
            document.documentElement.style.setProperty('--theme-hue', h);
            document.documentElement.style.setProperty('--theme-sat', s + '%');
            document.documentElement.style.setProperty('--theme-lit', l + '%');
            
            fetch('/api/theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hue: h, sat: s, lit: l })
            });
        }
</script>`);

    dash = dash.replace(/animation: floatUI 8s ease-in-out infinite, organicPulse 20s ease-in-out infinite;/g, 'animation: floatUI 8s ease-in-out infinite, organicPulse 6s ease-in-out infinite;');
    
    fs.writeFileSync('subscriber_dashboard.html', dash);
    console.log('subscriber_dashboard.html updated.');
} else {
    console.log('subscriber_dashboard.html already updated.');
}
