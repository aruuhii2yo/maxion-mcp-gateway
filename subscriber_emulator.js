const { app, BrowserWindow } = require('electron');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    // Prevent "Unable to move the cache: Access is denied" crashes
    app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
    app.commandLine.appendSwitch('disable-http-cache');
    // Ensure it can run regardless of strict OS sandbox rules
    app.commandLine.appendSwitch('no-sandbox');

    let win = null;

    app.whenReady().then(() => {
        win = new BrowserWindow({
        width: 395,
        height: 760,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        backgroundColor: '#020204',
        title: "Maxion Core"
    });
    
        win.setMenu(null);
        win.loadURL('http://localhost:11011');
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
