const { app, BrowserWindow } = require('electron');
const path = require('path');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    // Prevent cache issues and ensure no sandbox restrictions
    app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
    app.commandLine.appendSwitch('disable-http-cache');
    app.commandLine.appendSwitch('no-sandbox');

    let win = null;
    app.whenReady().then(() => {
        // Start the admin backend server which handles ngrok and /api/stats
        try {
            require('./admin_host.js');
        } catch (e) {
            console.error('Failed to boot admin_host.js:', e);
        }

        win = new BrowserWindow({
            width: 395,
            height: 760,
            resizable: false,
            maximizable: false,
            fullscreenable: false,
            autoHideMenuBar: true,
            backgroundColor: '#020204',
            title: 'Maxion Admin'
        });
        win.setMenu(null);
        win.loadFile(path.join(__dirname, 'admin_dashboard.html'));
    });

    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });

    app.on('window-all-closed', () => {
        app.quit();
    });
}
