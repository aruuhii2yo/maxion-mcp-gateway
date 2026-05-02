@echo off
set "SCRIPT_DIR=%~dp0"
if "%1"=="ELEVATED" goto :ELEVATED

powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\" ELEVATED' -Verb RunAs -WindowStyle Hidden"
exit /b

:ELEVATED
cd /d "%SCRIPT_DIR%"
call "node_modules\.bin\electron.cmd" "%SCRIPT_DIR%subscriber_emulator.js"
