@echo off
REM Start XAMPP Control Panel which will auto-start MySQL
start "" "C:\xampp\xampp-control.exe"

REM Wait 10 seconds for MySQL to be up
timeout /t 10 /nobreak

REM Go to your project folder
cd /d "C:\Users\Karma\Desktop\library.html\new.html\robocoder-project-2025-11-23T15-08-08"

REM Start the Node.js server in a new window
start cmd /k "npm start"

REM Wait for 5 seconds so the server boots
timeout /t 5 /nobreak

REM Open the library management system in the browser
start http://localhost:3000
