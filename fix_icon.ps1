Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('c:\Users\aruuh\.gemini\antigravity\scratch\Maxion_Windows_Core\public_mcp_repo\icon.png')
$img.Save('c:\Users\aruuh\.gemini\antigravity\scratch\Maxion_Windows_Core\public_mcp_repo\icon_real.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Move-Item -Path 'c:\Users\aruuh\.gemini\antigravity\scratch\Maxion_Windows_Core\public_mcp_repo\icon_real.png' -Destination 'c:\Users\aruuh\.gemini\antigravity\scratch\Maxion_Windows_Core\public_mcp_repo\icon.png' -Force
