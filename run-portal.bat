@echo off
title MiNZTECH Operations Portal
cd /d "%~dp0"
echo ========================================================
echo   MiNZTECH - Microsoft Authorized Refurbisher Portal
echo   USA & LATAM / Mexico Enterprise Operations
echo ========================================================
echo Starting local portal server...
start http://localhost:5173
"C:\Program Files\nodejs\npm.cmd" run preview -- --port 5173 --host
pause
