const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable sandbox for Windows hardware-level access if needed
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    return;
}

// 1. Boot the internal subscriber express host (this binds port 11011 and enforces the 1-hour trial limit locally)
process.env.IS_PACKAGED = 'true';
require('./subscriber_host.js');

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 395,
        height: 760,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        backgroundColor: '#020204',
        title: 'Maxion Command Center'
    });
    
    mainWindow.setMenu(null);
    
    // Slight delay to ensure the express server is bound
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:11011');
    }, 500);

    mainWindow.on('close', (event) => {
        // Keeps the optimization engine running in the background if they close the window
        event.preventDefault();
        mainWindow.hide();
    });
});

app.on('second-instance', () => {
    if (mainWindow) {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});
