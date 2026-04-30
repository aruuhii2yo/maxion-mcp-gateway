param([string]$CommandToRun, [string]$WindowName)

# Apply Cyberpunk Transparency
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    [DllImport("user32.dll")] public static extern bool SetLayeredWindowAttributes(IntPtr hwnd, uint crKey, byte bAlpha, uint dwFlags);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
}
"@

$hwnd = [Win32]::GetConsoleWindow()
[Win32]::SetWindowLong($hwnd, -20, [Win32]::GetWindowLong($hwnd, -20) -bor 0x80000)
[Win32]::SetLayeredWindowAttributes($hwnd, 0, 210, 2) # 210/255 is a nice frosted glass transparency

$host.ui.RawUI.WindowTitle = $WindowName
$host.ui.RawUI.BackgroundColor = "Black"
$host.ui.RawUI.ForegroundColor = "Green"
Clear-Host

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " [$WindowName] ONLINE" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Establishing secure link... OK." -ForegroundColor Green

# Execute the actual backend command
Invoke-Expression $CommandToRun

# Keep open if it crashes
Read-Host "Press Enter to exit..."
