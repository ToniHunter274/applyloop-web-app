@echo off
setlocal
cd /d "%~dp0"
echo Installing ApplyLoop dependencies...
call npm install
if errorlevel 1 goto :error
echo Starting ApplyLoop on http://localhost:3000
echo Press Ctrl+C to stop the server.
call npm run dev
exit /b 0
:error
echo Setup failed. Confirm that Node.js 18 or newer is installed, then run this file again.
exit /b 1
