const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');

// Resolve desktop (handle OneDrive sync)
let desktopDir = path.join(os.homedir(), 'Desktop');
const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
if (fs.existsSync(oneDriveDesktop)) {
    desktopDir = oneDriveDesktop;
}

// 1. Public shortcut (subscriber dashboard)
const publicShortcutPath = path.join(desktopDir, 'Maxion Command Center.lnk');
const publicBatch = path.join(__dirname, 'run_emulator_admin.bat');
const psCommandPublic = `$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${publicShortcutPath}'); $Shortcut.TargetPath = '${publicBatch}'; $Shortcut.Arguments = ''; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Description = 'Maxion Command Center (Public)'; $Shortcut.Save()`;
exec(`powershell.exe -Command "${psCommandPublic}"`, (error) => {
    if (error) {
        console.error(`Failed to create public shortcut: ${error.message}`);
        return;
    }
    console.log('Public shortcut deployed to desktop.');
});

// 2. Admin shortcut (admin dashboard)
const adminShortcutPath = path.join(desktopDir, 'Maxion Admin Command Center.lnk');
const adminBatch = path.join(__dirname, 'run_admin_emulator_admin.bat');
const psCommandAdmin = `$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${adminShortcutPath}'); $Shortcut.TargetPath = '${adminBatch}'; $Shortcut.Arguments = ''; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Description = 'Maxion Admin Command Center'; $Shortcut.Save()`;
exec(`powershell.exe -Command "${psCommandAdmin}"`, (error) => {
    if (error) {
        console.error(`Failed to create admin shortcut: ${error.message}`);
        return;
    }
    console.log('Admin shortcut deployed to desktop.');
});

// 3. Register auto-start for the core engine
const mcpWrapperPath = path.join(__dirname, 'mcp_wrapper.js');
const startupCmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "MaxionCoreEngine" /t REG_SZ /d "node \\"${mcpWrapperPath}\\"" /f`;
exec(startupCmd, (error) => {
    if (error) {
        console.error(`Failed to register auto-start: ${error.message}`);
        return;
    }
    console.log('Maxion Core Engine registered for persistent system boot.');
});
