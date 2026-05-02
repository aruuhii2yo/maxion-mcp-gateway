const fs = require('fs');
let html = fs.readFileSync('subscriber_dashboard.html', 'utf8');

// Replace hex and rgba
html = html.replace(/#00f2ff/gi, 'var(--primary)');
html = html.replace(/rgba\(0,\s*242,\s*255,\s*(.*?)\)/gi, 'hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), $1)');

// Inject CSS variables
html = html.replace('<style>', `<style>
    :root {
        --theme-hue: 188;
        --theme-sat: 100%;
        --theme-lit: 50%;
        --primary: hsl(var(--theme-hue), var(--theme-sat), var(--theme-lit));
        --primary-glow: hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.5);
        --primary-faint: hsla(var(--theme-hue), var(--theme-sat), var(--theme-lit), 0.2);
    }
`);

// Inject Sliders UI
html = html.replace('<div class="card" style="margin-top: 10px; border-color: rgba(255,255,255,0.1); padding-bottom: 10px;">', `
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

// Inject updateTheme logic
html = html.replace('</script>', `
        function updateTheme() {
            const h = document.getElementById('hueSlider').value;
            const s = document.getElementById('satSlider').value;
            const l = document.getElementById('litSlider').value;
            document.documentElement.style.setProperty('--theme-hue', h);
            document.documentElement.style.setProperty('--theme-sat', s + '%');
            document.documentElement.style.setProperty('--theme-lit', l + '%');
        }
</script>`);

// Fix breathing animations
html = html.replace(/animation: floatUI 8s ease-in-out infinite, organicPulse 20s ease-in-out infinite;/g, 'animation: floatUI 8s ease-in-out infinite, organicPulse 6s ease-in-out infinite;');
html = html.replace(/animation: pulseBlue 2s infinite ease-in-out;/g, 'animation: pulseBlue 4s infinite ease-in-out;');

// Replace keyframes
html = html.replace(/@keyframes organicPulse \{[^}]*\}/s, `@keyframes organicPulse {
        0%   { box-shadow: 0 0 15px var(--primary-glow); }
        50%  { box-shadow: 0 0 35px var(--primary); }
        100% { box-shadow: 0 0 15px var(--primary-glow); }
    }`);

html = html.replace(/@keyframes pulseBlue \{[^}]*\}/s, `@keyframes pulseBlue {
        0% { box-shadow: 0 0 15px var(--primary-glow); transform: scale(1); }
        50% { box-shadow: 0 0 35px var(--primary); transform: scale(1.02); }
        100% { box-shadow: 0 0 15px var(--primary-glow); transform: scale(1); }
    }`);

fs.writeFileSync('subscriber_dashboard.html', html);
console.log('Dashboard theme dynamically patched.');
