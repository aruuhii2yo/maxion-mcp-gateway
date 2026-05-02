const fs = require('fs');

function patch(file, replacer) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    const newContent = replacer(content);
    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log(`Patched ${file}`);
    } else {
        console.log(`No changes made to ${file}`);
    }
}

// Patch subscriber_host.js
patch('subscriber_host.js', content => {
    let res = content;
    
    // Add endpoints
    const hostTarget = `app.get('/api/status', (req, res) => {`;
    if (!res.includes('currentTheme') && res.includes(hostTarget)) {
        res = res.replace(hostTarget, `let currentTheme = { hue: 188, sat: 100, lit: 50 };\n\napp.post('/api/theme', (req, res) => {\n    currentTheme = req.body;\n    res.json({success: true});\n});\n\napp.get('/api/theme', (req, res) => {\n    res.json(currentTheme);\n});\n\napp.get('/api/status', (req, res) => {`);
    }

    // Add isPromo
    const promoTarget = `trialExpired: trialExpired\n        });`;
    if (res.includes(promoTarget)) {
        res = res.replace(promoTarget, `trialExpired: trialExpired, isPromo: lifetimeStats.isPromo\n        });`);
    }

    return res;
});

// Patch subscriber_dashboard.html
patch('subscriber_dashboard.html', content => {
    let res = content;

    // Theme Variables
    if (!res.includes('var(--primary)')) {
        res = res.replace(/#00f2ff/gi, 'var(--primary)');
        res = res.replace(/rgba\(0,\s*242,\s*255,\s*([^\)]+)\)/gi, 'hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), $1)');
        
        res = res.replace('<style>', `<style>\n    :root {\n        --theme-hue: 188;\n        --theme-sat: 100%;\n        --theme-lit: 50%;\n        --primary: hsl(var(--theme-hue), var(--theme-sat), var(--theme-lit));\n        --primary-glow: hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.5);\n    }`);
    }

    // Sliders
    const dashTarget = `<div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">\n            <div style="font-size:0.7rem; color:#888; margin-bottom: 10px; letter-spacing: 1px;">SUBSCRIPTION MANAGEMENT</div>`;
    if (!res.includes('hueSlider') && res.includes(dashTarget)) {
        res = res.replace(dashTarget, `        <div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding: 15px;">
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
            <div style="font-size:0.7rem; color:#888; margin-bottom: 10px; letter-spacing: 1px;">SUBSCRIPTION MANAGEMENT</div>`);
    }

    // sync function
    const scriptTarget = `</script>`;
    if (!res.includes('function updateTheme()') && res.includes(scriptTarget)) {
        res = res.replace(scriptTarget, `        function updateTheme() {
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
    }

    return res;
});
