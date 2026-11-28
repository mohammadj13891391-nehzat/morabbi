@echo off
rem Morabbi watchdog launcher - keeps backend (:3010) and frontend (:4210) running.
rem Usage: scripts\watchdog.bat          (both services)
rem        scripts\watchdog.bat backend  (backend only)
rem        scripts\watchdog.bat frontend (frontend only)
setlocal
cd /d "%~dp0"
if /i "%~1"=="backend" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "watchdog.ps1" -BackendOnly
) else if /i "%~1"=="frontend" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "watchdog.ps1" -FrontendOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "watchdog.ps1"
)
endlocal
