@echo off
title Maxion Core Engine Bootloader
echo ====================================================
echo MAXION ENGINE INITIALIZING
echo ====================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-Transparent.ps1" -CommandToRun "node master_boot.js" -WindowName "MAXION CENTRAL CONSOLE"
exit
